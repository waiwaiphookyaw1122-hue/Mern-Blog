import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { errorMessage, safeReturn } from '../lib/utils';
import { useNotice, useSession } from '../stores/session';
import { useForm } from '../hooks/useForm';
import { Button, ErrorBox, Field } from '../components/ui';

export default function Auth({ register = false, compact = false, onSuccess }) {
  const form = useForm({ name: '', email: '', password: '', password2: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const login = useSession((state) => state.login);
  const show = useNotice((state) => state.show);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = safeReturn(location.state?.from);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;

    const { name, email, password, password2 } = form.values;
    const validationErrors = {
      ...(register && !name.trim() ? { name: 'Please enter your name.' } : {}),
      ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? { email: 'Please enter a valid email.' }
        : {}),
      ...(!password
        ? { password: 'Password is required.' }
        : register && password.trim().length < 6
          ? { password: 'Password must be at least 6 characters.' }
          : {}),
      ...(register && password !== password2
        ? { password2: 'Passwords do not match.' }
        : {}),
    };

    if (!form.validate(validationErrors, e.currentTarget)) return;

    setBusy(true);
    setError('');

    try {
      const endpoint = register ? '/users/register' : '/users/login';
      const payload = {
        ...(register ? { name: name.trim(), password2 } : {}),
        email: email.trim().toLowerCase(),
        password,
      };

      const { data } = await api.post(endpoint, payload);

      if (register) {
        show('Registration complete! Please sign in.');
        navigate('/login', { replace: true, state: { from: redirectTarget } });
      } else {
        login(data);
        show('Welcome back to Inkwell!');
        if (compact) onSuccess?.();
        else navigate(redirectTarget, { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? 'auth-compact' : 'auth-layout'}>
      {!compact && (
        <aside className="auth-aside">
          <span className="eyebrow text-emerald-200">Inkwell Community</span>
          <h1>
            {register
              ? 'Start sharing your ideas today.'
              : 'Welcome back to your writing desk.'}
          </h1>
          <p className="text-emerald-100 mt-4">
            Publish articles, connect with readers, and build your personal
            archive of stories.
          </p>
        </aside>
      )}

      <section className="auth-form">
        {!compact && (
          <div className="mb-6">
            <p className="eyebrow">
              {register ? 'Create Account' : 'Member Sign In'}
            </p>
            <h2>{register ? 'Join Inkwell' : 'Sign in to continue'}</h2>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit}>
          <fieldset disabled={busy}>
            {register && (
              <Field
                label="Full Name"
                autoComplete="name"
                {...form.bind('name')}
              />
            )}
            <Field
              label="Email Address"
              type="email"
              autoComplete="email"
              {...form.bind('email')}
            />
            <Field
              label="Password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              help={register ? 'Minimum 6 characters required.' : undefined}
              {...form.bind('password')}
            />
            {register && (
              <Field
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                {...form.bind('password2')}
              />
            )}
          </fieldset>

          <ErrorBox message={error} />

          <Button type="submit" busy={busy} className="w-full mt-2">
            {register ? 'Create Account' : 'Sign In'} <ArrowRight size={16} />
          </Button>
        </form>

        {!compact && (
          <p className="auth-switch">
            {register ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link
              to={register ? '/login' : '/register'}
              state={{ from: redirectTarget }}
              className="text-link"
            >
              {register ? 'Sign in here' : 'Register now'}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}