import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export default function AdminVisualizer() {
  // ESTADO DE LOS DATOS (La tabla)
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);

  // ESTADO DE LOS CATÁLOGOS (Para llenar los dropdowns)
  const [catalogos, setCatalogos] = useState({
    colores: [],
    materiales: [],
    sitios: [],
    clases: ['<1 mm', '1-5 mm', '5-10 mm', '>10 mm'] // Estos son fijos (hardcoded)
  });

  // ESTADO DE LOS FILTROS SELECCIONADOS
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    color: '',
    material: '',
    sitio: '',
    clase: ''
  });

  useEffect(() => {
    cargarCatalogos();
    fetchData();
  }, []); // Carga inicial

  // Escuchar cambios en los filtros para recargar automáticamente 
  useEffect(() => {
    fetchData();
  }, [filtros]); 

  // --- FUNCIÓN A: Cargar las opciones de los menús ---
  const cargarCatalogos = async () => {
    // Pedimos las 3 listas al mismo tiempo 
    const [reqColores, reqMateriales, reqSitios] = await Promise.all([
      supabase.from('color').select('*'),
      supabase.from('resultado_ftir_raman').select('*'),
      supabase.from('ubicacion').select('*')
    ]);

    setCatalogos(prev => ({
      ...prev,
      colores: reqColores.data || [],
      materiales: reqMateriales.data || [],
      sitios: reqSitios.data || []
    }));
  };

  // --- FUNCIÓN B: La Consulta Maestra con Filtros ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Iniciamos la consulta base
      let query = supabase
        .from('analisis')
        .select(`
          id, forma, clase, largo_mm, ancho_mm, url_fotografia,
          color!inner ( nombre ),                 
          resultado_ftir_raman!inner ( nombre ),
          muestreo!inner (                        
            fecha_muestreo,
            epoca_climatica,
            ubicacion!inner (                     
              nombre_sitio, latitud, longitud
            )
          )
        `);

      // Aplicamos filtros dinámicamente SI el usuario seleccionó algo
      
      // Filtro: Color (Tabla relacionada)
      if (filtros.color) {
        query = query.eq('color.nombre', filtros.color);
      }

      // Filtro: Material / FTIR (Tabla relacionada)
      if (filtros.material) {
        query = query.eq('resultado_ftir_raman.nombre', filtros.material);
      }

      // Filtro: Tamaño / Clase (Columna directa)
      if (filtros.clase) {
        query = query.eq('clase', filtros.clase);
      }

      // Filtro: Sitio (Tabla "abuela" Ubicacion)
      if (filtros.sitio) {
        query = query.eq('muestreo.ubicacion.nombre_sitio', filtros.sitio);
      }

      // Filtro: Fechas (Tabla padre Muestreo)
      if (filtros.fechaInicio) {
        query = query.gte('muestreo.fecha_muestreo', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        // Añadimos la hora final del día para incluir el día completo
        query = query.lte('muestreo.fecha_muestreo', filtros.fechaFin + 'T23:59:59');
      }

      // 3. Ejecutar
      const { data, error } = await query;

      if (error) throw error;
      setDatos(data || []);

    } catch (err) {
      console.error("Error filtrando datos:", err);
      // alert(err.message); // Opcional
    } finally {
      setLoading(false);
    }
  };

  // Manejador genérico para inputs
  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔬 Explorador de Datos</h1>
      
      {/* --- BARRA DE FILTROS --- */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        alignItems: 'end'
      }}>
        
        {/* Filtro Fecha */}
        <div>
          <label style={{display:'block', fontSize:'0.8rem', fontWeight:'bold'}}>Desde:</label>
          <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={handleFiltroChange} />
        </div>
        <div>
          <label style={{display:'block', fontSize:'0.8rem', fontWeight:'bold'}}>Hasta:</label>
          <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={handleFiltroChange} />
        </div>

        {/* Filtro Color */}
        <div>
          <label style={{display:'block', fontSize:'0.8rem', fontWeight:'bold'}}>Color:</label>
          <select name="color" value={filtros.color} onChange={handleFiltroChange}>
            <option value="">-- Todos --</option>
            {catalogos.colores.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>

        {/* Filtro Material */}
        <div>
          <label style={{display:'block', fontSize:'0.8rem', fontWeight:'bold'}}>Polímero (FTIR):</label>
          <select name="material" value={filtros.material} onChange={handleFiltroChange}>
            <option value="">-- Todos --</option>
            {catalogos.materiales.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </div>

        {/* Filtro Sitio */}
        <div>
          <label style={{display:'block', fontSize:'0.8rem', fontWeight:'bold'}}>Sitio:</label>
          <select name="sitio" value={filtros.sitio} onChange={handleFiltroChange}>
            <option value="">-- Todos --</option>
            {catalogos.sitios.map(s => <option key={s.id} value={s.nombre_sitio}>{s.nombre_sitio}</option>)}
          </select>
        </div>

        {/* Filtro Clase */}
        <div>
          <label style={{display:'block', fontSize:'0.8rem', fontWeight:'bold'}}>Tamaño:</label>
          <select name="clase" value={filtros.clase} onChange={handleFiltroChange}>
            <option value="">-- Todos --</option>
            {catalogos.clases.map(cl => <option key={cl} value={cl}>{cl}</option>)}
          </select>
        </div>

        {/* Botón Reset */}
        <button 
          onClick={() => setFiltros({fechaInicio:'', fechaFin:'', color:'', material:'', sitio:'', clase:''})}
          style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', height: '30px' }}
        >
          Limpiar Filtros
        </button>

      </div>

      <p>Resultados encontrados: <strong>{datos.length}</strong></p>

      {/* --- TABLA DE RESULTADOS --- */}
      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
          <thead style={{ background: '#2c3e50', color: 'white' }}>
            <tr>
              <th>Fecha</th>
              <th>Sitio</th>
              <th>Lat / Long</th>
              <th>Forma</th>
              <th>Color</th>
              <th>Material</th>
              <th>Tamaño</th>
            </tr>
          </thead>
          <tbody>
            {datos.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign:'center'}}>No hay resultados con estos filtros.</td></tr>
            ) : (
              datos.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.muestreo?.fecha_muestreo).toLocaleDateString()}</td>
                  <td>{item.muestreo?.ubicacion?.nombre_sitio}</td>
                  <td>{item.muestreo?.ubicacion?.latitud}, {item.muestreo?.ubicacion?.longitud}</td>
                  <td>{item.forma}</td>
                  <td>{item.color?.nombre}</td>
                  <td>{item.resultado_ftir_raman?.nombre}</td>
                  <td>{item.clase}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}