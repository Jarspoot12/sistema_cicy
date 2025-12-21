import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Asegúrate que esta ruta coincida con tu carpeta services

export default function AdminVisualizer() {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // JOINS entre tablas relacionadas
      const { data, error } = await supabase
        .from('analisis') //Tabla base: Microplásticos
        .select(`
          id,
          forma,
          clase,
          largo_mm,
          ancho_mm,
          url_fotografia,
          
          color ( nombre ),                 // Join con Color
          resultado_ftir_raman ( nombre ),  // Join con Resultado Químico
          
          muestreo (                        // Join con Muestreo
            fecha_muestreo,
            epoca_climatica,
            ubicacion (                     // Join Anidado: Muestreo -> Ubicación
              nombre_sitio,
              latitud,
              longitud
            )
          )
        `);

      if (error) throw error;
      setDatos(data);
      console.log("Datos recuperados (Joins):", data); // Para verificar en consola

    } catch (err) {
      console.error("Error cargando datos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando visualizador...</div>;
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>🔗 Visualizador de Datos Maestros</h1>
      <p>Total de registros encontrados: {datos.length}</p>

      {/* Tabla simple para verificar que los datos llegan bien */}
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>ID</th>
            <th>Fecha</th>
            <th>Sitio</th>
            <th>Forma</th>
            <th>Color</th>
            <th>Tamaño (Clase)</th>
            <th>FTIR/Raman</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              {/* Accedemos a los datos anidados con seguridad (.?) */}
              <td>{new Date(item.muestreo?.fecha_muestreo).toLocaleDateString()}</td>
              <td>{item.muestreo?.ubicacion?.nombre_sitio || 'N/A'}</td>
              <td>{item.forma}</td>
              <td>{item.color?.nombre || 'N/A'}</td>
              <td>{item.clase}</td>
              <td>{item.resultado_ftir_raman?.nombre || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}