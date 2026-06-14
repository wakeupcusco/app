import { useEffect, useState, useRef } from "react";
import api from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, PencilSimple, Trash, Package, UploadSimple, X, Barcode, Camera } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import BarcodeScanner from "@/components/BarcodeScanner";

const placeholderImg = "https://images.unsplash.com/photo-1601985705806-5b9a71f6004f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxwb3R0ZWQlMjBwbGFudCUyMGluZG9vcnxlbnwwfHx8fDE3ODE0NjQ2MTd8MA&ixlib=rb-4.1.0&q=85";

const Productos = () => {
  const { isAdmin } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);
  const fileInputRef = useRef(null);
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
    imagen: "",
    codigo_barras: ""
  });

  useEffect(() => {
    loadProductos();
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const response = await api.get("/categorias");
      setCategorias(response.data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const response = await api.post("/categorias", { nombre: newCategoryName.trim() });
      toast.success(`Categoría "${response.data.nombre}" creada`);
      await loadCategorias();
      setFormData((prev) => ({ ...prev, categoria: response.data.nombre }));
      setNewCategoryName("");
      setIsNewCategoryOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear categoría");
    }
  };

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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 2MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setFormData((prev) => ({ ...prev, imagen: compressedDataUrl }));
        toast.success("Imagen cargada exitosamente");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imagen: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBarcodeScanned = (code) => {
    setFormData({ ...formData, codigo_barras: code });
    setIsScannerOpen(false);
    toast.success(`Código escaneado: ${code}`);
  };

  const handleSearchBarcodeScanned = async (code) => {
    setIsSearchScannerOpen(false);
    try {
      const response = await api.get(`/productos/barras/${code}`);
      handleEdit(response.data);
      toast.success(`Producto encontrado: ${response.data.nombre}`);
    } catch (error) {
      toast.error("Producto no encontrado con ese código de barras");
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
        toast.error(error.response?.data?.detail || "Error al eliminar producto");
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
      imagen: "",
      codigo_barras: ""
    });
    setEditingProduct(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      imagen: producto.imagen || "",
      codigo_barras: producto.codigo_barras || ""
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
        <div className="flex gap-2">
          <Button
            onClick={() => setIsSearchScannerOpen(true)}
            variant="outline"
            className="border-[#4A5D23] text-[#4A5D23] hover:bg-[#E9F5E9]"
            data-testid="search-by-barcode-button"
          >
            <Camera size={20} weight="duotone" className="mr-2" />
            Escanear
          </Button>
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
                {/* Image Upload */}
                <div>
                  <Label>Imagen del Producto</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-32 h-32 border-2 border-dashed border-[#E8E6E1] rounded-lg overflow-hidden flex items-center justify-center bg-[#F9F8F6]">
                      {formData.imagen ? (
                        <img 
                          src={formData.imagen} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          data-testid="product-image-preview"
                        />
                      ) : (
                        <Package size={36} weight="duotone" className="text-[#A5A58D]" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        data-testid="image-upload-input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="upload-image-button"
                      >
                        <UploadSimple size={18} className="mr-2" />
                        Subir Imagen
                      </Button>
                      {formData.imagen && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveImage}
                          className="text-[#BC4749] border-[#BC4749] hover:bg-[#FDF0F0]"
                          data-testid="remove-image-button"
                        >
                          <X size={18} className="mr-2" />
                          Quitar Imagen
                        </Button>
                      )}
                      <p className="text-xs text-[#6B705C]">Máx 2MB. JPG, PNG, WebP</p>
                    </div>
                  </div>
                </div>

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

                {/* Código de Barras */}
                <div>
                  <Label htmlFor="codigo_barras" className="flex items-center gap-2">
                    <Barcode size={18} weight="duotone" />
                    Código de Barras
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="codigo_barras"
                      data-testid="input-codigo-barras"
                      value={formData.codigo_barras}
                      onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                      placeholder={editingProduct ? "" : "Se generará automáticamente si lo dejas vacío"}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsScannerOpen(true)}
                      className="bg-[#4A5D23] text-white hover:bg-[#3B4A1C] border-[#4A5D23]"
                      data-testid="scan-barcode-button"
                    >
                      <Camera size={18} className="mr-2" />
                      Escanear
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoría *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                      >
                        <SelectTrigger data-testid="select-categoria">
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsNewCategoryOpen(true)}
                        title="Nueva categoría"
                        data-testid="new-category-button"
                      >
                        <Plus size={18} />
                      </Button>
                    </div>
                  </div>
                  {isAdmin && (
                    <div>
                      <Label htmlFor="proveedor">Proveedor</Label>
                      <Input
                        id="proveedor"
                        data-testid="input-proveedor"
                        value={formData.proveedor}
                        onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                      />
                    </div>
                  )}
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
                  {/* Costo Compra: Solo visible para Admin */}
                  {isAdmin && (
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
                  )}
                  <div className={isAdmin ? "" : "col-span-2"}>
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
      </div>

      <BarcodeScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />
      
      <BarcodeScanner 
        isOpen={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onScan={handleSearchBarcodeScanned}
      />

      {/* Diálogo Nueva Categoría */}
      <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
        <DialogContent className="max-w-md" data-testid="new-category-dialog">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <Label htmlFor="new-cat-name">Nombre de la categoría *</Label>
              <Input
                id="new-cat-name"
                data-testid="new-category-input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Plantas Aromáticas"
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewCategoryOpen(false);
                  setNewCategoryName("");
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#4A5D23] hover:bg-[#3B4A1C]"
                data-testid="save-new-category-button"
              >
                Crear
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                  <TableHead>Cód. Barras</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  {isAdmin && <TableHead>Costo</TableHead>}
                  <TableHead>Precio</TableHead>
                  {isAdmin && <TableHead>Utilidad</TableHead>}
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((producto) => (
                  <TableRow key={producto.codigo} data-testid={`producto-row-${producto.codigo}`}>
                    <TableCell>
                      <img 
                        src={producto.imagen || placeholderImg} 
                        alt={producto.nombre}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{producto.codigo}</TableCell>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell className="text-xs text-[#6B705C]">
                      {producto.codigo_barras || "-"}
                    </TableCell>
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
                    {isAdmin && <TableCell>S/ {producto.costo_compra.toFixed(2)}</TableCell>}
                    <TableCell>S/ {producto.precio_venta.toFixed(2)}</TableCell>
                    {isAdmin && <TableCell className="text-[#386641] font-semibold">S/ {producto.utilidad.toFixed(2)}</TableCell>}
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
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#BC4749] border-[#BC4749] hover:bg-[#FDF0F0]"
                            onClick={() => handleDelete(producto.codigo)}
                            data-testid={`delete-product-${producto.codigo}`}
                          >
                            <Trash size={16} />
                          </Button>
                        )}
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
