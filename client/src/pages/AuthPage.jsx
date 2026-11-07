import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e = {};
    if (isRegister && form.name.trim().length < 2) e.name = 'Enter your name (at least 2 characters).';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (form.password.length < 8) e.password = 'Use at least 8 characters.';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    setFormError('');
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
      navigate('/');
    } catch (err) {
      const fieldErrs = {};
      (err.fields || []).forEach((f) => (fieldErrs[f.field] = f.message));
      setErrors(fieldErrs);
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-intro">
        <h1>EquipmentBooking</h1>
        <p>Book shared team equipment without double-booking.</p>
        <p className="muted">Reserve cameras, laptops, tools and meeting gear. Overlapping bookings are rejected, and the condition is recorded when an item comes back.</p>
      </section>

      <form className="card auth-form" onSubmit={submit} noValidate>
        <h2>{isRegister ? 'Create your account' : 'Log in'}</h2>
        {formError && <div className="alert" role="alert">{formError}</div>}

        {isRegister && (
          <label>
            Name
            <input value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} aria-invalid={!!errors.password} />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>

        <button className="btn primary" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button>
        <p className="muted small">
          {isRegister ? 'Already have an account? ' : 'New here? '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
        </p>
      </form>
    </main>
  );
}
