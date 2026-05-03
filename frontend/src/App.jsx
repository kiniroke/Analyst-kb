import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import LoadingState from "./components/common/LoadingState";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SourceRegistry from "./pages/SourceRegistry";
import SourceDetails from "./pages/SourceDetails";
import ExtractionLab from "./pages/ExtractionLab";
import CsiDataImport from "./pages/CsiDataImport";
import CoverageChecks from "./pages/CoverageChecks";
import CoverageDetails from "./pages/CoverageDetails";
import Issues from "./pages/Issues";
import Tasks from "./pages/Tasks";
import KnowledgeBase from "./pages/KnowledgeBase";
import Reports from "./pages/Reports";
import AdminPanel from "./pages/AdminPanel";
import ApiDocs from "./pages/ApiDocs";
import About from "./pages/About";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Loading application..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedLayout />
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="sources" element={<SourceRegistry />} />
        <Route path="sources/:id" element={<SourceDetails />} />
        <Route path="extraction-lab" element={<ExtractionLab />} />
        <Route path="csi-data-import" element={<CsiDataImport />} />
        <Route path="coverage-checks" element={<CoverageChecks />} />
        <Route path="coverage-checks/:id" element={<CoverageDetails />} />
        <Route path="issues" element={<Issues />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="knowledge-base" element={<KnowledgeBase />} />
        <Route path="reports" element={<Reports />} />
        <Route
          path="admin"
          element={
            <AdminOnly>
              <AdminPanel />
            </AdminOnly>
          }
        />
        <Route path="api-docs" element={<ApiDocs />} />
        <Route path="about" element={<About />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
