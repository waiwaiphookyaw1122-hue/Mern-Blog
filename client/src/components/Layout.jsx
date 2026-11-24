import { useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Feather, LogOut, PenSquare, User, X } from 'lucide-react';
import { useNotice, useSession } from '../stores/session';
import { Modal } from './ui';
import Auth from '../pages/Auth';

export default function Layout() {
  const { user, expired, logout } = useSession();
  const { notice, dismiss } = useNotice();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismiss, 4500);
    return () => clearTimeout(timer);
  }, [notice, dismiss]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <header className="site-header">
        <div className="shell header-inner">
          <Link to="/" className="brand-logo">
            <span className="brand-badge">
              <Feather size={18} />
            </span>
            <span>Inkwell</span>
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            <NavLink to="/" end>
              Stories
            </NavLink>
            <NavLink to="/authors">Authors</NavLink>
            {user ? (
              <>
                <NavLink to="/my-posts">My Stories</NavLink>
                <NavLink to="/write" className="nav-cta">
                  <PenSquare size={15} /> Write
                </NavLink>
                <NavLink to="/profile">
                  <User size={15} /> {user.name}
                </NavLink>
                <Link to="/logout" className="nav-logout" title="Sign out">
                  <LogOut size={16} />
                </Link>
              </>
            ) : (
              <>
                <NavLink to="/login">Sign in</NavLink>
                <NavLink to="/register" className="button button-primary">
                  Get Started
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      {notice && (
        <div className="toast-banner" role="status" aria-live="polite">
          <span>{notice.message}</span>
          <button type="button" onClick={dismiss} aria-label="Close notice">
            <X size={16} />
          </button>
        </div>
      )}

      <main className="shell flex-1 py-10">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <div className="flex items-center gap-2 font-semibold text-emerald-900">
            <Feather size={16} /> Inkwell Publishing
          </div>
          <p className="text-sm text-stone-500">
            Crafted with MERN Stack, Tailwind CSS & Zustand.
          </p>
        </div>
      </footer>

      <Modal
        open={Boolean(user && expired)}
        title="Session expired"
        onClose={logout}
      >
        <p className="mb-4">
          Your login session has expired. Sign in again to continue without
          losing your current work.
        </p>
        <Auth compact />
      </Modal>
    </div>
  );
}