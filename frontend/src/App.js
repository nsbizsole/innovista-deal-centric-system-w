import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import NewDeal from "./pages/NewDeal";
import DealDetail from "./pages/DealDetail";
import UserManagement from "./pages/UserManagement";
import Documents from "./pages/Documents";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/deals" element={<Deals />} />
                        <Route path="/deals/new" element={<NewDeal />} />
                        <Route path="/deals/:id" element={<DealDetail />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/pipeline" element={<Dashboard />} />
                        <Route path="/commissions" element={<Dashboard />} />
                        <Route path="/collaborations" element={<Deals />} />
                        <Route path="/sites" element={<Deals />} />
                        <Route path="/jobs" element={<Deals />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>
                    
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
