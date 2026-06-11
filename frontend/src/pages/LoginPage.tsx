import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { login } from '../lib/api';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { session, isReady, setSession } = useAuth();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Memproses login...');

    try {
      const response = await login(nip, password);
      setSession({ accessToken: response.accessToken, role: response.role });
      navigate(response.role === 'admin' ? '/admin/dashboard' : '/staf/dashboard', { replace: true });
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  if (isReady && session) {
    return <Navigate to={session.role === 'admin' ? '/admin/dashboard' : '/staf/dashboard'} replace />;
  }

  return (
    <section className="panel">
      <h2>Portal Login</h2>
      <p>Masukkan NIP dan password. Sistem akan mengenali peran akun secara otomatis.</p>
      <div className="row-gap">
        <button type="button" onClick={() => navigate('/warga')}>Masuk sebagai Warga</button>
      </div>
      <form onSubmit={handleSubmit} className="row-gap">
        <label>
          NIP
          <input value={nip} onChange={(e) => setNip(e.target.value)} placeholder="Masukkan NIP" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" required />
        </label>
        <button type="submit">Masuk</button>
      </form>
      {status && <p className="status">{status}</p>}
    </section>
  );
}
