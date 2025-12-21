import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Verificando permisos...</div>;

  // 1. Si no hay usuario, al Login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 2. Si el usuario existe pero aún no carga el rol
  if (!role) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#222121ff', background: '#d8d8d89d' }}>
        <h3>Cargando permisos...</h3>
      </div>
    );
  }

  // 3. Validación de Roles
  if (allowedRoles && !allowedRoles.includes(role)) {
    // IMPORTANTE: Evitar bucle infinito.
    // Si ya estamos en la página de destino (/captura-datos), NO redirigir de nuevo.
    if (location.pathname === '/captura-datos') {
       // Si estás en captura-datos y aun así no tienes permiso (ej. un rol raro), mostramos error
       return <div>No tienes permiso para ver esta sección.</div>;
    }
    
    // Si intentas entrar a Admin siendo General, te mandamos a Captura
    return <Navigate to="/captura-datos" replace />;
  }

  return children;
};

export default ProtectedRoute;