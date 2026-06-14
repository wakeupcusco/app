import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Productos from "@/pages/Productos";
import Ventas from "@/pages/Ventas";
import Compras from "@/pages/Compras";
import Clientes from "@/pages/Clientes";
import Caja from "@/pages/Caja";
import Ajustes from "@/pages/Ajustes";
import { Toaster } from "@/components/ui/sonner";
import InstallPWAButton from "@/components/InstallPWAButton";
import "@/App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="productos" element={<Productos />} />
              <Route path="ventas" element={<Ventas />} />
              <Route path="clientes" element={<Clientes />} />
              <Route
                path="compras"
                element={
                  <ProtectedRoute adminOnly>
                    <Compras />
                  </ProtectedRoute>
                }
              />
              <Route
                path="caja"
                element={
                  <ProtectedRoute adminOnly>
                    <Caja />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ajustes"
                element={
                  <ProtectedRoute adminOnly>
                    <Ajustes />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="bottom-right" />
      <InstallPWAButton />
    </div>
  );
}

export default App;
