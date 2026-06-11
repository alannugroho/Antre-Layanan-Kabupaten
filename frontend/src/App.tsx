import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { StaffPage } from './pages/StaffPage';
import { WargaPage } from './pages/WargaPage';
import { useAuth } from './lib/auth';

function roleHome(role: 'admin' | 'staff') {
  return role === 'admin' ? '/admin/dashboard' : '/staf/dashboard';
}

function ProtectedRoute({ role, children }: { role: 'admin' | 'staff'; children: React.ReactElement }) {
  const { session, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== role) {
    return <Navigate to={roleHome(session.role)} replace />;
  }

  return children;
}

function Layout() {
  const { session, clearSession, isReady } = useAuth();

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
        <div className="topbar-actions">
          {session && isReady ? <span className="session-chip">{session.role}</span> : null}
          {session && isReady ? (
            <button type="button" className="secondary-button" onClick={clearSession}>
              Logout
            </button>
          ) : null}
        </div>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to={session ? roleHome(session.role) : '/login'} replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/warga" element={<WargaPage />} />
          <Route
            path="/staf/dashboard"
            element={
              <ProtectedRoute role="staff">
                <StaffPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default Layout;
