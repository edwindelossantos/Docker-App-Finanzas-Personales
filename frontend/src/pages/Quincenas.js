import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount);
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

const Quincenas = () => {
  const [quincenas, setQuincenas] = useState([]);
  const [mode, setMode] = useState('quincenal');
  const [showModal, setShowModal] = useState(false);
  const [totalIncome, setTotalIncome] = useState('');
  const [form, setForm] = useState({ quincena_num: 1, mes: '', anio: new Date().getFullYear(), ingresos: 0, gastos_fijos: 0, disponible: 0, ahorrado: 0 });
  const [percentages, setPercentages] = useState({
    'VIVIENDA': 30,
    'ALIMENTACIÓN': 15,
    'AHORRO': 10,
    'SALUD': 10,
    'IMPREVISTOS': 10,
    'TRANSPORTE': 15,
    'ENTRETENIMIENTO': 10
  });

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  useEffect(() => {
    fetchQuincenas();
  }, []);

  const fetchQuincenas = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/financial/quincenas`, { maxRedirects: 5 });
      setQuincenas(res.data);
    } catch (error) {
      console.error('Error fetching quincenas:', error);
    }
  };

  const getIncomeValue = () => {
    const val = parseFloat(totalIncome);
    return isNaN(val) ? 0 : val;
  };

  const saveIncome = async () => {
    const incomeValue = getIncomeValue();
    if (incomeValue <= 0) {
      alert('Ingrese un monto válido');
      return;
    }
    try {
      const now = new Date();
      const currentMonth = meses[now.getMonth()];
      const currentYear = now.getFullYear();
      
      await axios.post(`${API_URL}/api/financial/quincenas`, {
        quincena_num: mode === 'quincenal' ? 1 : 0,
        mes: currentMonth,
        anio: currentYear,
        ingresos: incomeValue,
        gastos_fijos: 0,
        disponible: incomeValue,
        ahorrado: 0,
        fecha_inicio: new Date(currentYear, now.getMonth(), 1).toISOString(),
        fecha_fin: new Date(currentYear, now.getMonth() + 1, 0).toISOString()
      }, { maxRedirects: 5 });
      
      fetchQuincenas();
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Error al guardar');
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    const incomeValue = getIncomeValue();
    if (newMode === 'quincenal') {
      setForm({ ...form, ingresos: incomeValue / 2 });
    } else {
      setForm({ ...form, ingresos: incomeValue });
    }
  };

  const handlePercentageChange = (category, value) => {
    const newPercentages = { ...percentages, [category]: parseFloat(value) || 0 };
    setPercentages(newPercentages);
  };

  const getDistribution = () => {
    const incomeValue = getIncomeValue();
    const income = mode === 'quincenal' ? incomeValue / 2 : incomeValue;
    return Object.keys(percentages).map(cat => ({
      name: cat,
      percentage: percentages[cat],
      color: COLORS[cat],
      amount: income * (percentages[cat] / 100)
    }));
  };

  const distribution = getDistribution();
  const totalAsignado = distribution.reduce((sum, d) => sum + d.amount, 0);
  const totalPercentage = Object.values(percentages).reduce((sum, p) => sum + p, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = new Date();
    const monthIndex = meses.indexOf(form.mes);
    let startDate, endDate;
    
    if (mode === 'mensual') {
      startDate = new Date(form.anio, monthIndex, 1);
      endDate = new Date(form.anio, monthIndex + 1, 0);
    } else {
      startDate = new Date(form.anio, monthIndex, (form.quincena_num - 1) * 15 + 1);
      endDate = new Date(form.anio, monthIndex, form.quincena_num * 15);
    }

    try {
      await axios.post(`${API_URL}/api/financial/quincenas`, {
        ...form,
        disponible: form.ingresos - form.gastos_fijos,
        fecha_inicio: startDate.toISOString(),
        fecha_fin: endDate.toISOString()
      }, { maxRedirects: 5 });
      setShowModal(false);
      fetchQuincenas();
    } catch (error) {
      alert('Error al crear registro');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este registro?')) {
      try {
        await axios.delete(`${API_URL}/api/financial/quincenas/${id}`, { maxRedirects: 5 });
        fetchQuincenas();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const filteredQuincenas = mode === 'mensual' 
    ? quincenas.filter(q => !q.mes?.includes('Quincena'))
    : quincenas;

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Ingresos</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`tab ${mode === 'quincenal' ? 'active' : ''}`}
            onClick={() => handleModeChange('quincenal')}
          >
            Quincenal
          </button>
          <button 
            className={`tab ${mode === 'mensual' ? 'active' : ''}`}
            onClick={() => handleModeChange('mensual')}
          >
            Mensual
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 className="card-title">Ingreso Fijo</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px', marginTop: '15px' }}>
          <div style={{ gridSpan: 2 }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#6B7280', fontSize: '14px' }}>
              {mode === 'quincenal' ? 'Ingreso Quincenal' : 'Ingreso Mensual'}
            </label>
            <input
              type="number"
              className="form-input"
              value={totalIncome}
              onChange={(e) => {
                setTotalIncome(e.target.value);
                const val = parseFloat(e.target.value) || 0;
                if (mode === 'quincenal') {
                  setForm({...form, ingresos: val / 2});
                } else {
                  setForm({...form, ingresos: val});
                }
              }}
              style={{ width: '100%', textAlign: 'right', fontSize: '20px', padding: '12px', fontWeight: 'bold' }}
              placeholder="0.00"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#6B7280', fontSize: '14px' }}>Total</label>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', padding: '12px' }}>
              {totalIncome ? formatCurrency(getIncomeValue()) : 'RD$ 0.00'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              onClick={saveIncome}
              style={{ width: '100%', padding: '12px' }}
            >
              Guardar
            </button>
          </div>
        </div>

        <table className="table" style={{ marginBottom: '15px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>CATEGORÍA</th>
              <th style={{ textAlign: 'center', width: '120px' }}>PORCENTAJE (%)</th>
              <th style={{ textAlign: 'right' }}>MONTO ASIGNADO</th>
            </tr>
          </thead>
          <tbody>
            {distribution.map((d, i) => (
              <tr key={i}>
                <td style={{ fontWeight: '500' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: d.color, 
                    borderRadius: '2px',
                    marginRight: '8px'
                  }}></span>
                  {d.name}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="number"
                    value={percentages[d.name]}
                    onChange={(e) => handlePercentageChange(d.name, e.target.value)}
                    style={{ 
                      width: '60px', 
                      textAlign: 'center',
                      padding: '4px 8px',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      background: 'var(--bg)',
                      color: 'var(--text)'
                    }}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span style={{ marginLeft: '4px' }}>%</span>
                </td>
                <td style={{ textAlign: 'right', color: '#10B981', fontWeight: '500' }}>{formatCurrency(d.amount)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
              <td>Total</td>
              <td style={{ textAlign: 'center' }}>
                <span style={{ color: totalPercentage !== 100 ? '#EF4444' : '#10B981' }}>
                  {totalPercentage.toFixed(0)}%
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(totalAsignado)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          <div>
            <span style={{ color: '#6B7280' }}>Total Ingresos</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#10B981' }}>{totalIncome ? formatCurrency(getIncomeValue()) : 'RD$ 0.00'}</div>
          </div>
          <div>
            <span style={{ color: '#6B7280' }}>Total Asignado</span>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatCurrency(totalAsignado)}</div>
          </div>
          <div>
            <span style={{ color: '#6B7280' }}>Registros</span>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{quincenas.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Historial</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Tipo</th>
              <th>Ingresos</th>
              <th>Gastos Fijos</th>
              <th>Disponible</th>
              <th>Ahorrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuincenas.map(q => (
              <tr key={q.id}>
                <td>{q.mes} {q.anio}</td>
                <td>{q.quincena_num === 1 ? '1ra Q' : q.quincena_num === 2 ? '2da Q' : 'Mensual'}</td>
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
              <h3 className="modal-title">Nuevo Registro</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {mode === 'quincenal' && (
                <div className="form-group">
                  <label className="form-label">Quincena</label>
                  <select className="form-select" value={form.quincena_num} onChange={e => {
                    const q = parseInt(e.target.value);
                    setForm({...form, quincena_num: q, ingresos: getIncomeValue() / 2});
                  }}>
                    <option value={1}>1ra Quincena</option>
                    <option value={2}>2da Quincena</option>
                  </select>
                </div>
              )}
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