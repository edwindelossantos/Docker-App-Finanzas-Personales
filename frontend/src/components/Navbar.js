import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';
  
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }} className="logo">Finanzas</Link>
        <div className="nav-links">
          <Link to="/" className={isActive('/')}>Dashboard</Link>
          <Link to="/transactions" className={isActive('/transactions')}>Transacciones</Link>
          <Link to="/categories" className={isActive('/categories')}>Categorías</Link>
          <Link to="/budgets" className={isActive('/budgets')}>Presupuestos</Link>
          <Link to="/goals" className={isActive('/goals')}>Metas</Link>
          <Link to="/quincenas" className={isActive('/quincenas')}>Ingresos</Link>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;