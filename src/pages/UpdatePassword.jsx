import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../services/auth';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setMsg('');

    const { error } = await updatePassword(password);

    if (error) {
      setErrorMsg('Error al actualizar: ' + error.message);
      setLoading(false);
    } else {
      setMsg('¡Contraseña actualizada correctamente!');
      setLoading(false);
      // Esperamos 2 segundos y lo mandamos al login o dashboard
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  };

  return (
    <div className="centered-layout">
    <div className="auth-container">
      <h2>Nueva Contraseña</h2>
      
      {errorMsg && <div className="error-msg">{errorMsg}</div>}
      {msg && <div className="error-msg" style={{backgroundColor: '#d4edda', color: '#155724'}}>{msg}</div>}

      <p style={{marginBottom: '1rem', fontSize: '0.9rem'}}>
        Ingresa tu nueva contraseña para recuperar el acceso.
      </p>
      
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label>Nueva Contraseña</label>
          <input 
            type="password" 
            placeholder="Mínimo 6 caracteres" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Cambiar Contraseña'}
        </button>
      </form>
    </div>
    </div>
  );
};

export default UpdatePassword;