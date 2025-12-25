import { useState, useEffect, useMemo } from 'react';
import { getTableData } from '../services/dataService';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const AdminDashboard = () => {
  const [rawData, setRawData] = useState({
    muestreo: [],
    analisis: [],
    colectores: [],
    ubicacion: [],
    instituciones: [],
    colores: [],
  });
  const [loading, setLoading] = useState(true);

  // ESTADOS DE FILTROS
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [kpi2Metric, setKpi2Metric] = useState('forma'); 
  const [kpi2Location, setKpi2Location] = useState(''); 
  const [kpi4Metric, setKpi4Metric] = useState('id_color');
  const [kpi4Location, setKpi4Location] = useState('');

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [m, a, c, u, i, col] = await Promise.all([
          getTableData('muestreo'),
          getTableData('analisis'),
          getTableData('identificacion_general'),
          getTableData('ubicacion'),
          getTableData('institucion_procedencia'),
          getTableData('color')
        ]);
        setRawData({ muestreo: m, analisis: a, colectores: c, ubicacion: u, instituciones: i, colores: col });
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const filterByDate = (items, dateField) => {
    if (!dateRange.start && !dateRange.end) return items;
    const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
    const end = dateRange.end ? new Date(dateRange.end) : new Date('2100-01-01');
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };

  const getCatalogName = (id, catalog, field = 'nombre') => {
    const found = catalog.find(c => c.id === id);
    return found ? found[field] : 'Desconocido';
  };

  // ==========================================================
  // CÁLCULOS
  // ==========================================================

  // --- KPI SUMMARY (Tarjetones) ---
  const cardMetrics = useMemo(() => {
    // CORRECCIÓN 1: Usamos .length para contar REGISTROS (filas), no la suma de cantidades.
    return {
      totalMuestras: rawData.muestreo.length, 
      totalAnalisis: rawData.analisis.length,
      totalColectores: rawData.colectores.length
    };
  }, [rawData]);

  // --- KPI 1: MAPA ---
  const mapData = useMemo(() => {
    const filteredMuestreos = filterByDate(rawData.muestreo, 'fecha_muestreo');
    const grouped = {};
    filteredMuestreos.forEach(m => {
      const ubi = rawData.ubicacion.find(u => u.id === m.id_ubicacion);
      if (ubi && ubi.latitud && ubi.longitud) {
        if (!grouped[ubi.id]) {
          grouped[ubi.id] = {
            id: ubi.id,
            name: ubi.nombre_sitio,
            lat: parseFloat(ubi.latitud),
            lng: parseFloat(ubi.longitud),
            // Aquí puedes decidir si quieres contar filas (eventos) o sumar muestras
            // Por ahora contamos filas para ser consistentes con el tarjetón
            count: 0 
          };
        }
        grouped[ubi.id].count += 1; 
      }
    });
    return Object.values(grouped);
  }, [rawData, dateRange]);

  // --- KPI 2: DONA PROPORCIONES ---
  const kpi2Data = useMemo(() => {
    let joinedAnalisis = rawData.analisis.map(an => {
      const parentMuestreo = rawData.muestreo.find(m => m.id === an.id_muestreo);
      return { ...an, fecha_muestreo: parentMuestreo?.fecha_muestreo, id_ubicacion: parentMuestreo?.id_ubicacion };
    });
    joinedAnalisis = filterByDate(joinedAnalisis, 'fecha_muestreo');
    if (kpi2Location) joinedAnalisis = joinedAnalisis.filter(a => a.id_ubicacion === parseInt(kpi2Location));

    const counts = joinedAnalisis.reduce((acc, item) => {
      let key = item[kpi2Metric];
      if (kpi2Metric === 'id_color') key = getCatalogName(key, rawData.colores);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [rawData, dateRange, kpi2Metric, kpi2Location]);

  // --- KPI 3: DONA INSTITUCIONES ---
  const kpi3Data = useMemo(() => {
    const counts = rawData.colectores.reduce((acc, col) => {
      const nombreInst = getCatalogName(col.id_institucion_procedencia, rawData.instituciones);
      acc[nombreInst] = (acc[nombreInst] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [rawData.colectores, rawData.instituciones]);

  // --- KPI 4: BARRAS DETALLADAS ---
  const kpi4Data = useMemo(() => {
    let joinedAnalisis = rawData.analisis.map(an => {
      const parentMuestreo = rawData.muestreo.find(m => m.id === an.id_muestreo);
      return { ...an, id_ubicacion: parentMuestreo?.id_ubicacion };
    });
    if (kpi4Location) joinedAnalisis = joinedAnalisis.filter(a => a.id_ubicacion === parseInt(kpi4Location));

    const counts = joinedAnalisis.reduce((acc, item) => {
      let key = item[kpi4Metric];
      if (kpi4Metric === 'id_color') key = getCatalogName(key, rawData.colores);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(k => ({ name: k, cantidad: counts[k] }));
  }, [rawData, kpi4Metric, kpi4Location]);

  return (
    <div className="wide-container">
      <div className="selector-card" style={{minWidth: '100%'}}> {/* Forzamos ancho completo */}
        <h2 style={{margin:0, color:'#0f172a'}}>Dashboard Analítico</h2>
        
        {/* FILTRO GLOBAL DE FECHA */}
        <div style={{display:'flex', gap:'10px', marginTop:'15px', alignItems:'center'}}>
          <span style={{fontWeight:'bold', fontSize:'0.9rem'}}>Rango Global:</span>
          <input type="date" className="modern-input" onChange={e => setDateRange({...dateRange, start: e.target.value})} />
          <span>a</span>
          <input type="date" className="modern-input" onChange={e => setDateRange({...dateRange, end: e.target.value})} />
        </div>
      </div>

      {loading ? <p>Cargando Business Intelligence...</p> : (
        <div style={{display:'flex', flexDirection:'column', gap:'2rem'}}>
          
          {/* 1. TARJETONES SUPERIORES */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'1.5rem'}}>
            <StatCard title="Eventos de Muestreo" value={cardMetrics.totalMuestras} color="#0f4c81" />
            <StatCard title="Análisis Realizados" value={cardMetrics.totalAnalisis} color="#10b981" />
            <StatCard title="Colectores Activos" value={cardMetrics.totalColectores} color="#f59e0b" />
          </div>

          {/* 2. KPI 1: MAPA (OCUPANDO 100% DE LA TARJETA, LA CUAL OCUPA TODO EL ANCHO) */}
          {/* CORRECCIÓN 2: maxWidth: '100%' anula el límite de 900px */}
          <div className="modern-form-card" style={{padding:'0', overflow:'hidden', height:'700px', display:'flex', flexDirection:'column', minWidth: '100%'}}>
             <div style={{padding:'1rem', borderBottom:'1px solid #eee', background:'#f8fafc'}}>
               {/* CORRECCIÓN 3: ETIQUETA MAPA */}
               <h3 style={{margin:0}}> Mapa de Distribución Geoespacial</h3>
             </div>
             <MapContainer center={[21.1619, -86.8515]} zoom={9} style={{height:'100%', width:'100%'}}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {mapData.map(site => (
                  <Marker key={site.id} position={[site.lat, site.lng]}>
                    <Popup>
                      <strong>{site.name}</strong><br/>
                      Eventos registrados: {site.count}
                    </Popup>
                  </Marker>
                ))}
             </MapContainer>
          </div>

          {/* 3. FILA DE GRÁFICOS (KPI 2 y 3) - OCUPANDO EL ANCHO DISPONIBLE */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:'2rem'}}>
            
            {/* KPI 2: DONA IZQUIERDA */}
            <div className="modern-form-card" style={{ minWidth: '100%' }}>
              {/* CORRECCIÓN 3: ETIQUETA DONA 1 */}
              <h3>Distribución de Características</h3>
              
              <div style={{display:'flex', gap:'10px', marginBottom:'1rem', flexWrap:'wrap'}}>
                <select className="modern-input" value={kpi2Metric} onChange={e => setKpi2Metric(e.target.value)}>
                  <option value="forma">Por Forma</option>
                  <option value="id_color">Por Color</option>
                  <option value="clase">Por Tamaño</option>
                </select>
                <select className="modern-input" value={kpi2Location} onChange={e => setKpi2Location(e.target.value)}>
                  <option value="">Todas las Ubicaciones</option>
                  {rawData.ubicacion.map(u => <option key={u.id} value={u.id}>{u.nombre_sitio}</option>)}
                </select>
              </div>

              <div style={{height: 300}}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={kpi2Data} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60}      /* EL AGUJERO DE LA DONA */
                      outerRadius={90}     /* TAMAÑO TOTAL */
                      paddingAngle={1}      /* ESPACIO BLANCO ENTRE REBANADAS */
                      dataKey="value" 
                      cornerRadius={5}      /* BORDES REDONDOS */
                      stroke="none"         /* QUITA EL BORDE BLANCO FEO POR DEFECTO */
                      /* label   <-- AL BORRAR ESTA LÍNEA, DESAPARECEN LOS NÚMEROS */
                    >
                      {kpi2Data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} registros`, 'Cantidad']}
                      contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>              
              </div>
            </div>

            {/* KPI 3: DONA DERECHA */}
            <div className="modern-form-card" style={{ minWidth: '100%' }}>
              {/* CORRECCIÓN 3: ETIQUETA DONA 2 */}
              <h3>Origen Institucional</h3>
              <div style={{marginBottom:'3.5rem'}}></div>
              <div style={{height: 300}}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={kpi3Data} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60}      /* DEBE COINCIDIR CON EL DE ARRIBA */
                      outerRadius={90}     /* DEBE COINCIDIR CON EL DE ARRIBA */
                      paddingAngle={1} 
                      dataKey="value" 
                      cornerRadius={5}
                      stroke="none"
                      /* label   <-- BORRADO TAMBIÉN AQUÍ */
                    >
                      {kpi3Data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} colectores`, 'Total']}
                      contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 4. KPI 4: BARRAS DETALLADAS - ANCHO COMPLETO */}
          <div className="modern-form-card" style={{ minWidth: '100%' }}>
            {/* CORRECCIÓN 3: ETIQUETA BARRAS */}
            <h3>Detalle Comparativo por Sitio</h3>
            
            <div style={{display:'flex', gap:'10px', marginBottom:'1rem'}}>
               <select className="modern-input" value={kpi4Metric} onChange={e => setKpi4Metric(e.target.value)}>
                  <option value="forma">Ver Formas</option>
                  <option value="id_color">Ver Colores</option>
                  <option value="clase">Ver Tamaños</option>
                </select>
                <select className="modern-input" value={kpi4Location} onChange={e => setKpi4Location(e.target.value)}>
                  <option value="">Todas las Ubicaciones</option>
                  {rawData.ubicacion.map(u => <option key={u.id} value={u.id}>{u.nombre_sitio}</option>)}
                </select>
            </div>
              <div style={{height: 400}}>
                <ResponsiveContainer>
                  <BarChart data={kpi4Data} layout="vertical" margin={{top:5, right:30, left:40, bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    
                    {/* CORRECCIÓN 4: EJE X numérico sin decimales */}
                    <XAxis type="number" allowDecimals={false} />
                    
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#8884d8" name="Cantidad Encontrada" barSize={30}>
                       {kpi4Data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', borderLeft:`5px solid ${color}`, boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
    <h4 style={{margin:'0 0 10px 0', color:'#64748b', fontSize:'0.9rem'}}>{title}</h4>
    <span style={{fontSize:'2rem', fontWeight:'bold', color:'#1e293b'}}>{value}</span>
  </div>
);

export default AdminDashboard;