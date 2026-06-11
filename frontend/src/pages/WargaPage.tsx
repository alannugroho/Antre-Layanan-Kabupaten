import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createTicket, getServices, type ServiceCategory } from '../lib/api';

export function WargaPage() {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [nik, setNik] = useState('');
  const [serviceCategoryId, setServiceCategoryId] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    getServices()
      .then((items) => {
        const active = items.filter((item) => item.isActive);
        setServices(active);
        if (active.length > 0) {
          setServiceCategoryId(active[0].id);
        }
      })
      .catch((error) => setStatus((error as Error).message));
  }, []);

  async function handleTakeTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Mengambil nomor antrean...');

    try {
      const ticket = await createTicket(nik, serviceCategoryId);
      setTicketNumber(ticket.ticketNumber);
      setStatus('Berhasil mengambil antrean');
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  return (
    <section className="panel">
      <h2>Kiosk Warga</h2>
      <p>Isi NIK dan pilih layanan untuk mengambil nomor antrean.</p>
      <form onSubmit={handleTakeTicket} className="row-gap">
        <label>
          NIK
          <input value={nik} onChange={(e) => setNik(e.target.value)} minLength={8} required />
        </label>
        <label>
          Layanan
          <select value={serviceCategoryId} onChange={(e) => setServiceCategoryId(e.target.value)} required>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.code} - {service.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Ambil Nomor</button>
      </form>
      {ticketNumber && <p className="status">Nomor antrean Anda: {ticketNumber}</p>}
      {status && <p className="status">{status}</p>}
    </section>
  );
}
