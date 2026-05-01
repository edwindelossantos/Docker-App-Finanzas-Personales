import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const CATEGORY_ICONS = {
  '🏠': 'Vivienda',
  '🍽️': 'Alimentación',
  '💰': 'Ahorro',
  '❤️': 'Salud',
  '⚠️': 'Imprevistos',
  '🚗': 'Transporte',
  '🎮': 'Entretenimiento',
  '💡': 'Servicios',
  '📱': 'Internet',
  '☎️': 'Teléfono',
  '📚': 'Educación',
  '🛡️': 'Seguro',
  '📋': 'Deudas',
  '📄': 'Impuestos',
  '🔧': 'Mantenimiento',
  '🎀': 'Regalos',
  '📺': 'Suscripciones',
  '✈️': 'Viajes',
  '🏋️': 'Gimnasio',
  '🐾': 'Mascotas',
  '💵': 'Salario',
  '💻': 'Freelance',
  '📈': 'Inversión',
  '🎁': 'Bono',
  '📦': 'Otro Ingreso',
  '💼': 'Nómina',
  '📊': 'Comisiones',
  '🏢': 'Alquiler',
  '💹': 'Dividendos',
  '🛒': 'Venta',
  '🏥': 'Subsidio',
  '🔄': 'Devolución',
  '💳': 'Tarjeta',
  '🏦': 'Banco',
  '💳': 'Préstamo'
};

const CATEGORY_COLORS = {
  '🏠': '#10B981',
  '🍽️': '#F59E0B',
  '💰': '#3B82F6',
  '❤️': '#EF4444',
  '⚠️': '#8B5CF6',
  '🚗': '#06B6D4',
  '🎮': '#EC4899',
  '💡': '#F59E0B',
  '📱': '#3B82F6',
  '☎️': '#8B5CF6',
  '📚': '#EF4444',
  '🛡️': '#06B6D4',
  '📋': '#EC4899',
  '📄': '#F59E0B',
  '🔧': '#3B82F6',
  '🎀': '#8B5CF6',
  '📺': '#EC4899',
  '✈️': '#06B6D4',
  '🏋️': '#10B981',
  '🐾': '#F59E0B',
  '💵': '#10B981',
  '💻': '#3B82F6',
  '📈': '#8B5CF6',
  '🎁': '#F59E0B',
  '📦': '#06B6D4',
  '💼': '#10B981',
  '📊': '#3B82F6',
  '🏢': '#8B5CF6',
  '💹': '#F59E0B',
  '🛒': '#06B6D4',
  '🏥': '#EC4899',
  '🔄': '#10B981',
  '💳': '#8B5CF6',
  '🏦': '#3B82F6'
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6', icon: '🏠', percentage: 0 });

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
      setForm({ name: '', description: '', color: '#3B82F6', icon: '🏠', percentage: 0 });
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

  const selectIcon = (icon) => {
    setForm({ ...form, icon, color: CATEGORY_COLORS[icon] || '#3B82F6' });
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
            <div key={c.id} style={{ padding: '15px', background: 'var(--light)', borderRadius: '8px', borderLeft: `4px solid ${c.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{c.icon || '📁'}</span>
                  <div>
                    <h4 style={{ margin: 0 }}>{c.name}</h4>
                    <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>{c.percentage}%</p>
                  </div>
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
                <label className="form-label">Icono</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginTop: '8px' }}>
                  {Object.keys(CATEGORY_ICONS).map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => selectIcon(icon)}
                      title={CATEGORY_ICONS[icon]}
                      style={{
                        fontSize: '24px',
                        padding: '8px',
                        border: form.icon === icon ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: '8px',
                        background: form.icon === icon ? 'var(--primary)' + '20' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
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