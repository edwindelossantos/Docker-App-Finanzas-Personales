import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount);
};

const DEFAULT_PERCENTAGES = {
  'VIVIENDA': 30,
  'ALIMENTACIÓN': 15,
  'AHORRO': 10,
  'SALUD': 10,
  'IMPREVISTOS': 10,
  'TRANSPORTE': 15,
  'ENTRETENIMIENTO': 10
};

const COLORS = {
  'VIVIENDA': '#3B82F6',
  'ALIMENTACIÓN': '#10B981',
  'AHORRO': '#8B5CF6',
  'SALUD': '#EF4444',
  'IMPREVISTOS': '#F59E0B',
  'TRANSPORTE': '#06B6D4',
  'ENTRETENIMIENTO': '#EC4899'
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [form, setForm] = useState({ category_id: '', amount: '', alert_threshold: 80, start_date: '', period: 'monthly' });
  const [fixedForm, setFixedForm] = useState({ nombre: '', monto: '', categoria: '' });
  const [gastosFijos, setGastosFijos] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [percentages, setPercentages] = useState(DEFAULT_PERCENTAGES);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchGastosFijos();
    fetchTotalIncome();
  }, []);

  const fetchBudgets = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = now.toISOString();
    const res = await axios.get(`${API_URL}/api/budgets/?start_date=${startOfMonth}&end_date=${endOfMonth}`, { maxRedirects: 5 });
    setBudgets(res.data);
  };

  const fetchCategories = async () => {
    const res = await axios.get(`${API_URL}/api/categories/`, { maxRedirects: 5 });
    setCategories(res.data);
  };

  const fetchGastosFijos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/financial/gastos-fijos`, { maxRedirects: 5 });
      setGastosFijos(res.data);
    } catch (error) {
      console.error('Error fetching gastos fijos:', error);
    }
  };

  const fetchTotalIncome = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/financial/quincenas`, { maxRedirects: 5 });
      if (res.data && res.data.length > 0) {
        const total = res.data.reduce((sum, q) => sum + (q.ingresos || 0), 0);
        setTotalIncome(total);
      }
    } catch (error) {
      console.error('Error fetching income:', error);
    }
  };

  const getCalculatedFixedExpenses = () => {
    return Object.keys(percentages).map(cat => ({
      nombre: cat,
      monto: totalIncome * (percentages[cat] / 100),
      categoria: cat,
      es_automatico: 1
    }));
  };

  const calculatedExpenses = getCalculatedFixedExpenses();
  const totalCalculado = calculatedExpenses.reduce((sum, e) => sum + e.monto, 0);
  const totalFijosManual = gastosFijos.filter(g => !g.es_automatico).reduce((sum, g) => sum + g.monto, 0);
  const totalGastosFijos = totalCalculado + totalFijosManual;
  const disponible = totalIncome - totalGastosFijos;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/budgets/`, {
        ...form,
        start_date: new Date(form.start_date).toISOString()
      }, { maxRedirects: 5 });
      setShowModal(false);
      setForm({ category_id: '', amount: '', alert_threshold: 80, start_date: '', period: 'monthly' });
      fetchBudgets();
    } catch (error) {
      alert('Error al crear presupuesto');
    }
  };

  const handleFixedSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/financial/gastos-fijos`, {
        ...fixedForm,
        monto: parseFloat(fixedForm.monto),
        es_automatico: 0
      }, { maxRedirects: 5 });
      setShowFixedModal(false);
      setFixedForm({ nombre: '', monto: '', categoria: '' });
      fetchGastosFijos();
    } catch (error) {
      alert('Error al crear gasto fijo');
    }
  };

  const handleDeleteFixed = async (id) => {
    if (confirm('¿Eliminar este gasto fijo?')) {
      try {
        await axios.delete(`${API_URL}/api/financial/gastos-fijos/${id}`, { maxRedirects: 5 });
        fetchGastosFijos();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const handlePercentageChange = (category, value) => {
    setPercentages({ ...percentages, [category]: parseFloat(value) || 0 });
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Presupuestos</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo</button>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        <div className="card stat-card">
          <div className="stat-label">Ingreso Mensual</div>
          <div className="stat-value positive">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Gastos Calculados</div>
          <div className="stat-value" style={{ color: '#F59E0B' }}>{formatCurrency(totalCalculado)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Fijos Manuales</div>
          <div className="stat-value" style={{ color: '#3B82F6' }}>{formatCurrency(totalFijosManual)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Disponible</div>
          <div className={`stat-value ${disponible >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(disponible)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3>Porcentajes para Cálculo Automático</h3>
          <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => setShowFixedModal(true)}>+ Agregar Fijo</button>
        </div>
        
        <table className="table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Porcentaje (%)</th>
              <th style={{ textAlign: 'right', width: '150px' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(percentages).map(cat => (
              <tr key={cat}>
                <td>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: COLORS[cat], borderRadius: '2px', marginRight: '8px' }}></span>
                  {cat}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="number"
                    value={percentages[cat]}
                    onChange={(e) => handlePercentageChange(cat, e.target.value)}
                    style={{ 
                      width: '80px', 
                      textAlign: 'center',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)'
                    }}
                    min="0"
                    max="100"
                  />
                </td>
                <td style={{ textAlign: 'right' }}>
                  {totalIncome > 0 ? (
                    <input
                      type="number"
                      value={Math.round(totalIncome * (percentages[cat] / 100) * 100) / 100}
                      onChange={(e) => {
                        const newAmount = parseFloat(e.target.value) || 0;
                        const newPercentage = totalIncome > 0 ? (newAmount / totalIncome) * 100 : 0;
                        setPercentages({ ...percentages, [cat]: Math.round(newPercentage * 100) / 100 });
                      }}
                      style={{ 
                        width: '130px', 
                        textAlign: 'right',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: '#F59E0B',
                        fontWeight: '500'
                      }}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span style={{ color: '#6B7280' }}>Sin ingreso</span>
                  )}
                </td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
              <td>Total</td>
              <td style={{ textAlign: 'center' }}>{Object.values(percentages).reduce((a, b) => a + b, 0)}%</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(totalCalculado)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <h3 className="card-title">Gastos Calculados (Automático)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {calculatedExpenses.map((e, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: COLORS[e.nombre], borderRadius: '2px', marginRight: '8px' }}></span>
                    {e.nombre}
                  </td>
                  <td style={{ textAlign: 'right', color: '#F59E0B' }}>{formatCurrency(e.monto)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
                <td>Total</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(totalCalculado)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="card-title">Gastos Fijos Manuales</h3>
          {gastosFijos.filter(g => !g.es_automatico).length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ width: '80px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastosFijos.filter(g => !g.es_automatico).map(g => (
                  <tr key={g.id}>
                    <td>{g.nombre}</td>
                    <td style={{ textAlign: 'right', color: '#3B82F6' }}>{formatCurrency(g.monto)}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleDeleteFixed(g.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
                  <td>Total</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(totalFijosManual)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>No hay gastos fijos manuales</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Presupuestos por Categoría</h3>
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

      {showFixedModal && (
        <div className="modal-overlay" onClick={() => setShowFixedModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Gasto Fijo Manual</h3>
              <button className="close-btn" onClick={() => setShowFixedModal(false)}>×</button>
            </div>
            <form onSubmit={handleFixedSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input type="text" className="form-input" value={fixedForm.nombre} onChange={e => setFixedForm({...fixedForm, nombre: e.target.value})} required placeholder="Ej: Internet, Celular, etc." />
              </div>
              <div className="form-group">
                <label className="form-label">Monto Mensual</label>
                <input type="number" className="form-input" step="0.01" value={fixedForm.monto} onChange={e => setFixedForm({...fixedForm, monto: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría (opcional)</label>
                <select className="form-select" value={fixedForm.categoria} onChange={e => setFixedForm({...fixedForm, categoria: e.target.value})}>
                  <option value="">Seleccionar</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
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