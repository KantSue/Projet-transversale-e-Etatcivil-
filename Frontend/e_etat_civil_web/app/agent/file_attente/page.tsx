'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/api';

export default function FileAttente() {
  const router = useRouter();
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

useEffect(() => {
  api.get('/dashboard/demandes/').then(res => {
    console.log('DEMANDES:', res.data);
    setDemandes(res.data);
  }).catch((err) => {
    console.log('ERREUR:', err);
  }).finally(() => setLoading(false));
}, []);
const handleClick = (demande: any, index: number) => {
  if (index === 0) {
    router.push(`/agent/detail?id=${demande.id_demande}`);
  } else {
    alert(`⛔ Traitez d'abord la demande #1 (${demandes[0].num_demande})`);
  }
};

  if (loading) return (
    <div style={styles.center}>
      <p style={styles.loading}>⏳ Chargement...</p>
    </div>
  );

  return (
    <div>

      {/* Stats rapides */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total en attente</p>
          <p style={styles.statValue}>{demandes.length}</p>
        </div>
        <div style={styles.statCardRed}>
          <p style={styles.statLabel}>Prioritaire</p>
          <p style={styles.statValueRed}>{demandes[0]?.num_demande || 'Aucune'}</p>
        </div>
        <div style={styles.statCardGold}>
          <p style={styles.statLabel}>Type prioritaire</p>
          <p style={styles.statValueGold}>{demandes[0]?.type_acte || 'N/A'}</p>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h2 style={styles.tableTitle}>Demandes en attente</h2>
          <p style={styles.tableSubtitle}>Classées par ancienneté — priorité au plus ancien</p>
        </div>

        {demandes.length === 0 ? (
          <div style={styles.vide}>
            <i className="fi fi-rr-check-circle" style={styles.videIcon}></i>
            <p style={styles.videText}>Aucune demande en attente ✅</p>
          </div>
        ) : (
          <div style={styles.liste}>

            {/* En-tête tableau */}
            <div style={styles.theader}>
              <span style={styles.colPriorite}>#</span>
              <span style={styles.colFlex}>Numéro</span>
              <span style={styles.colFlex}>Type</span>
              <span style={styles.colFlex}>Citoyen</span>
              <span style={styles.colFlex}>Date dépôt</span>
              <span style={styles.colAction}>Action</span>
            </div>

            {/* Lignes */}
            {demandes.map((d: any, index: number) => (
              <div
                key={d.id_demande}
                style={{
                  ...styles.trow,
                  opacity    : index === 0 ? 1 : 0.5,
                  background : index === 0 ? '#fff' : '#f8fafc',
                  borderLeft : index === 0
                    ? '4px solid #e74c3c'
                    : '4px solid transparent',
                }}
              >
                {/* Priorité */}
                <div style={styles.colPriorite}>
                  <div style={{
                    ...styles.prioriteBadge,
                    background : index === 0
                      ? 'linear-gradient(135deg, #e74c3c, #ff6b6b)'
                      : '#e2e8f0',
                    color      : index === 0 ? '#fff' : '#94a3b8',
                  }}>
                    {index + 1}
                  </div>
                  {index === 0 && <span>🔥</span>}
                </div>

                {/* Numéro */}
                <span style={{ ...styles.colFlex, ...styles.numDemande }}>
                  {d.num_demande}
                </span>

                {/* Type */}
                <span style={styles.colFlex}>
                  <span style={styles.typeBadge}>{d.type_acte}</span>
                </span>

                {/* Citoyen */}
                <span style={{ ...styles.colFlex, ...styles.citoyenText }}>
                  <i className="fi fi-rr-user" style={styles.rowIcon}></i>
                  {d.citoyen}
                </span>

                {/* Date */}
                <span style={{ ...styles.colFlex, ...styles.dateText }}>
                  <i className="fi fi-rr-calendar" style={styles.rowIcon}></i>
                  {d.date_depot?.split('T')[0]}
                </span>

                {/* Action */}
                <div style={styles.colAction}>
                  <button
                    onClick={() => handleClick(d, index)}
                    style={{
                      ...styles.btnAction,
                      background : index === 0
                        ? 'linear-gradient(135deg, #1a3a6b, #2d5fa0)'
                        : '#e2e8f0',
                      color      : index === 0 ? '#fff' : '#94a3b8',
                      cursor     : index === 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {index === 0 ? 'Traiter →' : '🔒'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  // Chargement
  center  : { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' },
  loading : { color: '#f0b429', fontSize: '16px' },

  // Stats
  statsRow    : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' },
  statCard    : { background: '#fff', borderRadius: '16px', padding: '20px 24px', borderLeft: '4px solid #1a3a6b', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statCardRed : { background: '#fff', borderRadius: '16px', padding: '20px 24px', borderLeft: '4px solid #e74c3c', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statCardGold: { background: '#fff', borderRadius: '16px', padding: '20px 24px', borderLeft: '4px solid #f0b429', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statLabel   : { color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0', fontWeight: '500' },
  statValue   : { color: '#1a1a2e', fontSize: '24px', fontWeight: '700', margin: 0 },
  statValueRed : { color: '#e74c3c', fontSize: '18px', fontWeight: '700', margin: 0 },
  statValueGold: { color: '#f0b429', fontSize: '16px', fontWeight: '700', margin: 0 },

  // Table
  tableCard    : { background: '#fff', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  tableHeader  : { padding: '24px', borderBottom: '1px solid #f0f4f8' },
  tableTitle   : { color: '#1a1a2e', fontSize: '18px', fontWeight: '700', margin: 0 },
  tableSubtitle: { color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' },

  // Vide
  vide    : { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' },
  videIcon: { fontSize: '48px', color: '#27ae60' },
  videText: { color: '#94a3b8', marginTop: '16px' },

  // Liste
  liste  : { display: 'flex', flexDirection: 'column' },
  theader: { display: 'flex', alignItems: 'center', padding: '12px 24px', background: '#f8fafc', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  trow   : { display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f0f4f8', transition: 'all 0.2s' },

  // Colonnes
  colPriorite: { width: '80px', display: 'flex', alignItems: 'center', gap: '4px' },
  colFlex    : { flex: 1, fontSize: '13px', color: '#1a1a2e' },
  colAction  : { width: '100px' },

  // Éléments ligne
  prioriteBadge: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' },
  numDemande   : { color: '#f0b429', fontWeight: '600' },
  typeBadge    : { background: '#eef2ff', color: '#1a3a6b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  citoyenText  : { color: '#1a1a2e' },
  dateText     : { color: '#94a3b8', fontSize: '12px' },
  rowIcon      : { marginRight: '6px', color: '#94a3b8' },
  btnAction    : { padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: '600' },
};