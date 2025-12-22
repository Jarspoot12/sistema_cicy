// src/utils/tableConfig.js

export const TABLE_CONFIG = {
  // ======================================================
  // TABLAS PRINCIPALES (ADMIN Y GENERAL)
  // ======================================================

  identificacion_general: {
    label: "Identificación General (Colectores)",
    roles: ['admin', 'general'],
    columns: [
      { key: 'id', label: 'ID', type: 'number', readOnly: true },
      { key: 'nombre', label: 'NOMBRE COMPLETO', type: 'text' },
      { 
        key: 'grado', 
        label: 'GRADO ACADÉMICO', 
        type: 'select', 
        options: ['LICENCIATURA', 'MAESTRÍA', 'DOCTORADO', 'TÉCNICO', 'INVESTIGADOR'] 
      },
      // AQUÍ ESTÁ LA MAGIA PARA LAS LLAVES FORÁNEAS
      { 
        key: 'id_institucion_procedencia', 
        label: 'INSTITUCIÓN', 
        type: 'relation', // Tipo especial que crearemos
        relationTable: 'institucion_procedencia', // Tabla a buscar
        displayField: 'nombre' // Campo a mostrar en el select
      },
      { key: 'fecha_registro', label: 'FECHA REGISTRO', type: 'date', readOnly: true }
    ]
  },

  muestreo: {
    label: "Ficha de Muestreo",
    roles: ['admin', 'general'],
    columns: [
      { key: 'id', label: 'ID', type: 'number', readOnly: true },
      { key: 'fecha_muestreo', label: 'FECHA MUESTREO', type: 'date' },
      { 
        key: 'epoca_climatica', 
        label: 'ÉPOCA CLIMÁTICA', 
        type: 'select', 
        options: ['SECO', 'LLUVIOSO', 'NORTES', 'TORMENTA', 'POST-HURACÁN'] 
      },
      { key: 'numero_muestras', label: 'NÚMERO DE MUESTRAS', type: 'number' },
      { 
        key: 'contenedor', 
        label: 'CONTENEDOR', 
        type: 'select', 
        options: ['ENVASE DE VIDRIO', 'FRASCO DE VIDRIO', 'BOLSA METÁLICA'] 
      },
      { 
        key: 'preservacion', 
        label: 'PRESERVACIÓN', 
        type: 'select', 
        options: ['TEMPERATURA AMBIENTE', '4 GRADOS CENTÍGRADOS'] 
      },
      { 
        key: 'matriz', 
        label: 'MATRIZ', 
        type: 'select', 
        options: ['SEDIMENTO', 'AGUA', 'ORGANISMO', 'AIRE', 'OTROS'] 
      },
      { key: 'profundidad_muestreo_cm', label: 'PROFUNDIDAD (cm)', type: 'number', step: '0.1' },
      { key: 'especie_organismo', label: 'ESPECIE', type: 'text' },
      { key: 'tejido_organismo', label: 'TEJIDO', type: 'text' },
      { key: 'tiempo_procesamiento_min', label: 'TIEMPO PROC. (min)', type: 'number', step: '0.1' },
      
      // RELACIONES
      { key: 'id_institucion_financiamiento', label: 'FINANCIAMIENTO', type: 'relation', relationTable: 'institucion_financiamiento', displayField: 'nombre' },
      { key: 'id_ubicacion', label: 'UBICACIÓN (SITIO)', type: 'relation', relationTable: 'ubicacion', displayField: 'nombre_sitio' },
      { key: 'id_colector', label: 'COLECTOR', type: 'relation', relationTable: 'identificacion_general', displayField: 'nombre' }
    ]
  },

  analisis: {
    label: "Resultados de Análisis",
    roles: ['admin', 'general'],
    columns: [
      { key: 'id', label: 'ID', type: 'number', readOnly: true },
      { key: 'fecha_analisis', label: 'FECHA ANÁLISIS', type: 'date' },
      { key: 'id_particula', label: 'ID PARTÍCULA', type: 'number' },
      { key: 'largo_mm', label: 'LARGO (mm)', type: 'number', step: '0.001' },
      { key: 'ancho_mm', label: 'ANCHO (mm)', type: 'number', step: '0.001' },
      { key: 'peso_mg', label: 'PESO (mg)', type: 'number', step: '0.001' },
      { 
        key: 'forma', 
        label: 'FORMA', 
        type: 'select', 
        options: ['FIBRA', 'FRAGMENTO', 'FILMS', 'PELLETS', 'ESPUMA', 'GOMA', 'OTROS'] 
      },
      { 
        key: 'clase', 
        label: 'CLASE (Tamaño)', 
        type: 'select', 
        options: ['<1 mm', '1-5 mm', '5-10 mm', '>10 mm'] 
      },
      { key: 'nombre_fotografia', label: 'NOMBRE FOTO', type: 'text' },
      { key: 'url_fotografia', label: 'URL FOTO', type: 'text' },
      { key: 'fotografo', label: 'FOTÓGRAFO', type: 'text' },
      { key: 'microscopio_camara', label: 'MICROSCOPIO', type: 'text' },
      { key: 'escala', label: 'ESCALA', type: 'text' },
      { key: 'metodo_extraccion', label: 'MÉTODO EXTRACCIÓN', type: 'text' },
      { 
        key: 'metodo_identificacion', 
        label: 'MÉTODO IDENTIFICACIÓN', 
        type: 'select', 
        options: ['VISUAL', 'ESTEREOSCOPÍA', 'FTIR', 'RAMAN', 'SEM', 'OTROS'] 
      },
      { key: 'porcentaje_coincidencia_espectral', label: '% COINCIDENCIA', type: 'number', step: '0.1' },
      { key: 'observaciones', label: 'OBSERVACIONES', type: 'textarea' },

      // RELACIONES
      { key: 'id_muestreo', label: 'ID MUESTREO (Ficha)', type: 'relation', relationTable: 'muestreo', displayField: 'id' }, // Este quizás convenga dejarlo numérico o buscar por código
      { key: 'id_color', label: 'COLOR', type: 'relation', relationTable: 'color', displayField: 'nombre' },
      { key: 'id_ftir_raman', label: 'RESULTADO FTIR/RAMAN', type: 'relation', relationTable: 'resultado_ftir_raman', displayField: 'nombre' },
      { key: 'id_institucion_analisis', label: 'INST. ANÁLISIS', type: 'relation', relationTable: 'institucion_analisis', displayField: 'nombre' }
    ]
  },

  // ======================================================
  // CATÁLOGOS (SOLO ADMIN)
  // ======================================================
  
ubicacion: {
  label: "Catálogo: Ubicaciones",
  roles: ['admin'],
  columns: [
    { key: 'id', label: 'ID', type: 'number', readOnly: true },
    { key: 'nombre_sitio', label: 'NOMBRE SITIO', type: 'text' },
    { key: 'codigo_sitio', label: 'CÓDIGO SITIO', type: 'text' },    
    { 
      key: 'latitud', 
      label: 'LATITUD', 
      type: 'number', 
      step: '0.000001' // Permite alta precisión GPS
    },
    { 
      key: 'longitud', 
      label: 'LONGITUD', 
      type: 'number', 
      step: '0.000001' 
    },
      { key: 'pais', label: 'PAÍS', type: 'text' },
      { key: 'estado', label: 'ESTADO', type: 'text' },
      { key: 'municipio', label: 'MUNICIPIO', type: 'text' },
      { key: 'id_tipo_ambiente', label: 'TIPO AMBIENTE', type: 'relation', relationTable: 'tipo_ambiente', displayField: 'tipo' }
    ]
  },

  color: {
    label: "Catálogo: Colores",
    roles: ['admin'],
    columns: [
      { key: 'id', label: 'ID', type: 'number', readOnly: true },
      { key: 'nombre', label: 'NOMBRE', type: 'text' }
    ]
  },

  institucion_procedencia: {
    label: "Catálogo: Inst. Procedencia",
    roles: ['admin'],
    columns: [
      { key: 'id', label: 'ID', type: 'number', readOnly: true },
      { key: 'nombre', label: 'NOMBRE', type: 'text' }
    ]
  },

  institucion_financiamiento: {
    label: "Catálogo: Inst. Financiamiento",
    roles: ['admin'],
    columns: [
      { key: 'id', label: 'ID', type: 'number', readOnly: true },
      { key: 'nombre', label: 'NOMBRE', type: 'text' }
    ]
  },

  institucion_analisis: {
    label: "Catálogo: Inst. Análisis",
    roles: ['admin'],
    columns: [
      { key: 'id', label: 'ID', type: 'number', readOnly: true },
      { key: 'nombre', label: 'NOMBRE', type: 'text' }
    ]
  },
  
  tipo_ambiente: {
    label: "Catálogo: Tipo Ambiente",
    roles: ['admin'],
    columns: [
      { key: 'id', label: 'ID', type: 'number', readOnly: true },
      { key: 'tipo', label: 'TIPO', type: 'text' }
    ]
  },
  
  resultado_ftir_raman: {
    label: "Catálogo: Resultados FTIR/Raman",
    roles: ['admin'],
    columns: [
      { key: 'id', label: 'ID', type: 'number', readOnly: true },
      { key: 'nombre', label: 'NOMBRE', type: 'text' }
    ]
  }
};