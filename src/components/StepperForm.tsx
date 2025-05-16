/**  @cursor

DOEL
Maak een herbruikbare React-component 〈StepperForm〉 voor Anemi Meets.

STACK
React 18 + Vite + TailwindCSS + i18next.

EISEN
1. Multi-step formulier met voortgangsbalk (Zeigarnik-effect). 
   • Steps: Gegevens → Datum&Tijd → Café → Bevestigen.
   • Toon %-balk bovenaan, breedte = huidige step / total * 100.
2. Beperk keuzestress (Choice Paradox):
   • Toon per step slechts de relevante inputs.
   • "Volgende"-knop pas enabled zodra verplichte velden zijn ingevuld.
3. Micro-interacties:
   • Knop: `hover:scale-105 transition` & kort "schud"-effect bij invalid submit.
   • Loading-spinners (Tailwind `animate-spin`) tijdens async opslaan.
4. Bevestigingsscherm:
   • Confetti-animatie (import `@lottiefiles/react-lottie-player`).
   • Koptekst + korte boodschap in gekozen taal.
   • CTA-knop "Terug naar start".
5. Taalondersteuning
   • Prop `locale` (`'nl' | 'en'`). 
   • Tekstobject `translations = { nl:{…}, en:{…} }`.
6. Kleurpalet:
   • Basisblauw `#1573ff` voor vertrouwen.
   • Accent oranje `#ff914d` voor CTA's.
   • Rustige achtergrond `#fff7f3`.
7. Exporteer als default:  
   ```tsx
   export default function StepperForm(props: { locale?: 'nl'|'en' }) { … }
Uitleg in code-comments zodat een beginner snapt wat er gebeurt.
#endregion */ 

