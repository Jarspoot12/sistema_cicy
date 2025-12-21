import { supabase } from './supabaseClient';

// 1. LEER DATOS (SELECT)
export const getTableData = async (tableName) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('id', { ascending: true }); // Asumiendo que todas tienen id
  
  if (error) throw error;
  return data;
};

// 2. CREAR DATO (INSERT)
export const insertItem = async (tableName, itemData) => {
  // Nota: user_id se asigna automáticamente por el backend o triggers si está configurado
  // O podemos inyectarlo aquí si es necesario.
  const { data, error } = await supabase
    .from(tableName)
    .insert([itemData])
    .select();
    
  if (error) throw error;
  return data;
};

// 3. ACTUALIZAR DATO (UPDATE)
export const updateItem = async (tableName, id, itemData) => {
  const { data, error } = await supabase
    .from(tableName)
    .update(itemData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

// 4. ELIMINAR DATO (DELETE)
export const deleteItem = async (tableName, id) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};