import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../services/auth';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const { error } = await signUp(email, password);

    if (error) {
      setMsg('Error: ' + error.message);
    } else {
      alert('Registro exitoso. Por favor inicia sesión.');
      navigate('/'); 
    }
  };

  return (
    <div className="centered-layout">
    <div className="auth-container">
      <h2>Crear Cuenta</h2>
      
      {/* MODIFICACIÓN 2: Usamos la clase de error/mensaje si existe */}
      {msg && <div className="error-msg">{msg}</div>}
      
      <form onSubmit={handleRegister}>
        {/* MODIFICACIÓN 3: Envolvemos cada input en un form-group y agregamos Label */}
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            placeholder="tu@email.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            placeholder="Crea una contraseña segura" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        {/* El botón toma los estilos automáticos del CSS global */}
        <button type="submit">Registrarse</button>
      </form>

      {/* MODIFICACIÓN 4: Contenedor para los links */}
      <div className="auth-links">
        <p>
          ¿Ya tienes cuenta? <Link to="/">Inicia Sesión</Link>
        </p>
      </div>
    </div>
    </div>
  );
};

export default Register;