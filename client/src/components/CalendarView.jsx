import { useState } from 'react';
import { daysCovered, fmtDateTime, monthGrid, todayKey } from '../dateUtils.js';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ equipment, bookings }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayKey());
  const [itemId, setItemId] = useState('all');
  const today = todayKey();

  const active = bookings.filter((b) => b.status === 'booked' && (itemId === 'all' || b.equipment?._id === itemId));
  const byDay = {};
  active.forEach((b) => daysCovered(b.start, b.end).forEach((k) => (byDay[k] = byDay[k] || []).push(b)));

  const cells = monthGrid(cursor.y, cursor.m);
  const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const shift = (n) => setCursor(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const dayItems = (byDay[selected] || []).sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <div>
      <label className="inline-select">Show
        <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="all">All equipment</option>
          {equipment.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
      </label>
      <div className="calendar-wrap">
        <div className="card calendar">
          <div className="cal-head">
            <button className="btn small" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
            <h2 aria-live="polite">{title}</h2>
            <button className="btn small" onClick={() => shift(1)} aria-label="Next month">›</button>
          </div>
          <div className="cal-grid">
            {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
            {cells.map((key, i) => key ? (
              <button key={key} className={`cal-cell ${key === today ? 'today' : ''} ${key === selected ? 'selected' : ''}`} onClick={() => setSelected(key)}
                aria-label={`${key}, ${(byDay[key] || []).length} bookings`}>
                <span>{Number(key.slice(8))}</span>
                {byDay[key] && <i className="dot" />}
              </button>
            ) : <div key={i} className="cal-cell empty" />)}
          </div>
        </div>
        <section aria-live="polite">
          <h3>{selected === today ? 'Today' : selected}</h3>
          {dayItems.length === 0 ? <p className="muted">Nothing booked on this day.</p> : (
            <ul className="reminder-list">
              {dayItems.map((b) => (
                <li key={b._id} className="reminder booking"><span aria-hidden="true" />
                  <div className="reminder-body">
                    <p className="reminder-title">{b.equipment?.name}</p>
                    <p className="reminder-meta">{fmtDateTime(b.start)} to {fmtDateTime(b.end)}</p>
                    <p className="reminder-notes">{b.user?.name}{b.purpose ? `: ${b.purpose}` : ''}</p>
                  </div><span />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
