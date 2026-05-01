import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err) {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="login-page">
      <div className="card login-form">
        <div className="login-logo">
          <h1>Finanzas</h1>
          <p style={{ color: '#6B7280', marginTop: '10px' }}>Gestión Financiera Personal</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: '#EF4444', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Iniciar Sesión
          </button>
          <p style={{ marginTop: '15px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
            Usuario: admin | Contraseña: admin123
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;