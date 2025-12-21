import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import DataEntry from './pages/DataEntry';
import AdminVisualizer from './pages/AdminVisualizer';
import AdminDashboard from './pages/AdminDashboard';
import EmailVerified from './pages/EmailVerified';
// Componente simple de Navegación (Temporal, para probar)
import Navbar from './components/Navbar'; // Te daré el código de este abajo

function App() {
  return (
    <AuthProvider> {/* El Proveedor envuelve TODA la app */}
      <Router>
        <Navbar /> {/* Menú de navegación visible en todas partes */}
        
        <Routes>
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/email-verified" element={<EmailVerified />} />

          {/* --- RUTAS PRIVADAS --- */}
          
          {/* 1. Captura de Datos: Acceso para ADMIN y GENERAL */}
          <Route 
            path="/captura-datos" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'general']}>
                <DataEntry />
              </ProtectedRoute>
            } 
          />

          {/* 2. Visualizador Avanzado: Acceso SOLO ADMIN */}
          <Route 
            path="/visualizador" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminVisualizer />
              </ProtectedRoute>
            } 
          />

          {/* 3. Dashboard: Acceso SOLO ADMIN */}
          <Route 
            path="/dashboard-admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Ruta 404 */}
          <Route path="*" element={<h2>Página no encontrada</h2>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;