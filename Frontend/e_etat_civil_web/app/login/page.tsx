'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [mdp, setMdp]         = useState('');
  const [showMdp, setShowMdp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('accounts/login/', {
        email,
        mdp_user: mdp,
      });
        console.log('REPONSE:', res.data);
        console.log('ROLE:', res.data.role);
        console.log('TOKEN:', res.data.token);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role',  res.data.role);

      const role = res.data.role.toLowerCase();
      if (role === 'citoyen')             router.push('/citoyen/accueil');
      else if (role === 'agent')          router.push('/agent/file_attente');
      else if (role === 'administrateur') router.push('/admin/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-md p-8 rounded-2xl border"
        style={{
          background  : 'rgba(255,255,255,0.05)',
          borderColor : 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #f0b429, #fcd34d)' }}
          >
            <i className="fi fi-sr-government text-3xl" style={{ color: '#0a1830' }}></i>
          </div>
          <h1 className="text-2xl font-bold text-white">e-EtatCivily</h1>
          <p style={{ color: '#f0b429' }} className="text-sm font-medium mt-1">
            Madagascar 2035
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          {/* Erreur */}
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-center"
              style={{
                background  : 'rgba(239,68,68,0.1)',
                border      : '1px solid rgba(239,68,68,0.3)',
                color       : '#f87171',
              }}
            >
              <i className="fi fi-rr-exclamation mr-2"></i>
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">Email</label>
            <div className="relative">
              <i className="fi fi-rr-envelope absolute left-4 top-1/2 -translate-y-1/2 text-white/40"></i>
              <input
                type="email"
                placeholder="votre@email.mg"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/30 outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border    : '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">Mot de passe</label>
            <div className="relative">
              <i className="fi fi-rr-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/40"></i>
              <input
                type={showMdp ? 'text' : 'password'}
                placeholder="••••••••"
                value={mdp}
                onChange={e => setMdp(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3 rounded-xl text-white placeholder-white/30 outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border    : '1px solid rgba(255,255,255,0.1)',
                }}
              />
              <span
                onClick={() => setShowMdp(!showMdp)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 cursor-pointer"
                >
                <i className={`fi ${showMdp ? 'fi-rr-eye-crossed' : 'fi-rr-eye'}`}></i>
                </span>
            </div>
          </div>

          {/* Mot de passe oublié */}
          <a
          
            href="/mot-de-passe-oublie"
            className="text-sm text-right flex items-center justify-end gap-1 hover:opacity-80"
            style={{ color: '#f0b429' }}
          >
            <i className="fi fi-rr-key"></i>
            Mot de passe oublié ?
          </a>

          {/* Bouton connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold mt-2 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #f0b429, #fcd34d)',
              color     : '#0a1830',
            }}
          >
            {loading ? (
              <>
                <i className="fi fi-rr-spinner animate-spin"></i>
                Connexion...
              </>
            ) : (
              <>
                <i className="fi fi-rr-sign-in-alt"></i>
                Se connecter
              </>
            )}
          </button>

          {/* Lien inscription */}
          <p className="text-center text-white/40 text-sm mt-2">
            Pas de compte ?{' '}
            <a href="/register" style={{ color: '#f0b429' }} className="hover:opacity-80">
              Créer un compte
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}