import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount);
};

const Dashboard = () => {
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [categories, setCategories] = useState([]);
  const [spending, setSpending] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const transactionsPerPage = 10;
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [showQuickIncome, setShowQuickIncome] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0] });

  const today = new Date();
  const currentDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingIncome && !e.target.closest('.stat-card')) {
        setEditingIncome(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [editingIncome]);

  const fetchData = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const startOfMonth = new Date(year, month, 1, 0, 0, 0).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const skip = (currentPage - 1) * transactionsPerPage;

      const [summaryRes, catsRes, spendingRes, transRes, alertsRes, quincenasRes, countRes] = await Promise.all([
        axios.get(`${API_URL}/api/transactions/summary?start_date=${startOfMonth}&end_date=${endOfMonth}`, { maxRedirects: 5 }),
        axios.get(`${API_URL}/api/categories/`, { maxRedirects: 5 }),
        axios.get(`${API_URL}/api/transactions/by-category?start_date=${startOfMonth}&end_date=${endOfMonth}`, { maxRedirects: 5 }),
        axios.get(`${API_URL}/api/transactions/?skip=${skip}&limit=${transactionsPerPage}`, { maxRedirects: 5 }),
        axios.get(`${API_URL}/api/budgets/alerts?start_date=${startOfMonth}&end_date=${endOfMonth}`, { maxRedirects: 5 }),
        axios.get(`${API_URL}/api/financial/quincenas`, { maxRedirects: 5 }),
        axios.get(`${API_URL}/api/transactions/?limit=1000`, { maxRedirects: 5 })
      ]);

      setSummary(summaryRes.data);
      setCategories(catsRes.data);
      setSpending(spendingRes.data);
      setRecentTransactions(transRes.data);
      setBudgetAlerts(alertsRes.data);
      setTotalTransactions(countRes.data.length);

      if (quincenasRes.data && quincenasRes.data.length > 0) {
        const total = quincenasRes.data.reduce((sum, q) => sum + (q.ingresos || 0), 0);
        setTotalIncome(total);
      }

      await fetchMonthlyTrends();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchMonthlyTrends = async () => {
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      
      try {
        const res = await axios.get(`${API_URL}/api/transactions/summary?start_date=${startDate}&end_date=${endDate}`, { maxRedirects: 5 });
        months.push(d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
        incomeData.push(res.data.total_income || 0);
        expenseData.push(res.data.total_expense || 0);
      } catch (e) {
        months.push(d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
        incomeData.push(0);
        expenseData.push(0);
      }
    }
    
    setMonthlyData({ months, incomeData, expenseData });
  };

  const saveIncome = async () => {
    const incomeValue = parseFloat(incomeInput);
    if (isNaN(incomeValue) || incomeValue <= 0) {
      alert('Ingrese un monto válido');
      return;
    }
    try {
      const now = new Date();
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const currentMonth = meses[now.getMonth()];
      const currentYear = now.getFullYear();
      
      await axios.post(`${API_URL}/api/financial/quincenas`, {
        quincena_num: 0,
        mes: currentMonth,
        anio: currentYear,
        ingresos: incomeValue,
        gastos_fijos: 0,
        disponible: incomeValue,
        ahorrado: 0,
        fecha_inicio: new Date(currentYear, now.getMonth(), 1).toISOString(),
        fecha_fin: new Date(currentYear, now.getMonth() + 1, 0).toISOString()
      }, { maxRedirects: 5 });
      
      setTotalIncome(incomeValue);
      setEditingIncome(false);
      setIncomeInput('');
      fetchData();
      alert('Ingreso mensual actualizado');
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Error al guardar');
    }
  };

  const handleQuickExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/transactions/`, {
        type: 'expense',
        amount: parseFloat(expenseForm.amount),
        category_id: parseInt(expenseForm.category_id),
        description: expenseForm.description,
        date: new Date(expenseForm.date + 'T12:00:00').toISOString()
      }, { maxRedirects: 5 });
      
      setShowQuickExpense(false);
      setExpenseForm({ amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error al registrar gasto');
    }
  };

  const handleQuickIncome = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/transactions/`, {
        type: 'income',
        amount: parseFloat(incomeForm.amount),
        category_id: parseInt(incomeForm.category_id),
        description: incomeForm.description,
        date: new Date(incomeForm.date + 'T12:00:00').toISOString()
      }, { maxRedirects: 5 });
      
      setShowQuickIncome(false);
      setIncomeForm({ amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Error al registrar ingreso');
    }
  };

  const spendingValues = Object.values(spending);
  const hasSpendingData = spendingValues.length > 0 && spendingValues.some(v => v > 0);

  const categoryColors = categories.map(c => c.color || '#6B7280');
  
  const pieData = {
    labels: categories.map(c => c.name),
    datasets: [{
      data: categories.map(c => spending[c.id] || 0),
      backgroundColor: categoryColors,
      borderColor: '#ffffff',
      borderWidth: 2,
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const hasRealData = monthlyData.incomeData?.some(v => v > 0) || monthlyData.expenseData?.some(v => v > 0);

  const lineData = {
    labels: monthlyData.months || [],
    datasets: [
      { 
        label: 'Ingresos', 
        data: hasRealData ? (monthlyData.incomeData || []) : [], 
        borderColor: '#10B981', 
        backgroundColor: '#10B981',
        fill: false,
        tension: 0.3
      },
      { 
        label: 'Gastos', 
        data: hasRealData ? (monthlyData.expenseData || []) : [], 
        borderColor: '#EF4444', 
        backgroundColor: '#EF4444',
        fill: false,
        tension: 0.3
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    },
    plugins: {
      legend: { position: 'top' }
    }
  };

  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          style={{
            padding: '8px 12px',
            margin: '0 4px',
            border: 'none',
            borderRadius: '4px',
            background: currentPage === i ? '#3B82F6' : 'var(--bg-secondary)',
            color: currentPage === i ? '#fff' : 'var(--text)',
            cursor: 'pointer'
          }}
        >
          {i}
        </button>
      );
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '10px' }}>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          ‹ Anterior
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Siguiente ›
        </button>
      </div>
    );
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2>Dashboard Financiero</h2>
          <span style={{ color: '#6B7280', fontSize: '14px' }}>Fecha: {currentDate}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn" 
            onClick={() => setShowQuickIncome(true)}
            style={{ 
              background: '#10B981', 
              color: '#fff', 
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            + Registrar Ingreso
          </button>
          <button 
            className="btn" 
            onClick={() => setShowQuickExpense(true)}
            style={{ 
              background: '#EF4444', 
              color: '#fff', 
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            - Registrar Gasto
          </button>
        </div>
      </div>
      
      {budgetAlerts.length > 0 && (
        <div style={{ background: '#FEF3C7', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <strong>Alertas de Presupuesto:</strong>
          <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
            {budgetAlerts.map((alert, i) => (
              <li key={i}>{alert.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => { setEditingIncome(true); setIncomeInput(totalIncome > 0 ? String(totalIncome) : ''); }}>
          <div className="stat-label">Ingreso Mensual</div>
          {editingIncome ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                autoFocus
                style={{ 
                  width: '120px', 
                  padding: '6px 10px', 
                  borderRadius: '4px', 
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '14px' }}
                onClick={(e) => { e.stopPropagation(); saveIncome(); }}
              >
                Guardar
              </button>
            </div>
          ) : (
            <div className="stat-value positive" onClick={(e) => e.stopPropagation()}>{formatCurrency(totalIncome)}</div>
          )}
        </div>
        <div className="card stat-card">
          <div className="stat-label">Ingresos del Mes</div>
          <div className="stat-value positive">{formatCurrency(summary.total_income)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Gastos del Mes</div>
          <div className="stat-value negative">{formatCurrency(summary.total_expense)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Balance</div>
          <div className={`stat-value ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(summary.balance)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ position: 'relative' }}>
          <h3 className="card-title">Gastos por Categoría</h3>
          {hasSpendingData ? (
            <div className="chart-container" style={{ height: '300px' }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
              No hay gastos registrados este mes
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="card-title">Tendencia 6 Meses</h3>
          {hasRealData ? (
            <div className="chart-container" style={{ height: '300px' }}>
              <Line data={lineData} options={lineOptions} />
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
              No hay datos suficientes para mostrar tendencias
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Transacciones ({totalTransactions} total)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length > 0 ? recentTransactions.map(t => (
              <tr key={t.id}>
                <td>{formatDate(t.date)}</td>
                <td>
                  <span style={{ 
                    color: t.type === 'income' ? '#10B981' : '#EF4444',
                    fontWeight: 500
                  }}>
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
              </tr>
            )) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#6B7280' }}>No hay transacciones</td>
              </tr>
            )}
          </tbody>
        </table>
        {renderPagination()}
      </div>

      {showQuickExpense && (
        <div className="modal-overlay" onClick={() => setShowQuickExpense(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Gasto</h3>
              <button className="close-btn" onClick={() => setShowQuickExpense(false)}>×</button>
            </div>
            <form onSubmit={handleQuickExpense}>
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input 
                  type="number" 
                  className="form-input" 
                  step="0.01" 
                  value={expenseForm.amount} 
                  onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
                  required 
                  style={{ fontSize: '18px', padding: '12px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select 
                  className="form-select" 
                  value={expenseForm.category_id} 
                  onChange={e => setExpenseForm({...expenseForm, category_id: e.target.value})}
                  required
                >
                  <option value="">Seleccionar</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={expenseForm.date} 
                  onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={expenseForm.description} 
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', background: '#EF4444' }}>
                Guardar Gasto
              </button>
            </form>
          </div>
        </div>
      )}

      {showQuickIncome && (
        <div className="modal-overlay" onClick={() => setShowQuickIncome(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Ingreso</h3>
              <button className="close-btn" onClick={() => setShowQuickIncome(false)}>×</button>
            </div>
            <form onSubmit={handleQuickIncome}>
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input 
                  type="number" 
                  className="form-input" 
                  step="0.01" 
                  value={incomeForm.amount} 
                  onChange={e => setIncomeForm({...incomeForm, amount: e.target.value})} 
                  required 
                  style={{ fontSize: '18px', padding: '12px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Ingreso</label>
                <select 
                  className="form-select" 
                  value={incomeForm.category_id} 
                  onChange={e => setIncomeForm({...incomeForm, category_id: e.target.value})}
                  required
                >
                  <option value="">Seleccionar tipo de ingreso</option>
                  {categories.filter(c => ['Salario', 'Freelance', 'Inversión', 'Bono', 'Otro Ingreso'].includes(c.name)).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={incomeForm.date} 
                  onChange={e => setIncomeForm({...incomeForm, date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={incomeForm.description} 
                  onChange={e => setIncomeForm({...incomeForm, description: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', background: '#10B981' }}>
                Guardar Ingreso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;