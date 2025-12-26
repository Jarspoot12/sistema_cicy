import { useState } from 'react'; // Agregamos useState
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, ChevronDown, Folder, BarChart2, PieChart } from 'lucide-react';

const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado para controlar si el menú está abierto o cerrado
  const [isOpen, setIsOpen] = useState(false);

  const rutasOcultas = [
    '/', '/register', '/forgot-password', '/update-password', '/email-verified'
  ];

  if (!user || rutasOcultas.includes(location.pathname)) return null;

  // Función para navegar y cerrar el menú automáticamente
  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false); // <--- IMPORTANTE: Cierra el menú al hacer clic
  };

  // Títulos amigables para mostrar en el botón según la ruta actual
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/captura-datos': return 'Captura de Datos';
      case '/visualizador': return 'Visualizador';
      case '/dashboard-admin': return 'Dashboard KPIs';
      default: return 'Menú';
    }
  };

  return (
    <nav className="navbar">
      
      {/* IZQUIERDA: Menú Colapsable Personalizado */}
      <div className="nav-menu-container">
        
        {/* Botón Disparador */}
        <button 
          className="menu-trigger-btn" 
          onClick={() => setIsOpen(!isOpen)} // Alternar abierto/cerrado
        >
          <Menu size={18} />
          <span>{getPageTitle()}</span>
          <ChevronDown size={14} style={{ opacity: 0.7 }} />
        </button>

        {/* Lista Flotante (Solo se muestra si isOpen es true) */}
        {isOpen && (
          <div className="dropdown-menu">
            
            {/* Opción 1 */}
            <div className="dropdown-item" onClick={() => handleNavigate('/captura-datos')}>
              <Folder size={16} />
              <span>Captura de Datos</span>
            </div>

            {/* Opciones Admin */}
            {role === 'admin' && (
              <>
                <div className="dropdown-item" onClick={() => handleNavigate('/visualizador')}>
                  <BarChart2 size={16} />
                  <span>Visualizador</span>
                </div>
                <div className="dropdown-item" onClick={() => handleNavigate('/dashboard-admin')}>
                  <PieChart size={16} />
                  <span>Dashboard</span>
                </div>
              </>
            )}
            
          </div>
        )}

        {/* Capa invisible para cerrar el menú si haces clic afuera (Opcional pero recomendado) */}
        {isOpen && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* DERECHA: Info Usuario */}
      <div className="nav-right">
        <div className="user-info">
          <span className="user-email-text">{user.email}</span>
          <span className="user-role">{role}</span>
        </div>
        <button onClick={signOut} className="logout-btn" title="Salir">
          <LogOut size={20} />
        </button>
      </div>

    </nav>
  );
};

export default Navbar;