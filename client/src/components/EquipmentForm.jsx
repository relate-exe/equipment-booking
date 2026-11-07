import { useState } from 'react';

const CATS = [['camera', 'Camera'], ['laptop', 'Laptop'], ['tool', 'Tool'], ['audio-video', 'Audio / video'], ['meeting', 'Meeting room kit'], ['other', 'Other']];

export default function EquipmentForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', category: 'camera', description: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError('Give the item a name (at least 2 characters).');
    setBusy(true);
    try { await onSave({ ...form, name: form.name.trim() }); } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>Add equipment</h2>
      {error && <div className="alert" role="alert">{error}</div>}
      <label>Name<input value={form.name} onChange={set('name')} maxLength={80} placeholder="e.g. Sony A7 camera" autoFocus /></label>
      <label>Type<select value={form.category} onChange={set('category')}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label>Description (optional)<textarea rows={2} value={form.description} onChange={set('description')} maxLength={300} /></label>
      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Add to catalogue'}</button>
      </div>
    </form>
  );
}
