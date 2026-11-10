import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Download, 
  Phone, 
  MessageSquare, 
  Users, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  LogIn, 
  LogOut,
  MapPin,
  Calendar,
  Lock
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  RegistrationRecord, 
  subscribeToRegistrations, 
  exportToCSV 
} from '../services/registrationService';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPhones, setCopiedPhones] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore registrations
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const unsubscribe = subscribeToRegistrations(
      (data) => {
        setRegistrations(data);
        setLoading(false);
      },
      (err) => {
        console.warn('Subscription info:', err.message);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  // Google sign in for organizer
  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion';
      setAuthError(msg);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Filter registrations
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return registrations;
    const q = searchQuery.toLowerCase();
    return registrations.filter(
      (r) =>
        r.nom.toLowerCase().includes(q) ||
        r.prenom.toLowerCase().includes(q) ||
        r.telephone.toLowerCase().includes(q) ||
        r.ville.toLowerCase().includes(q) ||
        r.passId.toLowerCase().includes(q)
    );
  }, [registrations, searchQuery]);

  // Copy all phone numbers for WhatsApp Broadcast
  const handleCopyAllPhoneNumbers = () => {
    if (registrations.length === 0) return;
    const phoneList = registrations
      .map((r) => r.telephone.replace(/\s+/g, ''))
      .join(', ');
    navigator.clipboard.writeText(phoneList);
    setCopiedPhones(true);
    setTimeout(() => setCopiedPhones(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#141414] border-2 border-[#FF7900] rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF7900]/15 border border-[#FF7900]/40 flex items-center justify-center text-[#FF7900]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Espace Organisateur</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FF7900] text-black">
                  {registrations.length} inscrits
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Liste en temps réel des coordonnées des participants (Noms & Numéros WhatsApp)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-zinc-800/80 rounded-full py-1 px-3 text-xs text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline font-medium">{currentUser.email}</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-zinc-400 hover:text-white ml-1 p-0.5"
                  title="Déconnexion"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center gap-1.5 bg-[#FF7900] hover:bg-[#ff9433] text-black font-extrabold text-xs py-1.5 px-3 rounded-full transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Connexion Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Export actions */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/40 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, ville ou pass..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-700/80 focus:border-[#FF7900] rounded-xl text-sm text-white placeholder:text-zinc-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAllPhoneNumbers}
              disabled={registrations.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold text-zinc-200 rounded-xl transition-colors cursor-pointer"
              title="Copier tous les numéros de téléphone pour broadcast WhatsApp"
            >
              {copiedPhones ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Numéros copiés !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#FF7900]" />
                  <span>Copier les numéros</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => exportToCSV(registrations)}
              disabled={registrations.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#FF7900] hover:bg-[#ff9433] disabled:opacity-50 text-black font-extrabold text-xs rounded-xl transition-all shadow-[0_2px_12px_rgba(255,121,0,0.3)] cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Exporter Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <RefreshCw className="w-6 h-6 animate-spin text-[#FF7900]" />
              <span className="text-sm">Chargement des inscriptions en temps réel...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#FF7900]" />
              <p className="text-base font-semibold text-zinc-300">
                {searchQuery ? 'Aucun résultat trouvé pour votre recherche' : 'Aucune inscription enregistrée pour le moment'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Dès qu'une personne valide le formulaire en ligne, ses coordonnées apparaîtront ici instantanément.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-3">Participant</th>
                    <th className="py-3 px-3">Numéro WhatsApp</th>
                    <th className="py-3 px-3">Ville</th>
                    <th className="py-3 px-3">Pass VIP N°</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Action directe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.map((r, i) => {
                    const cleanPhone = r.telephone.replace(/\D/g, '');
                    return (
                      <tr 
                        key={r.id || `${r.passId}-${i}`}
                        className="hover:bg-zinc-900/60 transition-colors group"
                      >
                        <td className="py-3 px-3 font-bold text-white text-sm">
                          {r.prenom} <span className="uppercase text-[#FF7900]">{r.nom}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-zinc-200">
                          {r.telephone}
                        </td>
                        <td className="py-3 px-3 text-zinc-300 font-medium">
                          <span className="inline-flex items-center gap-1 bg-zinc-800/80 px-2 py-0.5 rounded-md">
                            <MapPin className="w-3 h-3 text-[#FF7900]" />
                            {r.ville}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs font-bold text-emerald-400">
                          {r.passId}
                        </td>
                        <td className="py-3 px-3 text-zinc-500 text-[11px]">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Récemment'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] transition-colors"
                              title="Envoyer un message WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${r.telephone}`}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                              title="Appeler par téléphone"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 px-6 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#FF7900]" />
            <span>Données hébergées et sécurisées sur Google Cloud Firestore</span>
          </div>
          <span className="font-mono text-zinc-400 font-semibold">
            {filtered.length} affiché(s) sur {registrations.length} total
          </span>
        </div>
      </div>
    </div>
  );
};
