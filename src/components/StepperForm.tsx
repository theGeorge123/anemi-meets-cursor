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