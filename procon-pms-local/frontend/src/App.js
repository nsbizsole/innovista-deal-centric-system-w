import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import UserManagement from "./pages/UserManagement";
import Documents from "./pages/Documents";
import ChangeOrders from "./pages/ChangeOrders";
import Financials from "./pages/Financials";
import ProgressLogsPage from "./pages/ProgressLogsPage";
import Reports from "./pages/Reports";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected Routes */}
                    <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/new" element={<NewProject />} />
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/change-orders" element={<ChangeOrders />} />
                        <Route path="/financials" element={<Financials />} />
                        <Route path="/progress-logs" element={<ProgressLogsPage />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>
                    
                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
