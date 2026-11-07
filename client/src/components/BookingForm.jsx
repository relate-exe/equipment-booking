import { useState } from 'react';
import { fmtDateTime, localInputToISO, toLocalInput } from '../dateUtils.js';

function defaults() {
  const s = new Date();
  s.setMinutes(0, 0, 0);
  s.setHours(s.getHours() + 1);
  const e = new Date(s.getTime() + 2 * 3600000);
  return { start: toLocalInput(s), end: toLocalInput(e), purpose: '' };
}

export default function BookingForm({ equipment, bookings, onSave, onCancel }) {
  const [form, setForm] = useState(defaults());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Fast feedback only. The server makes the final overlap decision.
  const clash = (() => {
    if (!form.start || !form.end) return null;
    const s = new Date(form.start), e = new Date(form.end);
    return bookings.find((b) => b.equipment._id === equipment._id && b.status === 'booked' && new Date(b.start) < e && new Date(b.end) > s);
  })();

  async function submit(ev) {
    ev.preventDefault();
    setError('');
    if (!form.start || !form.end) return setError('Choose a start and end time.');
    if (new Date(form.end) <= new Date(form.start)) return setError('End time must be after the start time.');
    setBusy(true);
    try {
      await onSave({ equipment: equipment._id, start: localInputToISO(form.start), end: localInputToISO(form.end), purpose: form.purpose.trim() });
    } catch (err) {
      const c = err.fields?.[0]?.conflict;
      setError(c ? `Already booked ${fmtDateTime(c.start)} to ${fmtDateTime(c.end)}${c.by ? ` by ${c.by}` : ''}. Pick another time.` : err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>Book {equipment.name}</h2>
      {error && <div className="alert" role="alert">{error}</div>}
      {clash && !error && (
        <div className="alert" role="status">Overlaps a booking from {fmtDateTime(clash.start)} to {fmtDateTime(clash.end)} by {clash.user?.name}.</div>
      )}
      <div className="row">
        <label>From<input type="datetime-local" value={form.start} onChange={set('start')} /></label>
        <label>Until<input type="datetime-local" value={form.end} onChange={set('end')} /></label>
      </div>
      <label>What is it for? (optional)<input value={form.purpose} onChange={set('purpose')} maxLength={200} placeholder="e.g. Client shoot" /></label>
      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" disabled={busy || !!clash}>{busy ? 'Booking…' : 'Confirm booking'}</button>
      </div>
    </form>
  );
}
