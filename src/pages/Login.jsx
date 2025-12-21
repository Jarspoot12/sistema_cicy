import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../services/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await signIn(email, password);
    if (error) {
      setErrorMsg('Credenciales incorrectas o error de conexión.');
      setLoading(false);
    } else {
      navigate('/captura-datos');
    }
  };

  return (
    <div className="centered-layout">
    <div className="auth-container">
      <h2>Iniciar Sesión</h2>
      
      {errorMsg && <div className="error-msg">{errorMsg}</div>}
      
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="ejemplo@correo.com"
          />
        </div>
        
        <div className="form-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Ingresar'}
        </button>
      </form>

      <div className="auth-links">
        <p>
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p>
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>
    </div>
    </div>
  );
};

export default Login;