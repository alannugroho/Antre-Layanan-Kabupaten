import { useEffect, useState } from 'react';
import { getHistory, getSummary, type HistoryTicket } from '../lib/api';

export function AdminPage() {
  const [summary, setSummary] = useState({
    totalTickets: 0,
    waiting: 0,
    called: 0,
    completed: 0,
    activeCounters: 0
  });
  const [history, setHistory] = useState<HistoryTicket[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([getSummary(), getHistory(5)])
      .then(([summaryData, historyData]) => {
        setSummary(summaryData);
        setHistory(historyData);
      })
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
      <div className="history-list">
        <h3>Riwayat Terbaru</h3>
        {history.length === 0 ? <p className="status">Belum ada tiket.</p> : null}
        {history.map((ticket) => (
          <article key={ticket.id} className="history-item">
            <strong>{ticket.ticketNumber}</strong>
            <span>Status: {ticket.status}</span>
            <small>{ticket.citizenNik}</small>
          </article>
        ))}
      </div>
      {status && <p className="status">{status}</p>}
    </section>
  );
}
