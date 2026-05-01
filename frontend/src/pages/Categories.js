import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6', percentage: 0 });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get(`${API_URL}/api/categories/`);
    setCategories(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/categories/`, form);
      setShowModal(false);
      setForm({ name: '', description: '', color: '#3B82F6', percentage: 0 });
      fetchCategories();
    } catch (error) {
      alert('Error al crear categoría');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta categoría?')) {
      await axios.delete(`${API_URL}/api/categories/${id}/`);
      fetchCategories();
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <div className="card">
        <div className="card-header">
          <h2>Categorías</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nueva</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {categories.map(c => (
            <div key={c.id} style={{ padding: '15px', background: '#F9FAFB', borderRadius: '8px', borderLeft: `4px solid ${c.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{c.name}</h4>
                  <p style={{ margin: '5px 0 0', color: '#6B7280', fontSize: '14px' }}>{c.percentage}%</p>
                </div>
                <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => handleDelete(c.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Categoría</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input type="text" className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <input type="color" className="form-input" style={{ height: '40px' }} value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Porcentaje (%)</label>
                <input type="number" className="form-input" step="0.1" value={form.percentage} onChange={e => setForm({...form, percentage: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;