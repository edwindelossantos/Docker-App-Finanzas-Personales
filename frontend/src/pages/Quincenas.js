import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
};

const Quincenas = () => {
  const [quincenas, setQuincenas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ quincena_num: 1, mes: '', anio: new Date().getFullYear(), ingresos: 0, gastos_fijos: 0, disponible: 0, ahorrado: 0 });
  const [totalIncome, setTotalIncome] = useState(0);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  useEffect(() => {
    fetchQuincenas();
    fetchTotalIncome();
  }, []);

  const fetchQuincenas = async () => {
    const res = await axios.get(`${API_URL}/api/financial/quincenas/`);
    setQuincenas(res.data);
  };

  const fetchTotalIncome = async () => {
    const res = await axios.get(`${API_URL}/api/financial/incomes/total`);
    setTotalIncome(res.data.total);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = new Date();
    const monthIndex = meses.indexOf(form.mes);
    const startDate = new Date(form.anio, monthIndex, (form.quincena_num - 1) * 15 + 1);
    const endDate = new Date(form.anio, monthIndex, form.quincena_num * 15);

    try {
      await axios.post(`${API_URL}/api/financial/quincenas/`, {
        ...form,
        disponible: form.ingresos - form.gastos_fijos,
        fecha_inicio: startDate.toISOString(),
        fecha_fin: endDate.toISOString()
      });
      setShowModal(false);
      setForm({ quincena_num: 1, mes: '', anio: new Date().getFullYear(), ingresos: 0, gastos_fijos: 0, disponible: 0, ahorrado: 0 });
      fetchQuincenas();
    } catch (error) {
      alert('Error al crear quincena');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta quincena?')) {
      await axios.delete(`${API_URL}/api/financial/quincenas/${id}/`);
      fetchQuincenas();
    }
  };

  const currentQuincena = quincenas[0] || null;
  const prevQuincena = quincenas[1] || null;

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Gestión Quincenal</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <h3 style={{ color: '#10B981', marginBottom: '20px' }}>1ra Quincena</h3>
          {currentQuincena && currentQuincena.quincena_num === 1 ? (
            <div>
              <div className="quincena-card">
                <h4>Ingresos</h4>
                <div className="quincena-amount">{formatCurrency(currentQuincena.ingresos)}</div>
              </div>
              <div className="quincena-card">
                <h4>Gastos Fijos</h4>
                <div className="quincena-amount" style={{ color: '#EF4444' }}>-{formatCurrency(currentQuincena.gastos_fijos)}</div>
              </div>
              <div className="quincena-card">
                <h4>Disponible</h4>
                <div className="quincena-amount">{formatCurrency(currentQuincena.disponible)}</div>
              </div>
              <div className="quincena-card">
                <h4>Ahorrado</h4>
                <div className="quincena-amount">{formatCurrency(currentQuincena.ahorrado)}</div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#6B7280' }}>No hay datos de 1ra quincena</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ color: '#3B82F6', marginBottom: '20px' }}>2da Quincena</h3>
          {currentQuincena && currentQuincena.quincena_num === 2 ? (
            <div>
              <div className="quincena-card">
                <h4>Ingresos</h4>
                <div className="quincena-amount">{formatCurrency(currentQuincena.ingresos)}</div>
              </div>
              <div className="quincena-card">
                <h4>Gastos Fijos</h4>
                <div className="quincena-amount" style={{ color: '#EF4444' }}>-{formatCurrency(currentQuincena.gastos_fijos)}</div>
              </div>
              <div className="quincena-card">
                <h4>Disponible</h4>
                <div className="quincena-amount">{formatCurrency(currentQuincena.disponible)}</div>
              </div>
              <div className="quincena-card">
                <h4>Ahorrado</h4>
                <div className="quincena-amount">{formatCurrency(currentQuincena.ahorrado)}</div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#6B7280' }}>No hay datos de 2da quincena</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Resumen Mensual</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '15px' }}>
          <div>
            <span style={{ color: '#6B7280' }}>Ingresos Totales</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10B981' }}>{formatCurrency(totalIncome)}</div>
          </div>
          <div>
            <span style={{ color: '#6B7280' }}>Total Disponible (2Q)</span>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{formatCurrency((currentQuincena?.disponible || 0) + (prevQuincena?.disponible || 0))}</div>
          </div>
          <div>
            <span style={{ color: '#6B7280' }}>Total Ahorrado</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6' }}>{formatCurrency((currentQuincena?.ahorrado || 0) + (prevQuincena?.ahorrado || 0))}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Historial de Quincenas</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nueva Quincena</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Quincena</th>
              <th>Ingresos</th>
              <th>Gastos Fijos</th>
              <th>Disponible</th>
              <th>Ahorrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quincenas.map(q => (
              <tr key={q.id}>
                <td>{q.mes} {q.anio}</td>
                <td>{q.quincena_num === 1 ? '1ra' : '2da'}</td>
                <td style={{ color: '#10B981' }}>{formatCurrency(q.ingresos)}</td>
                <td style={{ color: '#EF4444' }}>{formatCurrency(q.gastos_fijos)}</td>
                <td>{formatCurrency(q.disponible)}</td>
                <td style={{ color: '#3B82F6' }}>{formatCurrency(q.ahorrado)}</td>
                <td>
                  <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => handleDelete(q.id)}>Eliminar</button>
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
              <h3 className="modal-title">Nueva Quincena</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Quincena</label>
                <select className="form-select" value={form.quincena_num} onChange={e => setForm({...form, quincena_num: parseInt(e.target.value)})}>
                  <option value={1}>1ra Quincena</option>
                  <option value={2}>2da Quincena</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mes</label>
                <select className="form-select" value={form.mes} onChange={e => setForm({...form, mes: e.target.value})} required>
                  <option value="">Seleccionar</option>
                  {meses.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Año</label>
                <input type="number" className="form-input" value={form.anio} onChange={e => setForm({...form, anio: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Ingresos</label>
                <input type="number" className="form-input" step="0.01" value={form.ingresos} onChange={e => setForm({...form, ingresos: parseFloat(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Gastos Fijos</label>
                <input type="number" className="form-input" step="0.01" value={form.gastos_fijos} onChange={e => setForm({...form, gastos_fijos: parseFloat(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Ahorrado</label>
                <input type="number" className="form-input" step="0.01" value={form.ahorrado} onChange={e => setForm({...form, ahorrado: parseFloat(e.target.value)})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quincenas;