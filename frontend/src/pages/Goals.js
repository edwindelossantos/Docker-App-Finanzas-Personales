import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Sin fecha';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: 0, deadline: '', category: '' });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const res = await axios.get(`${API_URL}/api/financial/goals/`);
    setGoals(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/financial/goals/`, form);
      setShowModal(false);
      setForm({ name: '', target_amount: '', current_amount: 0, deadline: '', category: '' });
      fetchGoals();
    } catch (error) {
      alert('Error al crear meta');
    }
  };

  const handleAddAmount = async (goal) => {
    const amount = prompt('Ingrese cantidad a agregar:');
    if (amount) {
      await axios.put(`${API_URL}/api/financial/goals/${goal.id}/`, {
        current_amount: goal.current_amount + parseFloat(amount)
      });
      fetchGoals();
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta meta?')) {
      await axios.delete(`${API_URL}/api/financial/goals/${id}/`);
      fetchGoals();
    }
  };

  const getProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <div className="card">
        <div className="card-header">
          <h2>Metas de Ahorro</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nueva Meta</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {goals.map(g => (
            <div key={g.id} style={{ padding: '20px', background: '#F9FAFB', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h4>{g.name}</h4>
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>{g.category || 'Sin categoría'}</p>
                </div>
                <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => handleDelete(g.id)}>×</button>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Actual</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(g.current_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Meta</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(g.target_amount)}</span>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill low" style={{ width: `${getProgress(g.current_amount, g.target_amount)}%` }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                <span style={{ fontSize: '14px', color: g.is_achieved ? '#10B981' : '#6B7280' }}>
                  {g.is_achieved ? '✓ Completada' : `${getProgress(g.current_amount, g.target_amount).toFixed(1)}%`}
                </span>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{formatDate(g.deadline)}</span>
              </div>
              <button className="btn btn-primary" style={{ marginTop: '15px', width: '100%' }} onClick={() => handleAddAmount(g)}>
                Agregar Ahorro
              </button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Meta</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Monto Objetivo</label>
                <input type="number" className="form-input" step="0.01" value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Monto Actual</label>
                <input type="number" className="form-input" step="0.01" value={form.current_amount} onChange={e => setForm({...form, current_amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Límite</label>
                <input type="date" className="form-input" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <input type="text" className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Ej: Vacaciones, Vehículo" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;