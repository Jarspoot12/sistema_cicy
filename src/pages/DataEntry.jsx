import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TABLE_CONFIG } from '../utils/tableConfig';
import { getTableData, deleteItem, insertItem, updateItem } from '../services/dataService';
import { Trash2, Edit, Plus, Save, Database, FileSpreadsheet } from 'lucide-react'; // Agregado icono Excel
import * as XLSX from 'xlsx'; // Agregada librería Excel

const DataEntry = () => {
  const { user, role } = useAuth();
  
  // ESTADOS
  const [selectedTable, setSelectedTable] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({});
  const [relationsData, setRelationsData] = useState({}); // Almacén de catálogos

  // 1. Filtrar tablas por rol
  const availableTables = Object.keys(TABLE_CONFIG).filter(key => 
    TABLE_CONFIG[key].roles.includes(role)
  );

  // 2. Efecto al cambiar tabla
  useEffect(() => {
    if (selectedTable) {
      loadData();
      setIsEditing(false);
      loadRelations(selectedTable);
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

  const loadRelations = async (tableName) => {
    const columns = TABLE_CONFIG[tableName].columns;
    const relationColumns = columns.filter(col => col.type === 'relation');
    if (relationColumns.length === 0) return;

    const tempRelations = {};
    for (const col of relationColumns) {
      try {
        const result = await getTableData(col.relationTable);
        tempRelations[col.key] = result; 
      } catch (err) {
        console.error(`Error cargando relación ${col.relationTable}:`, err);
      }
    }
    setRelationsData(tempRelations);
  };

  // --- NUEVA FUNCIÓN: EXPORTAR A EXCEL ---
  const handleExport = () => {
    if (data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    // Preparamos los datos: Cambiamos IDs por Nombres legibles
    const dataToExport = data.map(item => {
      const row = {};
      
      TABLE_CONFIG[selectedTable].columns.forEach(col => {
        if (col.type === 'relation') {
          // Buscamos el nombre en el catálogo descargado
          const relationList = relationsData[col.key] || [];
          const found = relationList.find(r => r.id === item[col.key]);
          row[col.label] = found ? found[col.displayField] : item[col.key]; 
        } else {
          // Dato normal
          row[col.label] = item[col.key];
        }
      });
      return row;
    });

    // Generar archivo Excel
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
    XLSX.writeFile(workbook, `${selectedTable}_export.xlsx`);
  };
  // ---------------------------------------

  // 3. Manejadores CRUD
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try { await deleteItem(selectedTable, id); loadData(); } 
      catch (e) { alert(e.message); }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...currentItem };
      
      // Lógica selectiva para inyectar user_id solo donde existe
      const tablesWithUser = ['identificacion_general', 'muestreo', 'analisis'];
      if (tablesWithUser.includes(selectedTable)) {
        payload.user_id = user.id;
      }

      if (currentItem.id) {
        await updateItem(selectedTable, currentItem.id, payload);
      } else {
        await insertItem(selectedTable, payload);
      }
      setIsEditing(false);
      loadData();
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  const openNewForm = () => { setCurrentItem({}); setIsEditing(true); };
  const openEditForm = (item) => { setCurrentItem(item); setIsEditing(true); };

  // Manejo de Inputs con Uppercase
  const handleInputChange = (e, key, type) => {
    let value = e.target.value;
    if (type === 'text' || type === 'textarea') {
      value = value.toUpperCase();
    }
    setCurrentItem(prev => ({ ...prev, [key]: value }));
  };

  // Renderizador de celdas (para mostrar nombres en lugar de IDs)
  const renderCellContent = (item, col) => {
    if (col.type === 'relation') {
      const relationList = relationsData[col.key] || [];
      const found = relationList.find(r => r.id === item[col.key]);
      return found ? found[col.displayField] : item[col.key];
    }
    return item[col.key];
  };

  // --- RENDERIZADO VISUAL ---
  return (
    <div className="wide-container">
      
      {/* 1. TARJETA SELECTOR DE TABLA */}
      <div className="selector-card">
        <label className="selector-label">Selecciona el módulo de trabajo</label>
        <div style={{position: 'relative', maxWidth: '400px'}}>
           <select 
            value={selectedTable} 
            onChange={(e) => setSelectedTable(e.target.value)}
            className="modern-select-large"
          >
            <option value="">-- Seleccionar Tabla --</option>
            {availableTables.map(key => (
              <option key={key} value={key}>{TABLE_CONFIG[key].label}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTable ? (
        <div style={{
          textAlign:'center', padding:'4rem', color:'#94a3b8', 
          background:'#f8fafc', borderRadius:'16px', border:'2px dashed #cbd5e1'
        }}>
          <Database size={48} style={{marginBottom: '1rem', opacity: 0.5}} />
          <p style={{fontSize:'1.1rem', fontWeight: 500}}>Selecciona una tabla arriba para comenzar a gestionar los datos.</p>
        </div>
      ) : (
        <>
          {isEditing ? (
            /* --- FORMULARIO MODERNO --- */
            <div className="modern-form-card">
              <div className="form-header">
                <h3>{currentItem.id ? 'Editar Registro' : 'Nuevo Registro'}</h3>
                <p style={{color: '#64748b', margin: '5px 0 0 0', fontSize: '0.9rem'}}>
                  Completa los campos solicitados para {TABLE_CONFIG[selectedTable].label}.
                </p>
              </div>

              <form onSubmit={handleSave}>
                <div className="form-grid">
                  
                  {TABLE_CONFIG[selectedTable].columns.map((col) => (
                    <div 
                      key={col.key} 
                      className={`form-group-modern ${col.type === 'textarea' ? 'full-width' : ''}`}
                    >
                      <label>{col.label}</label>
                      
                      {/* TIPO: SELECT (ENUMS) */}
                      {col.type === 'select' ? (
                        <select 
                          required 
                          value={currentItem[col.key] || ''}
                          onChange={(e) => handleInputChange(e, col.key, col.type)}
                          className="modern-input"
                        >
                           <option value="">- Seleccione -</option>
                           {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      
                      // TIPO: RELACIÓN (Catálogos)
                      ) : col.type === 'relation' ? (
                        <select
                          required
                          value={currentItem[col.key] || ''}
                          onChange={(e) => handleInputChange(e, col.key, col.type)}
                          className="modern-input"
                        >
                          <option value="">- Buscar {col.label} -</option>
                          {(relationsData[col.key] || []).map(relItem => (
                            <option key={relItem.id} value={relItem.id}>
                              {relItem[col.displayField]}
                            </option>
                          ))}
                        </select>

                      // TIPO: TEXTAREA
                      ) : col.type === 'textarea' ? (
                         <textarea
                          required 
                          value={currentItem[col.key] || ''}
                          onChange={(e) => handleInputChange(e, col.key, col.type)}
                          className="modern-input"
                          style={{minHeight: '100px', resize: 'vertical'}}
                         />
                      
                      // TIPO: INPUTS NORMALES
                      ) : (
                        <input 
                          type={col.type} 
                          step={col.step} 
                          required={!col.readOnly}
                          disabled={col.readOnly}
                          value={currentItem[col.key] || ''}
                          onChange={(e) => handleInputChange(e, col.key, col.type)}
                          className="modern-input"
                          placeholder={col.readOnly ? '(Automático)' : ''}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* BOTONES */}
                <div className="form-actions">
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-cancel">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save">
                    <Save size={18}/> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>

          ) : (
            
            /* --- TABLA DE LISTADO --- */
            <div>
              <div className="action-bar">
                <h3>{TABLE_CONFIG[selectedTable].label}</h3>
                
                {/* GRUPO DE BOTONES (EXCEL + NUEVO) */}
                <div className='action-buttons-group'>
                  
                  {/* BOTÓN EXCEL (VERDE) */}
                  <button onClick={handleExport} className="btn-excel">
                    <FileSpreadsheet size={16} />
                    <span>Exportar Excel</span>
                  </button>

                  {/* BOTÓN NUEVO (AZUL) - CON TUS ESTILOS PRESERVADOS */}
                  <button 
                    onClick={openNewForm} 
                    className="btn-modern-new" 
                  >
                    <Plus size={18} strokeWidth={2.5} /> 
                    <span>Nuevo Registro</span>
                  </button>
                </div>
              </div>

              {loading ? <p style={{textAlign:'center', padding:'3rem', color:'#64748b'}}>Cargando registros...</p> : (
                <div style={{ 
                  background: 'white', 
                  borderRadius: '0 0 12px 12px', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
                  border: '1px solid #e2e8f0',
                  borderTop: 'none',
                  overflow: 'hidden'
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '16px', textAlign:'center', width:'60px', color:'#64748b' }}>#</th>
                          {TABLE_CONFIG[selectedTable].columns.map(col => (
                            <th key={col.key} style={{ padding: '16px', textAlign: 'left', fontWeight:'600', color:'#475569' }}>
                              {col.label}
                            </th>
                          ))}
                          
                          {/* HEADER ACCIONES */}
                          <th style={{ padding: '16px', textAlign: 'right', paddingRight: '1.1rem', color:'#475569' }}>
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.length === 0 ? (
                           <tr><td colSpan="100%" style={{padding:'4rem', textAlign:'center', color:'#94a3b8'}}>
                             No hay datos registrados en esta tabla.
                           </td></tr>
                        ) : (
                          data.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '14px', textAlign:'center', fontWeight: 'bold', color: '#cbd5e1' }}>
                                {index + 1}
                              </td>
                              {TABLE_CONFIG[selectedTable].columns.map(col => (
                                <td key={col.key} style={{ padding: '14px', color:'#334155' }}>
                                  {renderCellContent(item, col)}
                                </td>
                              ))}
                              
                              {/* CELDA ACCIONES - CON TUS ESTILOS PRESERVADOS */}
                              <td style={{ padding: '8px', paddingRight: '1.5rem', textAlign: 'right' }}>
                                <div style={{ 
                                  display: 'inline-flex', 
                                  justifyContent: 'flex-end', 
                                  gap: '12px', 
                                  alignItems: 'center' 
                                }}>
                                  <button onClick={() => openEditForm(item)} style={{background:'none', border:'none', cursor:'pointer', color:'#f59e0b', padding:'4px'}} title="Editar">
                                    <Edit size={18}/>
                                  </button>
                                  <button onClick={() => handleDelete(item.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:'4px'}} title="Eliminar">
                                    <Trash2 size={18}/>
                                  </button>
                                </div>
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
          )}
        </>
      )}
    </div>
  );
};

export default DataEntry;