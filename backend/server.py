from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

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

# ==================== PRODUCTOS ====================

@api_router.post("/productos", response_model=Product)
async def create_product(product: ProductCreate):
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
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/productos/{codigo}", response_model=Product)
async def get_product(codigo: str):
    product = await db.products.find_one({"codigo": codigo}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@api_router.put("/productos/{codigo}", response_model=Product)
async def update_product(codigo: str, product: ProductCreate):
    existing = await db.products.find_one({"codigo": codigo}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    utilidad = product.precio_venta - product.costo_compra
    doc = product.model_dump()
    doc['utilidad'] = utilidad
    doc['fecha_creacion'] = existing['fecha_creacion']
    
    await db.products.update_one({"codigo": codigo}, {"$set": doc})
    return Product(**doc)

@api_router.delete("/productos/{codigo}")
async def delete_product(codigo: str):
    result = await db.products.delete_one({"codigo": codigo})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"message": "Producto eliminado exitosamente"}

# ==================== VENTAS ====================

@api_router.post("/ventas", response_model=Sale)
async def create_sale(sale: SaleCreate):
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
async def get_sales():
    sales = await db.sales.find({}, {"_id": 0}).sort("fecha", -1).to_list(1000)
    return sales

# ==================== COMPRAS ====================

@api_router.post("/compras", response_model=Purchase)
async def create_purchase(purchase: PurchaseCreate):
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
async def get_purchases():
    purchases = await db.purchases.find({}, {"_id": 0}).sort("fecha", -1).to_list(1000)
    return purchases

# ==================== CLIENTES ====================

@api_router.post("/clientes", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    fecha_registro = datetime.now(timezone.utc).isoformat()
    customer_id = str(ObjectId())
    
    doc = customer.model_dump()
    doc['id'] = customer_id
    doc['fecha_registro'] = fecha_registro
    
    await db.customers.insert_one(doc)
    return Customer(**doc)

@api_router.get("/clientes", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return customers

@api_router.put("/clientes/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer: CustomerCreate):
    existing = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    doc = customer.model_dump()
    doc['id'] = customer_id
    doc['fecha_registro'] = existing['fecha_registro']
    
    await db.customers.update_one({"id": customer_id}, {"$set": doc})
    return Customer(**doc)

@api_router.delete("/clientes/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"message": "Cliente eliminado exitosamente"}

# ==================== MOVIMIENTOS DE CAJA ====================

@api_router.post("/caja", response_model=CashMovement)
async def create_cash_movement(movement: CashMovementCreate):
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
async def get_cash_movements():
    movements = await db.cash_movements.find({}, {"_id": 0}).sort("fecha", -1).to_list(1000)
    return movements

# ==================== AJUSTES DE INVENTARIO ====================

@api_router.post("/ajustes", response_model=InventoryAdjustment)
async def create_inventory_adjustment(adjustment: InventoryAdjustmentCreate):
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
async def get_inventory_adjustments():
    adjustments = await db.inventory_adjustments.find({}, {"_id": 0}).sort("fecha", -1).to_list(1000)
    return adjustments

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    from datetime import datetime as dt, timedelta
    
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()