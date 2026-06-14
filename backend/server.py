from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import bcrypt
import jwt

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=8),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inv\u00e1lido")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de administrador")
    return user

# ==================== MODELS ====================

class LoginRequest(BaseModel):
    email: str
    password: str

class ProductCreate(BaseModel):
    codigo: str
    nombre: str
    categoria: str
    stock: int
    stock_minimo: int
    costo_compra: float
    precio_venta: float
    proveedor: Optional[str] = None
    ubicacion: Optional[str] = None
    coleccion: Optional[str] = None
    imagen: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    codigo: str
    nombre: str
    categoria: str
    stock: int
    stock_minimo: int
    costo_compra: float
    precio_venta: float
    utilidad: float
    proveedor: Optional[str] = None
    ubicacion: Optional[str] = None
    coleccion: Optional[str] = None
    imagen: Optional[str] = None
    fecha_creacion: str

class SaleItem(BaseModel):
    codigo_producto: str
    nombre_producto: str
    cantidad: int
    precio_unit: float
    subtotal: float

class SaleCreate(BaseModel):
    items: List[SaleItem]
    metodo_pago: str
    vendedor: str
    cliente_id: Optional[str] = None

class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    fecha: str
    items: List[SaleItem]
    metodo_pago: str
    vendedor: str
    total: float
    cliente_id: Optional[str] = None

class PurchaseItem(BaseModel):
    codigo_producto: str
    nombre_producto: str
    cantidad: int
    costo_unit: float
    subtotal: float

class PurchaseCreate(BaseModel):
    proveedor: str
    items: List[PurchaseItem]

class Purchase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    fecha: str
    proveedor: str
    items: List[PurchaseItem]
    total: float

class CustomerCreate(BaseModel):
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    fecha_registro: str

class CashMovementCreate(BaseModel):
    concepto: str
    efectivo: float = 0
    yape: float = 0
    plin: float = 0
    transferencia: float = 0
    tipo: str
    observacion: Optional[str] = None

class CashMovement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    fecha: str
    concepto: str
    efectivo: float
    yape: float
    plin: float
    transferencia: float
    tipo: str
    total: float
    observacion: Optional[str] = None

class InventoryAdjustmentCreate(BaseModel):
    codigo_producto: str
    cantidad: int
    motivo: str

