'use client';

interface TopbarProps {
  nom  : string;
  role : string;
  titre: string;
}

export default function Topbar({ nom, role, titre }: TopbarProps) {
  return (
    <div style={styles.topbar}>

      {/* Gauche — titre */}
      <div>
        <p style={styles.welcome}>
          Bienvenue, <span style={styles.welcomeName}>{nom} </span>
        </p>
        <h1 style={styles.titre}>{titre}</h1>
      </div>

      {/* Droite — profil */}
      <div style={styles.right}>
        {/* Recherche */}
        <button style={styles.iconBtn}>
          <i className="fi fi-rr-search" style={styles.icon}></i>
        </button>

        {/* Notifications */}
        <button style={styles.iconBtn}>
          <i className="fi fi-rr-bell" style={styles.icon}></i>
        </button>

        {/* Profil */}
        <div style={styles.profil}>
          <div style={styles.avatar}>
            {nom?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p style={styles.profilNom}>{nom}</p>
            <p style={styles.profilRole}>{role}</p>
          </div>
        </div>
      </div>

    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  topbar: {
    display        : 'flex',
    alignItems     : 'center',
    justifyContent : 'space-between',
    padding        : '20px 32px',
    background     : '#fff',
    borderBottom   : '1px solid #e8ecf0',
    marginBottom   : '32px',
    borderRadius   : '0 0 20px 20px',
  },
  welcome: {
    color      : '#94a3b8',
    fontSize   : '13px',
    margin     : '0 0 4px 0',
  },
  welcomeName: {
    color      : '#f0b429',
    fontWeight : '600',
  },
  titre: {
    color      : '#1a1a2e',
    fontSize   : '28px',
    fontWeight : '700',
    margin     : 0,
  },
  right: {
    display    : 'flex',
    alignItems : 'center',
    gap        : '12px',
  },
  iconBtn: {
    width          : '40px',
    height         : '40px',
    borderRadius   : '50%',
    background     : '#f0f4f8',
    border         : 'none',
    display        : 'flex',
    alignItems     : 'center',
    justifyContent : 'center',
    cursor         : 'pointer',
  },
  icon: {
    color    : '#64748b',
    fontSize : '16px',
  },
  profil: {
    display      : 'flex',
    alignItems   : 'center',
    gap          : '10px',
    padding      : '8px 16px',
    borderRadius : '12px',
    background   : '#f0f4f8',
    cursor       : 'pointer',
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
    color      : '#1a1a2e',
    fontSize   : '13px',
    fontWeight : '600',
    margin     : 0,
  },
  profilRole: {
    color    : '#f0b429',
    fontSize : '11px',
    margin   : 0,
  },
};