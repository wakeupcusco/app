import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, PencilSimple, Trash, Package } from "@phosphor-icons/react";
import { toast } from "sonner";

const categorias = [
  "Interior", "Flores", "Kokedamas", "Terrarios", "Suculentas", 
  "Espinos", "Arreglos", "Macetas", "Insecticidas", "Fungicidas",
  "Fertilizantes", "Enraizantes", "Abono Foliar", "Atomizadores", 
  "Sustratos", "Accesorios"
];

const imagenesProductos = [
  "https://images.unsplash.com/photo-1601985705806-5b9a71f6004f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxwb3R0ZWQlMjBwbGFudCUyMGluZG9vcnxlbnwwfHx8fDE3ODE0NjQ2MTd8MA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1604762525950-13c07ecdab8b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHw0fHxwb3R0ZWQlMjBwbGFudCUyMGluZG9vcnxlbnwwfHx8fDE3ODE0NjQ2MTd8MA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1604762524889-3e2fcc145683?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwyfHxwb3R0ZWQlMjBwbGFudCUyMGluZG9vcnxlbnwwfHx8fDE3ODE0NjQ2MTd8MA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwzfHxwb3R0ZWQlMjBwbGFudCUyMGluZG9vcnxlbnwwfHx8fDE3ODE0NjQ2MTd8MA&ixlib=rb-4.1.0&q=85"
];

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    stock: 0,
    stock_minimo: 0,
    costo_compra: 0,
    precio_venta: 0,
    proveedor: "",
    ubicacion: "",
    coleccion: "",
    imagen: imagenesProductos[0]
  });

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      const response = await api.get("/productos");
      setProductos(response.data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/productos/${editingProduct.codigo}`, formData);
        toast.success("Producto actualizado exitosamente");
      } else {
        await api.post("/productos", formData);
        toast.success("Producto creado exitosamente");
      }
      setIsDialogOpen(false);
      resetForm();
      loadProductos();
    } catch (error) {
      console.error("Error guardando producto:", error);
      toast.error(error.response?.data?.detail || "Error al guardar producto");
    }
  };

  const handleDelete = async (codigo) => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await api.delete(`/productos/${codigo}`);
        toast.success("Producto eliminado exitosamente");
        loadProductos();
      } catch (error) {
        console.error("Error eliminando producto:", error);
        toast.error("Error al eliminar producto");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      categoria: "",
      stock: 0,
      stock_minimo: 0,
      costo_compra: 0,
      precio_venta: 0,
      proveedor: "",
      ubicacion: "",
      coleccion: "",
      imagen: imagenesProductos[0]
    });
    setEditingProduct(null);
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      stock: producto.stock,
      stock_minimo: producto.stock_minimo,
      costo_compra: producto.costo_compra,
      precio_venta: producto.precio_venta,
      proveedor: producto.proveedor || "",
      ubicacion: producto.ubicacion || "",
      coleccion: producto.coleccion || "",
      imagen: producto.imagen || imagenesProductos[0]
    });
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="productos-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#2D312E]" data-testid="productos-title">
            Productos
          </h1>
          <p className="text-[#6B705C] mt-2">Gestiona tu inventario de plantas y productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleOpenDialog}
              className="bg-[#4A5D23] hover:bg-[#3B4A1C] text-white"
              data-testid="add-product-button"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="product-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    data-testid="input-codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    disabled={editingProduct !== null}
                  />
                </div>
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    data-testid="input-nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger data-testid="select-categoria">
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
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Input
                    id="proveedor"
                    data-testid="input-proveedor"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    data-testid="input-stock"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
                  <Input
                    id="stock_minimo"
                    type="number"
                    data-testid="input-stock-minimo"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costo_compra">Costo Compra *</Label>
                  <Input
                    id="costo_compra"
                    type="number"
                    step="0.01"
                    data-testid="input-costo-compra"
                    value={formData.costo_compra}
                    onChange={(e) => setFormData({ ...formData, costo_compra: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="precio_venta">Precio Venta *</Label>
                  <Input
                    id="precio_venta"
                    type="number"
                    step="0.01"
                    data-testid="input-precio-venta"
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    data-testid="input-ubicacion"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="coleccion">Colección</Label>
                  <Input
                    id="coleccion"
                    data-testid="input-coleccion"
                    value={formData.coleccion}
                    onChange={(e) => setFormData({ ...formData, coleccion: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imagen">Imagen</Label>
                <Select
                  value={formData.imagen}
                  onValueChange={(value) => setFormData({ ...formData, imagen: value })}
                >
                  <SelectTrigger data-testid="select-imagen">
                    <SelectValue placeholder="Selecciona imagen" />
                  </SelectTrigger>
                  <SelectContent>
                    {imagenesProductos.map((img, idx) => (
                      <SelectItem key={idx} value={img}>Imagen {idx + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  data-testid="save-product-button"
                >
                  {editingProduct ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-[#E8E6E1] shadow-sm" data-testid="productos-table-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64" data-testid="loading-productos">
              <p className="text-[#6B705C]">Cargando productos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64" data-testid="empty-productos">
              <Package size={48} weight="duotone" className="text-[#A5A58D] mb-4" />
              <p className="text-[#6B705C]">No hay productos registrados</p>
              <p className="text-sm text-[#A5A58D]">Crea tu primer producto para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Utilidad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((producto) => (
                  <TableRow key={producto.codigo} data-testid={`producto-row-${producto.codigo}`}>
                    <TableCell>
                      <img 
                        src={producto.imagen || imagenesProductos[0]} 
                        alt={producto.nombre}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{producto.codigo}</TableCell>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9F5E9] text-[#386641]">
                        {producto.categoria}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={producto.stock <= producto.stock_minimo ? "text-[#BC4749] font-semibold" : ""}>
                        {producto.stock}
                      </span>
                    </TableCell>
                    <TableCell>S/ {producto.costo_compra.toFixed(2)}</TableCell>
                    <TableCell>S/ {producto.precio_venta.toFixed(2)}</TableCell>
                    <TableCell className="text-[#386641] font-semibold">S/ {producto.utilidad.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(producto)}
                          data-testid={`edit-product-${producto.codigo}`}
                        >
                          <PencilSimple size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#BC4749] border-[#BC4749] hover:bg-[#FDF0F0]"
                          onClick={() => handleDelete(producto.codigo)}
                          data-testid={`delete-product-${producto.codigo}`}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
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

export default Productos;