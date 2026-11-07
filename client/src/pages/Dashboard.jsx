import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import BookingForm from '../components/BookingForm.jsx';
import BookingList from '../components/BookingList.jsx';
import CalendarView from '../components/CalendarView.jsx';
import EquipmentForm from '../components/EquipmentForm.jsx';

const TABS = [['catalogue', 'Equipment'], ['calendar', 'Calendar'], ['mine', 'My bookings'], ['all', 'All bookings']];
const CAT = { camera: 'Camera', laptop: 'Laptop', tool: 'Tool', 'audio-video': 'Audio / video', meeting: 'Meeting kit', other: 'Other' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('catalogue');
  const [booking, setBooking] = useState(null); // equipment being booked
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const isAdmin = user.role === 'admin';

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setError('');
    try {
      const [eq, bk] = await Promise.all([api.listEquipment(), api.listBookings()]);
      setEquipment(eq.equipment);
      setBookings(bk.bookings);
    } catch (e) {
      if (e.status === 401) return logout();
      setError(e.message);
    } finally { setLoading(false); }
  }, [logout]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, okMsg) => {
    try { await fn(); flash(okMsg); await load(); return true; } catch (e) { setError(e.message); return false; }
  };

  const actions = {
    onCancel: (b) => window.confirm('Cancel this booking?') && run(() => api.cancelBooking(b._id), 'Booking cancelled'),
    onReturn: (b, d) => run(() => api.returnBooking(b._id, d), 'Return recorded'),
  };

  const now = Date.now();
  const nextFor = (id) => bookings.filter((b) => b.equipment?._id === id && b.status === 'booked' && new Date(b.end) > now).sort((a, b) => new Date(a.start) - new Date(b.start))[0];
  const mine = bookings.filter((b) => b.user?._id === user.id);
  const sortRecent = (arr) => [...arr].sort((a, b) => (a.status === 'booked') === (b.status === 'booked') ? new Date(b.start) - new Date(a.start) : a.status === 'booked' ? -1 : 1);

  return (
    <div className="shell">
      <header className="topbar">
        <div><h1>EquipmentBooking</h1><p className="muted small">{user.name}{isAdmin ? ' (admin)' : ''}</p></div>
        <button className="btn" onClick={logout}>Log out</button>
      </header>

      <div className="toolbar">
        <nav className="tabs" aria-label="Views">
          {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>)}
        </nav>
        {isAdmin && tab === 'catalogue' && <button className="btn primary" onClick={() => setAdding(true)}>Add equipment</button>}
      </div>

      {error && <div className="alert" role="alert">{error} <button className="link" onClick={load}>Reload</button></div>}
      {adding && <EquipmentForm onCancel={() => setAdding(false)} onSave={async (d) => { await api.createEquipment(d); setAdding(false); flash('Equipment added'); load(); }} />}
      {booking && <BookingForm equipment={booking} bookings={bookings} onCancel={() => setBooking(null)}
        onSave={async (d) => { await api.createBooking(d); setBooking(null); flash('Booking confirmed'); load(); }} />}

      {loading ? <p className="center-note" role="status">Loading…</p> : tab === 'catalogue' ? (
        equipment.length === 0 ? (
          <p className="muted empty-note">{isAdmin ? 'No equipment yet. Add your first item.' : 'No equipment has been added yet. Ask your admin.'}</p>
        ) : (
          <ul className="equip-grid">
            {equipment.map((e) => {
              const next = nextFor(e._id);
              const inUse = next && new Date(next.start) <= now;
              return (
                <li key={e._id} className="card equip">
                  <div className="equip-top"><h3>{e.name}</h3><span className={`badge cond-${e.condition}`}>{e.condition}</span></div>
                  <p className="muted small">{CAT[e.category]}{e.description ? ` · ${e.description}` : ''}</p>
                  <p className="small">{inUse ? `In use until ${new Date(next.end).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : next ? `Next booked ${new Date(next.start).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : 'Free to book'}</p>
                  <div className="actions">
                    {isAdmin && <button className="link danger" onClick={() => window.confirm(`Remove ${e.name}?`) && run(() => api.removeEquipment(e._id), 'Equipment removed')}>Remove</button>}
                    <button className="btn primary small" disabled={e.condition === 'damaged'} onClick={() => setBooking(e)}>{e.condition === 'damaged' ? 'Damaged' : 'Book'}</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : tab === 'calendar' ? <CalendarView equipment={equipment} bookings={bookings} />
        : tab === 'mine' ? <BookingList bookings={sortRecent(mine)} user={user} {...actions} empty="You have no bookings yet. Pick an item from Equipment." />
        : <BookingList bookings={sortRecent(bookings)} user={user} {...actions} empty="No bookings yet." />}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
