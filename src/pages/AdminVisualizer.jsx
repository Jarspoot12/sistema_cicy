import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient'; 
import { Filter, RotateCcw, MapPin, Calendar, Layers, PenTool } from 'lucide-react';

export default function AdminVisualizer() {
  // --- ESTADO DE LOS DATOS ---
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- ESTADO DE LOS CATÁLOGOS ---
  const [catalogos, setCatalogos] = useState({
    colores: [],
    materiales: [],
    sitios: [],
    clases: ['<1 mm', '1-5 mm', '5-10 mm', '>10 mm'] 
  });

  // --- ESTADO DE LOS FILTROS ---
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
  }, []); 

  // Recargar si cambian los filtros
  useEffect(() => {
    fetchData();
  }, [filtros]); 

  const cargarCatalogos = async () => {
    try {
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
    } catch (error) {
        console.error("Error cargando catálogos", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // JOIN COMPLEJO
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

      // APLICAR FILTROS
      if (filtros.color) query = query.eq('color.nombre', filtros.color);
      if (filtros.material) query = query.eq('resultado_ftir_raman.nombre', filtros.material);
      if (filtros.clase) query = query.eq('clase', filtros.clase);
      if (filtros.sitio) query = query.eq('muestreo.ubicacion.nombre_sitio', filtros.sitio);
      if (filtros.fechaInicio) query = query.gte('muestreo.fecha_muestreo', filtros.fechaInicio);
      if (filtros.fechaFin) query = query.lte('muestreo.fecha_muestreo', filtros.fechaFin + 'T23:59:59');

      const { data, error } = await query;

      if (error) throw error;
      setDatos(data || []);

    } catch (err) {
      console.error("Error filtrando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({fechaInicio:'', fechaFin:'', color:'', material:'', sitio:'', clase:''});
  };

  // --- RENDERIZADO ---
  return (
    <div className="wide-container">
      
      {/* 1. HEADER Y FILTROS */}
      <div className="selector-card">
        <div style={{borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem'}}>
            <h2 style={{margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Filter size={24} color="#0f4c81"/> Visualizador de Datos Maestros
            </h2>
            <p style={{color: '#64748b', margin: '5px 0 0 0'}}>
                Exploración profunda uniendo tablas de Muestreos, Ubicaciones y Análisis.
            </p>
        </div>
        
        {/* GRID DE FILTROS */}
        <div className="form-grid" style={{ marginBottom: '1rem' }}>
            
            {/* GRUPO FECHAS */}
            <div className="form-group-modern">
                <label><Calendar size={14}/> Desde:</label>
                <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={handleFiltroChange} className="modern-input"/>
            </div>
            <div className="form-group-modern">
                <label><Calendar size={14}/> Hasta:</label>
                <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={handleFiltroChange} className="modern-input"/>
            </div>

            {/* GRUPO DROPDOWNS */}
            <div className="form-group-modern">
                <label><PenTool size={14}/> Color:</label>
                <select name="color" value={filtros.color} onChange={handleFiltroChange} className="modern-input">
                    <option value="">-- Todos --</option>
                    {catalogos.colores.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
            </div>

            <div className="form-group-modern">
                <label><Layers size={14}/> Polímero (FTIR):</label>
                <select name="material" value={filtros.material} onChange={handleFiltroChange} className="modern-input">
                    <option value="">-- Todos --</option>
                    {catalogos.materiales.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                </select>
            </div>

            <div className="form-group-modern">
                <label><MapPin size={14}/> Sitio:</label>
                <select name="sitio" value={filtros.sitio} onChange={handleFiltroChange} className="modern-input">
                    <option value="">-- Todos --</option>
                    {catalogos.sitios.map(s => <option key={s.id} value={s.nombre_sitio}>{s.nombre_sitio}</option>)}
                </select>
            </div>

            <div className="form-group-modern">
                <label>📏 Tamaño (Clase):</label>
                <select name="clase" value={filtros.clase} onChange={handleFiltroChange} className="modern-input">
                    <option value="">-- Todos --</option>
                    {catalogos.clases.map(cl => <option key={cl} value={cl}>{cl}</option>)}
                </select>
            </div>
        </div>

        {/* BOTÓN LIMPIAR */}
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
             <button 
                onClick={limpiarFiltros}
                className="btn-cancel"
                style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.9rem'}}
             >
                <RotateCcw size={16}/> Limpiar Filtros
             </button>
        </div>
      </div>

      {/* 2. RESULTADOS */}
      <div style={{ marginBottom: '10px', fontWeight: '600', color: '#475569' }}>
        Resultados encontrados: <span style={{color: '#0f4c81'}}>{datos.length}</span>
      </div>

      {/* 3. TABLA DE DATOS */}
      {loading ? (
        <div style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}>
            <div style={{marginBottom: '10px'}}>🔄</div>
            Cargando datos maestros...
        </div>
      ) : (
        <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
        }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Fecha</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Sitio</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Coordenadas</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Forma</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Color</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Material</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Clase</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{textAlign: 'center', padding: '3rem', color: '#94a3b8'}}>
                                    No se encontraron registros con estos filtros.
                                </td>
                            </tr>
                        ) : (
                            datos.map((item, index) => (
                                <tr 
                                    key={item.id} 
                                    style={{ 
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' /* Efecto cebra sutil */
                                    }}
                                >
                                    <td style={{ padding: '14px', color: '#334155' }}>
                                        {new Date(item.muestreo?.fecha_muestreo).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '14px', color: '#334155', fontWeight: '500' }}>
                                        {item.muestreo?.ubicacion?.nombre_sitio}
                                    </td>
                                    <td style={{ padding: '14px', color: '#64748b', fontSize: '0.85rem' }}>
                                        {item.muestreo?.ubicacion?.latitud?.toFixed(4)}, {item.muestreo?.ubicacion?.longitud?.toFixed(4)}
                                    </td>
                                    <td style={{ padding: '14px', color: '#334155' }}>{item.forma}</td>
                                    <td style={{ padding: '14px', color: '#334155' }}>
                                        {/* Pequeño círculo de color visual */}
                                        <span style={{display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', background: getColorHex(item.color?.nombre), marginRight:'6px'}}></span>
                                        {item.color?.nombre}
                                    </td>
                                    <td style={{ padding: '14px', color: '#334155' }}>{item.resultado_ftir_raman?.nombre}</td>
                                    <td style={{ padding: '14px', color: '#334155' }}>
                                        <span style={{
                                            background: '#e0f2fe', color: '#0369a1', 
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600'
                                        }}>
                                            {item.clase}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
}

// Helper opcional para pintar el circulito de color en la tabla
// Puedes expandir esto o quitarlo si no te gusta
const getColorHex = (nombreColor) => {
    const map = {
        'ROJO': '#ef4444', 'AZUL': '#8db6f7ff', 'VERDE': '#9be1b4ff', 
        'NEGRO': '#000000', 'BLANCO': '#efefefff', 'AMARILLO': '#eab308', 'ROSA': '#f593e0ff',
        'TRANSPARENTE': '#cbd5e1', // Gris claro para transparente
        'MORADO': '#e97affff', 'NARANJA': '#e3ab61ff', 'OTROS': '#cfd6dfff'
    };
    return map[nombreColor] || '#cbd5e1';
};