import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'vrouw', label: 'Vrouw' },
  { value: 'anders', label: 'Anders' },
  { value: 'wil_niet_zeggen', label: 'Wil ik niet zeggen' },
];

const UPDATES_EMAIL_KEY = 'anemi-updates-email';

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    gender: '',
  });
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (signUpError) {
      if (
        signUpError.message.toLowerCase().includes("already registered") ||
        signUpError.message.toLowerCase().includes("user already registered") ||
        signUpError.message.toLowerCase().includes("user already exists") ||
        signUpError.message.toLowerCase().includes("email address is already in use")
      ) {
        setError("Dit e-mailadres is al in gebruik. Probeer in te loggen of gebruik een ander e-mailadres.");
      } else {
        setError(signUpError.message);
      }
      return;
    }
    // Save gender in profiles table (if possible)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: form.email,
        full_name: '',
        bio: '',
        gender: form.gender,
      });
    }
    if (wantsUpdates) {
      localStorage.setItem(UPDATES_EMAIL_KEY, form.email);
    }
    setSuccess('Account aangemaakt! Check je e-mail om te bevestigen.');
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-primary-600 mb-8 text-center">Account aanmaken</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white/70 p-6 rounded-2xl shadow">
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            type="email"
            id="signup-email"
            className="input-field mt-1"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
            Wachtwoord
          </label>
          <input
            type="password"
            id="signup-password"
            className="input-field mt-1"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            Geslacht
          </label>
          <select
            id="gender"
            className="input-field mt-1"
            value={form.gender}
            onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
            required
          >
            <option value="">Maak een keuze</option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="updates-checkbox"
            checked={wantsUpdates}
            onChange={() => setWantsUpdates((v) => !v)}
            className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
          />
          <label htmlFor="updates-checkbox" className="text-sm text-gray-700 select-none">
            Houd mij op de hoogte van updates
          </label>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button type="submit" className="btn-primary w-full">Account aanmaken</button>
      </form>
      <div className="text-center mt-6">
        <button
          className="text-primary-600 underline hover:text-primary-800 text-sm"
          onClick={() => navigate('/login')}
        >
          Al een account? Inloggen
        </button>
      </div>
    </div>
  );
};

export default Signup; 