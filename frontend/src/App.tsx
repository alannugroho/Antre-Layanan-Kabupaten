import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { StaffPage } from './pages/StaffPage';
import { WargaPage } from './pages/WargaPage';

function Layout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Sistem Manajemen Antrean</h1>
        <nav>
          <Link to="/login">Login</Link>
          <Link to="/warga">Warga</Link>
          <Link to="/staf/dashboard">Staf</Link>
          <Link to="/admin/dashboard">Admin</Link>
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/warga" element={<WargaPage />} />
          <Route path="/staf/dashboard" element={<StaffPage />} />
          <Route path="/admin/dashboard" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default Layout;
