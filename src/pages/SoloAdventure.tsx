import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { Database } from '../types/supabase';
import { displayCafeTag } from '../utils/display';
import { Coffee, Search } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingIndicator from '../components/LoadingIndicator';
import FormStatus from '../components/FormStatus';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Cafe = Database['public']['Tables']['cafes']['Row'];
type City = Database['public']['Tables']['cities']['Row'];

const CAFE_TAGS = ['quiet', 'lively', 'work-friendly', 'cozy', 'modern', 'traditional'];
const PRICE_BRACKETS = ['low', 'mid', 'high'];

const SoloAdventure: React.FC = () => {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Cafe[] | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(new Date());
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  const [searchCriteria, setSearchCriteria] = useState({
    city: '',
    timePreference: '',
    tags: [] as string[],
    price_bracket: '',
  });

  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase.from('cities').select('*').order('name');
      if (error) {
        setError(t('solo.errorCities'));
      } else {
        setCities(data);
        if (data.length > 0) {
          setSearchCriteria(prev => ({ ...prev, city: data[0].name }));
        }
      }
    };
    fetchCities();
  }, [t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setSearchCriteria(prev => {
      const newTags = checked
        ? [...prev.tags, value]
        : prev.tags.filter(tag => tag !== value);
      return { ...prev, tags: newTags };
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-cafe', {
        body: searchCriteria,
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error.message);

      setResults(data.cafes);
    } catch (err: any) {
      setError(err.message || t('solo.errorSearch'));
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (cafeId: string) => {
    if (!scheduleDate) {
      setError(t('solo.errorDate'));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(t('solo.errorUser'));
      return;
    }

    try {
      const { error } = await supabase.from('solo_adventures').insert({
        user_id: user.id,
        cafe_id: cafeId,
        adventure_date: scheduleDate.toISOString(),
      });

      if (error) throw error;

      setScheduleSuccess(`${t('solo.scheduleSuccess')} ${scheduleDate.toLocaleDateString()}`);
      setTimeout(() => setScheduleSuccess(null), 3000);

    } catch (err: any) {
      setError(err.message || t('solo.errorSchedule'));
    }
  };

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800 flex items-center justify-center gap-2">
            <Coffee size={32} /> {t('solo.title')}
          </h1>
          <p className="text-lg text-gray-600 mt-2">{t('solo.subtitle')}</p>
        </div>

        <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">{t('solo.cityLabel')}</label>
              <select id="city" name="city" value={searchCriteria.city} onChange={handleInputChange} className="input-field w-full" required>
                {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="price_bracket" className="block text-sm font-medium text-gray-700 mb-1">{t('account.priceBracketTitle')}</label>
              <div className="flex gap-4">
                {PRICE_BRACKETS.map(p => (
                  <label key={p} className="flex items-center gap-2">
                    <input type="radio" name="price_bracket" value={p} checked={searchCriteria.price_bracket === p} onChange={handleInputChange} className="radio radio-primary" />
                    {t(`account.priceBrackets.${p}`)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.tagsTitle')}</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CAFE_TAGS.map(tag => (
                <label key={tag} className="flex items-center gap-2">
                  <input type="checkbox" value={tag} checked={searchCriteria.tags.includes(tag)} onChange={handleTagChange} className="checkbox checkbox-primary" />
                  {displayCafeTag(tag)}
                </label>
              ))}
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button type="submit" className="btn-primary btn-lg" disabled={loading}>
              <Search size={20} className="mr-2" />
              {loading ? t('common.loading') : t('solo.searchButton')}
            </button>
          </div>
        </form>

        {loading && <LoadingIndicator />}
        {error && <FormStatus type="error" message={error} />}
        
        {results && (
          <div>
            <h2 className="text-2xl font-bold mb-4">{t('solo.resultsTitle')}</h2>
            {results.length === 0 ? (
              <p className="text-gray-500">{t('solo.noResults')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map(cafe => (
                  <div key={cafe.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
                    <h3 className="text-xl font-bold text-primary-700">{cafe.name}</h3>
                    <p className="text-gray-500 text-sm mb-2">{cafe.address}</p>
                    <div className="flex-grow">
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cafe.tags?.map(tag => (
                          <span key={tag} className="badge-primary">{displayCafeTag(tag)}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                      <DatePicker
                        selected={scheduleDate}
                        onChange={(date: Date) => setScheduleDate(date)}
                        className="input-field w-full"
                        minDate={new Date()}
                        dateFormat="PPP"
                      />
                      <button onClick={() => handleSchedule(cafe.id)} className="btn-secondary w-full">
                        {t('solo.scheduleButton')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {scheduleSuccess && <FormStatus type="success" message={scheduleSuccess} />}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default SoloAdventure; 