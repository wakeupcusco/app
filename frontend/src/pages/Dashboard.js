import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendUp, 
  CurrencyDollar, 
  Package, 
  Warning,
  ShoppingCart
} from "@phosphor-icons/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-dashboard">
        <p className="text-[#6B705C]">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#2D312E]" data-testid="dashboard-title">
          Dashboard
        </h1>
        <p className="text-[#6B705C] mt-2">Resumen general de tu negocio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-[#E8E6E1] shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="kpi-ventas-hoy">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-[#6B705C]">
              Ventas Hoy
            </CardTitle>
            <div className="w-10 h-10 bg-[#E9F5E9] rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} weight="duotone" className="text-[#386641]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light tracking-tighter text-[#2D312E]">
              S/ {stats?.ventas_hoy?.total?.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-[#6B705C] mt-2">
              {stats?.ventas_hoy?.cantidad || 0} transacciones
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E6E1] shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="kpi-ventas-mes">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-[#6B705C]">
              Ventas del Mes
            </CardTitle>
            <div className="w-10 h-10 bg-[#E9F5E9] rounded-lg flex items-center justify-center">
              <TrendUp size={20} weight="duotone" className="text-[#386641]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light tracking-tighter text-[#2D312E]">
              S/ {stats?.ventas_mes?.total?.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-[#6B705C] mt-2">
              {stats?.ventas_mes?.cantidad || 0} transacciones
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E6E1] shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="kpi-inventario">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-[#6B705C]">
              Valor Inventario
            </CardTitle>
            <div className="w-10 h-10 bg-[#E9F5E9] rounded-lg flex items-center justify-center">
              <CurrencyDollar size={20} weight="duotone" className="text-[#386641]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light tracking-tighter text-[#2D312E]">
              S/ {stats?.valor_inventario?.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-[#6B705C] mt-2">
              {stats?.total_productos || 0} productos
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E6E1] shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="kpi-stock-bajo">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-[#6B705C]">
              Stock Bajo
            </CardTitle>
            <div className="w-10 h-10 bg-[#FDF0F0] rounded-lg flex items-center justify-center">
              <Warning size={20} weight="duotone" className="text-[#BC4749]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light tracking-tighter text-[#2D312E]">
              {stats?.productos_bajo_stock || 0}
            </div>
            <p className="text-sm text-[#6B705C] mt-2">
              Productos con stock mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Productos */}
      <Card className="border-[#E8E6E1] shadow-sm" data-testid="top-productos-card">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D312E]">
            Top 5 Productos Más Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.top_productos && stats.top_productos.length > 0 ? (
            <div className="space-y-4">
              {stats.top_productos.map((producto, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E8E6E1]"
                  data-testid={`top-producto-${index}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#4A5D23] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#2D312E]">{producto.nombre}</p>
                      <p className="text-sm text-[#6B705C]">{producto.cantidad} unidades vendidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#4A5D23]">S/ {producto.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6B705C] text-center py-8">No hay datos de ventas aún</p>
          )}
        </CardContent>
      </Card>

      {/* Productos con Stock Bajo */}
      {stats?.productos_bajo_stock_lista && stats.productos_bajo_stock_lista.length > 0 && (
        <Card className="border-[#E8E6E1] shadow-sm" data-testid="stock-bajo-card">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D312E]">
              Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.productos_bajo_stock_lista.map((producto, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-[#FDF0F0] rounded-lg border border-[#BC4749]/20"
                  data-testid={`stock-bajo-${index}`}
                >
                  <div>
                    <p className="font-medium text-[#2D312E]">{producto.nombre}</p>
                    <p className="text-sm text-[#6B705C]">Código: {producto.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#BC4749]">
                      Stock: {producto.stock} / Mínimo: {producto.stock_minimo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;