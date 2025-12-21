import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getUserRole } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  
  // Iniciamos cargando solo la primera vez
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Función auxiliar para buscar el rol sin bloquear
    const fetchRoleInternal = async (userId) => {
      try {
        const userRole = await getUserRole(userId);
        if (mounted) setRole(userRole);
      } catch (error) {
        console.error("Error obteniendo rol:", error);
      }
    };

    // LOGICA 1: Carga Inicial (Se ejecuta al dar F5 o escribir URL)
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          // Esperamos el rol antes de quitar la pantalla de carga
          // para evitar "parpadeos" de permisos
          await fetchRoleInternal(session.user.id);
        }
      } catch (error) {
        console.error("Error en carga inicial:", error);
      } finally {
        // AQUÍ está la clave: Pase lo que pase, quitamos el loading inicial.
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // LOGICA 2: Escuchar cambios en vivo
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento Auth:", event); // Para depuración

      if (session?.user) {
        setUser(session.user);
        // IMPORTANTE: Aquí NO ponemos setLoading(true).
        // Si el usuario ya está viendo la app, no queremos bloquearle la pantalla
        // solo porque se refrescó un token en segundo plano.
        // Solo actualizamos el rol si cambió el usuario.
        if (session.user.id !== user?.id) {
           fetchRoleInternal(session.user.id);
        }
      } else {
        // Si hizo logout o no hay sesión
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Array vacío = Solo se monta una vez

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontFamily: 'sans-serif',
        flexDirection: 'column'
      }}>
        <h3 style={{color: '#333'}}>Iniciando sistema...</h3>
        <p style={{color: '#888', fontSize: '0.9rem'}}>Verificando credenciales</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut: () => supabase.auth.signOut() }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);