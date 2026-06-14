# PRD - Plantástika (Sistema de Ventas e Inventario)

## Problema Original
Sistema de ventas e inventario para tienda de plantas. El usuario proporcionó un Excel "Plantastika_Pro.xlsx" como referencia, y solicitó convertirlo a sistema web funcional.

## Stack
- Backend: FastAPI + MongoDB (motor) + bcrypt + PyJWT
- Frontend: React 19 + Tailwind + Shadcn UI + Phosphor Icons + html5-qrcode
- Auth: JWT con roles (admin / vendedor)

## Personas
1. **Administrador**: dueña/o del negocio. Acceso total.
2. **Vendedora**: empleada. Sin acceso a costos, compras, caja ni ajustes de inventario.

## Implementado (al 2026-02-06)
- Login con JWT y 2 roles seedeados (admin, vendedor)
- Dashboard con KPIs (ventas hoy/mes, valor inventario, stock bajo, top 5 productos)
- Productos: CRUD con imagen (upload base64 comprimida), código de barras y categorías
- Escáner de código de barras (html5-qrcode) en form de producto y búsqueda
- Ventas: precio editable por item (rebajas), 4 métodos de pago, stock automático
- Compras: con opción de crear producto nuevo in-line (solo admin)
- Clientes: CRUD completo
- Caja: movimientos efectivo/yape/plin/transferencia (solo admin)
- Ajustes de inventario (solo admin)
- Restricciones por rol en backend (require_admin dependency) y frontend (ProtectedRoute adminOnly + Layout filtrado)
- Vendedora NO ve costo_compra ni utilidad en form ni tabla de productos

## Credenciales
- admin@plantastika.com / admin123
- vendedora@plantastika.com / vendedora123

## Backlog
- P1: Reporte exportable a Excel/PDF
- P1: Recibo/ticket de venta imprimible
- P1: PWA instalable (offline-first)
- P2: Múltiples sucursales/ubicaciones
- P2: Comisiones de vendedores
- P2: Integración WhatsApp para notificaciones
- P2: Tienda online pública con catálogo

## Próximos pasos
- Usuario solicita versión descargable/desplegable → opción "Deploy" en Emergent recomendada
