import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';
import { CheckCircle } from 'lucide-react';
import { displayCafeTag, displayPriceBracket } from '../utils/display';

type Cafe = Database['public']['Tables']['cafes']['Row'];

const Explore: React.FC = () => {
  const { t } = useTranslation();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCafes = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('cafes').select('*');
      if (!error && data) {
        setCafes(data as Cafe[]);
      } else {
        setCafes([]);
      }
      setLoading(false);
    };
    fetchCafes();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-700 mb-8 text-center">{t('explore.title', 'Explore Cafés')}</h1>
      {loading ? (
        <div className="text-center py-12 text-lg">{t('common.loading', 'Loading...')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cafes.map((cafe) => (
            <div
              key={cafe.id}
              className="bg-white rounded-xl shadow-md p-4 flex flex-col transition-transform hover:scale-105"
            >
              <img
                src={cafe.image_url || 'https://source.unsplash.com/400x200/?coffee,cafe'}
                alt={cafe.name}
                className="rounded-lg mb-4 h-40 object-cover"
              />
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-primary-700 mb-1">{cafe.name}</h2>
                {cafe.verified && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    {t('verified', 'Verified')}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-2">{cafe.address}</p>
              <p className="text-base text-gray-700 mb-4 line-clamp-2">{cafe.description}</p>
              {cafe.tags && cafe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {cafe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-semibold"
                    >
                      {displayCafeTag(tag, t)}
                    </span>
                  ))}
                </div>
              )}
              {cafe.price_bracket && (
                <div className="mb-4 text-sm text-primary-700 font-semibold">
                  {t('cafe.priceBracket', 'Price')}:{' '}
                  {displayPriceBracket(cafe.price_bracket, t)}
                </div>
              )}
              <button className="btn-primary mt-auto">{t('explore.viewDetails', 'View details')}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
