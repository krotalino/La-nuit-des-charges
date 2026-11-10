import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Download, 
  Share2, 
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrangeBrandLogo } from './components/OrangeBrandLogo';
import { BackgroundSparks } from './components/BackgroundSparks';
import { generateTicketImage, TicketData } from './utils/ticketGenerator';
import { testFirestoreConnection } from './lib/firebase';
import { saveRegistration } from './services/registrationService';
import { AdminDashboard } from './components/AdminDashboard';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+237', country: 'Cameroun', flag: '🇨🇲' },
  { code: '+225', country: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: '+221', country: 'Sénégal', flag: '🇸🇳' },
  { code: '+241', country: 'Gabon', flag: '🇬🇦' },
  { code: '+242', country: 'Congo', flag: '🇨🇬' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+235', country: 'Tchad', flag: '🇹🇩' },
  { code: '+236', country: 'Centrafrique', flag: '🇨🇫' },
];

export default function App() {
  // Form fields state
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [prefix, setPrefix] = useState('+237');
  const [numero, setNumero] = useState('');
  const ville = 'Douala';
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<{ nom?: string; prenom?: string; numero?: string; ville?: string }>({});

  // Submission & view state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'ticket'>('form');
  const [generatedTicketUrl, setGeneratedTicketUrl] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<TicketData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Test Firestore connection on boot & register discreet admin triggers
  useEffect(() => {
    testFirestoreConnection();

    // Open if URL has ?admin=1 or #admin
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1' || params.get('admin') === 'true' || window.location.hash === '#admin') {
      setIsAdminOpen(true);
    }

    const handleHash = () => {
      if (window.location.hash === '#admin') setIsAdminOpen(true);
    };

    // Keyboard shortcut: Ctrl + Shift + A or Cmd + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };

    window.addEventListener('hashchange', handleHash);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const copyrightClicksRef = useRef<number>(0);
  const handleCopyrightClick = () => {
    copyrightClicksRef.current += 1;
    if (copyrightClicksRef.current >= 3) {
      setIsAdminOpen(true);
      copyrightClicksRef.current = 0;
    }
    setTimeout(() => {
      copyrightClicksRef.current = 0;
    }, 1500);
  };

  // Audio effect toggle (gentle synthetic tone or silent)
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 110,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF7900', '#FF9433', '#FFB870', '#FFFFFF', '#FFA726'],
    });
  };

  // Sound effect via web audio
  const playSuccessSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Validate fields
  const validateForm = () => {
    const newErrors: { nom?: string; prenom?: string; numero?: string; ville?: string } = {};

    if (!nom.trim()) {
      newErrors.nom = 'Requis';
    } else if (nom.trim().length < 2) {
      newErrors.nom = '2 caractères minimum';
    }

    if (!prenom.trim()) {
      newErrors.prenom = 'Requis';
    } else if (prenom.trim().length < 2) {
      newErrors.prenom = '2 caractères minimum';
    }

    const cleanNum = numero.replace(/\D/g, '');
    if (!cleanNum) {
      newErrors.numero = 'Requis';
    } else if (cleanNum.length < 8 || cleanNum.length > 10) {
      newErrors.numero = 'Numéro invalide';
    }

    if (!ville.trim()) {
      newErrors.ville = 'Requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const cleanNum = numero.replace(/\D/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const cityCode = ville.trim().substring(0, 3).toUpperCase();
      const passId = `#CHG-${randomSuffix}-${cityCode}`;

      const data: TicketData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: `${prefix} ${cleanNum}`,
        ville: ville.trim(),
        passId,
        timestamp: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      };

      // Generate the digital ticket PNG
      const ticketUrl = await generateTicketImage(data);

      // Save attendee registration to Firestore database in background
      saveRegistration({
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        ville: data.ville,
        passId: data.passId,
        createdAt: new Date().toISOString(),
      });

      setTicketDetails(data);
      setGeneratedTicketUrl(ticketUrl);
      setActiveTab('ticket');

      triggerConfetti();
      playSuccessSound();

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur lors de la génération du pass:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset for another registration
  const handleReset = () => {
    setActiveTab('form');
    setGeneratedTicketUrl(null);
    setNom('');
    setPrenom('');
    setNumero('');
    setErrors({});
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    if (!ticketDetails) return;
    const shareText = encodeURIComponent(
      `🎉 Je viens d'obtenir mon Pass VIP pour LA NUIT DES CHARGÉS !\n\n` +
      `🔥 Es-tu prêt à être CHARGÉ ?\n` +
      `👉 Réserve ton Pass VIP avant l'épuisement des places sur : ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  // Copy invitation link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-start py-8 px-4 sm:px-6">
      {/* Background sparks */}
      <BackgroundSparks />

      {/* Top bar with audio toggle */}
      <header className="w-full max-w-[460px] flex items-center justify-end mb-4 z-10 px-1">
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800 rounded-full py-1 px-2.5 transition-colors cursor-pointer"
          title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#FF7900]" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Son activé' : 'Muet'}</span>
        </button>
      </header>

      {/* Navigation switcher if pass already generated */}
      {generatedTicketUrl && (
        <div className="w-full max-w-[460px] flex items-center justify-center gap-2 mb-3 z-10">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-[#FF7900] text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formulaire</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ticket')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ticket'
                ? 'bg-[#FF7900] text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Mon Billet Généré</span>
          </button>
        </div>
      )}

      {/* Main Ticket Container */}
      <main className="w-full max-w-[460px] z-10">
        <div 
          className="relative bg-[#161616] text-white rounded-[22px] overflow-hidden shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] border-[4px] border-[#FF7900] ticket-glow transition-all duration-300"
        >
          {/* Subtle hologram overlay */}
          <div className="absolute inset-0 pointer-events-none hologram-shimmer opacity-20 z-0" />

          {activeTab === 'form' ? (
            <>
              {/* STUB / HEADER DU TICKET */}
              <div className="relative pt-7 px-8 pb-6 text-center z-10 flex flex-col items-center">
                {/* Brand Logo - Centered with attached image */}
                <div className="flex justify-center items-center w-full mb-5">
                  <OrangeBrandLogo height={110} />
                </div>

                {/* Titre principal */}
                <h1 className="font-bold text-[clamp(28px,7vw,38px)] leading-[1.08] tracking-[-0.02em] text-white mb-2.5">
                  Es-tu prêt à être <span className="text-[#FF7900]">CHARGÉ</span> ?
                </h1>

                {/* Sous titre */}
                <p className="text-[15px] leading-relaxed text-[#9a9a9a] max-w-[34ch] mx-auto">
                  La Nuit des Chargés — L'expérience exclusive à ne pas manquer.
                </p>

                {/* Texte d'appel */}
                <p className="text-white font-bold text-[15px] mt-3.5">
                  Réserve ton Pass VIP (Places limitées).
                </p>
              </div>

              {/* Separator / Notched ticket perforation */}
              <div className="ticket-perf" />

              {/* FORMULAIRE RSVP */}
              <form onSubmit={handleSubmit} noValidate className="relative p-6 sm:p-8 flex flex-col gap-4 z-10">
                {/* Ligne Nom & Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nom" className="text-[11px] font-bold tracking-[0.09em] uppercase text-white">
                      Nom
                    </label>
                    <div className="flex items-center border border-white/12 focus-within:border-[#FF7900] focus-within:ring-2 focus-within:ring-[#FF7900]/25 rounded-[10px] bg-[#0f0f0f] transition-all">
                      <input
                        id="nom"
                        name="nom"
                        type="text"
                        value={nom}
                        onChange={(e) => {
                          setNom(e.target.value);
                          if (errors.nom) setErrors({ ...errors, nom: undefined });
                        }}
                        autoComplete="family-name"
                        required
                        className="w-full bg-transparent border-none outline-none px-3.5 py-3 text-[15px] text-white font-medium"
                      />
                    </div>
                    {errors.nom && <span className="text-[12px] text-[#ff5a5a] font-semibold">{errors.nom}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="prenom" className="text-[11px] font-bold tracking-[0.09em] uppercase text-white">
                      Prénom
                    </label>
                    <div className="flex items-center border border-white/12 focus-within:border-[#FF7900] focus-within:ring-2 focus-within:ring-[#FF7900]/25 rounded-[10px] bg-[#0f0f0f] transition-all">
                      <input
                        id="prenom"
                        name="prenom"
                        type="text"
                        value={prenom}
                        onChange={(e) => {
                          setPrenom(e.target.value);
                          if (errors.prenom) setErrors({ ...errors, prenom: undefined });
                        }}
                        autoComplete="given-name"
                        required
                        className="w-full bg-transparent border-none outline-none px-3.5 py-3 text-[15px] text-white font-medium"
                      />
                    </div>
                    {errors.prenom && <span className="text-[12px] text-[#ff5a5a] font-semibold">{errors.prenom}</span>}
                  </div>
                </div>

                {/* Champ Numéro WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="numero" className="text-[11px] font-bold tracking-[0.09em] uppercase text-white">
                    Numéro WhatsApp
                  </label>

                  <div className="flex items-center border border-white/12 focus-within:border-[#FF7900] focus-within:ring-2 focus-within:ring-[#FF7900]/25 rounded-[10px] bg-[#0f0f0f] transition-all overflow-hidden">
                    {/* Prefix selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountrySelector(!showCountrySelector)}
                        className="flex items-center gap-1 pl-3.5 pr-2 py-3 text-[#9a9a9a] font-bold text-[15px] hover:text-white transition-colors cursor-pointer select-none"
                      >
                        <span>{prefix}</span>
                      </button>

                      {showCountrySelector && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50 max-h-48 overflow-y-auto">
                          {COUNTRY_CODES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setPrefix(c.code);
                                setShowCountrySelector(false);
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#FF7900]/20 hover:text-white text-zinc-300 cursor-pointer"
                            >
                              <span>{c.flag} {c.country}</span>
                              <span className="font-mono font-bold text-[#FF7900]">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      id="numero"
                      name="numero"
                      type="tel"
                      inputMode="numeric"
                      value={numero}
                      onChange={(e) => {
                        setNumero(e.target.value);
                        if (errors.numero) setErrors({ ...errors, numero: undefined });
                      }}
                      placeholder="6XX XXX XXX"
                      autoComplete="tel-national"
                      required
                      className="w-full bg-transparent border-none outline-none pr-3.5 py-3 text-[15px] text-white placeholder:text-[#5c5c5c] font-medium"
                    />
                  </div>
                  {errors.numero && <span className="text-[12px] text-[#ff5a5a] font-semibold">{errors.numero}</span>}
                </div>

                {/* Champ Ville - Fixé sur Douala uniquement */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ville" className="text-[11px] font-bold tracking-[0.09em] uppercase text-white">
                    Ville
                  </label>
                  <div className="flex items-center border border-white/12 rounded-[10px] bg-[#0f0f0f]">
                    <input
                      id="ville"
                      name="ville"
                      type="text"
                      value={ville}
                      readOnly
                      tabIndex={-1}
                      className="w-full bg-transparent border-none outline-none px-3.5 py-3 text-[15px] font-medium text-white/90 cursor-default select-none"
                    />
                  </div>
                </div>

                {/* Bouton d'action CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full py-4 px-5 rounded-[10px] bg-[#FF7900] hover:bg-[#ff9433] text-black font-bold text-base flex items-center justify-center gap-2.5 transition-all duration-150 transform active:translate-y-px disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Validation en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Obtenir mon Pass Chargé</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Footnote officielle */}
                <p className="text-center text-[12px] text-[#9a9a9a] leading-relaxed mt-1">
                  En validant, tu confirmes ta présence à l'événement. Tes données servent uniquement à générer ton invitation.
                </p>
              </form>
            </>
          ) : (
            /* PANNEAU DE SUCCÈS & TICKET GÉNÉRÉ */
            <div className="p-6 sm:p-8 text-center relative z-10">
              {/* Animated Success Stamp */}
              <div className="stamp-pop w-16 h-16 sm:w-18 sm:h-18 mx-auto rounded-full bg-[#FF7900] flex items-center justify-center shadow-[0_0_35px_rgba(255,121,0,0.6)] mb-4">
                <Check className="w-9 h-9 sm:w-10 sm:h-10 text-black stroke-[3]" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                C'est confirmé !
              </h2>
              <p className="text-[14.5px] leading-relaxed text-[#9a9a9a] max-w-[34ch] mx-auto mb-5">
                Voici ton billet d'invitation officiel avec tes coordonnées. Télécharge-le et présente-le à l'entrée.
              </p>

              {/* Aperçu de l'invitation personnalisée générée */}
              {generatedTicketUrl && (
                <div className="relative my-4 max-w-[380px] mx-auto rounded-2xl overflow-hidden border border-white/12 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.7)] group bg-white">
                  <img
                    src={generatedTicketUrl}
                    alt="Invitation officielle personnalisée La Nuit des Chargés"
                    className="w-full h-auto block rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              )}

              {/* Récapitulatif des coordonnées de la personne */}
              {ticketDetails && (
                <div className="bg-[#111111] border border-white/10 rounded-xl p-3.5 my-4 max-w-[380px] mx-auto text-left shadow-lg">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7900]">
                      Coordonnées de l'invité
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {ticketDetails.passId}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10.5px]">Titulaire :</span>
                      <span className="text-white font-bold">{ticketDetails.prenom} {ticketDetails.nom}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10.5px]">WhatsApp :</span>
                      <span className="text-white font-bold">{ticketDetails.telephone}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10.5px]">Ville :</span>
                      <span className="text-white font-bold">{ticketDetails.ville}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10.5px]">Statut :</span>
                      <span className="text-emerald-400 font-bold">Pass VIP Validé</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton de Téléchargement immédiat de l'invitation */}
              {generatedTicketUrl && (
                <div className="flex flex-col gap-2.5 mt-4 max-w-[380px] mx-auto">
                  <a
                    href={generatedTicketUrl}
                    download={`Invitation-Orange-${ticketDetails?.prenom || 'Invite'}-${ticketDetails?.nom || 'VIP'}.png`}
                    className="w-full py-3.5 px-5 rounded-[10px] bg-[#FF7900] hover:bg-[#ff9433] text-black font-bold text-[15px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Télécharger mon billet (PNG)</span>
                  </a>

                  {/* Bouton de Partage WhatsApp */}
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 px-4 rounded-[10px] bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager avec un ami sur WhatsApp</span>
                  </button>

                  {/* Bouton retour direct au formulaire */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className="w-full py-2.5 px-4 rounded-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#FF7900]" />
                    <span>Afficher / Modifier le formulaire</span>
                  </button>

                  {/* Copier le lien */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-xs text-zinc-400 hover:text-white transition-colors py-1 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? (
                      <span className="text-emerald-400 font-semibold">Lien copié dans le presse-papier !</span>
                    ) : (
                      <span>Copier le lien d'invitation</span>
                    )}
                  </button>
                </div>
              )}

              <p className="text-[12px] text-[#9a9a9a] mt-4 leading-relaxed">
                Astuce : sur mobile, appuie longuement sur l'image pour l'enregistrer.
              </p>

              {/* Bouton Recommencer / Enregistrer un autre */}
              <div className="pt-5 mt-5 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-[#FF7900] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réserver un autre Pass VIP
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-zinc-400 text-xs">
          <p onClick={handleCopyrightClick} className="select-none cursor-default">
            © 2026 La Nuit des Chargés • Plateforme officielle de réservation.
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            L'abus d'alcool est dangereux pour la santé. Événement réservé aux personnes majeures.
          </p>
        </footer>
      </main>

      {/* Admin Dashboard Modal */}
      <AdminDashboard isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}
