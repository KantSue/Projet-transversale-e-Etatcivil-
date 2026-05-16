'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/app/component/header';
import Topbar  from '@/app/component/topbar';

const agentItems = [
  { icon: 'fi-rr-list-check', label: "File d'attente", href: '/agent/file-attente' },
  { icon: 'fi-rr-archive',    label: 'Archives',       href: '/archives'           },
  { icon: 'fi-rr-time-past',  label: 'Historique',     href: '/agent/historique'   },
  { icon: 'fi-rr-user',       label: 'Mon profil',     href: '/profil'             },
];

export default function AgentLayoutClient({ children }: { children: React.ReactNode }) {
  const [nom, setNom]   = useState('');
  const [role, setRole] = useState('Agent');

  useEffect(() => {
    // Récupérer le token et appeler l'API profil
    const token = localStorage.getItem('token');
    if (token) {
     fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/profil/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setNom(`${data.prenom_user} ${data.nom_user}`);
        setRole(data.role || 'Agent');
      })
      .catch(() => {});
    }
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar items={agentItems} role={role} nom={nom} />
      <main style={{
        marginLeft : '240px',
        flex       : 1,
        background : '#f0f4f8',
        minHeight  : '100vh',
      }}>
        <Topbar nom={nom} role={role} titre="File d'attente" />
        <div style={{ padding: '0 32px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}