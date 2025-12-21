import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../services/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false); // Agregué estado de carga para mejor UX

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    
    if (error) {
      setMsg('Error: ' + error.message);
    } else {
      setMsg('¡Listo! Revisa tu correo para recuperar la contraseña.');
    }
    setLoading(false);
  };

  return (
    <div className="centered-layout">
    <div className="auth-container">
      <h2>Recuperar Contraseña</h2>
      
      {/* MODIFICACIÓN 2: Mensaje de éxito o error estilizado */}
      {msg && <div className="error-msg" style={{ backgroundColor: msg.includes('Error') ? '#fdecea' : '#d4edda', color: msg.includes('Error') ? '#e74c3c' : '#155724' }}>{msg}</div>}
      
      <form onSubmit={handleReset}>
        {/* MODIFICACIÓN 3: Estructura de grupo con label */}
        <div className="form-group">
          <label>Ingresa tu correo registrado</label>
          <input 
            type="email" 
            placeholder="ejemplo@correo.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar correo'}
        </button>
      </form>

      {/* MODIFICACIÓN 4: Link de regreso estilizado */}
      <div className="auth-links">
        <p><Link to="/">Volver al Login</Link></p>
      </div>
    </div>
    </div>
  );
};

export default ForgotPassword;