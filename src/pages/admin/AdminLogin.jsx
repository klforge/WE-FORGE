import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './AdminLogin.css';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.login(password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login__form" onSubmit={handleSubmit}>
        <div className="admin-login__lock">🔒</div>
        <h1 className="admin-login__title">Admin Access</h1>
        <p className="admin-login__subtitle">Enter password to continue</p>

        {error && <div className="admin-login__error">{error}</div>}

        <input
          type="password"
          className="admin-login__input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />

        <button className="admin-login__btn" type="submit" disabled={loading || !password}>
          {loading ? 'Verifying...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
