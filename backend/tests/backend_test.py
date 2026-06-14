"""Backend API tests for Plantastika - sales & inventory system."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://plant-shop-hub-7.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# Test codigos with TEST_ prefix
TEST_CODIGO = "TEST_P001"
TEST_CODIGO2 = "TEST_P002"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    # Cleanup
    try:
        s.delete(f"{API}/productos/{TEST_CODIGO}")
        s.delete(f"{API}/productos/{TEST_CODIGO2}")
    except Exception:
        pass


# ============ Dashboard ============
def test_dashboard_stats(client):
    r = client.get(f"{API}/dashboard/stats")
    assert r.status_code == 200
    data = r.json()
    for key in ["ventas_hoy", "ventas_mes", "productos_bajo_stock", "valor_inventario", "total_productos", "top_productos"]:
        assert key in data
    assert "total" in data["ventas_hoy"]
    assert "cantidad" in data["ventas_hoy"]


# ============ Productos CRUD ============
def test_product_create_and_get(client):
    # cleanup first
    client.delete(f"{API}/productos/{TEST_CODIGO}")
    payload = {
        "codigo": TEST_CODIGO,
        "nombre": "Suculenta Eco Test",
        "categoria": "Suculentas",
        "stock": 20,
        "stock_minimo": 5,
        "costo_compra": 10,
        "precio_venta": 25,
        "proveedor": "Vivero Local",
    }
    r = client.post(f"{API}/productos", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["codigo"] == TEST_CODIGO
    assert data["nombre"] == "Suculenta Eco Test"
    assert data["utilidad"] == 15
    # GET to verify persistence
    r2 = client.get(f"{API}/productos/{TEST_CODIGO}")
    assert r2.status_code == 200
    assert r2.json()["stock"] == 20


def test_product_duplicate_code(client):
    payload = {
        "codigo": TEST_CODIGO, "nombre": "Dup", "categoria": "X",
        "stock": 1, "stock_minimo": 1, "costo_compra": 1, "precio_venta": 2
    }
    r = client.post(f"{API}/productos", json=payload)
    assert r.status_code == 400


def test_product_update(client):
    payload = {
        "codigo": TEST_CODIGO,
        "nombre": "Suculenta Eco Modificada",
        "categoria": "Suculentas",
        "stock": 20,
        "stock_minimo": 5,
        "costo_compra": 10,
        "precio_venta": 30,
        "proveedor": "Vivero Local",
    }
    r = client.put(f"{API}/productos/{TEST_CODIGO}", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["nombre"] == "Suculenta Eco Modificada"
    assert r.json()["utilidad"] == 20
    # Verify persistence
    r2 = client.get(f"{API}/productos/{TEST_CODIGO}")
    assert r2.json()["nombre"] == "Suculenta Eco Modificada"


def test_product_list(client):
    r = client.get(f"{API}/productos")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ============ Ventas ============
def test_create_sale_decreases_stock(client):
    # Get current stock
    p = client.get(f"{API}/productos/{TEST_CODIGO}").json()
    initial_stock = p["stock"]
    payload = {
        "items": [{
            "codigo_producto": TEST_CODIGO,
            "nombre_producto": p["nombre"],
            "cantidad": 2,
            "precio_unit": p["precio_venta"],
            "subtotal": 2 * p["precio_venta"],
        }],
        "metodo_pago": "Yape",
        "vendedor": "Juan",
    }
    r = client.post(f"{API}/ventas", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["total"] == 2 * p["precio_venta"]
    assert data["vendedor"] == "Juan"
    # Stock decrease
    p2 = client.get(f"{API}/productos/{TEST_CODIGO}").json()
    assert p2["stock"] == initial_stock - 2


def test_get_sales(client):
    r = client.get(f"{API}/ventas")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


# ============ Compras ============
def test_create_purchase_increases_stock(client):
    p = client.get(f"{API}/productos/{TEST_CODIGO}").json()
    initial_stock = p["stock"]
    payload = {
        "proveedor": "Vivero Norte",
        "items": [{
            "codigo_producto": TEST_CODIGO,
            "nombre_producto": p["nombre"],
            "cantidad": 10,
            "costo_unit": 8,
            "subtotal": 80,
        }],
    }
    r = client.post(f"{API}/compras", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["total"] == 80
    p2 = client.get(f"{API}/productos/{TEST_CODIGO}").json()
    assert p2["stock"] == initial_stock + 10


def test_get_purchases(client):
    r = client.get(f"{API}/compras")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ============ Clientes ============
_customer_id = None


def test_create_customer(client):
    global _customer_id
    payload = {
        "nombre": "TEST_Maria Garcia",
        "email": "maria@test.com",
        "telefono": "999888777",
    }
    r = client.post(f"{API}/clientes", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["nombre"] == "TEST_Maria Garcia"
    assert "id" in data
    _customer_id = data["id"]


def test_get_customers(client):
    r = client.get(f"{API}/clientes")
    assert r.status_code == 200


def test_update_customer(client):
    assert _customer_id
    payload = {"nombre": "TEST_Maria Updated", "email": "maria@test.com", "telefono": "999888777"}
    r = client.put(f"{API}/clientes/{_customer_id}", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["nombre"] == "TEST_Maria Updated"


def test_delete_customer(client):
    assert _customer_id
    r = client.delete(f"{API}/clientes/{_customer_id}")
    assert r.status_code == 200
    # verify
    r2 = client.put(f"{API}/clientes/{_customer_id}", json={"nombre": "x"})
    assert r2.status_code == 404


# ============ Caja ============
def test_create_cash_movement(client):
    payload = {
        "concepto": "TEST_Venta del dia",
        "tipo": "ingreso",
        "efectivo": 100,
        "yape": 50,
    }
    r = client.post(f"{API}/caja", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["total"] == 150
    assert data["concepto"] == "TEST_Venta del dia"


def test_get_cash_movements(client):
    r = client.get(f"{API}/caja")
    assert r.status_code == 200


# ============ Ajustes ============
def test_create_adjustment(client):
    p = client.get(f"{API}/productos/{TEST_CODIGO}").json()
    initial_stock = p["stock"]
    payload = {
        "codigo_producto": TEST_CODIGO,
        "cantidad": -2,
        "motivo": "Dano",
    }
    r = client.post(f"{API}/ajustes", json=payload)
    assert r.status_code == 200, r.text
    p2 = client.get(f"{API}/productos/{TEST_CODIGO}").json()
    assert p2["stock"] == initial_stock - 2


def test_adjustment_invalid_product(client):
    payload = {"codigo_producto": "NOPE_NOT_EXIST", "cantidad": 1, "motivo": "x"}
    r = client.post(f"{API}/ajustes", json=payload)
    assert r.status_code == 404


def test_get_adjustments(client):
    r = client.get(f"{API}/ajustes")
    assert r.status_code == 200


# ============ Cleanup product ============
def test_delete_product(client):
    r = client.delete(f"{API}/productos/{TEST_CODIGO}")
    assert r.status_code == 200
    r2 = client.get(f"{API}/productos/{TEST_CODIGO}")
    assert r2.status_code == 404
