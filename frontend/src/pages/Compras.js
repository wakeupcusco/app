import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingBag, Trash, Package } from "@phosphor-icons/react";
import { toast } from "sonner";

const categorias = [
  "Interior", "Flores", "Kokedamas", "Terrarios", "Suculentas", 
  "Espinos", "Arreglos", "Macetas", "Insecticidas", "Fungicidas",
  "Fertilizantes", "Enraizantes", "Abono Foliar", "Atomizadores", 
  "Sustratos", "Accesorios"
];

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    producto: null,
    cantidad: 1,
    costo_unit: 0
  });
  const [proveedor, setProveedor] = useState("");
  const [newProduct, setNewProduct] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    stock: 0,
    stock_minimo: 5,
    costo_compra: 0,
    precio_venta: 0,
    proveedor: "",
    ubicacion: "",
    codigo_barras: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [comprasRes, productosRes] = await Promise.all([
        api.get("/compras"),
        api.get("/productos")
      ]);
      setCompras(comprasRes.data);
      setProductos(productosRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.producto) {
      toast.error("Selecciona un producto");
      return;
    }
    if (currentItem.cantidad <= 0 || currentItem.costo_unit <= 0) {
      toast.error("Cantidad y costo deben ser mayores a 0");
      return;
    }

    const producto = productos.find(p => p.codigo === currentItem.producto);
    const subtotal = currentItem.costo_unit * currentItem.cantidad;
    
    setItems([...items, {
      codigo_producto: producto.codigo,
      nombre_producto: producto.nombre,
      cantidad: currentItem.cantidad,
      costo_unit: currentItem.costo_unit,
      subtotal
    }]);

    setCurrentItem({ producto: null, cantidad: 1, costo_unit: 0 });
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateNewProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/productos", { ...newProduct, stock: 0 });
      toast.success(`Producto "${response.data.nombre}" creado`);
      
      // Recargar productos y seleccionar el nuevo
      await loadData();
      setCurrentItem({
        producto: response.data.codigo,
        cantidad: 1,
        costo_unit: response.data.costo_compra
      });
      
      // Reset y cerrar diálogo
      setNewProduct({
        codigo: "",
        nombre: "",
        categoria: "",
        stock: 0,
        stock_minimo: 5,
        costo_compra: 0,
        precio_venta: 0,
        proveedor: proveedor,
        ubicacion: "",
        codigo_barras: ""
      });
      setIsNewProductDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear producto");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    if (!proveedor) {
      toast.error("Ingresa el nombre del proveedor");
      return;
    }

    try {
      await api.post("/compras", {
        proveedor,
        items
      });
      toast.success("Compra registrada exitosamente");
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error registrando compra:", error);
      toast.error("Error al registrar compra");
    }
  };

  const resetForm = () => {
    setItems([]);
    setCurrentItem({ producto: null, cantidad: 1, costo_unit: 0 });
    setProveedor("");
  };

  const handleSelectProduct = (codigo) => {
    const producto = productos.find(p => p.codigo === codigo);
    setCurrentItem({
      producto: codigo,
      cantidad: 1,
      costo_unit: producto?.costo_compra || 0
    });
  };

  const handleDeletePurchase = async (compra) => {
    if (window.confirm(`¿Eliminar la compra a "${compra.proveedor}" por S/ ${compra.total.toFixed(2)}? Esto también restará el stock que sumó.`)) {
      try {
        await api.delete(`/compras/${compra.id}`);
        toast.success("Compra eliminada exitosamente");
        loadData();
      } catch (error) {
        console.error("Error eliminando compra:", error);
        toast.error(error.response?.data?.detail || "Error al eliminar compra");
      }
    }
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-6" data-testid="compras-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#2D312E]" data-testid="compras-title">
            Compras
          </h1>
          <p className="text-[#6B705C] mt-2">Registra compras a proveedores y actualiza tu stock</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => resetForm()}
              className="bg-[#4A5D23] hover:bg-[#3B4A1C] text-white"
              data-testid="new-purchase-button"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">Nueva Compra</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="purchase-form">
              <div>
                <Label htmlFor="proveedor">Proveedor *</Label>
                <Input
                  id="proveedor"
                  data-testid="input-proveedor"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  required
                  placeholder="Nombre del proveedor"
                />
              </div>

              {/* Agregar Productos */}
              <div className="space-y-4 p-4 bg-[#F9F8F6] rounded-lg border border-[#E8E6E1]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#2D312E]">Agregar Producto</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewProduct((prev) => ({ ...prev, proveedor: proveedor }));
                      setIsNewProductDialogOpen(true);
                    }}
                    className="border-[#4A5D23] text-[#4A5D23] hover:bg-[#E9F5E9]"
                    data-testid="create-new-product-button"
                  >
                    <Package size={18} className="mr-2" />
                    Crear Producto Nuevo
                  </Button>
                </div>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-5">
                    <Label>Producto Existente</Label>
                    <Select
                      value={currentItem.producto}
                      onValueChange={handleSelectProduct}
                    >
                      <SelectTrigger data-testid="select-producto">
                        <SelectValue placeholder="Selecciona producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((prod) => (
                          <SelectItem key={prod.codigo} value={prod.codigo}>
                            {prod.nombre} (Stock: {prod.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      data-testid="input-cantidad"
                      value={currentItem.cantidad}
                      onChange={(e) => setCurrentItem({ ...currentItem, cantidad: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="col-span-3">
                    <Label>Costo Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      data-testid="input-costo"
                      value={currentItem.costo_unit}
                      onChange={(e) => setCurrentItem({ ...currentItem, costo_unit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full bg-[#4A5D23] hover:bg-[#3B4A1C]"
                      data-testid="add-item-button"
                    >
                      <Plus size={18} className="mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-[#6B705C]">
                  💡 Si el producto no existe en tu inventario, créalo con el botón "Crear Producto Nuevo"
                </p>
              </div>

              {/* Lista de Items */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-[#2D312E]">Productos en Compra</h3>
                  <div className="border border-[#E8E6E1] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index} data-testid={`purchase-item-${index}`}>
                            <TableCell>{item.nombre_producto}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>S/ {item.costo_unit.toFixed(2)}</TableCell>
                            <TableCell className="font-semibold">S/ {item.subtotal.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-[#BC4749]"
                                onClick={() => handleRemoveItem(index)}
                                data-testid={`remove-item-${index}`}
                              >
                                <Trash size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-[#6B705C]">Total</p>
                      <p className="text-2xl font-bold text-[#4A5D23]" data-testid="purchase-total">S/ {total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="cancel-button"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#4A5D23] hover:bg-[#3B4A1C]"
                  data-testid="save-purchase-button"
                >
                  Registrar Compra
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diálogo de crear producto nuevo */}
      <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Producto Nuevo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateNewProduct} className="space-y-4" data-testid="new-product-form">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="np-codigo">Código *</Label>
                <Input
                  id="np-codigo"
                  data-testid="new-product-codigo"
                  value={newProduct.codigo}
                  onChange={(e) => setNewProduct({ ...newProduct, codigo: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="np-nombre">Nombre *</Label>
                <Input
                  id="np-nombre"
                  data-testid="new-product-nombre"
                  value={newProduct.nombre}
                  onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="np-categoria">Categoría *</Label>
                <Select
                  value={newProduct.categoria}
                  onValueChange={(value) => setNewProduct({ ...newProduct, categoria: value })}
                >
                  <SelectTrigger data-testid="new-product-categoria">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="np-codigo-barras">Código de Barras</Label>
                <Input
                  id="np-codigo-barras"
                  data-testid="new-product-codigo-barras"
                  value={newProduct.codigo_barras}
                  onChange={(e) => setNewProduct({ ...newProduct, codigo_barras: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="np-costo">Costo Compra *</Label>
                <Input
                  id="np-costo"
                  type="number"
                  step="0.01"
                  data-testid="new-product-costo"
                  value={newProduct.costo_compra}
                  onChange={(e) => setNewProduct({ ...newProduct, costo_compra: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="np-precio">Precio Venta *</Label>
                <Input
                  id="np-precio"
                  type="number"
                  step="0.01"
                  data-testid="new-product-precio"
                  value={newProduct.precio_venta}
                  onChange={(e) => setNewProduct({ ...newProduct, precio_venta: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="np-stock-min">Stock Mínimo</Label>
                <Input
                  id="np-stock-min"
                  type="number"
                  data-testid="new-product-stock-min"
                  value={newProduct.stock_minimo}
                  onChange={(e) => setNewProduct({ ...newProduct, stock_minimo: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="np-ubicacion">Ubicación</Label>
                <Input
                  id="np-ubicacion"
                  data-testid="new-product-ubicacion"
                  value={newProduct.ubicacion}
                  onChange={(e) => setNewProduct({ ...newProduct, ubicacion: e.target.value })}
                />
              </div>
            </div>

            <p className="text-xs text-[#6B705C] bg-[#E9F5E9] p-3 rounded">
              💡 El stock inicial será 0. Las unidades que estás comprando ahora se sumarán al confirmar la compra.
            </p>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewProductDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#4A5D23] hover:bg-[#3B4A1C]"
                data-testid="save-new-product-button"
              >
                Crear Producto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-[#E8E6E1] shadow-sm" data-testid="compras-table-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64" data-testid="loading-compras">
              <p className="text-[#6B705C]">Cargando compras...</p>
            </div>
          ) : compras.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64" data-testid="empty-compras">
              <ShoppingBag size={48} weight="duotone" className="text-[#A5A58D] mb-4" />
              <p className="text-[#6B705C]">No hay compras registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.map((compra) => (
                  <TableRow key={compra.id} data-testid={`compra-row-${compra.id}`}>
                    <TableCell>
                      {new Date(compra.fecha).toLocaleString('es-PE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{compra.proveedor}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {compra.items.map((item, idx) => (
                          <div key={idx}>
                            {item.nombre_producto} x{item.cantidad}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-[#4A5D23]">S/ {compra.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePurchase(compra)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-purchase-${compra.id}`}
                      >
                        <Trash size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Compras;
