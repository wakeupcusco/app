"""Plantastika - Auth + Role-based access control tests."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@plantastika.com"
ADMIN_PASSWORD = "admin123"
VEND_EMAIL = "vendedora@plantastika.com"
VEND_PASSWORD = "vendedora123"

TS = str(int(time.time()))
TEST_CODIGO = f"TEST_AUTH_{TS}"


# ============ Fixtures ============
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == "admin"
    assert "access_token" in data and len(data["access_token"]) > 0
    return data["access_token"]


@pytest.fixture(scope="module")
def vend_token():
    r = requests.post(f"{API}/auth/login", json={"email": VEND_EMAIL, "password": VEND_PASSWORD})
    assert r.status_code == 200, f"Vendedora login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == "vendedor"
    return data["access_token"]


def admin_h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ============ Login / Auth ============
def test_login_invalid_password():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpass"})
    assert r.status_code == 401


def test_login_unknown_user():
    r = requests.post(f"{API}/auth/login", json={"email": "nope@plantastika.com", "password": "x"})
    assert r.status_code == 401


def test_auth_me_admin(admin_token):
    r = requests.get(f"{API}/auth/me", headers=admin_h(admin_token))
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"
    assert "password_hash" not in data
    assert "_id" not in data
    assert "id" in data


def test_auth_me_vend(vend_token):
    r = requests.get(f"{API}/auth/me", headers=admin_h(vend_token))
    assert r.status_code == 200
    assert r.json()["role"] == "vendedor"


def test_no_token_unauthorized():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_invalid_token_unauthorized():
    r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert r.status_code == 401


# ============ Role-based protection: Caja (admin only) ============
def test_caja_get_vendedora_forbidden(vend_token):
    r = requests.get(f"{API}/caja", headers=admin_h(vend_token))
    assert r.status_code == 403


def test_caja_get_admin_allowed(admin_token):
    r = requests.get(f"{API}/caja", headers=admin_h(admin_token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_caja_create_vendedora_forbidden(vend_token):
    payload = {"concepto": "TEST_CAJA", "efectivo": 10, "yape": 0, "plin": 0, "transferencia": 0, "tipo": "ingreso"}
    r = requests.post(f"{API}/caja", json=payload, headers=admin_h(vend_token))
    assert r.status_code == 403


def test_caja_create_admin_allowed(admin_token):
    payload = {"concepto": "TEST_CAJA_ADMIN", "efectivo": 50, "yape": 0, "plin": 0, "transferencia": 0, "tipo": "ingreso"}
    r = requests.post(f"{API}/caja", json=payload, headers=admin_h(admin_token))
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 50
    assert data["concepto"] == "TEST_CAJA_ADMIN"


# ============ Role-based: Compras (admin only) ============
def test_compras_get_vendedora_forbidden(vend_token):
    r = requests.get(f"{API}/compras", headers=admin_h(vend_token))
    assert r.status_code == 403


def test_compras_get_admin_allowed(admin_token):
    r = requests.get(f"{API}/compras", headers=admin_h(admin_token))
    assert r.status_code == 200


# ============ Role-based: Ajustes (admin only) ============
def test_ajustes_get_vendedora_forbidden(vend_token):
    r = requests.get(f"{API}/ajustes", headers=admin_h(vend_token))
    assert r.status_code == 403


def test_ajustes_get_admin_allowed(admin_token):
    r = requests.get(f"{API}/ajustes", headers=admin_h(admin_token))
    assert r.status_code == 200


# ============ Vendedora allowed: Productos, Ventas, Clientes ============
def test_productos_get_vendedora_allowed(vend_token):
    r = requests.get(f"{API}/productos", headers=admin_h(vend_token))
    assert r.status_code == 200


def test_clientes_get_vendedora_allowed(vend_token):
    r = requests.get(f"{API}/clientes", headers=admin_h(vend_token))
    assert r.status_code == 200


def test_ventas_get_vendedora_allowed(vend_token):
    r = requests.get(f"{API}/ventas", headers=admin_h(vend_token))
    assert r.status_code == 200


def test_dashboard_vendedora_allowed(vend_token):
    r = requests.get(f"{API}/dashboard/stats", headers=admin_h(vend_token))
    assert r.status_code == 200


# ============ Product CRUD with auth + image (base64) ============
def test_product_create_with_image_admin(admin_token):
    # cleanup
    requests.delete(f"{API}/productos/{TEST_CODIGO}", headers=admin_h(admin_token))
    img_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    payload = {
        "codigo": TEST_CODIGO,
        "nombre": "Suculenta Auth Test",
        "categoria": "Suculentas",
        "stock": 30,
        "stock_minimo": 5,
        "costo_compra": 10,
        "precio_venta": 25,
        "imagen": img_b64,
    }
    r = requests.post(f"{API}/productos", json=payload, headers=admin_h(admin_token))
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["imagen"] == img_b64
    assert data["utilidad"] == 15

    # GET to verify persistence
    g = requests.get(f"{API}/productos/{TEST_CODIGO}", headers=admin_h(admin_token))
    assert g.status_code == 200
    assert g.json()["imagen"] == img_b64


# ============ Sale with custom (discount) price - stock decrement ============
def test_sale_with_discount_price_decrements_stock(admin_token, vend_token):
    # Ensure product exists with known stock
    requests.delete(f"{API}/productos/{TEST_CODIGO}", headers=admin_h(admin_token))
    requests.post(f"{API}/productos", json={
        "codigo": TEST_CODIGO, "nombre": "Sale Test Prod", "categoria": "Plantas",
        "stock": 10, "stock_minimo": 1, "costo_compra": 5, "precio_venta": 20,
    }, headers=admin_h(admin_token))

    # Vendedora creates sale with discounted unit price (15 instead of 20)
    payload = {
        "items": [{
            "codigo_producto": TEST_CODIGO,
            "nombre_producto": "Sale Test Prod",
            "cantidad": 3,
            "precio_unit": 15.0,  # discounted
            "subtotal": 45.0,
        }],
        "metodo_pago": "Yape",
        "vendedor": "Vendedora",
    }
    r = requests.post(f"{API}/ventas", json=payload, headers=admin_h(vend_token))
    assert r.status_code == 200, r.text
    sale = r.json()
    assert sale["total"] == 45.0
    assert sale["items"][0]["precio_unit"] == 15.0
    assert sale["metodo_pago"] == "Yape"

    # Verify stock decremented from 10 -> 7
    g = requests.get(f"{API}/productos/{TEST_CODIGO}", headers=admin_h(vend_token))
    assert g.status_code == 200
    assert g.json()["stock"] == 7


@pytest.mark.parametrize("metodo", ["Efectivo", "Yape", "Plin", "Transferencia"])
def test_sale_payment_methods(admin_token, metodo):
    # Reset stock
    requests.delete(f"{API}/productos/{TEST_CODIGO}", headers=admin_h(admin_token))
    requests.post(f"{API}/productos", json={
        "codigo": TEST_CODIGO, "nombre": "Pay Test", "categoria": "X",
        "stock": 5, "stock_minimo": 1, "costo_compra": 2, "precio_venta": 10,
    }, headers=admin_h(admin_token))
    payload = {
        "items": [{"codigo_producto": TEST_CODIGO, "nombre_producto": "Pay Test",
                   "cantidad": 1, "precio_unit": 10.0, "subtotal": 10.0}],
        "metodo_pago": metodo, "vendedor": "Admin",
    }
    r = requests.post(f"{API}/ventas", json=payload, headers=admin_h(admin_token))
    assert r.status_code == 200
    assert r.json()["metodo_pago"] == metodo


# ============ Customer CRUD with auth ============
def test_customer_create_vendedora(vend_token):
    payload = {"nombre": f"TEST_Cliente_{TS}", "email": "test@x.com", "telefono": "999"}
    r = requests.post(f"{API}/clientes", json=payload, headers=admin_h(vend_token))
    assert r.status_code == 200
    data = r.json()
    assert data["nombre"] == payload["nombre"]
    assert "id" in data

    # Cleanup
    requests.delete(f"{API}/clientes/{data['id']}", headers=admin_h(vend_token))


# ============ Cleanup at end ============
def test_cleanup(admin_token):
    requests.delete(f"{API}/productos/{TEST_CODIGO}", headers=admin_h(admin_token))
