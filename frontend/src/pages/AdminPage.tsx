import { useEffect, useState } from 'react';
import { getSummary } from '../lib/api';

export function AdminPage() {
  const [summary, setSummary] = useState({
    totalTickets: 0,
    waiting: 0,
    called: 0,
    completed: 0,
    activeCounters: 0
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    getSummary()
      .then((data) => setSummary(data))
      .catch((error) => setStatus((error as Error).message));
  }, []);

  return (
    <section className="panel">
      <h2>Admin Dashboard</h2>
      <p>Ringkasan operasional antrean dari backend.</p>
      <div className="grid">
        <article><span>Total Tiket</span><strong>{summary.totalTickets}</strong></article>
        <article><span>Menunggu</span><strong>{summary.waiting}</strong></article>
        <article><span>Dipanggil</span><strong>{summary.called}</strong></article>
        <article><span>Selesai</span><strong>{summary.completed}</strong></article>
        <article><span>Loket Aktif</span><strong>{summary.activeCounters}</strong></article>
      </div>
      {status && <p className="status">{status}</p>}
    </section>
  );
}
