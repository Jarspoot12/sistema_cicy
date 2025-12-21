import { Link } from 'react-router-dom';

const EmailVerified = () => {
  return (
    <div className="centered-layout">
    <div className="auth-container" style={{ textAlign: 'center' }}>
      <h2 style={{ color: '#27ae60' }}>¡Cuenta Verificada!</h2>
      <p>Tu correo ha sido confirmado exitosamente.</p>
      <p>Ya puedes acceder al sistema con tus credenciales.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <Link to="/">
          <button>Ir a Iniciar Sesión</button>
        </Link>
      </div>
    </div>
    </div>
  );
};

export default EmailVerified;