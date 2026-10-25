import type { ReactNode } from 'react';

interface AuditorSidebarProps {
  active: string;
  lowStockCount: number;
  onNavigate: (view: string) => void;
}
const menu = [
  { id: 'overview', icon: '◫', label: 'Overview' },
  { id: 'inventory', icon: '▤', label: 'Inventory' },
  { id: 'orders', icon: '↗', label: 'Orders' },
  { id: 'reports', icon: '▥', label: 'Reports' },
];

export function AuditorSidebar({
  active,
  lowStockCount,
  onNavigate,
}: AuditorSidebarProps): ReactNode {
  return (
    <aside className="auditor-sidebar d-flex flex-column">
      <a className="brand sidebar-brand" href="#overview">
        <span className="brand-mark">c</span>
        <span>
          common<span className="brand-light">goods</span>
        </span>
      </a>
      <p className="sidebar-label">WORKSPACE</p>
      <nav className="sidebar-nav nav flex-column" aria-label="Main navigation">
        {menu.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`nav-link ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.id === 'inventory' && lowStockCount > 0 && (
              <span className="nav-count">{lowStockCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="audit-health">
        <span className="health-mark">✳</span>
        <div>
          <strong>Inventory health</strong>
          <span>Needs a little attention</span>
        </div>
        <span className="health-dot" />
      </div>
      <div className="profile-row">
        <span className="profile-avatar">AM</span>
        <div>
          <strong>Alex Morgan</strong>
          <span>Store manager</span>
        </div>
        <button type="button" aria-label="Account options">
          ···
        </button>
      </div>
    </aside>
  );
}
