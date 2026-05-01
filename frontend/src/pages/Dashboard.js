import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

const Dashboard = () => {
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [categories, setCategories] = useState([]);
  const [spending, setSpending] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = now.toISOString();

      const [summaryRes, catsRes, spendingRes, transRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/api/transactions/summary?start_date=${startOfMonth}&end_date=${endOfMonth}`),
        axios.get(`${API_URL}/api/categories/`),
        axios.get(`${API_URL}/api/transactions/by-category?start_date=${startOfMonth}&end_date=${endOfMonth}`),
        axios.get(`${API_URL}/api/transactions/?limit=5`),
        axios.get(`${API_URL}/api/budgets/alerts?start_date=${startOfMonth}&end_date=${endOfMonth}`)
      ]);

      setSummary(summaryRes.data);
      setCategories(catsRes.data);
      setSpending(spendingRes.data);
      setRecentTransactions(transRes.data);
      setBudgetAlerts(alertsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const pieData = {
    labels: categories.map(c => c.name),
    datasets: [{
      data: categories.map(c => spending[c.id] || 0),
      backgroundColor: categories.map(c => c.color),
    }]
  };

  const last6Months = [];
  const incomeData = [];
  const expenseData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    last6Months.push(d.toLocaleDateString('es-ES', { month: 'short' }));
    incomeData.push(Math.random() * 50000 + 30000);
    expenseData.push(Math.random() * 40000 + 20000);
  }

  const lineData = {
    labels: last6Months,
    datasets: [
      { label: 'Ingresos', data: incomeData, borderColor: '#10B981', backgroundColor: '#10B981' },
      { label: 'Gastos', data: expenseData, borderColor: '#EF4444', backgroundColor: '#EF4444' }
    ]
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <h2 style={{ marginBottom: '30px' }}>Dashboard Financiero</h2>
      
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
        <div className="card stat-card">
          <div className="stat-label">Transacciones</div>
          <div className="stat-value">{recentTransactions.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <h3 className="card-title">Gastos por Categoría</h3>
          <div className="chart-container">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Tendencia 6 Meses</h3>
          <div className="chart-container">
            <Line data={lineData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Transacciones Recientes</h3>
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
            {recentTransactions.map(t => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;