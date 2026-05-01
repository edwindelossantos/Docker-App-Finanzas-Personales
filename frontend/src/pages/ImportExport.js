import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount);
};

const ImportExport = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quincenas, setQuincenas] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [transRes, catsRes, quinRes, budgetRes] = await Promise.all([
        axios.get(`${API_URL}/api/transactions/`, { maxRedirects: 5 }),
        axios.get(`${API_URL}/api/categories/`, { maxRedirects: 5 }),
        axios.get(`${API_URL}/api/financial/quincenas`, { maxRedirects: 5 }),
        axios.get(`${API_URL}/api/budgets/`, { maxRedirects: 5 })
      ]);
      setTransactions(transRes.data);
      setCategories(catsRes.data);
      setQuincenas(quinRes.data);
      setBudgets(budgetRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const exportTransactions = () => {
    const data = transactions.map(t => ({
      fecha: new Date(t.date).toLocaleDateString('es-DO'),
      tipo: t.type === 'income' ? 'Ingreso' : 'Gasto',
      categoría: t.category_name,
      monto: t.amount,
      descripción: t.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
    XLSX.writeFile(wb, 'transacciones_finanzas.xlsx');
  };

  const exportCategories = () => {
    const data = categories.map(c => ({
      nombre: c.name,
      icono: c.icon,
      color: c.color,
      porcentaje: c.percentage
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categorías');
    XLSX.writeFile(wb, 'categorias_finanzas.xlsx');
  };

  const exportQuincenas = () => {
    const data = quincenas.map(q => ({
      período: `${q.mes} ${q.anio}`,
      quincena: q.quincena_num === 0 ? 'Mensual' : q.quincena_num === 1 ? '1ra Quincena' : '2da Quincena',
      ingresos: q.ingresos,
      gastos_fijos: q.gastos_fijos,
      disponible: q.disponible,
      ahorrado: q.ahorrado
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingresos');
    XLSX.writeFile(wb, 'ingresos_finanzas.xlsx');
  };

  const exportAll = () => {
    const wb = XLSX.utils.book_new();

    const transData = transactions.map(t => ({
      fecha: new Date(t.date).toLocaleDateString('es-DO'),
      tipo: t.type === 'income' ? 'Ingreso' : 'Gasto',
      categoría: t.category_name,
      monto: t.amount,
      descripción: t.description || ''
    }));
    const wsTrans = XLSX.utils.json_to_sheet(transData);
    XLSX.utils.book_append_sheet(wb, wsTrans, 'Transacciones');

    const catData = categories.map(c => ({
      nombre: c.name,
      icono: c.icon,
      color: c.color,
      porcentaje: c.percentage
    }));
    const wsCats = XLSX.utils.json_to_sheet(catData);
    XLSX.utils.book_append_sheet(wb, wsCats, 'Categorías');

    const quinData = quincenas.map(q => ({
      período: `${q.mes} ${q.anio}`,
      quincena: q.quincena_num === 0 ? 'Mensual' : q.quincena_num === 1 ? '1ra Quincena' : '2da Quincena',
      ingresos: q.ingresos,
      gastos_fijos: q.gastos_fijos,
      disponible: q.disponible,
      ahorrado: q.ahorrado
    }));
    const wsQuin = XLSX.utils.json_to_sheet(quinData);
    XLSX.utils.book_append_sheet(wb, wsQuin, 'Ingresos');

    XLSX.writeFile(wb, 'completo_finanzas.xlsx');
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const transData = [
      { fecha: '01/05/2026', tipo: 'Gasto', categoría: 'Alimentación', monto: 1500, descripción: 'Compra supermercado' },
      { fecha: '02/05/2026', tipo: 'Ingreso', categoría: 'Salario', monto: 25000, descripción: 'Nómina quincenal' }
    ];
    const wsTrans = XLSX.utils.json_to_sheet(transData);
    XLSX.utils.book_append_sheet(wb, wsTrans, 'Transacciones');

    const catData = [
      { nombre: 'Vivienda', icono: '🏠', color: '#10B981', porcentaje: 30 },
      { nombre: 'Alimentación', icono: '🍽️', color: '#F59E0B', porcentaje: 15 }
    ];
    const wsCats = XLSX.utils.json_to_sheet(catData);
    XLSX.utils.book_append_sheet(wb, wsCats, 'Categorías');

    const quinData = [
      { período: 'Mayo 2026', quincena: 'Mensual', ingresos: 50000, gastos_fijos: 0, disponible: 50000, ahorrado: 0 }
    ];
    const wsQuin = XLSX.utils.json_to_sheet(quinData);
    XLSX.utils.book_append_sheet(wb, wsQuin, 'Ingresos');

    XLSX.writeFile(wb, 'plantilla_finanzas.xlsx');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      let importedCount = 0;

      if (workbook.SheetNames.includes('Transacciones')) {
        const transData = XLSX.utils.sheet_to_json(workbook.Sheets['Transacciones']);
        
        for (const row of transData) {
          if (row.fecha && row.tipo && row.monto) {
            const category = categories.find(c => c.name === row.categoría);
            if (category) {
              const dateParts = row.fecha.split('/');
              const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T12:00:00`);
              
              await axios.post(`${API_URL}/api/transactions/`, {
                type: row.tipo === 'Ingreso' ? 'income' : 'expense',
                amount: parseFloat(row.monto),
                category_id: category.id,
                description: row.descripción || '',
                date: date.toISOString()
              }, { maxRedirects: 5 });
              importedCount++;
            }
          }
        }
      }

      if (workbook.SheetNames.includes('Categorías')) {
        const catData = XLSX.utils.sheet_to_json(workbook.Sheets['Categorías']);
        
        for (const row of catData) {
          if (row.nombre && !categories.find(c => c.name === row.nombre)) {
            await axios.post(`${API_URL}/api/categories/`, {
              name: row.nombre,
              icon: row.icono || '📁',
              color: row.color || '#3B82F6',
              percentage: parseFloat(row.porcentaje) || 0
            }, { maxRedirects: 5 });
          }
        }
      }

      if (workbook.SheetNames.includes('Ingresos')) {
        const quinData = XLSX.utils.sheet_to_json(workbook.Sheets['Ingresos']);
        
        for (const row of quinData) {
          if (row.período && row.ingresos) {
            const [mes, anio] = row.período.split(' ');
            await axios.post(`${API_URL}/api/financial/quincenas`, {
              quincena_num: row.quincena === 'Mensual' ? 0 : row.quincena === '1ra Quincena' ? 1 : 2,
              mes: mes,
              anio: parseInt(anio),
              ingresos: parseFloat(row.ingresos),
              gastos_fijos: parseFloat(row.gastos_fijos) || 0,
              disponible: parseFloat(row.disponible) || parseFloat(row.ingresos),
              ahorrado: parseFloat(row.ahorrado) || 0,
              fecha_inicio: new Date(parseInt(anio), 0, 1).toISOString(),
              fecha_fin: new Date(parseInt(anio), 11, 31).toISOString()
            }, { maxRedirects: 5 });
            importedCount++;
          }
        }
      }

      setMessage(`✅ Importación completada: ${importedCount} registros importados`);
      fetchAllData();
    } catch (error) {
      console.error('Error importing:', error);
      setMessage('❌ Error al importar el archivo. Verifique el formato.');
    }

    setLoading(false);
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      <h2>📊 Importar / Exportar Datos</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <h3 className="card-title">📥 Exportar Datos</h3>
          <p style={{ color: '#6B7280', marginBottom: '15px' }}>Descarga tus datos en formato Excel</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" onClick={exportAll}>
              📦 Exportar Todo
            </button>
            <button className="btn" onClick={exportTransactions} style={{ background: '#3B82F6', color: '#fff' }}>
              💰 Exportar Transacciones
            </button>
            <button className="btn" onClick={exportCategories} style={{ background: '#10B981', color: '#fff' }}>
              🏷️ Exportar Categorías
            </button>
            <button className="btn" onClick={exportQuincenas} style={{ background: '#F59E0B', color: '#fff' }}>
              💵 Exportar Ingresos
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">📤 Importar Datos</h3>
          <p style={{ color: '#6B7280', marginBottom: '15px' }}>Sube un archivo Excel con tus datos</p>
          
          <div style={{ marginBottom: '15px' }}>
            <button 
              className="btn" 
              onClick={downloadTemplate}
              style={{ background: '#8B5CF6', color: '#fff', width: '100%', marginBottom: '10px' }}
            >
              📥 Descargar Plantilla
            </button>
          </div>

          <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload}
              disabled={loading}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              style={{ cursor: 'pointer', color: '#6B7280' }}
            >
              {loading ? 'Importando...' : '📁 Haz clic para seleccionar archivo Excel'}
            </label>
          </div>

          {message && (
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              borderRadius: '8px', 
              background: message.includes('✅') ? '#D1FAE5' : '#FEE2E2',
              color: message.includes('✅') ? '#10B981' : '#EF4444'
            }}>
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 className="card-title">Resumen de Datos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '15px' }}>
          <div style={{ textAlign: 'center', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{transactions.length}</div>
            <div style={{ color: '#6B7280' }}>Transacciones</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{categories.length}</div>
            <div style={{ color: '#6B7280' }}>Categorías</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{quincenas.length}</div>
            <div style={{ color: '#6B7280' }}>Registros de Ingreso</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{budgets.length}</div>
            <div style={{ color: '#6B7280' }}>Presupuestos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExport;