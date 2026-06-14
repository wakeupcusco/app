import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  House, 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  Users, 
  Wallet, 
  ArrowsClockwise,
  Leaf
} from "@phosphor-icons/react";

const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigation = [
    { name: "Dashboard", path: "/dashboard", icon: House },
    { name: "Productos", path: "/productos", icon: Package },
    { name: "Ventas", path: "/ventas", icon: ShoppingCart },
    { name: "Compras", path: "/compras", icon: ShoppingBag },
    { name: "Clientes", path: "/clientes", icon: Users },
    { name: "Caja", path: "/caja", icon: Wallet },
    { name: "Ajustes Inventario", path: "/ajustes", icon: ArrowsClockwise },
  ];

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
        <nav className="flex-1 p-4" data-testid="navigation">
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

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E6E1]">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full px-4 py-2 text-sm text-[#6B705C] hover:text-[#2D312E] transition-colors"
            data-testid="sidebar-toggle"
          >
            {isSidebarOpen ? "◀" : "▶"}
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