import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Memproses login...');

    try {
      await login(role, nip, password);
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/staf/dashboard');
      }
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  return (
    <section className="panel">
      <h2>Portal Login</h2>
      <p>Gunakan akun staf atau admin, atau masuk sebagai warga.</p>
      <div className="row-gap">
        <button type="button" onClick={() => navigate('/warga')}>Masuk sebagai Warga</button>
      </div>
      <form onSubmit={handleSubmit} className="row-gap">
        <label>
          Peran
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}>
            <option value="staff">Staf Loket</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
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
