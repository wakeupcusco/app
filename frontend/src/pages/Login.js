import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Eye, EyeSlash } from "@phosphor-icons/react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bienvenido/a, ${user.nombre}`);
      navigate("/dashboard");
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-[#F9F8F6]" 
      style={{
        backgroundImage: 'linear-gradient(rgba(249, 248, 246, 0.85), rgba(249, 248, 246, 0.85)), url("https://images.unsplash.com/photo-1520515080697-c1f99f3137cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwyfHxncmVlbmhvdXNlJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzgxNDY0NjE3fDA&ixlib=rb-4.1.0&q=85")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
      data-testid="login-page"
    >
      <Card className="w-full max-w-md border-[#E8E6E1] shadow-xl bg-white/95 backdrop-blur">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#4A5D23] rounded-2xl flex items-center justify-center mb-4">
              <Leaf size={36} weight="duotone" className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tighter text-[#2D312E]">Plantástika</h1>
            <p className="text-sm text-[#6B705C] mt-1">Control de Negocio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="correo@plantastika.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  data-testid="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B705C]"
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#4A5D23] hover:bg-[#3B4A1C] text-white py-6"
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