import React, { useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
// Confetti animatie-bestand (bijv. public/confetti.json)
// Download een confetti lottie van lottiefiles.com en plaats in public/confetti.json

// --- Vertalingen ---
const translations = {
  nl: {
    steps: ['Gegevens', 'Datum & Tijd', 'Café', 'Bevestigen'],
    next: 'Volgende',
    prev: 'Vorige',
    submit: 'Bevestigen',
    required: 'Verplicht veld',
    gegevens: {
      title: 'Jouw gegevens',
      name: 'Naam',
      email: 'E-mailadres',
    },
    datetime: {
      title: 'Kies datum & tijd',
      date: 'Datum',
      time: 'Tijd',
      morning: 'Ochtend',
      afternoon: 'Middag',
      evening: 'Avond',
    },
    cafe: {
      title: 'Kies een café',
      select: 'Selecteer café',
    },
    confirm: {
      title: 'Bevestig je afspraak',
      info: 'Controleer je gegevens en bevestig.',
    },
    success: {
      title: 'Gelukt!',
      message: 'Je afspraak is succesvol aangemaakt. Je ontvangt binnenkort een bevestiging per e-mail.',
      button: 'Terug naar start',
    },
    cta: 'Wil jij ook terug naar echte connecties? Registreer dan nu!',
    register: 'Account aanmaken',
  },
  en: {
    steps: ['Details', 'Date & Time', 'Café', 'Confirm'],
    next: 'Next',
    prev: 'Back',
    submit: 'Confirm',
    required: 'Required',
    gegevens: {
      title: 'Your details',
      name: 'Name',
      email: 'Email',
    },
    datetime: {
      title: 'Choose date & time',
      date: 'Date',
      time: 'Time',
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
    },
    cafe: {
      title: 'Choose a café',
      select: 'Select café',
    },
    confirm: {
      title: 'Confirm your meetup',
      info: 'Check your details and confirm.',
    },
    success: {
      title: 'Success!',
      message: 'Your meetup was created successfully. You will receive a confirmation soon.',
      button: 'Back to Home',
    },
    cta: 'Want to reconnect in real life? Register now!',
    register: 'Create account',
  },
};

// --- Dummy cafés ---
const cafes = [
  { id: 1, name: 'Café de Dijk' },
  { id: 2, name: 'Coffee & More' },
  { id: 3, name: 'Barista Bar' },
];

// --- StepperForm component ---
export default function StepperForm({ locale = 'nl' }: { locale?: 'nl' | 'en' }) {
  // --- State voor formulier ---
  const [step, setStep] = useState(0); // 0 = eerste stap
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false); // Voor schud-animatie
  const [success, setSuccess] = useState(false);
  // Formulierdata
  const [form, setForm] = useState({
    name: '',
    email: '',
    date: '',
    time: '',
    cafe: '',
  });
  // --- Vertalingen ophalen ---
  const t = (key: string) => {
    const keys = key.split('.');
    let val: any = translations[locale];
    for (const k of keys) val = val?.[k];
    return val || key;
  };
  // --- Validatie per stap ---
  const isStepValid = () => {
    if (step === 0) return form.name.trim() && form.email.trim();
    if (step === 1) return form.date && form.time;
    if (step === 2) return form.cafe;
    return true;
  };
  // --- Voortgang in procenten ---
  const progress = ((step + (success ? 1 : 0)) / 4) * 100;

  // --- Handlers ---
  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!isStepValid()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setStep((s) => s + 1);
  }
  function handlePrev() {
    setStep((s) => Math.max(0, s - 1));
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isStepValid()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setLoading(true);
    // Simuleer async opslaan
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  }

  // --- UI per stap ---
  function StepContent() {
    switch (step) {
      case 0:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#1573ff]">{t('gegevens.title')}</h2>
            <div className="mb-4 text-left">
              <label className="block mb-1">{t('gegevens.name')} <span className="text-[#ff914d]">*</span></label>
              <input
                className="input-field w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1573ff]"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="mb-2 text-left">
              <label className="block mb-1">{t('gegevens.email')} <span className="text-[#ff914d]">*</span></label>
              <input
                className="input-field w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1573ff]"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#1573ff]">{t('datetime.title')}</h2>
            <div className="mb-4 text-left">
              <label className="block mb-1">{t('datetime.date')} <span className="text-[#ff914d]">*</span></label>
              <input
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1573ff]"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="mb-2 text-left">
              <label className="block mb-1">{t('datetime.time')} <span className="text-[#ff914d]">*</span></label>
              <div className="flex gap-3">
                {['morning', 'afternoon', 'evening'].map(tijd => (
                  <button
                    key={tijd}
                    type="button"
                    className={`px-4 py-2 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-[#1573ff] ${form.time === tijd ? 'bg-[#1573ff] text-white' : 'bg-white border-gray-300 text-[#1573ff]'} hover:scale-105`}
                    onClick={() => setForm(f => ({ ...f, time: tijd }))}
                  >
                    {t(`datetime.${tijd}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#1573ff]">{t('cafe.title')}</h2>
            <div className="mb-4 text-left">
              <label className="block mb-1">{t('cafe.select')} <span className="text-[#ff914d]">*</span></label>
              <select
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1573ff]"
                value={form.cafe}
                onChange={e => setForm(f => ({ ...f, cafe: e.target.value }))}
                required
              >
                <option value="">--</option>
                {cafes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#1573ff]">{t('confirm.title')}</h2>
            <p className="mb-4 text-gray-700">{t('confirm.info')}</p>
            <div className="bg-white/80 rounded-xl p-4 mb-4 text-left">
              <div><b>{t('gegevens.name')}:</b> {form.name}</div>
              <div><b>{t('gegevens.email')}:</b> {form.email}</div>
              <div><b>{t('datetime.date')}:</b> {form.date}</div>
              <div><b>{t('datetime.time')}:</b> {t(`datetime.${form.time}`)}</div>
              <div><b>{t('cafe.select')}:</b> {form.cafe}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  // --- Bevestigingsscherm met confetti ---
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff7f3] px-4">
        <Player
          autoplay
          loop={false}
          src="/confetti.json"
          style={{ height: '200px', width: '200px' }}
        />
        <h1 className="text-3xl font-bold text-[#1573ff] mt-4 mb-2">{t('success.title')}</h1>
        <p className="text-lg text-gray-700 mb-6">{t('success.message')}</p>
        <a
          href="/"
          className="bg-[#1573ff] text-white px-6 py-3 rounded-2xl font-medium hover:bg-[#125fcc] transition"
        >
          {t('success.button')}
        </a>
        <div className="mt-8 bg-white/80 rounded-xl p-6 shadow text-center flex flex-col items-center">
          <p className="text-lg text-[#1a1a1a] mb-3">{t('cta')}</p>
          <a
            href="/signup"
            className="bg-[#ff914d] text-[#1a1a1a] px-6 py-3 rounded-2xl font-medium hover:bg-[#ffb184] transition mt-2"
          >
            {t('register')}
          </a>
        </div>
      </div>
    );
  }

  // --- Hoofdformulier ---
  return (
    <div className="min-h-screen flex flex-col items-center bg-[#fff7f3] py-8 px-4">
      {/* Voortgangsbalk */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex justify-between mb-2">
          {translations[locale].steps.map((s, i) => (
            <span key={i} className={`text-xs font-medium ${i === step ? 'text-[#1573ff]' : 'text-gray-400'}`}>{s}</span>
          ))}
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1573ff] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {/* Formulier */}
      <form
        onSubmit={step === 3 ? handleSubmit : handleNext}
        className={`bg-white/80 rounded-2xl shadow p-8 w-full max-w-xl transition ${shake ? 'animate-shake' : ''}`}
        style={{ minHeight: 320 }}
      >
        <StepContent />
        <div className="flex justify-between mt-8">
          {step > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="px-6 py-2 rounded-2xl font-medium bg-gray-200 text-gray-700 hover:scale-105 transition"
            >
              {t('prev')}
            </button>
          )}
          <div className="flex-1" />
          {step < 3 && (
            <button
              type="submit"
              className={`px-6 py-2 rounded-2xl font-medium bg-[#1573ff] text-white ml-2 hover:scale-105 transition ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isStepValid()}
            >
              {t('next')}
            </button>
          )}
          {step === 3 && (
            <button
              type="submit"
              className={`px-6 py-2 rounded-2xl font-medium bg-[#ff914d] text-[#1a1a1a] ml-2 hover:scale-105 transition flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading && <span className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-[#ff914d] rounded-full inline-block"></span>}
              {t('submit')}
            </button>
          )}
        </div>
      </form>
      {/* Uitleg voor beginners */}
      <div className="mt-8 text-gray-500 text-sm max-w-xl text-left">
        {/*
          Deze StepperForm is opgebouwd uit 4 stappen. Elke stap toont alleen de relevante velden.
          De voortgangsbalk bovenaan laat zien hoe ver je bent (Zeigarnik-effect).
          De "Volgende" knop is pas actief als alle verplichte velden zijn ingevuld.
          Bij een ongeldige submit schudt het formulier kort.
          Tijdens het opslaan zie je een spinner.
          Na bevestigen verschijnt een confetti-animatie en een call-to-action.
          De kleuren zijn gekozen voor vertrouwen en rust.
          Taal wissel je via de prop `locale`.
        */}
      </div>
      {/* Animatie shake (Tailwind) */}
      <style>{`
        .animate-shake {
          animation: shake 0.4s;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
} 