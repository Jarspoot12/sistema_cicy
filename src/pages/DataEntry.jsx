import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TABLE_CONFIG } from '../utils/tableConfig';
import { getTableData, deleteItem, insertItem, updateItem } from '../services/dataService';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';

const DataEntry = () => {
  const { user, role } = useAuth();
  
  // ESTADOS
  const [selectedTable, setSelectedTable] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({});
  
  // ESTADO NUEVO: Almacén de relaciones (ej: { 'ubicacion': [...datos...], 'color': [...] })
  const [relationsData, setRelationsData] = useState({});

  const availableTables = Object.keys(TABLE_CONFIG).filter(key => 
    TABLE_CONFIG[key].roles.includes(role)
  );

  useEffect(() => {
    if (selectedTable) {
      loadData();
      setIsEditing(false);
      loadRelations(selectedTable); // <--- CARGAR RELACIONES
    }
  }, [selectedTable]);

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await getTableData(selectedTable);
      setData(items);
    } catch (error) {
      console.error("Error:", error);
      alert("Error cargando datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // NUEVA FUNCIÓN: Identifica si la tabla necesita datos externos y los descarga
  const loadRelations = async (tableName) => {
    const columns = TABLE_CONFIG[tableName].columns;
    const relationColumns = columns.filter(col => col.type === 'relation');
    
    if (relationColumns.length === 0) return;

    const tempRelations = {};

    for (const col of relationColumns) {
      try {
        // Reusamos getTableData para traer los catálogos
        const result = await getTableData(col.relationTable);
        tempRelations[col.key] = result; 
      } catch (err) {
        console.error(`Error cargando relación ${col.relationTable}:`, err);
      }
    }
    setRelationsData(tempRelations);
  };

  // ... (handleDelete, handleSave, openNewForm, openEditForm se mantienen IGUAL que antes) ...
  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar registro?')) {
      try { await deleteItem(selectedTable, id); loadData(); } 
      catch (e) { alert(e.message); }
    }
  };
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...currentItem, user_id: user.id };
      if (currentItem.id) await updateItem(selectedTable, currentItem.id, payload);
      else await insertItem(selectedTable, payload);
      setIsEditing(false); loadData();
    } catch (e) { alert(e.message); }
  };
  const openNewForm = () => { setCurrentItem({}); setIsEditing(true); };
  const openEditForm = (item) => { setCurrentItem(item); setIsEditing(true); };

  // --- MANEJO DE INPUTS (Ahora con Mayúsculas forzadas) ---
  const handleInputChange = (e, key, type) => {
    let value = e.target.value;
    // Forzar Mayúsculas en textos
    if (type === 'text' || type === 'textarea') {
      value = value.toUpperCase();
    }
    setCurrentItem(prev => ({ ...prev, [key]: value }));
  };

  // --- RENDER AUXILIAR: Para mostrar el nombre en la TABLA en vez del ID ---
  const renderCellContent = (item, col) => {
    if (col.type === 'relation') {
      // Buscamos en los datos descargados el nombre correspondiente al ID
      const relationList = relationsData[col.key] || [];
      const found = relationList.find(r => r.id === item[col.key]);
      return found ? found[col.displayField] : item[col.key]; // Muestra nombre o el ID si falla
    }
    return item[col.key];
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER (Igual que antes) */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
        <h2>Gestión de Datos</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label>Tabla:</label>
          <select 
            value={selectedTable} 
            onChange={(e) => setSelectedTable(e.target.value)}
            style={{ padding: '8px', minWidth: '200px' }}
          >
            <option value="">-- Seleccionar --</option>
            {availableTables.map(key => (
              <option key={key} value={key}>{TABLE_CONFIG[key].label}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTable ? <p>👈 Selecciona una tabla.</p> : (
        <>
          {isEditing ? (
            /* --- FORMULARIO --- */
            <div className="auth-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3>{currentItem.id ? 'Editar' : 'Nuevo'}</h3>
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  
                  {TABLE_CONFIG[selectedTable].columns.map((col) => (
                    <div key={col.key} className="form-group" style={col.type === 'textarea' ? {gridColumn: 'span 2'} : {}}>
                      <label style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{col.label}</label>
                      
                      {/* 1. SELECT ESTÁTICO (ENUMS) */}
                      {col.type === 'select' ? (
                        <select 
                          required 
                          value={currentItem[col.key] || ''}
                          onChange={(e) => handleInputChange(e, col.key, col.type)}
                          className="input-field"
                        >
                           <option value="">- Seleccione -</option>
                           {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      
                      // 2. SELECT DINÁMICO (RELACIONES / LLAVES FORÁNEAS)
                      ) : col.type === 'relation' ? (
                        <select
                          required
                          value={currentItem[col.key] || ''}
                          onChange={(e) => handleInputChange(e, col.key, col.type)}
                          className="input-field"
                        >
                          <option value="">- Buscar {col.label} -</option>
                          {/* Mapeamos la lista descargada de la otra tabla */}
                          {(relationsData[col.key] || []).map(relItem => (
                            <option key={relItem.id} value={relItem.id}>
                              {relItem[col.displayField]}
                            </option>
                          ))}
                        </select>

                      // 3. TEXTAREA
                      ) : col.type === 'textarea' ? (
                         <textarea
                          required value={currentItem[col.key] || ''}
                          onChange={(e) => handleInputChange(e, col.key, col.type)}
                          style={{width: '100%', minHeight: '80px'}}
                         />
                      
                      // 4. INPUTS NORMALES (Text, Number, Date)
                      ) : (
                        <input 
                          type={col.type} 
                          step={col.step} // Para decimales
                          required={!col.readOnly}
                          disabled={col.readOnly}
                          value={currentItem[col.key] || ''}
                          onChange={(e) => handleInputChange(e, col.key, col.type)}
                          style={col.readOnly ? { background: '#eee' } : {}}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsEditing(false)} style={{ background: '#95a5a6' }}>Cancelar</button>
                  <button type="submit"><Save size={16}/> Guardar</button>
                </div>
              </form>
            </div>
          ) : (
            
            /* --- TABLA DE DATOS --- */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3>{TABLE_CONFIG[selectedTable].label}</h3>
                <button onClick={openNewForm}><Plus size={16} /> Nuevo</button>
              </div>

              {loading ? <p>Cargando...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ccc' }}>
                        {TABLE_CONFIG[selectedTable].columns.map(col => (
                          <th key={col.key} style={{ padding: '8px', textAlign: 'left' }}>{col.label}</th>
                        ))}
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                          {TABLE_CONFIG[selectedTable].columns.map(col => (
                            <td key={col.key} style={{ padding: '8px' }}>
                              {/* Usamos la función renderCellContent para mostrar Nombres en vez de IDs */}
                              {renderCellContent(item, col)}
                            </td>
                          ))}
                          <td>
                            <div style={{display:'flex', gap:'5px'}}>
                              <button onClick={() => openEditForm(item)} className="icon-btn" style={{color:'#f39c12'}}><Edit size={16}/></button>
                              <button onClick={() => handleDelete(item.id)} className="icon-btn" style={{color:'#e74c3c'}}><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataEntry;