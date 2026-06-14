import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  House, 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  Users, 
  Wallet, 
  ArrowsClockwise,
  Leaf,
  SignOut,
  User
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const allNavigation = [
    { name: "Dashboard", path: "/dashboard", icon: House, adminOnly: false },
    { name: "Productos", path: "/productos", icon: Package, adminOnly: false },
    { name: "Ventas", path: "/ventas", icon: ShoppingCart, adminOnly: false },
    { name: "Compras", path: "/compras", icon: ShoppingBag, adminOnly: true },
    { name: "Clientes", path: "/clientes", icon: Users, adminOnly: false },
    { name: "Caja", path: "/caja", icon: Wallet, adminOnly: true },
    { name: "Ajustes Inventario", path: "/ajustes", icon: ArrowsClockwise, adminOnly: true },
  ];

  const navigation = allNavigation.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    await logout();
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden" data-testid="layout-container">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-[#F3F2EF] border-r border-[#E8E6E1] transition-all duration-200 flex flex-col`}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#E8E6E1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4A5D23] rounded-lg flex items-center justify-center">
              <Leaf size={24} weight="duotone" className="text-white" />
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-[#2D312E] tracking-tight">Plantástika</h1>
                <p className="text-xs text-[#6B705C]">Control de Negocio</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto" data-testid="navigation">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-testid={`nav-link-${item.path.slice(1)}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-[#4A5D23] text-white shadow-sm"
                        : "text-[#6B705C] hover:bg-white hover:text-[#2D312E]"
                    }`}
                  >
                    <Icon size={22} weight="duotone" />
                    {isSidebarOpen && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info & Logout */}
        <div className="p-4 border-t border-[#E8E6E1] space-y-3" data-testid="user-section">
          {isSidebarOpen && user && (
            <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg">
              <div className="w-9 h-9 bg-[#4A5D23] rounded-full flex items-center justify-center flex-shrink-0">
                <User size={18} weight="duotone" className="text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-[#2D312E] truncate" data-testid="user-name">{user.nombre}</p>
                <p className="text-xs text-[#6B705C] capitalize" data-testid="user-role">
                  {user.role === "admin" ? "Administrador" : "Vendedora"}
                </p>
              </div>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-[#E8E6E1] text-[#BC4749] hover:bg-[#FDF0F0]"
            data-testid="logout-button"
          >
            <SignOut size={18} weight="duotone" className="mr-2" />
            {isSidebarOpen && "Cerrar Sesión"}
          </Button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full px-4 py-1 text-xs text-[#6B705C] hover:text-[#2D312E] transition-colors"
            data-testid="sidebar-toggle"
          >
            {isSidebarOpen ? "◀ Contraer" : "▶"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" data-testid="main-content">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
