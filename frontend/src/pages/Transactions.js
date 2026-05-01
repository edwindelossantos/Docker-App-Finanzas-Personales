import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'expense', amount: '', category_id: '', description: '', date: '' });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    const res = await axios.get(`${API_URL}/api/transactions/`);
    setTransactions(res.data);
  };

  const fetchCategories = async () => {
    const res = await axios.get(`${API_URL}/api/categories/`);
    setCategories(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/transactions/`, {
        ...form,
        date: new Date(form.date).toISOString()
      });
      setShowModal(false);
      setForm({ type: 'expense', amount: '', category_id: '', description: '', date: '' });
      fetchTransactions();
    } catch (error) {
      alert('Error al crear transacción');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta transacción?')) {
      await axios.delete(`${API_URL}/api/transactions/${id}/`);
      fetchTransactions();
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <div className="card">
        <div className="card-header">
          <h2>Transacciones</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nueva</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>{formatDate(t.date)}</td>
                <td>
                  <span style={{ color: t.type === 'income' ? '#10B981' : '#EF4444', fontWeight: 500 }}>
                    {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </span>
                </td>
                <td>
                  <span className="category-badge" style={{ background: t.category_color + '20', color: t.category_color }}>
                    {t.category_name}
                  </span>
                </td>
                <td style={{ color: t.type === 'income' ? '#10B981' : '#EF4444' }}>
                  {formatCurrency(t.amount)}
                </td>
                <td>{t.description || '-'}</td>
                <td>
                  <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => handleDelete(t.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Transacción</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input type="number" className="form-input" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} required>
                  <option value="">Seleccionar</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input type="text" className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;