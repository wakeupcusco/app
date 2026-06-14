import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingBag, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    producto: null,
    cantidad: 1,
    costo_unit: 0
  });
  const [proveedor, setProveedor] = useState("");

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

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-6" data-testid="compras-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#2D312E]" data-testid="compras-title">
            Compras
          </h1>
          <p className="text-[#6B705C] mt-2">Registra compras a proveedores</p>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-4">
                <h3 className="font-semibold text-[#2D312E]">Agregar Productos</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label>Producto</Label>
                    <Select
                      value={currentItem.producto}
                      onValueChange={(value) => {
                        const prod = productos.find(p => p.codigo === value);
                        setCurrentItem({ 
                          ...currentItem, 
                          producto: value,
                          costo_unit: prod?.costo_compra || 0
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-producto">
                        <SelectValue placeholder="Selecciona producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((prod) => (
                          <SelectItem key={prod.codigo} value={prod.codigo}>
                            {prod.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      data-testid="input-cantidad"
                      value={currentItem.cantidad}
                      onChange={(e) => setCurrentItem({ ...currentItem, cantidad: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label>Costo Unit.</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        data-testid="input-costo"
                        value={currentItem.costo_unit}
                        onChange={(e) => setCurrentItem({ ...currentItem, costo_unit: parseFloat(e.target.value) || 0 })}
                      />
                      <Button
                        type="button"
                        onClick={handleAddItem}
                        className="bg-[#4A5D23] hover:bg-[#3B4A1C]"
                        data-testid="add-item-button"
                      >
                        <Plus size={20} />
                      </Button>
                    </div>
                  </div>
                </div>
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