import { useEffect, useState } from 'react';
import { callTicket, getCounters, getNextTicket, type Counter, type Ticket } from '../lib/api';

export function StaffPage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [counterId, setCounterId] = useState('');
  const [nextTicket, setNextTicket] = useState<Ticket | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    getCounters()
      .then((items) => {
        setCounters(items);
        if (items.length > 0) {
          setCounterId(items[0].id);
        }
      })
      .catch((error) => setStatus((error as Error).message));
  }, []);

  async function loadNext() {
    if (!counterId) {
      return;
    }
    setStatus('Memuat antrean berikutnya...');
    try {
      const ticket = await getNextTicket(counterId);
      setNextTicket(ticket);
      setStatus(ticket ? 'Antrean ditemukan' : 'Tidak ada antrean menunggu');
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  async function callCurrent() {
    if (!counterId || !nextTicket) {
      return;
    }
    try {
      const called = await callTicket(nextTicket.id, counterId);
      setNextTicket(called);
      setStatus(`Memanggil ${called.ticketNumber}`);
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  return (
    <section className="panel">
      <h2>Dashboard Staf Loket</h2>
      <div className="row-gap">
        <label>
          Loket
          <select value={counterId} onChange={(e) => setCounterId(e.target.value)}>
            {counters.map((counter) => (
              <option key={counter.id} value={counter.id}>
                {counter.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <button type="button" onClick={loadNext}>Ambil Berikutnya</button>
        <button type="button" onClick={callCurrent} disabled={!nextTicket}>Panggil</button>
      </div>
      <div className="ticket-box">
        <p>Antrean saat ini</p>
        <strong>{nextTicket?.ticketNumber ?? '----'}</strong>
        <small>Status: {nextTicket?.status ?? 'idle'}</small>
      </div>
      {status && <p className="status">{status}</p>}
    </section>
  );
}
