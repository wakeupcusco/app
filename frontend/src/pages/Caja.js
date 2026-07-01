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
import { Plus, Wallet } from "@phosphor-icons/react";
import { toast } from "sonner";

const metodosPago = ["Efectivo", "Yape", "Plin", "Transferencia"];

const Caja = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    concepto: "",
    efectivo: 0,
    yape: 0,
    plin: 0,
    transferencia: 0,
    tipo: "ingreso",
    observacion: ""
  });

  useEffect(() => {
    loadMovimientos();
  }, []);

  const loadMovimientos = async () => {
    try {
      const response = await api.get("/caja");
      setMovimientos(response.data);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
      toast.error("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/caja", formData);
      toast.success("Movimiento registrado exitosamente");
      setIsDialogOpen(false);
      resetForm();
      loadMovimientos();
    } catch (error) {
      console.error("Error registrando movimiento:", error);
      toast.error("Error al registrar movimiento");
    }
  };

  const resetForm = () => {
    setFormData({
      concepto: "",
      efectivo: 0,
      yape: 0,
      plin: 0,
      transferencia: 0,
      tipo: "ingreso",
      observacion: ""
    });
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const calcularTotales = () => {
    const totales = {
      efectivo: 0,
      yape: 0,
      plin: 0,
      transferencia: 0,
      total: 0
    };

    movimientos.forEach(mov => {
      const multiplicador = mov.tipo === "ingreso" ? 1 : -1;
      totales.efectivo += mov.efectivo * multiplicador;
      totales.yape += mov.yape * multiplicador;
      totales.plin += mov.plin * multiplicador;
      totales.transferencia += mov.transferencia * multiplicador;
      totales.total += mov.total * multiplicador;
    });

    return totales;
  };

  const totales = calcularTotales();

  return (
    <div className="space-y-6" data-testid="caja-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#2D312E]" data-testid="caja-title">
            Caja
          </h1>
          <p className="text-[#6B705C] mt-2">Control de movimientos de efectivo</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleOpenDialog}
              className="bg-[#4A5D23] hover:bg-[#3B4A1C] text-white"
              data-testid="add-movement-button"
            >
              <Plus size={20} weight="bold" className="mr-2" />
              Nuevo Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">Nuevo Movimiento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="movement-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="concepto">Concepto *</Label>
                  <Input
                    id="concepto"
                    data-testid="input-concepto"
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger data-testid="select-tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="egreso">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="efectivo">Efectivo</Label>
                  <Input
                    id="efectivo"
                    type="number"
                    step="0.01"
                    data-testid="input-efectivo"
                    value={formData.efectivo}
                    onChange={(e) => setFormData({ ...formData, efectivo: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="yape">Yape</Label>
                  <Input
                    id="yape"
                    type="number"
                    step="0.01"
                    data-testid="input-yape"
                    value={formData.yape}
                    onChange={(e) => setFormData({ ...formData, yape: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plin">Plin</Label>
                  <Input
                    id="plin"
                    type="number"
                    step="0.01"
                    data-testid="input-plin"
                    value={formData.plin}
                    onChange={(e) => setFormData({ ...formData, plin: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="transferencia">Transferencia</Label>
                  <Input
                    id="transferencia"
                    type="number"
                    step="0.01"
                    data-testid="input-transferencia"
                    value={formData.transferencia}
                    onChange={(e) => setFormData({ ...formData, transferencia: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacion">Observación</Label>
                <Textarea
                  id="observacion"
                  data-testid="input-observacion"
                  value={formData.observacion}
                  onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                  rows={3}
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
                  data-testid="save-movement-button"
                >
                  Registrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen de Caja */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-[#E8E6E1] shadow-sm" data-testid="total-efectivo">
          <CardContent className="p-6">
            <p className="text-sm text-[#6B705C] mb-2">Efectivo</p>
            <p className="text-2xl font-bold text-[#2D312E]">S/ {totales.efectivo.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-[#E8E6E1] shadow-sm" data-testid="total-yape">
          <CardContent className="p-6">
            <p className="text-sm text-[#6B705C] mb-2">Yape</p>
            <p className="text-2xl font-bold text-[#2D312E]">S/ {totales.yape.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-[#E8E6E1] shadow-sm" data-testid="total-plin">
          <CardContent className="p-6">
            <p className="text-sm text-[#6B705C] mb-2">Plin</p>
            <p className="text-2xl font-bold text-[#2D312E]">S/ {totales.plin.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-[#E8E6E1] shadow-sm" data-testid="total-transferencia">
          <CardContent className="p-6">
            <p className="text-sm text-[#6B705C] mb-2">Transferencia</p>
            <p className="text-2xl font-bold text-[#2D312E]">S/ {totales.transferencia.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-[#E8E6E1] shadow-sm bg-[#E9F5E9]" data-testid="total-general">
          <CardContent className="p-6">
            <p className="text-sm text-[#386641] mb-2">Total en Caja</p>
            <p className="text-2xl font-bold text-[#386641]">S/ {totales.total.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E8E6E1] shadow-sm" data-testid="movimientos-table-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64" data-testid="loading-movimientos">
              <p className="text-[#6B705C]">Cargando movimientos...</p>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64" data-testid="empty-movimientos">
              <Wallet size={48} weight="duotone" className="text-[#A5A58D] mb-4" />
              <p className="text-[#6B705C]">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Efectivo</TableHead>
                  <TableHead>Yape</TableHead>
                  <TableHead>Plin</TableHead>
                  <TableHead>Transferencia</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((movimiento) => (
                  <TableRow key={movimiento.id} data-testid={`movimiento-row-${movimiento.id}`}>
                    <TableCell>
                      {new Date(movimiento.fecha).toLocaleString('es-PE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{movimiento.concepto}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        movimiento.tipo === "ingreso" 
                          ? "bg-[#E9F5E9] text-[#386641]" 
                          : "bg-[#FDF0F0] text-[#BC4749]"
                      }`}>
                        {movimiento.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                      </span>
                    </TableCell>
                    <TableCell>S/ {movimiento.efectivo.toFixed(2)}</TableCell>
                    <TableCell>S/ {movimiento.yape.toFixed(2)}</TableCell>
                    <TableCell>S/ {movimiento.plin.toFixed(2)}</TableCell>
                    <TableCell>S/ {movimiento.transferencia.toFixed(2)}</TableCell>
                    <TableCell className={`font-bold ${
                      movimiento.tipo === "ingreso" ? "text-[#386641]" : "text-[#BC4749]"
                    }`}>
                      {movimiento.tipo === "ingreso" ? "+" : "-"} S/ {movimiento.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B705C]">{movimiento.observacion || "-"}</TableCell>
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

export default Caja;
