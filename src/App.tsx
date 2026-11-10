import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Download, 
  Share2, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Smartphone, 
  RotateCcw,
  Flame,
  Volume2,
  VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrangeBrandLogo } from './components/OrangeBrandLogo';
import { BackgroundSparks } from './components/BackgroundSparks';
import { generateTicketImage, TicketData } from './utils/ticketGenerator';

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

const COMMON_CITIES = ['Douala', 'Yaoundé', 'Bafoussam', 'Kribi', 'Garoua', 'Autre'];

export default function App() {
  // Form fields state
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [prefix, setPrefix] = useState('+237');
  const [numero, setNumero] = useState('');
  const [ville, setVille] = useState('Douala');
  const [customVille, setCustomVille] = useState('');
  const [isEditingVille, setIsEditingVille] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<{ nom?: string; prenom?: string; numero?: string; ville?: string }>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedTicketUrl, setGeneratedTicketUrl] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<TicketData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

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
      newErrors.nom = 'Le nom est obligatoire';
    } else if (nom.trim().length < 2) {
      newErrors.nom = '2 caractères minimum';
    }

    if (!prenom.trim()) {
      newErrors.prenom = 'Le prénom est obligatoire';
    } else if (prenom.trim().length < 2) {
      newErrors.prenom = '2 caractères minimum';
    }

    const cleanNum = numero.replace(/\D/g, '');
    if (!cleanNum) {
      newErrors.numero = 'Numéro WhatsApp requis';
    } else if (cleanNum.length < 8 || cleanNum.length > 10) {
      newErrors.numero = 'Numéro invalide (8 à 10 chiffres)';
    }

    const activeVille = ville === 'Autre' ? customVille.trim() : ville.trim();
    if (!activeVille) {
      newErrors.ville = 'Veuillez préciser votre ville';
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
      // Simulate real-time secure registration and generation
      await new Promise((resolve) => setTimeout(resolve, 800));

      const cleanNum = numero.replace(/\D/g, '');
      const activeVille = ville === 'Autre' ? customVille.trim() : ville.trim();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const cityCode = activeVille.substring(0, 3).toUpperCase();
      const passId = `#CHG-${randomSuffix}-${cityCode}`;

      const data: TicketData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: `${prefix} ${cleanNum}`,
        ville: activeVille,
        passId,
        timestamp: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      };

      // Generate the digital ticket PNG
      const ticketUrl = await generateTicketImage(data);

      setTicketDetails(data);
      setGeneratedTicketUrl(ticketUrl);
      setIsSuccess(true);

      triggerConfetti();
      playSuccessSound();

      // Scroll smoothly to top of ticket
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur lors de la génération du pass:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset for another registration
  const handleReset = () => {
    setIsSuccess(false);
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
      <header className="w-full max-w-[480px] flex items-center justify-end mb-4 z-10 px-2">
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

      {/* Main Ticket Container */}
      <main className="w-full max-w-[480px] z-10">
        <div 
          className="relative bg-[#141414] text-white rounded-[24px] overflow-hidden shadow-[0_40px_90px_-25px_rgba(0,0,0,0.9)] border-[3.5px] border-[#FF7900] ticket-glow transition-all duration-300"
        >
          {/* Subtle hologram overlay */}
          <div className="absolute inset-0 pointer-events-none hologram-shimmer opacity-30 z-0" />

          {!isSuccess ? (
            <>
              {/* STUB / HEADER DU TICKET */}
              <div className="relative p-6 sm:p-8 text-center z-10 flex flex-col items-center">
                {/* Brand Logo - Centered with attached image */}
                <div className="flex justify-center items-center w-full mb-6">
                  <OrangeBrandLogo height={110} />
                </div>

                {/* Titre principal modifié selon la demande */}
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-white mb-3">
                  Es-tu prêt à être <span className="text-[#FF7900] drop-shadow-[0_0_15px_rgba(255,121,0,0.5)]">CHARGÉ</span> ?
                </h1>

                {/* Sous titre modifié selon la demande */}
                <p className="text-sm sm:text-[15px] leading-relaxed text-zinc-400 max-w-[34ch] mx-auto font-medium mb-3">
                  La Nuit des Chargés — L'expérience exclusive à ne pas manquer.
                </p>

                {/* Texte d'appel modifié selon la demande */}
                <div className="inline-flex items-center gap-2 mt-1 text-[#FF7900] font-bold text-sm sm:text-base">
                  <Flame className="w-4 h-4 text-[#FF7900] animate-bounce" />
                  <span>Réserve ton Pass VIP (Places limitées).</span>
                </div>
              </div>

              {/* Separator / Notched ticket perforation */}
              <div className="ticket-perf" />

              {/* FORMULAIRE RSVP */}
              <form onSubmit={handleSubmit} noValidate className="relative p-6 sm:p-8 flex flex-col gap-4 z-10">
                {/* Ligne Nom & Prénom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nom" className="text-[11px] font-bold tracking-[0.09em] uppercase text-zinc-300">
                      Nom <span className="text-[#FF7900]">*</span>
                    </label>
                    <div className="flex items-center border border-white/15 focus-within:border-[#FF7900] focus-within:ring-2 focus-within:ring-[#FF7900]/30 rounded-xl bg-[#0e0e0e] transition-all">
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
                        className="w-full bg-transparent border-none outline-none px-3.5 py-3 text-sm text-white placeholder:text-zinc-600 font-medium"
                      />
                    </div>
                    {errors.nom && <span className="text-[11.5px] text-red-400 font-semibold">{errors.nom}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="prenom" className="text-[11px] font-bold tracking-[0.09em] uppercase text-zinc-300">
                      Prénom <span className="text-[#FF7900]">*</span>
                    </label>
                    <div className="flex items-center border border-white/15 focus-within:border-[#FF7900] focus-within:ring-2 focus-within:ring-[#FF7900]/30 rounded-xl bg-[#0e0e0e] transition-all">
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
                        className="w-full bg-transparent border-none outline-none px-3.5 py-3 text-sm text-white placeholder:text-zinc-600 font-medium"
                      />
                    </div>
                    {errors.prenom && <span className="text-[11.5px] text-red-400 font-semibold">{errors.prenom}</span>}
                  </div>
                </div>

                {/* Champ Numéro WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="numero" className="text-[11px] font-bold tracking-[0.09em] uppercase text-zinc-300">
                      Numéro WhatsApp <span className="text-[#FF7900]">*</span>
                    </label>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      Réception du Pass
                    </span>
                  </div>

                  <div className="flex items-center border border-white/15 focus-within:border-[#FF7900] focus-within:ring-2 focus-within:ring-[#FF7900]/30 rounded-xl bg-[#0e0e0e] transition-all overflow-hidden">
                    {/* Prefix selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountrySelector(!showCountrySelector)}
                        className="flex items-center gap-1 pl-3.5 pr-2 py-3 text-zinc-300 font-bold text-sm hover:text-white border-r border-zinc-800 transition-colors bg-zinc-900/60"
                      >
                        <span>{COUNTRY_CODES.find((c) => c.code === prefix)?.flag || '🇨🇲'}</span>
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
                              className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#FF7900]/20 hover:text-white text-zinc-300"
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
                      className="w-full bg-transparent border-none outline-none px-3.5 py-3 text-sm text-white placeholder:text-zinc-600 font-medium"
                    />
                  </div>
                  {errors.numero && <span className="text-[11.5px] text-red-400 font-semibold">{errors.numero}</span>}
                </div>

                {/* Champ Ville avec mode verrouillé / modifiable comme l'original */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ville" className="text-[11px] font-bold tracking-[0.09em] uppercase text-zinc-300">
                      Ville
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEditingVille(!isEditingVille)}
                      className="text-xs text-[#FF7900] hover:text-[#ff9433] font-bold transition-colors cursor-pointer"
                    >
                      {isEditingVille ? 'Valider' : 'Modifier la ville'}
                    </button>
                  </div>

                  {!isEditingVille ? (
                    <div className="flex items-center border border-white/10 rounded-xl bg-[#0c0c0c] px-3.5 py-3">
                      <MapPin className="w-4 h-4 text-[#FF7900] mr-2" />
                      <input
                        id="ville"
                        name="ville"
                        type="text"
                        value={ville === 'Autre' ? customVille || 'Douala' : ville}
                        readOnly
                        className="w-full bg-transparent border-none outline-none text-sm text-zinc-300 font-medium cursor-default"
                      />
                      <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider">Fixé</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        {COMMON_CITIES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setVille(c);
                              if (c !== 'Autre') {
                                setIsEditingVille(false);
                              }
                            }}
                            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all border ${
                              ville === c
                                ? 'bg-[#FF7900] text-black border-[#FF7900]'
                                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>

                      {ville === 'Autre' && (
                        <div className="flex items-center border border-white/15 focus-within:border-[#FF7900] rounded-xl bg-[#0e0e0e]">
                          <input
                            type="text"
                            placeholder="Saisissez votre ville..."
                            value={customVille}
                            onChange={(e) => setCustomVille(e.target.value)}
                            className="w-full bg-transparent border-none outline-none px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 font-medium"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {errors.ville && <span className="text-[11.5px] text-red-400 font-semibold">{errors.ville}</span>}
                </div>

                {/* Bouton d'action CTA modifié selon la demande */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full py-4 px-6 rounded-xl bg-[#FF7900] hover:bg-[#ff9433] text-black font-extrabold text-base tracking-wide flex items-center justify-center gap-2.5 transition-all duration-200 transform active:scale-[0.99] shadow-[0_4px_25px_rgba(255,121,0,0.4)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Génération de ton Pass VIP...</span>
                    </>
                  ) : (
                    <>
                      <span>Obtenir mon Pass Chargé</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* Footnote officielle */}
                <p className="text-center text-[11.5px] leading-relaxed text-zinc-400 mt-2">
                  En validant, tu confirmes ta présence à l'événement. Tes données servent uniquement à générer ton invitation.
                </p>
              </form>
            </>
          ) : (
            /* PANNEAU DE SUCCÈS & TICKET GÉNÉRÉ */
            <div className="p-6 sm:p-8 text-center relative z-10">
              {/* Animated Success Stamp */}
              <div className="stamp-pop w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#FF7900] flex items-center justify-center shadow-[0_0_35px_rgba(255,121,0,0.6)] mb-4">
                <Check className="w-9 h-9 sm:w-11 sm:h-11 text-black stroke-[3]" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Pass VIP Confirmé & Enregistré
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                C'est confirmé !
              </h2>
              <p className="text-sm text-zinc-300 max-w-[34ch] mx-auto mb-5">
                Voici ton invitation officielle personnalisée avec tes coordonnées. Télécharge-la et présente-la à l'entrée.
              </p>

              {/* Aperçu de l'invitation personnalisée générée */}
              {generatedTicketUrl && (
                <div className="relative my-4 max-w-[380px] mx-auto rounded-2xl overflow-hidden border-2 border-[#FF7900]/40 shadow-[0_20px_50px_rgba(0,0,0,0.85)] group bg-white">
                  <img
                    src={generatedTicketUrl}
                    alt="Invitation officielle personnalisée La Nuit des Chargés"
                    className="w-full h-auto block rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              )}

              {/* Récapitulatif des coordonnées de la personne */}
              {ticketDetails && (
                <div className="bg-[#181818] border border-white/10 rounded-xl p-3.5 my-4 max-w-[380px] mx-auto text-left shadow-lg">
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
                    className="w-full py-3.5 px-5 rounded-xl bg-[#FF7900] hover:bg-[#ff9433] text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(255,121,0,0.35)] cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Télécharger mon invitation (PNG)</span>
                  </a>

                  {/* Bouton de Partage WhatsApp */}
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 px-4 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager avec un ami sur WhatsApp</span>
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

              <p className="text-[11.5px] text-zinc-400 mt-4 leading-relaxed">
                💡 Astuce : Sur mobile, effectue un appui long sur l'image pour l'enregistrer instantanément dans ta galerie.
              </p>

              {/* Bouton Recommencer / Enregistrer un autre */}
              <div className="pt-5 mt-5 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-[#FF7900] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réserver un autre Pass VIP ou corriger mes infos
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-zinc-400 text-xs">
          <p>© 2026 La Nuit des Chargés • Plateforme officielle de réservation.</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            L'abus d'alcool est dangereux pour la santé. Événement réservé aux personnes majeures.
          </p>
        </footer>
      </main>
    </div>
  );
}
