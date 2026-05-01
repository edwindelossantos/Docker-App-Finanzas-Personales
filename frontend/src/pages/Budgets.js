import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category_id: '', amount: '', alert_threshold: 80, start_date: '', period: 'monthly' });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchBudgets = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = now.toISOString();
    const res = await axios.get(`${API_URL}/api/budgets/?start_date=${startOfMonth}&end_date=${endOfMonth}`);
    setBudgets(res.data);
  };

  const fetchCategories = async () => {
    const res = await axios.get(`${API_URL}/api/categories/`);
    setCategories(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/budgets/`, {
        ...form,
        start_date: new Date(form.start_date).toISOString()
      });
      setShowModal(false);
      setForm({ category_id: '', amount: '', alert_threshold: 80, start_date: '', period: 'monthly' });
      fetchBudgets();
    } catch (error) {
      alert('Error al crear presupuesto');
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Sin categoría';
  };

  const getCategoryColor = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.color : '#3B82F6';
  };

  const getProgressClass = (pct) => {
    if (pct >= 90) return 'high';
    if (pct >= 70) return 'medium';
    return 'low';
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <div className="card">
        <div className="card-header">
          <h2>Presupuestos</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {budgets.map(b => (
            <div key={b.id} style={{ padding: '20px', background: '#F9FAFB', borderRadius: '12px', borderTop: `4px solid ${getCategoryColor(b.category_id)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h4>{getCategoryName(b.category_id)}</h4>
                <span style={{ color: '#6B7280' }}>{b.period}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Gastado: {formatCurrency(b.spent)}</span>
                <span>Presupuesto: {formatCurrency(b.amount)}</span>
              </div>
              <div className="progress-bar">
                <div className={`progress-fill ${getProgressClass(b.percentage_used)}`} style={{ width: `${Math.min(b.percentage_used, 100)}%` }}></div>
              </div>
              <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '14px', color: b.percentage_used >= b.alert_threshold ? '#EF4444' : '#10B981' }}>
                {b.percentage_used.toFixed(1)}% usado
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Presupuesto</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} required>
                  <option value="">Seleccionar</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input type="number" className="form-input" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Inicio</label>
                <input type="date" className="form-input" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Alerta (%)</label>
                <input type="number" className="form-input" value={form.alert_threshold} onChange={e => setForm({...form, alert_threshold: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;