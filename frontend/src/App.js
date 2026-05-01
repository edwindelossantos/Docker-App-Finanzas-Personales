import React, { Fragment } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Quincenas from './pages/Quincenas';
import Navbar from './components/Navbar';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Fragment><Navbar /><Dashboard /></Fragment>} />
      <Route path="/transactions" element={<Fragment><Navbar /><Transactions /></Fragment>} />
      <Route path="/categories" element={<Fragment><Navbar /><Categories /></Fragment>} />
      <Route path="/budgets" element={<Fragment><Navbar /><Budgets /></Fragment>} />
      <Route path="/goals" element={<Fragment><Navbar /><Goals /></Fragment>} />
      <Route path="/quincenas" element={<Fragment><Navbar /><Quincenas /></Fragment>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;