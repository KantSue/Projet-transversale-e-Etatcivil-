'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface NavItem {
  icon : string;
  label: string;
  href : string;
}

interface SidebarProps {
  items: NavItem[];
  role : string;
  nom  : string;
}

export default function Sidebar({ items, role, nom }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const deconnexion = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <aside style={styles.aside}>

      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <i className="fi fi-sr-government" style={{ color: '#fff', fontSize: '20px' }}></i>
        </div>
        <span style={styles.logoText}>e-EtatCivily</span>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navItem,
                background: isActive ? 'linear-gradient(135deg, #f0b429, #fcd34d)' : 'transparent',
                color     : isActive ? '#0a1830' : 'rgba(255,255,255,0.6)',
                fontWeight: isActive ? '600' : '400',
              }}
            >
              <i className={`fi ${item.icon}`} style={{ fontSize: '16px' }}></i>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profil + Déconnexion */}
      <div style={styles.bottom}>
       

        <button onClick={deconnexion} style={styles.btnDeco}>
          <i className="fi fi-rr-sign-out-alt" style={{ fontSize: '14px' }}></i>
          Déconnexion
        </button>
      </div>

    </aside>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  aside: {
    width         : '240px',
    minHeight     : '100vh',
    background    : 'linear-gradient(180deg, #1a3a6b 0%, #0a1830 100%)',
    display       : 'flex',
    flexDirection : 'column',
    padding       : '24px 16px',
    position      : 'fixed',
    top           : 0,
    left          : 0,
    bottom        : 0,
    zIndex        : 100,
  },
  logo: {
    display       : 'flex',
    alignItems    : 'center',
    gap           : '12px',
    padding       : '8px 12px',
    marginBottom  : '32px',
  },
  logoIcon: {
    width          : '40px',
    height         : '40px',
    borderRadius   : '12px',
    background     : 'linear-gradient(135deg, #f0b429, #fcd34d)',
    display        : 'flex',
    alignItems     : 'center',
    justifyContent : 'center',
  },
  logoText: {
    color      : '#fff',
    fontWeight : '700',
    fontSize   : '16px',
  },
  nav: {
    display       : 'flex',
    flexDirection : 'column',
    gap           : '4px',
    flex          : 1,
  },
  navItem: {
    display        : 'flex',
    alignItems     : 'center',
    gap            : '12px',
    padding        : '12px 16px',
    borderRadius   : '12px',
    textDecoration : 'none',
    fontSize       : '14px',
    transition     : 'all 0.2s',
  },
  bottom: {
    display       : 'flex',
    flexDirection : 'column',
    gap           : '12px',
    marginTop     : '24px',
  },
  profil: {
    display      : 'flex',
    alignItems   : 'center',
    gap          : '10px',
    padding      : '12px',
    borderRadius : '12px',
    background   : 'rgba(255,255,255,0.08)',
    border       : '1px solid rgba(255,255,255,0.1)',
  },
  avatar: {
    width          : '36px',
    height         : '36px',
    borderRadius   : '50%',
    background     : 'linear-gradient(135deg, #f0b429, #fcd34d)',
    display        : 'flex',
    alignItems     : 'center',
    justifyContent : 'center',
    fontSize       : '14px',
    fontWeight     : '700',
    color          : '#0a1830',
    flexShrink     : 0,
  },
  profilNom: {
    color      : '#fff',
    fontSize   : '13px',
    fontWeight : '600',
    margin     : 0,
  },
  profilRole: {
    color    : '#f0b429',
    fontSize : '11px',
    margin   : 0,
  },
  btnDeco: {
    display        : 'flex',
    alignItems     : 'center',
    justifyContent : 'center',
    gap            : '8px',
    padding        : '10px',
    borderRadius   : '12px',
    background     : 'rgba(239,68,68,0.15)',
    border         : '1px solid rgba(239,68,68,0.25)',
    color          : '#f87171',
    cursor         : 'pointer',
    fontSize       : '13px',
    fontWeight     : '500',
    width          : '100%',
  },
};