import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowsClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";

const Ajustes = () => {
  const [ajustes, setAjustes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo_producto: "",
    cantidad: 0,
    motivo: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ajustesRes, productosRes] = await Promise.all([
        api.get("/ajustes"),
        api.get("/productos")
      ]);
      setAjustes(ajustesRes.data);
      setProductos(productosRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/ajustes", formData);
      toast.success("Ajuste registrado exitosamente");
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error registrando ajuste:", error);
      toast.error(error.response?.data?.detail || "Error al registrar ajuste");
    }
  };

  const resetForm = () => {
    setFormData({
      codigo_producto: "",
      cantidad: 0,
      motivo: ""
    });
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="ajustes-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#2D312E]" data-testid="ajustes-title">
            Ajustes de Inventario
          </h1>
          <p className="text-[#6B705C] mt-2">Registra ajustes de stock (daños, pérdidas, correcciones)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleOpenDialog}
              className="bg-[#4A5D23] hover:bg-[#3B4A1C] text-white"
              data-testid="add-adjustment-button"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Nuevo Ajuste
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">Nuevo Ajuste de Inventario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="adjustment-form">
              <div>
                <Label htmlFor="codigo_producto">Producto *</Label>
                <Select
                  value={formData.codigo_producto}
                  onValueChange={(value) => setFormData({ ...formData, codigo_producto: value })}
                >
                  <SelectTrigger data-testid="select-producto">
                    <SelectValue placeholder="Selecciona producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((prod) => (
                      <SelectItem key={prod.codigo} value={prod.codigo}>
                        {prod.nombre} (Stock actual: {prod.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  data-testid="input-cantidad"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                  placeholder="Positivo para aumentar, negativo para disminuir"
                  required
                />
                <p className="text-xs text-[#6B705C] mt-1">
                  Usa números positivos para aumentar stock, negativos para disminuir
                </p>
              </div>

              <div>
                <Label htmlFor="motivo">Motivo *</Label>
                <Textarea
                  id="motivo"
                  data-testid="input-motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ej: Daño, pérdida, corrección de inventario"
                  rows={3}
                  required
                />
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
                  data-testid="save-adjustment-button"
                >
                  Registrar Ajuste
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-[#E8E6E1] shadow-sm" data-testid="ajustes-table-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64" data-testid="loading-ajustes">
              <p className="text-[#6B705C]">Cargando ajustes...</p>
            </div>
          ) : ajustes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64" data-testid="empty-ajustes">
              <ArrowsClockwise size={48} weight="duotone" className="text-[#A5A58D] mb-4" />
              <p className="text-[#6B705C]">No hay ajustes registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ajustes.map((ajuste) => (
                  <TableRow key={ajuste.id} data-testid={`ajuste-row-${ajuste.id}`}>
                    <TableCell>
                      {new Date(ajuste.fecha).toLocaleString('es-PE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{ajuste.nombre_producto}</TableCell>
                    <TableCell>{ajuste.codigo_producto}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        ajuste.cantidad > 0 ? "text-[#386641]" : "text-[#BC4749]"
                      }`}>
                        {ajuste.cantidad > 0 ? "+" : ""}{ajuste.cantidad}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#6B705C]">{ajuste.motivo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Ajustes;