class InventoryAdjustment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    fecha: str
    codigo_producto: str
    nombre_producto: str
    cantidad: int
    motivo: str

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response):
    email = request.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["email"], user["role"])
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=28800,
        path="/"
    )
    
    return {
        "id": user_id,
        "email": user["email"],
        "nombre": user["nombre"],
        "role": user["role"],
        "access_token": access_token
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Sesión cerrada"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ==================== PRODUCTOS ====================

@api_router.post("/productos", response_model=Product)
async def create_product(product: ProductCreate, user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({"codigo": product.codigo}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="El código de producto ya existe")
    
    utilidad = product.precio_venta - product.costo_compra
    fecha_creacion = datetime.now(timezone.utc).isoformat()
    
    doc = product.model_dump()
    doc['utilidad'] = utilidad
    doc['fecha_creacion'] = fecha_creacion
    
    await db.products.insert_one(doc)
    return Product(**doc)

@api_router.get("/productos", response_model=List[Product])
async def get_products(user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/productos/{codigo}", response_model=Product)
async def get_product(codigo: str, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"codigo": codigo}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@api_router.put("/productos/{codigo}", response_model=Product)
async def update_product(codigo: str, product: ProductCreate, user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({"codigo": codigo}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    utilidad = product.precio_venta - product.costo_compra
    doc = product.model_dump()
    doc['utilidad'] = utilidad
    doc['fecha_creacion'] = existing['fecha_creacion']
    
    await db.products.update_one({"codigo": codigo}, {"$set": doc})
    return Product(**doc, codigo=codigo)

@api_router.delete("/productos/{codigo}")
async def delete_product(codigo: str, user: dict = Depends(require_admin)):
    result = await db.products.delete_one({"codigo": codigo})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"message": "Producto eliminado exitosamente"}

# ==================== VENTAS ====================

@api_router.post("/ventas", response_model=Sale)
async def create_sale(sale: SaleCreate, user: dict = Depends(get_current_user)):
    total = sum(item.subtotal for item in sale.items)
    fecha = datetime.now(timezone.utc).isoformat()
    sale_id = str(ObjectId())
    
    doc = {
        "id": sale_id,
        "fecha": fecha,
        "items": [item.model_dump() for item in sale.items],
        "metodo_pago": sale.metodo_pago,
        "vendedor": sale.vendedor,
        "total": total,
        "cliente_id": sale.cliente_id
    }
    
    await db.sales.insert_one(doc)
    
    for item in sale.items:
        await db.products.update_one(
            {"codigo": item.codigo_producto},
            {"$inc": {"stock": -item.cantidad}}
        )
    
    return Sale(**doc)

@api_router.get("/ventas", response_model=List[Sale])
async def get_sales(user: dict = Depends(get_current_user)):
    sales = await db.sales.find({}, {"_id": 0}).sort("fecha", -1).to_list(1000)
    return sales

# ==================== COMPRAS (Solo Admin) ====================

@api_router.post("/compras", response_model=Purchase)
async def create_purchase(purchase: PurchaseCreate, user: dict = Depends(require_admin)):
    total = sum(item.subtotal for item in purchase.items)
    fecha = datetime.now(timezone.utc).isoformat()
    purchase_id = str(ObjectId())
    
    doc = {
        "id": purchase_id,
        "fecha": fecha,
        "proveedor": purchase.proveedor,
        "items": [item.model_dump() for item in purchase.items],
        "total": total
    }
    
    await db.purchases.insert_one(doc)
    
    for item in purchase.items:
        await db.products.update_one(
            {"codigo": item.codigo_producto},
            {"$inc": {"stock": item.cantidad}}
        )
    
    return Purchase(**doc)

@api_router.get("/compras", response_model=List[Purchase])
async def get_purchases(user: dict = Depends(require_admin)):
    purchases = await db.purchases.find({}, {"_id": 0}).sort("fecha", -1).to_list(1000)
    return purchases

# ==================== CLIENTES ====================

@api_router.post("/clientes", response_model=Customer)
async def create_customer(customer: CustomerCreate, user: dict = Depends(get_current_user)):
    fecha_registro = datetime.now(timezone.utc).isoformat()
    customer_id = str(ObjectId())
    
    doc = customer.model_dump()
    doc['id'] = customer_id
    doc['fecha_registro'] = fecha_registro
    
    await db.customers.insert_one(doc)
    return Customer(**doc)

@api_router.get("/clientes", response_model=List[Customer])
async def get_customers(user: dict = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return customers

@api_router.put("/clientes/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer: CustomerCreate, user: dict = Depends(get_current_user)):
    existing = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    doc = customer.model_dump()
    doc['id'] = customer_id
    doc['fecha_registro'] = existing['fecha_registro']
    
    await db.customers.update_one({"id": customer_id}, {"$set": doc})
    return Customer(**doc)

@api_router.delete("/clientes/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(get_current_user)):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"message": "Cliente eliminado exitosamente"}

# ==================== MOVIMIENTOS DE CAJA (Solo Admin) ====================

@api_router.post("/caja", response_model=CashMovement)
async def create_cash_movement(movement: CashMovementCreate, user: dict = Depends(require_admin)):
    fecha = datetime.now(timezone.utc).isoformat()
    movement_id = str(ObjectId())
    total = movement.efectivo + movement.yape + movement.plin + movement.transferencia
    
    doc = movement.model_dump()
    doc['id'] = movement_id
    doc['fecha'] = fecha
    doc['total'] = total
    
    await db.cash_movements.insert_one(doc)
    return CashMovement(**doc)

@api_router.get("/caja", response_model=List[CashMovement])
async def get_cash_movements(user: dict = Depends(require_admin)):
    movements = await db.cash_movements.find({}, {"_id": 0}).sort("fecha", -1).to_list(1000)
    return movements

# ==================== AJUSTES DE INVENTARIO (Solo Admin) ====================

@api_router.post("/ajustes", response_model=InventoryAdjustment)
async def create_inventory_adjustment(adjustment: InventoryAdjustmentCreate, user: dict = Depends(require_admin)):
    product = await db.products.find_one({"codigo": adjustment.codigo_producto}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    fecha = datetime.now(timezone.utc).isoformat()
    adjustment_id = str(ObjectId())
    
    doc = {
        "id": adjustment_id,
        "fecha": fecha,
        "codigo_producto": adjustment.codigo_producto,
        "nombre_producto": product['nombre'],
        "cantidad": adjustment.cantidad,
        "motivo": adjustment.motivo
    }
    
    await db.inventory_adjustments.insert_one(doc)
    
    await db.products.update_one(
        {"codigo": adjustment.codigo_producto},
        {"$inc": {"stock": adjustment.cantidad}}
    )
    
    return InventoryAdjustment(**doc)

@api_router.get("/ajustes", response_model=List[InventoryAdjustment])
async def get_inventory_adjustments(user: dict = Depends(require_admin)):
    adjustments = await db.inventory_adjustments.find({}, {"_id": 0}).sort("fecha", -1).to_list(1000)
    return adjustments

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    from datetime import datetime as dt
    
    now = dt.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    ventas_hoy = await db.sales.find({"fecha": {"$gte": today_start}}, {"_id": 0}).to_list(1000)
    ventas_mes = await db.sales.find({"fecha": {"$gte": month_start}}, {"_id": 0}).to_list(1000)
    
    total_ventas_hoy = sum(v['total'] for v in ventas_hoy)
    total_ventas_mes = sum(v['total'] for v in ventas_mes)
    
    productos = await db.products.find({}, {"_id": 0}).to_list(1000)
    productos_bajo_stock = [p for p in productos if p['stock'] <= p['stock_minimo']]
    
    valor_inventario = sum(p['stock'] * p['costo_compra'] for p in productos)
    
    ventas_totales = await db.sales.find({}, {"_id": 0}).to_list(1000)
    producto_ventas = {}
    for venta in ventas_totales:
        for item in venta['items']:
            codigo = item['codigo_producto']
            if codigo not in producto_ventas:
                producto_ventas[codigo] = {'nombre': item['nombre_producto'], 'cantidad': 0, 'total': 0}
            producto_ventas[codigo]['cantidad'] += item['cantidad']
            producto_ventas[codigo]['total'] += item['subtotal']
    
    top_productos = sorted(producto_ventas.values(), key=lambda x: x['total'], reverse=True)[:5]
    
    return {
        "ventas_hoy": {
            "total": total_ventas_hoy,
            "cantidad": len(ventas_hoy)
        },
        "ventas_mes": {
            "total": total_ventas_mes,
            "cantidad": len(ventas_mes)
        },
        "productos_bajo_stock": len(productos_bajo_stock),
        "productos_bajo_stock_lista": productos_bajo_stock[:10],
        "valor_inventario": valor_inventario,
        "total_productos": len(productos),
        "top_productos": top_productos
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@plantastika.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    vendedor_email = os.environ.get("VENDEDOR_EMAIL", "vendedora@plantastika.com")
    vendedor_password = os.environ.get("VENDEDOR_PASSWORD", "vendedora123")
    
    await db.users.create_index("email", unique=True)
    
    # Admin
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "nombre": "Administrador",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin creado: {admin_email}")
    else:
        if not verify_password(admin_password, existing_admin["password_hash"]):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_password)}}
            )
    
    # Vendedor
    existing_vendedor = await db.users.find_one({"email": vendedor_email})
    if not existing_vendedor:
        await db.users.insert_one({
            "email": vendedor_email,
            "password_hash": hash_password(vendedor_password),
            "nombre": "Vendedora",
            "role": "vendedor",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Vendedor creado: {vendedor_email}")
    else:
        if not verify_password(vendedor_password, existing_vendedor["password_hash"]):
            await db.users.update_one(
                {"email": vendedor_email},
                {"$set": {"password_hash": hash_password(vendedor_password)}}
            )

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
