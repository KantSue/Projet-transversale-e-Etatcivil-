'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */


import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/app/api';
import Image from 'next/image';
// ─── Types ───────────────────────────────────────────────────────────────────
interface Personne {
  role: string;
  nom: string;
  prenom: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  profession?: string;
}

interface Demande {
  id_demande: number;
  num_demande: string;
  num_acte: string;
  statut_demande: string;
  type_acte: string;
  date_demande: string;
  email_citoyen: string;
  nom_citoyen: string;
  prenom_citoyen: string;
  photo_cin?: string;
  personnes: Personne[];
  paiement_ok: boolean;
  id_agent?: number;
}

interface Acte {
  id_acte: number;
  num_acte: string;
  type_acte: string;
  date_acte: string;
  personnes: Personne[];
  email_citoyen?: string;
  paiement_ok?: boolean;
}

// ─── Couleurs statuts ─────────────────────────────────────────────────────────
const statutStyle: Record<string, { bg: string; color: string }> = {
  'EN ATTENTE': { bg: 'rgba(240,180,41,0.15)', color: '#f0b429' },
  'VALIDER':    { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
  'REFUSER':    { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
  'TERMINER':   { bg: 'rgba(139,92,246,0.15)',  color: '#8b5cf6' },
};

const roleLabel: Record<string, string> = {
  enfant:        '👶 Enfant',
  pere:          '👨 Père',
  mere:          '👩 Mère',
  epoux1:        '💍 Époux',
  epoux2:        '💍 Épouse',
  defunt:        '✝️ Défunt(e)',
  temoin:        '👁️ Témoin 1',
  temoin2:       '👁️ Témoin 2',
  pere_epoux1:   '👨 Père époux',
  mere_epoux1:   '👩 Mère époux',
  pere_epoux2:   '👨 Père épouse',
  mere_epoux2:   '👩 Mère épouse',
  pere_defunt:   '👨 Père défunt',
  mere_defunt:   '👩 Mère défunt',
};

// ─── Composant principal ──────────────────────────────────────────────────────
function DetailDemandeContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const id           = searchParams.get('id');

  const [demande,          setDemande]          = useState<Demande | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [recherche,        setRecherche]        = useState('');
  const [suggestions,      setSuggestions]      = useState<string[]>([]);
  const [actePreview,      setActePreview]      = useState<Acte | null>(null);   // ← nouveau
  const [acteLoading,      setActeLoading]      = useState(false);               // ← nouveau
  const [acteConfirme,     setActeConfirme]     = useState<Acte | null>(null);
  const [motif,            setMotif]            = useState('');
  const [showRefusModal,   setShowRefusModal]   = useState(false);
  const [showEmailModal,   setShowEmailModal]   = useState(false);
  const [email,            setEmail]            = useState('');
  const [actionLoading,    setActionLoading]    = useState(false);
  const [message,          setMessage]          = useState<{type:'success'|'error'; text:string} | null>(null);

  // ── Charger demande ──
  useEffect(() => {
    if (!id) return;
    api.get(`/dashboard/demandes/${id}/`)
      .then(r => {
        setDemande(r.data);
        setRecherche(r.data.num_acte || '');
        setEmail(r.data.email_citoyen || '');
      })
      .catch(() => setMessage({ type: 'error', text: 'Impossible de charger la demande.' }))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Suggestions Trie ──
 useEffect(() => {
  if (recherche.length < 2) {
    // Avoid synchronous setState inside effect — defer to next tick
    const clearT = setTimeout(() => setSuggestions([]), 0);
    return () => clearTimeout(clearT);
  }
  const t = setTimeout(() => {
    api.get(`/dashboard/recherche/suggestions/?q=${recherche}`)
      .then(r => {
        console.log('Suggestions response:', r.data); // ← regardez dans la console
        const data = r.data;
        // Gérer les différents formats possibles
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        } else if (Array.isArray(data.resultats)) {
          setSuggestions(data.resultats);
        } else {
          setSuggestions([]);
        }
      })
      .catch((err) => {
        console.log('Suggestions error:', err);
        setSuggestions([]);
      });
  }, 300);
  return () => clearTimeout(t);
}, [recherche]);
  // ── Clic suggestion → charger l'acte complet ──
  const handleSuggestionClick = async (numActe: string) => {
    setSuggestions([]);
    setRecherche(numActe);
    setActePreview(null);
    setActeLoading(true);
    try {
      // Chercher l'acte via KMP/RK pour obtenir son id
      const res = await api.get(`/dashboard/recherche/?q=${numActe}`);
      const actes: any[] = res.data.actes || res.data.resultats || res.data || [];
      const trouve = actes.find((a: any) =>
        a.num_acte === numActe || String(a.id_acte) === numActe
      );
      if (trouve) {
        // Charger le détail complet
        const detail = await api.get(
          `/dashboard/actes/${trouve.id_acte}/?id_demande=${id}`
        );
        setActePreview(detail.data);
      } else {
        setMessage({ type: 'error', text: 'Acte introuvable.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du chargement de l\'acte.' });
    } finally {
      setActeLoading(false);
    }
  };

  // ── Confirmer l'acte ──
  const confirmerActe = () => {
    if (!actePreview) return;
    setActeConfirme(actePreview);
    setActePreview(null);
    setMessage({ type: 'success', text: `✅ Acte ${actePreview.num_acte} confirmé.` });
  };

  // ── Valider demande ──
  const valider = async () => {
    if (!demande) return;
    setActionLoading(true);
    try {
      await api.patch(`/dashboard/demandes/${demande.id_agent}/${id}/`, { action: 'VALIDER' });
      setDemande(prev => prev ? { ...prev, statut_demande: 'VALIDER' } : prev);
      setMessage({ type: 'success', text: '✅ Demande validée avec succès.' });
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la validation.' });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Refuser demande ──
  const refuser = async () => {
    if (!demande || !motif.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/dashboard/demandes/${demande.id_agent}/${id}/`, { action: 'REFUSER', motif });
      setDemande(prev => prev ? { ...prev, statut_demande: 'REFUSER' } : prev);
      setShowRefusModal(false);
      setMessage({ type: 'error', text: '❌ Demande refusée.' });
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du refus.' });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Générer PDF ──
  const genererPDF = async () => {
    try {
      const res = await api.get(`/dashboard/demandes/${id}/acte/pdf/`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setMessage({ type: 'success', text: '📄 PDF généré avec succès.' });
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la génération du PDF.' });
    }
  };

  // ── Envoyer PDF par email ──
  const envoyerPDF = async () => {
    try {
      await api.post(`/dashboard/demandes/${id}/envoyer-pdf/`, { email });
      setShowEmailModal(false);
      setMessage({ type: 'success', text: `📧 PDF envoyé à ${email}.` });
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi.' });
    }
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div style={{ color:'#f0b429', fontSize:'18px' }}>⏳ Chargement...</div>
    </div>
  );

  if (!demande) return (
    <div style={{ color:'#ef4444', padding:'40px', textAlign:'center' }}>
      Demande introuvable.
    </div>
  );

  const st = statutStyle[demande.statut_demande] || { bg: '#eee', color: '#333' };
  const peutGenererPDF = acteConfirme && demande.statut_demande === 'VALIDER' && demande.paiement_ok;

  return (
    <div style={{ padding: '32px 0' }}>

      {/* ── Message flash ── */}
      {message && (
        <div style={{
          marginBottom : '20px',
          padding      : '14px 20px',
          borderRadius : '12px',
          background   : message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border       : `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
          color        : message.type === 'success' ? '#22c55e' : '#ef4444',
          display      : 'flex',
          justifyContent: 'space-between',
          alignItems   : 'center',
        }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:'18px' }}>×</button>
        </div>
      )}

      {/* ── En-tête ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px' }}>
        <div>
          <button
            onClick={() => router.push('/agent/file-attente')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'14px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}
          >
           {" ← Retour file d'attente"}
          </button>
          <h1 style={{ margin:0, fontSize:'24px', fontWeight:'700', color:'#1a1a2e' }}>
            Demande {demande.num_demande}
          </h1>
        </div>
        <span style={{ padding:'6px 16px', borderRadius:'20px', fontSize:'13px', fontWeight:'600', background:st.bg, color:st.color }}>
          {demande.statut_demande}
        </span>
      </div>

      {/* ── Layout 2 colonnes ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>

        {/* ── Colonne gauche — Infos demande ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* Infos citoyen */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>👤 Citoyen</h3>
            <InfoRow label="Nom"   value={`${demande.prenom_citoyen} ${demande.nom_citoyen}`} />
            <InfoRow label="Email" value={demande.email_citoyen} />
            <InfoRow label="Type"  value={demande.type_acte} />
            <InfoRow label="Date"  value={new Date(demande.date_demande).toLocaleDateString('fr-FR')} />
            <InfoRow label="N° Acte demandé" value={demande.num_acte} />
          </div>

          {/* Photo CIN */}
          {demande.photo_cin && (
            <div style={cardStyle}>
              <h3 style={cardTitle}>🪪 Photo CIN</h3>
              <Image
                src={demande.photo_cin}
                alt="CIN"
                style={{ width:'100%', borderRadius:'10px', objectFit:'cover', maxHeight:'200px' }}
              />
            </div>
          )}

          {/* Personnes */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>👥 Personnes concernées</h3>
            {demande.personnes.map((p, i) => (
              <div key={i} style={{ padding:'10px', background:'#f8fafc', borderRadius:'8px', marginBottom:'8px' }}>
                <div style={{ fontWeight:'600', color:'#1a3a6b', fontSize:'13px', marginBottom:'4px' }}>
                  {roleLabel[p.role] || p.role}
                </div>
                <div style={{ color:'#1a1a2e', fontWeight:'500' }}>{p.prenom} {p.nom}</div>
                {p.date_naissance && <div style={{ color:'#94a3b8', fontSize:'12px' }}>Né(e) le {p.date_naissance} {p.lieu_naissance ? `à ${p.lieu_naissance}` : ''}</div>}
                {p.profession && <div style={{ color:'#94a3b8', fontSize:'12px' }}>{p.profession}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Colonne droite — Recherche + Actions ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* Recherche acte */}
          <div style={cardStyle}>
            <h3 style={cardTitle}>🔍 Recherche acte (Trie)</h3>
            <div style={{ position:'relative' }}>
              <input
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                placeholder="N° acte (ex: NAISS-2024-001)"
                style={inputStyle}
              />
              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div style={{
                  position    : 'absolute',
                  top         : '100%',
                  left        : 0,
                  right       : 0,
                  background  : '#fff',
                  border      : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow   : '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex      : 100,
                  overflow    : 'hidden',
                  marginTop   : '4px',
                }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(s)}
                      style={{
                        width      : '100%',
                        textAlign  : 'left',
                        padding    : '12px 16px',
                        background : 'none',
                        border     : 'none',
                        cursor     : 'pointer',
                        borderBottom: i < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                        color      : '#1a1a2e',
                        fontSize   : '14px',
                        display    : 'flex',
                        alignItems : 'center',
                        gap        : '10px',
                        transition : 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ color:'#1a3a6b', fontWeight:'600' }}>📄</span>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Loading acte */}
            {acteLoading && (
              <div style={{ marginTop:'16px', color:'#f0b429', fontSize:'14px', textAlign:'center' }}>
               {" ⏳ Chargement de l'acte..."}
              </div>
            )}

            {/* ── Panneau acte preview ── */}
            {actePreview && !acteLoading && (
              <div style={{
                marginTop   : '16px',
                border      : '2px solid #1a3a6b',
                borderRadius: '12px',
                overflow    : 'hidden',
              }}>
                {/* Header panneau */}
                <div style={{
                  background : 'linear-gradient(135deg, #1a3a6b, #0a1830)',
                  padding    : '14px 18px',
                  display    : 'flex',
                  justifyContent:'space-between',
                  alignItems : 'center',
                }}>
                  <div>
                    <div style={{ color:'#f0b429', fontWeight:'700', fontSize:'15px' }}>
                      📄 {actePreview.num_acte}
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', marginTop:'2px' }}>
                      {actePreview.type_acte} — {new Date(actePreview.date_acte).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <button
                    onClick={() => setActePreview(null)}
                    style={{ background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', color:'#fff', borderRadius:'6px', padding:'4px 8px', fontSize:'16px' }}
                  >
                    ×
                  </button>
                </div>

                {/* Contenu acte */}
                <div style={{ padding:'16px', background:'#f8fafc', maxHeight:'320px', overflowY:'auto' }}>
                  <div style={{ fontSize:'12px', color:'#94a3b8', fontWeight:'600', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                    Personnes enregistrées
                  </div>
                  {actePreview.personnes && actePreview.personnes.length > 0 ? (
                    actePreview.personnes.map((p, i) => (
                      <div key={i} style={{
                        padding     : '10px 12px',
                        background  : '#fff',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border      : '1px solid #e2e8f0',
                      }}>
                        <div style={{ fontWeight:'700', color:'#1a3a6b', fontSize:'12px', marginBottom:'4px' }}>
                          {roleLabel[p.role] || p.role}
                        </div>
                        <div style={{ fontWeight:'600', color:'#1a1a2e', fontSize:'14px' }}>
                          {p.prenom} {p.nom}
                        </div>
                        {p.date_naissance && (
                          <div style={{ color:'#64748b', fontSize:'12px', marginTop:'2px' }}>
                            Né(e) le {p.date_naissance}{p.lieu_naissance ? ` à ${p.lieu_naissance}` : ''}
                          </div>
                        )}
                        {p.sexe && <div style={{ color:'#94a3b8', fontSize:'11px' }}>{p.sexe} {p.profession ? `· ${p.profession}` : ''}</div>}
                      </div>
                    ))
                  ) : (
                    <div style={{ color:'#94a3b8', fontSize:'13px' }}>Aucune personne enregistrée.</div>
                  )}
                </div>

                {/* Bouton confirmer */}
                <div style={{ padding:'14px 16px', background:'#fff', borderTop:'1px solid #e2e8f0', display:'flex', gap:'10px' }}>
                  <button
                    onClick={confirmerActe}
                    style={{
                      flex        : 1,
                      padding     : '10px',
                      background  : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color       : '#fff',
                      border      : 'none',
                      borderRadius: '8px',
                      fontWeight  : '700',
                      cursor      : 'pointer',
                      fontSize    : '14px',
                    }}
                  >
                    {"✅ C'est le bon acte — Confirmer"}
                  </button>
                  <button
                    onClick={() => setActePreview(null)}
                    style={{
                      padding     : '10px 14px',
                      background  : 'rgba(239,68,68,0.1)',
                      color       : '#ef4444',
                      border      : '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '8px',
                      fontWeight  : '600',
                      cursor      : 'pointer',
                      fontSize    : '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Acte confirmé badge */}
            {acteConfirme && (
              <div style={{
                marginTop   : '12px',
                padding     : '12px 16px',
                background  : 'rgba(34,197,94,0.1)',
                border      : '1px solid #22c55e',
                borderRadius: '10px',
                display     : 'flex',
                justifyContent:'space-between',
                alignItems  : 'center',
              }}>
                <div>
                  <div style={{ color:'#22c55e', fontWeight:'700', fontSize:'13px' }}>✅ Acte confirmé</div>
                  <div style={{ color:'#1a1a2e', fontSize:'13px', marginTop:'2px' }}>{acteConfirme.num_acte}</div>
                </div>
                <button
                  onClick={() => setActeConfirme(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'18px' }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          {demande.statut_demande === 'EN ATTENTE' && (
            <div style={cardStyle}>
              <h3 style={cardTitle}>⚡ Actions</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <button onClick={valider} disabled={actionLoading} style={btnPrimary}>
                  {actionLoading ? '⏳' : '✅'} Valider la demande
                </button>
                <button onClick={() => setShowRefusModal(true)} disabled={actionLoading} style={btnDanger}>
                  ❌ Refuser la demande
                </button>
              </div>
            </div>
          )}

          {/* Générer PDF */}
          {peutGenererPDF && (
            <div style={cardStyle}>
              <h3 style={cardTitle}>📄 Document PDF</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <button onClick={genererPDF} style={btnGold}>
                  📄 Générer et visualiser le PDF
                </button>
                <button onClick={() => setShowEmailModal(true)} style={btnOutline}>
                  📧 Envoyer par email
                </button>
              </div>
            </div>
          )}

          {/* Paiement non confirmé */}
          {acteConfirme && demande.statut_demande === 'VALIDER' && !demande.paiement_ok && (
            <div style={{
              padding:'14px 16px', background:'rgba(240,180,41,0.1)',
              border:'1px solid #f0b429', borderRadius:'12px',
              color:'#f0b429', fontSize:'14px'
            }}>
              ⚠️ Paiement non encore confirmé. Le PDF sera disponible après confirmation.
            </div>
          )}
        </div>
      </div>

      {/* ── Modal refus ── */}
      {showRefusModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ margin:'0 0 16px', color:'#1a1a2e' }}>❌ Motif de refus</h3>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Expliquez le motif du refus..."
              rows={4}
              style={{ ...inputStyle, resize:'vertical' }}
            />
            <div style={{ display:'flex', gap:'12px', marginTop:'16px' }}>
              <button onClick={refuser} disabled={!motif.trim() || actionLoading} style={{ ...btnDanger, flex:1 }}>
                Confirmer le refus
              </button>
              <button onClick={() => setShowRefusModal(false)} style={{ ...btnOutline, flex:1 }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal email ── */}
      {showEmailModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ margin:'0 0 16px', color:'#1a1a2e' }}>📧 Envoyer le PDF</h3>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email du citoyen"
              type="email"
              style={inputStyle}
            />
            <div style={{ display:'flex', gap:'12px', marginTop:'16px' }}>
              <button onClick={envoyerPDF} style={{ ...btnPrimary, flex:1 }}>
                Envoyer
              </button>
              <button onClick={() => setShowEmailModal(false)} style={{ ...btnOutline, flex:1 }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles réutilisables ─────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background   : '#fff',
  borderRadius : '16px',
  padding      : '20px',
  boxShadow    : '0 2px 12px rgba(0,0,0,0.06)',
};

const cardTitle: React.CSSProperties = {
  margin      : '0 0 16px',
  fontSize    : '15px',
  fontWeight  : '700',
  color       : '#1a3a6b',
};

const inputStyle: React.CSSProperties = {
  width        : '100%',
  padding      : '12px 16px',
  border       : '1.5px solid #e2e8f0',
  borderRadius : '10px',
  fontSize     : '14px',
  outline      : 'none',
  background   : '#f8fafc',
  color        : '#1a1a2e',
  boxSizing    : 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding      : '12px',
  background   : 'linear-gradient(135deg, #1a3a6b, #2563eb)',
  color        : '#fff',
  border       : 'none',
  borderRadius : '10px',
  fontWeight   : '700',
  cursor       : 'pointer',
  fontSize     : '14px',
};

const btnDanger: React.CSSProperties = {
  padding      : '12px',
  background   : 'rgba(239,68,68,0.1)',
  color        : '#ef4444',
  border       : '1px solid rgba(239,68,68,0.3)',
  borderRadius : '10px',
  fontWeight   : '700',
  cursor       : 'pointer',
  fontSize     : '14px',
};

const btnGold: React.CSSProperties = {
  padding      : '12px',
  background   : 'linear-gradient(135deg, #f0b429, #fcd34d)',
  color        : '#0a1830',
  border       : 'none',
  borderRadius : '10px',
  fontWeight   : '700',
  cursor       : 'pointer',
  fontSize     : '14px',
};

const btnOutline: React.CSSProperties = {
  padding      : '12px',
  background   : 'none',
  color        : '#1a3a6b',
  border       : '1.5px solid #1a3a6b',
  borderRadius : '10px',
  fontWeight   : '600',
  cursor       : 'pointer',
  fontSize     : '14px',
};

const overlayStyle: React.CSSProperties = {
  position        : 'fixed',
  inset           : 0,
  background      : 'rgba(0,0,0,0.5)',
  display         : 'flex',
  justifyContent  : 'center',
  alignItems      : 'center',
  zIndex          : 1000,
};

const modalStyle: React.CSSProperties = {
  background   : '#fff',
  borderRadius : '16px',
  padding      : '28px',
  width        : '420px',
  boxShadow    : '0 20px 60px rgba(0,0,0,0.2)',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
      <span style={{ color:'#94a3b8', fontSize:'13px' }}>{label}</span>
      <span style={{ color:'#1a1a2e', fontSize:'13px', fontWeight:'500', textAlign:'right', maxWidth:'60%' }}>{value}</span>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function DetailDemande() {
  return (
    <Suspense fallback={<div style={{ color:'#f0b429', padding:'40px', textAlign:'center' }}>⏳ Chargement...</div>}>
      <DetailDemandeContent />
    </Suspense>
  );
}