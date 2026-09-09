import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RegistroProvider } from "./contexts/RegistroContext";
import { Login } from "./pages/Login";
import { Climas } from "./pages/admin/Climas";
import { Contratos } from "./pages/admin/Contratos";
import { Dashboard } from "./pages/admin/Dashboard";
import { Motoristas } from "./pages/admin/Motoristas";
import { Placas } from "./pages/admin/Placas";
import { Rodovias } from "./pages/admin/Rodovias";
import { Servicos } from "./pages/admin/Servicos";
import { ServicosTerceiros } from "./pages/admin/ServicosTerceiros";
import { Usinas } from "./pages/admin/Usinas";
import { Planilha } from "./pages/engenheiro/Planilha";
import { RegistrosDoDia } from "./pages/operador/RegistrosDoDia";
import { Tela1Equipe } from "./pages/operador/Tela1Equipe";
import { Tela2Carga } from "./pages/operador/Tela2Carga";
import { Tela3Local } from "./pages/operador/Tela3Local";

function Home() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.perfil === "operador" || usuario.perfil === "terceirizado") return <Navigate to="/operador/equipe" replace />;
  if (usuario.perfil === "gestor") return <Navigate to="/admin" replace />;
  return <Navigate to="/engenheiro" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <RegistroProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />

            <Route
              path="/operador/equipe"
              element={
                <ProtectedRoute perfis={["operador", "terceirizado"]}>
                  <Tela1Equipe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operador/carga"
              element={
                <ProtectedRoute perfis={["operador", "terceirizado"]}>
                  <Tela2Carga />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operador/local"
              element={
                <ProtectedRoute perfis={["operador", "terceirizado"]}>
                  <Tela3Local />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operador/dia"
              element={
                <ProtectedRoute perfis={["operador", "terceirizado"]}>
                  <RegistrosDoDia />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute perfis={["gestor"]}>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/motoristas"
              element={
                <ProtectedRoute perfis={["gestor"]}>
                  <AdminLayout>
                    <Motoristas />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/placas"
              element={
                <ProtectedRoute perfis={["gestor"]}>
                  <AdminLayout>
                    <Placas />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contratos"
              element={
                <ProtectedRoute perfis={["gestor"]}>
                  <AdminLayout>
                    <Contratos />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/servicos"
              element={
                <ProtectedRoute perfis={["gestor"]}>
                  <AdminLayout>
                    <Servicos />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/servicos-terceiros"
              element={
                <ProtectedRoute perfis={["gestor"]}>
                  <AdminLayout>
                    <ServicosTerceiros />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/usinas"
              element={
                <ProtectedRoute perfis={["gestor"]}>
                  <AdminLayout>
                    <Usinas />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rodovias"
              element={
                <ProtectedRoute perfis={["gestor"]}>
                  <AdminLayout>
                    <Rodovias />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/climas"
              element={
                <ProtectedRoute perfis={["gestor"]}>
                  <AdminLayout>
                    <Climas />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/engenheiro"
              element={
                <ProtectedRoute perfis={["engenheiro", "gestor"]}>
                  <Planilha />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </RegistroProvider>
    </AuthProvider>
  );
}
