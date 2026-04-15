import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `block rounded-xl px-4 py-2.5 text-[15px] font-medium transition ${
    isActive
      ? 'bg-white/15 text-white shadow-inner ring-1 ring-white/20'
      : 'text-slate-300 hover:bg-white/10 hover:text-white'
  }`;

export default function Layout() {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="relative flex w-60 shrink-0 flex-col bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-950/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
        <div className="relative border-b border-white/10 px-5 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
            Store
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">Admin Panel</h1>
          {user?.email && (
            <p className="mt-2 truncate text-xs text-slate-400" title={user.email}>
              {user.email}
            </p>
          )}
        </div>
        <nav className="relative flex flex-1 flex-col gap-1 p-4">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            Products
          </NavLink>
          <NavLink to="/categories" className={linkClass}>
            Categories
          </NavLink>
          <NavLink to="/orders" className={linkClass}>
            Orders
          </NavLink>
        </nav>
        <div className="relative border-t border-white/10 p-4">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="relative flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-violet-50/40 to-indigo-50/30">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(at 0% 0%, rgba(99,102,241,0.12) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139,92,246,0.1) 0px, transparent 45%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
