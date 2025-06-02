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
import { useSwipeable } from 'react-swipeable';
import { useTranslation } from 'react-i18next';
// Confetti animatie-bestand (bijv. public/confetti.json)
// Download een confetti lottie van lottiefiles.com en plaats in public/confetti.json

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
  // --- i18n hook ---
  const { t, i18n } = useTranslation('stepperForm');
  // Forceer juiste taal indien nodig
  if (i18n.language !== locale) i18n.changeLanguage(locale);

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
          <div className="space-y-6">
            <h2 className="mobile-heading text-primary-700">{t('gegevens.title')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block mobile-text font-semibold text-primary-700 mb-2">
                  {t('gegevens.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field w-full"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block mobile-text font-semibold text-primary-700 mb-2">
                  {t('gegevens.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field w-full"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="mobile-heading text-primary-700">{t('datetime.title')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block mobile-text font-semibold text-primary-700 mb-2">
                  {t('datetime.date')} <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field w-full"
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block mobile-text font-semibold text-primary-700 mb-2">
                  {t('datetime.time')} <span className="text-red-500">*</span>
                </label>
                <select
                  className="input-field w-full"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  required
                >
                  <option value="">{t('select')}</option>
                  <option value="morning">{t('datetime.morning')}</option>
                  <option value="afternoon">{t('datetime.afternoon')}</option>
                  <option value="evening">{t('datetime.evening')}</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="mobile-heading text-primary-700">{t('cafe.title')}</h2>
            <div className="space-y-4">
              <label className="block mobile-text font-semibold text-primary-700 mb-2">
                {t('cafe.select')} <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field w-full"
                value={form.cafe}
                onChange={e => setForm(f => ({ ...f, cafe: e.target.value }))}
                required
              >
                <option value="">{t('select')}</option>
                {cafes.map(cafe => (
                  <option key={cafe.id} value={cafe.name}>{cafe.name}</option>
                ))}
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="mobile-heading text-primary-700">{t('confirm.title')}</h2>
            <p>{t('confirm.info')}</p>
            <ul className="list-disc ml-6">
              <li>{t('gegevens.name')}: {form.name}</li>
              <li>{t('gegevens.email')}: {form.email}</li>
              <li>{t('datetime.date')}: {form.date}</li>
              <li>{t('datetime.time')}: {t(`datetime.${form.time}`)}</li>
              <li>{t('cafe.select')}: {form.cafe}</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  }

  // --- Bevestigingsscherm met confetti ---
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="card max-w-md w-full text-center">
          <div className="mb-6">
            <Player
              autoplay
              loop
              src="/confetti.json"
              style={{ width: '100%', height: '200px' }}
            />
          </div>
          <h2 className="mobile-heading text-primary-700 mb-4">{t('success.title')}</h2>
          <p className="mobile-text text-gray-600 mb-8">{t('success.message')}</p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary w-full"
            >
              {t('success.button')}
            </button>
            <div className="pt-4 border-t border-gray-200">
              <p className="mobile-text text-gray-600 mb-4">{t('cta')}</p>
              <button
                onClick={() => window.location.href = '/register'}
                className="btn-secondary w-full"
              >
                {t('register')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Swipe handlers ---
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (step < 3 && isStepValid()) setStep(step + 1);
    },
    onSwipedRight: () => {
      if (step > 0) setStep(step - 1);
    },
    trackTouch: true,
    trackMouse: false,
  });

  // --- Hoofdformulier ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2f1] to-[#b2dfdb]">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              {(t('steps', { returnObjects: true }) as string[]).map((stepTitle: any, index: number) => (
                <div
                  key={index}
                  className={`flex-1 text-center ${
                    index <= step ? 'text-primary-700' : 'text-gray-400'
                  }`}
                >
                  <div className="mobile-text font-semibold">{stepTitle}</div>
                </div>
              ))}
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full">
              <div
                className="absolute h-full bg-primary-100 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="card" {...swipeHandlers}>
            <form
              onSubmit={step === 3 ? handleSubmit : handleNext}
              className={`space-y-6 ${shake ? 'animate-shake' : ''}`}
            >
              <StepContent />

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="btn-secondary flex-1 active:scale-95 active:bg-primary-100"
                  >
                    {t('prev')}
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary flex-1 active:scale-95 active:bg-[#80cbc4]"
                  disabled={!isStepValid() || loading}
                >
                  {step === 3
                    ? t('submit')
                    : t('next')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 