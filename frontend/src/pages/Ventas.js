import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingCart, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

const metodosPago = ["Efectivo", "Yape", "Plin", "Transferencia"];

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    producto: null,
    cantidad: 1
  });
  const [formData, setFormData] = useState({
    metodo_pago: "Efectivo",
    vendedor: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ventasRes, productosRes] = await Promise.all([
        api.get("/ventas"),
        api.get("/productos")
      ]);
      setVentas(ventasRes.data);
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
    if (currentItem.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    const producto = productos.find(p => p.codigo === currentItem.producto);
    if (producto.stock < currentItem.cantidad) {
      toast.error("Stock insuficiente");
      return;
    }

    const subtotal = producto.precio_venta * currentItem.cantidad;
    setItems([...items, {
      codigo_producto: producto.codigo,
      nombre_producto: producto.nombre,
      cantidad: currentItem.cantidad,
      precio_unit: producto.precio_venta,
      subtotal
    }]);

    setCurrentItem({ producto: null, cantidad: 1 });
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

    try {
      await api.post("/ventas", {
        items,
        metodo_pago: formData.metodo_pago,
        vendedor: formData.vendedor
      });
      toast.success("Venta registrada exitosamente");
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error registrando venta:", error);
      toast.error("Error al registrar venta");
    }
  };

  const resetForm = () => {
    setItems([]);
    setCurrentItem({ producto: null, cantidad: 1 });
    setFormData({ metodo_pago: "Efectivo", vendedor: "" });
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-6" data-testid="ventas-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#2D312E]" data-testid="ventas-title">
            Ventas
          </h1>
          <p className="text-[#6B705C] mt-2">Registra y consulta ventas realizadas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => resetForm()}
              className="bg-[#4A5D23] hover:bg-[#3B4A1C] text-white"
              data-testid="new-sale-button"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Nueva Venta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">Nueva Venta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="sale-form">
              {/* Agregar Productos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#2D312E]">Agregar Productos</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>Producto</Label>
                    <Select
                      value={currentItem.producto}
                      onValueChange={(value) => setCurrentItem({ ...currentItem, producto: value })}
                    >
                      <SelectTrigger data-testid="select-producto">
                        <SelectValue placeholder="Selecciona producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((prod) => (
                          <SelectItem key={prod.codigo} value={prod.codigo}>
                            {prod.nombre} - S/ {prod.precio_venta} (Stock: {prod.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        data-testid="input-cantidad"
                        value={currentItem.cantidad}
                        onChange={(e) => setCurrentItem({ ...currentItem, cantidad: parseInt(e.target.value) || 1 })}
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
                  <h3 className="font-semibold text-[#2D312E]">Productos en Venta</h3>
                  <div className="border border-[#E8E6E1] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index} data-testid={`sale-item-${index}`}>
                            <TableCell>{item.nombre_producto}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>S/ {item.precio_unit.toFixed(2)}</TableCell>
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
                      <p className="text-2xl font-bold text-[#4A5D23]" data-testid="sale-total">S/ {total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Datos de Venta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metodo_pago">Método de Pago *</Label>
                  <Select
                    value={formData.metodo_pago}
                    onValueChange={(value) => setFormData({ ...formData, metodo_pago: value })}
                  >
                    <SelectTrigger data-testid="select-metodo-pago">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metodosPago.map((metodo) => (
                        <SelectItem key={metodo} value={metodo}>{metodo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vendedor">Vendedor *</Label>
                  <Input
                    id="vendedor"
                    data-testid="input-vendedor"
                    value={formData.vendedor}
                    onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
                    required
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
                  data-testid="save-sale-button"
                >
                  Registrar Venta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-[#E8E6E1] shadow-sm" data-testid="ventas-table-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64" data-testid="loading-ventas">
              <p className="text-[#6B705C]">Cargando ventas...</p>
            </div>
          ) : ventas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64" data-testid="empty-ventas">
              <ShoppingCart size={48} weight="duotone" className="text-[#A5A58D] mb-4" />
              <p className="text-[#6B705C]">No hay ventas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Método Pago</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((venta) => (
                  <TableRow key={venta.id} data-testid={`venta-row-${venta.id}`}>
                    <TableCell>
                      {new Date(venta.fecha).toLocaleString('es-PE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {venta.items.map((item, idx) => (
                          <div key={idx}>
                            {item.nombre_producto} x{item.cantidad}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{venta.vendedor}</TableCell>
                    <TableCell>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9F5E9] text-[#386641]">
                        {venta.metodo_pago}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-[#4A5D23]">S/ {venta.total.toFixed(2)}</TableCell>
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

export default Ventas;