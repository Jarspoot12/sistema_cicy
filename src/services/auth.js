 /*Funciones para el login*/
 import { supabase } from './supabaseClient';

// 1. Iniciar Sesión
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// 2. Registrarse
export const signUp = async (email, password) => {
  // window.location.origin detecta automáticamente:
  // En tu PC: "http://localhost:5173"
  // En la Web: "https://tu-dominio-real.com"
  const redirectTo = `${window.location.origin}/email-verified`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo, 
    }
  });
  return { data, error };
};

// 3. Recuperar Contraseña
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:5173/update-password', // Página para poner la nueva pass
  });
  return { data, error };
};

// 4. Cerrar Sesión
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// 5. Actualizar usuario (Sirve para cambiar password)
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  return { data, error };
};

// 6. Obtener el rol del usuario actual
export const getUserRole = async (userId) => {
  const { data, error } = await supabase
    .from('roles')
    .select('role')
    .eq('id', userId)
    .single(); // .single() porque esperamos un solo resultado
  
  if (error) return null;
  return data?.role; // Retorna 'admin' o 'general'
};