# Plantástika Pro - Sistema de Ventas e Inventario

## Problema Original
Sistema de ventas e inventario para una tienda de plantas. Usuario tenía pestañas definidas en un archivo Excel (Plantastika_Pro.xlsx) y necesitaba convertirlo en un sistema funcional.

## Arquitectura
- **Backend**: FastAPI + MongoDB (Motor async)
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Phosphor Icons
- **Diseño**: Tema orgánico-terroso (paleta verde musgo #4A5D23, fondo #F9F8F6)
- **Fuentes**: Manrope (headings), Figtree (body)
- **Idioma**: Español (moneda S/ Soles)

## Personas de Usuario
- Dueños de tienda de plantas
- Vendedores que registran ventas diarias
- Encargados de inventario

## Características Implementadas (Feb 2026)
### Módulos Principales
1. **Dashboard** - KPIs (ventas hoy/mes, valor inventario, stock bajo), Top 5 productos, alertas
2. **Productos** - CRUD completo con código, categorías (16 tipos), stock, precio, utilidad calculada
3. **Ventas** - Carrito multi-producto, 4 métodos de pago (Efectivo, Yape, Plin, Transferencia), vendedor
4. **Compras** - Registro de compras a proveedores con actualización automática de stock
5. **Clientes** - CRUD con nombre, email, teléfono, dirección
6. **Caja** - Movimientos de ingresos/egresos, totales por método de pago
7. **Ajustes de Inventario** - Registro de daños, pérdidas, correcciones

### Backend Endpoints
- /api/productos (GET, POST, PUT, DELETE)
- /api/ventas (GET, POST) - actualiza stock automáticamente
- /api/compras (GET, POST) - actualiza stock automáticamente
- /api/clientes (GET, POST, PUT, DELETE)
- /api/caja (GET, POST)
- /api/ajustes (GET, POST)
- /api/dashboard/stats (GET) - estadísticas agregadas

## Backlog Futuro (P1/P2)
- P1: Exportación a Excel/PDF de reportes
- P1: Filtros y búsqueda en tablas
- P1: Asociar ventas a clientes específicos
- P2: Gráficos de tendencias en Dashboard (Recharts)
- P2: Sistema de autenticación multi-usuario
- P2: Códigos de barras / códigos QR
- P2: Recordatorios de cuidado de plantas (riego, fertilización)
- P2: Sistema de tickets/facturación impresos
