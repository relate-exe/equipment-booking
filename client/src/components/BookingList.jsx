import { useState } from 'react';
import { fmtDateTime } from '../dateUtils.js';

const CONDITIONS = [['excellent', 'Excellent'], ['good', 'Good'], ['fair', 'Fair (minor wear)'], ['damaged', 'Damaged']];

function ReturnForm({ onSubmit, onCancel }) {
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form className="return-form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); await onSubmit({ condition, notes: notes.trim() }); setBusy(false); }}>
      <label>Condition on return
        <select value={condition} onChange={(e) => setCondition(e.target.value)}>{CONDITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </label>
      <label>Notes (optional)<input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} placeholder="Scratches, missing cable…" /></label>
      <div className="actions">
        <button type="button" className="btn small" onClick={onCancel}>Back</button>
        <button className="btn primary small" disabled={busy}>Record return</button>
      </div>
    </form>
  );
}

export default function BookingList({ bookings, user, onCancel, onReturn, empty }) {
  const [returning, setReturning] = useState(null);
  if (!bookings.length) return <p className="muted empty-note">{empty}</p>;
  const now = Date.now();

  return (
    <ul className="reminder-list">
      {bookings.map((b) => {
        const mine = b.user?._id === user.id;
        const manage = mine || user.role === 'admin';
        const late = b.status === 'booked' && new Date(b.end).getTime() < now;
        return (
          <li key={b._id} className={`reminder booking ${b.status} ${late ? 'overdue' : ''}`}>
            <span aria-hidden="true" />
            <div className="reminder-body">
              <p className="reminder-title">{b.equipment?.name}</p>
              <p className="reminder-meta">{fmtDateTime(b.start)} to {fmtDateTime(b.end)} · {mine ? 'You' : b.user?.name}</p>
              {b.purpose && <p className="reminder-notes">{b.purpose}</p>}
              {b.status === 'returned' && <p className="reminder-notes">Returned in {b.returnCondition} condition{b.returnNotes ? `: ${b.returnNotes}` : ''}</p>}
              {returning === b._id && (
                <ReturnForm onCancel={() => setReturning(null)} onSubmit={async (d) => { if (await onReturn(b, d)) setReturning(null); }} />
              )}
            </div>
            <div className="reminder-side">
              <span className="when">{late ? 'Not returned yet' : b.status === 'booked' ? 'Booked' : b.status === 'returned' ? 'Returned' : 'Cancelled'}</span>
              {b.status === 'booked' && manage && returning !== b._id && (
                <span className="item-actions">
                  <button className="link" onClick={() => setReturning(b._id)}>Return</button>
                  <button className="link danger" onClick={() => onCancel(b)}>Cancel</button>
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
