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
  const [transactionIncome, setTransactionIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const transactionsPerPage = 10;
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [showQuickIncome, setShowQuickIncome] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [selectedRuleCategory, setSelectedRuleCategory] = useState(null);

  const hasNewAlerts = budgetAlerts.length > 0 && !budgetAlerts.every(a => dismissedAlerts.includes(a.message));
  const [customRules, setCustomRules] = useState(() => {
    const saved = localStorage.getItem('rule50_30_20_categories');
    return saved ? JSON.parse(saved) : {
      needs: ['Vivienda', 'Alimentación', 'Transporte', 'Servicios', 'Internet', 'Teléfono', 'Educación', 'Seguro', 'Mantenimiento', 'Mascotas', 'Gimnasio'],
      wants: ['Entretenimiento', 'Viajes', 'Suscripciones', 'Regalos', 'Otros'],
      savings: ['Ahorro', 'Inversión', 'Deudas', 'Impuestos']
    };
  });

  const saveCustomRules = () => {
    localStorage.setItem('rule50_30_20_categories', JSON.stringify(customRules));
    setShowCustomizeModal(false);
  };

  const calculateRuleSpending = () => {
    const totalAvailable = totalIncome;
    if (totalAvailable <= 0) return { needs: 0, wants: 0, savings: 0, needsLimit: 0, wantsLimit: 0, savingsLimit: 0 };
    
    const needsLimit = totalAvailable * 0.50;
    const wantsLimit = totalAvailable * 0.30;
    const savingsLimit = totalAvailable * 0.20;
    
    let needs = 0, wants = 0, savings = 0;
    
    Object.keys(spending).forEach(catId => {
      const cat = categories.find(c => c.id === parseInt(catId));
      if (cat) {
        const amount = spending[catId] || 0;
        if (customRules.needs.includes(cat.name)) needs += amount;
        else if (customRules.wants.includes(cat.name)) wants += amount;
        else if (customRules.savings.includes(cat.name)) savings += amount;
        else needs += amount;
      }
    });
    
    return { needs, wants, savings, needsLimit, wantsLimit, savingsLimit };
  };

  const ruleData = calculateRuleSpending();
  const totalSpent = ruleData.needs + ruleData.wants + ruleData.savings;
  const isOverNeeds = ruleData.needs > ruleData.needsLimit;
  const isOverWants = ruleData.wants > ruleData.wantsLimit;
  const isOverSavings = ruleData.savings > ruleData.savingsLimit;
  const hasExceeded = isOverNeeds || isOverWants || isOverSavings;

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

      const allExpenses = countRes.data
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      setTotalExpenses(allExpenses);

      const allIncomesFromTransactions = countRes.data
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      setTransactionIncome(allIncomesFromTransactions);

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
      
      {budgetAlerts.length > 0 && !budgetAlerts.every(a => dismissedAlerts.includes(a.message)) && (
        <div className="modal-overlay" style={{ position: 'fixed', background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#FEF3C7', padding: '20px', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#92400E' }}>⚠️ Alertas de Presupuesto</h3>
              <button 
                onClick={() => setDismissedAlerts(budgetAlerts.map(a => a.message))}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#92400E' }}
              >
                ×
              </button>
            </div>
            <ul style={{ marginLeft: '20px', color: '#92400E' }}>
              {budgetAlerts.map((alert, i) => (
                <li key={i} style={{ marginBottom: '8px' }}>{alert.message}</li>
              ))}
            </ul>
            <button 
              onClick={() => setDismissedAlerts(budgetAlerts.map(a => a.message))}
              style={{ width: '100%', padding: '10px', background: '#92400E', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' }}
            >
              Entendido
            </button>
          </div>
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
          <div className="stat-label">Balance Total</div>
          <div className={`stat-value ${((totalIncome + transactionIncome) - totalExpenses) >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency((totalIncome + transactionIncome) - totalExpenses)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div className="card stat-card" style={{ cursor: 'pointer', borderTop: isOverNeeds ? '4px solid #EF4444' : '4px solid #10B981' }} onClick={() => setSelectedRuleCategory('needs')}>
          <div className="stat-label">Necesidades (50%)</div>
          <div className={`stat-value ${isOverNeeds ? 'negative' : 'positive'}`}>
            {formatCurrency(ruleData.needs)}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            Límite: {formatCurrency(ruleData.needsLimit)} • {ruleData.needsLimit > 0 ? ((ruleData.needs / ruleData.needsLimit) * 100).toFixed(0) : 0}%
          </div>
        </div>
        <div className="card stat-card" style={{ cursor: 'pointer', borderTop: isOverWants ? '4px solid #EF4444' : '4px solid #3B82F6' }} onClick={() => setSelectedRuleCategory('wants')}>
          <div className="stat-label">Deseos (30%)</div>
          <div className={`stat-value ${isOverWants ? 'negative' : ''}`} style={{ color: isOverWants ? '#EF4444' : '#3B82F6' }}>
            {formatCurrency(ruleData.wants)}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            Límite: {formatCurrency(ruleData.wantsLimit)} • {ruleData.wantsLimit > 0 ? ((ruleData.wants / ruleData.wantsLimit) * 100).toFixed(0) : 0}%
          </div>
        </div>
        <div className="card stat-card" style={{ cursor: 'pointer', borderTop: isOverSavings ? '4px solid #EF4444' : '4px solid #F59E0B' }} onClick={() => setSelectedRuleCategory('savings')}>
          <div className="stat-label">Ahorro (20%)</div>
          <div className={`stat-value ${isOverSavings ? 'negative' : ''}`} style={{ color: isOverSavings ? '#EF4444' : '#F59E0B' }}>
            {formatCurrency(ruleData.savings)}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            Límite: {formatCurrency(ruleData.savingsLimit)} • {ruleData.savingsLimit > 0 ? ((ruleData.savings / ruleData.savingsLimit) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>
      {hasExceeded && (
        <div style={{ background: '#FEE2E2', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', color: '#EF4444', fontWeight: '500' }}>
          ⚠️ Has excedido la regla 50/30/20. Haz clic en las tarjetas arriba para ver detalles.
        </div>
      )}

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

      {showRuleModal && (
        <div className="modal-overlay" onClick={() => setShowRuleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle Regla 50/30/20</h3>
              <button className="close-btn" onClick={() => setShowRuleModal(false)}>×</button>
            </div>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => { setShowRuleModal(false); setShowCustomizeModal(true); }}
              >
                ⚙️ Personalizar Categorías
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="card" style={{ marginBottom: '20px' }}>
                <h4 className="card-title">Resumen General</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                  <div>Ingreso Fijo: <strong>{formatCurrency(totalIncome)}</strong></div>
                  <div>Ingresos Registrados: <strong>{formatCurrency(transactionIncome)}</strong></div>
                  <div>Total Disponible: <strong>{formatCurrency(totalIncome + transactionIncome)}</strong></div>
                  <div>Gastos Totales: <strong style={{ color: '#EF4444' }}>{formatCurrency(totalExpenses)}</strong></div>
                </div>
              </div>

              <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
                <div className="card stat-card" style={{ borderTop: isOverNeeds ? '4px solid #EF4444' : '4px solid #10B981' }}>
                  <div className="stat-label">Necesidades (50%)</div>
                  <div className={`stat-value ${isOverNeeds ? 'negative' : 'positive'}`}>{formatCurrency(ruleData.needs)}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Límite: {formatCurrency(ruleData.needsLimit)}</div>
                  {isOverNeeds && <div style={{ color: '#EF4444', fontSize: '12px' }}>Excedido: {formatCurrency(ruleData.needs - ruleData.needsLimit)}</div>}
                </div>
                <div className="card stat-card" style={{ borderTop: isOverWants ? '4px solid #EF4444' : '4px solid #3B82F6' }}>
                  <div className="stat-label">Deseos (30%)</div>
                  <div className="stat-value" style={{ color: isOverWants ? '#EF4444' : '#3B82F6' }}>{formatCurrency(ruleData.wants)}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Límite: {formatCurrency(ruleData.wantsLimit)}</div>
                  {isOverWants && <div style={{ color: '#EF4444', fontSize: '12px' }}>Excedido: {formatCurrency(ruleData.wants - ruleData.wantsLimit)}</div>}
                </div>
                <div className="card stat-card" style={{ borderTop: isOverSavings ? '4px solid #EF4444' : '4px solid #F59E0B' }}>
                  <div className="stat-label">Ahorro (20%)</div>
                  <div className="stat-value" style={{ color: isOverSavings ? '#EF4444' : '#F59E0B' }}>{formatCurrency(ruleData.savings)}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Límite: {formatCurrency(ruleData.savingsLimit)}</div>
                  {isOverSavings && <div style={{ color: '#EF4444', fontSize: '12px' }}>Excedido: {formatCurrency(ruleData.savings - ruleData.savingsLimit)}</div>}
                </div>
              </div>

              <div className="card">
                <h4 className="card-title">Gastos por Categoría del Mes</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                      <th style={{ textAlign: 'right' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(spending).map(catId => {
                      const cat = categories.find(c => c.id === parseInt(catId));
                      const amount = spending[catId] || 0;
                      if (amount <= 0) return null;
                      return (
                        <tr key={catId}>
                          <td>{cat?.icon} {cat?.name}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(amount)}</td>
                          <td style={{ textAlign: 'right' }}>{totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRuleCategory && (
        <div className="modal-overlay" onClick={() => setSelectedRuleCategory(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedRuleCategory === 'needs' && '🏠 Necesidades (50%)'}
                {selectedRuleCategory === 'wants' && '🎯 Deseos (30%)'}
                {selectedRuleCategory === 'savings' && '💰 Ahorro/Deudas (20%)'}
              </h3>
              <button className="close-btn" onClick={() => setSelectedRuleCategory(null)}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="card" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6B7280' }}>Gastado</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 
                      selectedRuleCategory === 'needs' ? (isOverNeeds ? '#EF4444' : '#10B981') :
                      selectedRuleCategory === 'wants' ? (isOverWants ? '#EF4444' : '#3B82F6') :
                      (isOverSavings ? '#EF4444' : '#F59E0B')
                    }}>
                      {formatCurrency(
                        selectedRuleCategory === 'needs' ? ruleData.needs :
                        selectedRuleCategory === 'wants' ? ruleData.wants :
                        ruleData.savings
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6B7280' }}>Límite</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {formatCurrency(
                        selectedRuleCategory === 'needs' ? ruleData.needsLimit :
                        selectedRuleCategory === 'wants' ? ruleData.wantsLimit :
                        ruleData.savingsLimit
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ marginBottom: '10px' }}>Categorías asignadas:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(selectedRuleCategory === 'needs' ? customRules.needs : 
                    selectedRuleCategory === 'wants' ? customRules.wants : 
                    customRules.savings).map(catName => {
                    const cat = categories.find(c => c.name === catName);
                    const catSpending = cat ? (spending[cat.id] || 0) : 0;
                    return (
                      <span key={catName} style={{ padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: '16px', fontSize: '14px' }}>
                        {cat?.icon || '📁'} {catName}: {formatCurrency(catSpending)}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => { setSelectedRuleCategory(null); setShowCustomizeModal(true); }}
                >
                  ⚙️ Personalizar
                </button>
                <button 
                  className="btn" 
                  style={{ flex: 1, background: 'var(--bg-secondary)' }}
                  onClick={() => setSelectedRuleCategory(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCustomizeModal && (
        <div className="modal-overlay" onClick={() => setShowCustomizeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Personalizar Regla 50/30/20</h3>
              <button className="close-btn" onClick={() => setShowCustomizeModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ color: '#6B7280', marginBottom: '20px' }}>
                Selecciona las categorías que belong a cada grupo de la regla 50/30/20:
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#10B981' }}>🏠 Necesidades (50%)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const isInNeeds = customRules.needs.includes(cat.name);
                        const isInWants = customRules.wants.includes(cat.name);
                        const isInSavings = customRules.savings.includes(cat.name);
                        if (isInNeeds) {
                          setCustomRules({
                            ...customRules,
                            needs: customRules.needs.filter(n => n !== cat.name)
                          });
                        } else {
                          setCustomRules({
                            needs: [...customRules.needs.filter(n => !customRules.wants.includes(n) && !customRules.savings.includes(n)), cat.name],
                            wants: customRules.wants.filter(n => n !== cat.name),
                            savings: customRules.savings.filter(n => n !== cat.name)
                          });
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: customRules.needs.includes(cat.name) ? '#10B981' : 'var(--border)',
                        background: customRules.needs.includes(cat.name) ? '#10B98120' : 'transparent',
                        color: customRules.needs.includes(cat.name) ? '#10B981' : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#3B82F6' }}>🎯 Deseos (30%)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const isInWants = customRules.wants.includes(cat.name);
                        if (isInWants) {
                          setCustomRules({
                            ...customRules,
                            wants: customRules.wants.filter(n => n !== cat.name)
                          });
                        } else {
                          setCustomRules({
                            needs: customRules.needs.filter(n => n !== cat.name),
                            wants: [...customRules.wants.filter(n => !customRules.needs.includes(n) && !customRules.savings.includes(n)), cat.name],
                            savings: customRules.savings.filter(n => n !== cat.name)
                          });
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: customRules.wants.includes(cat.name) ? '#3B82F6' : 'var(--border)',
                        background: customRules.wants.includes(cat.name) ? '#3B82F620' : 'transparent',
                        color: customRules.wants.includes(cat.name) ? '#3B82F6' : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#F59E0B' }}>💰 Ahorro/Deudas (20%)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const isInSavings = customRules.savings.includes(cat.name);
                        if (isInSavings) {
                          setCustomRules({
                            ...customRules,
                            savings: customRules.savings.filter(n => n !== cat.name)
                          });
                        } else {
                          setCustomRules({
                            needs: customRules.needs.filter(n => n !== cat.name),
                            wants: customRules.wants.filter(n => n !== cat.name),
                            savings: [...customRules.savings.filter(n => !customRules.needs.includes(n) && !customRules.wants.includes(n)), cat.name]
                          });
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: customRules.savings.includes(cat.name) ? '#F59E0B' : 'var(--border)',
                        background: customRules.savings.includes(cat.name) ? '#F59E0B20' : 'transparent',
                        color: customRules.savings.includes(cat.name) ? '#F59E0B' : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '10px' }}
                onClick={saveCustomRules}
              >
                Guardar Personalización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;