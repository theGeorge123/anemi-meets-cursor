import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabaseClient';
import ErrorBoundary from '@/components/ErrorBoundary';
import FormStatus from '@/components/FormStatus';
import SkeletonLoader from '@/components/SkeletonLoader';
import { Cafe } from '@/types';
import SimpleDateTimePicker from '@/components/SimpleDateTimePicker';

type ScheduleStatus = {
  type: 'success' | 'error' | 'info';
  msg: string;
} | null;

export default function SoloAdventure(): JSX.Element {
  const { t } = useTranslation();

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [randomCafe, setRandomCafe] = useState<Cafe | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [adventureDate, setAdventureDate] = useState<Date | null>(null);
  const [adventureTime, setAdventureTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>(null);
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCafes = async () => {
      setLoading(true);
      const { data, error: dbError } = await supabase.from('cafes').select('*');
      if (dbError) {
        setError(t('solo.error.cafes'));
        console.error(dbError);
      } else {
        // Map Supabase response to full Cafe type
        const cafesData = (Array.isArray(data) ? data : []).map(
          (cafe: Record<string, unknown>) => ({
            id: typeof cafe.id === 'string' ? cafe.id : '',
            created_at: typeof cafe.created_at === 'string' ? cafe.created_at : '',
            name: typeof cafe.name === 'string' ? cafe.name : '',
            address: typeof cafe.address === 'string' ? cafe.address : null,
            city: typeof cafe.city === 'string' ? cafe.city : null,
            gmaps_url: typeof cafe.gmaps_url === 'string' ? cafe.gmaps_url : null,
            verified: typeof cafe.verified === 'boolean' ? cafe.verified : null,
            story: typeof cafe.story === 'string' ? cafe.story : null,
            specialty: typeof cafe.specialty === 'string' ? cafe.specialty : null,
            mission: typeof cafe.mission === 'string' ? cafe.mission : null,
            tags: Array.isArray(cafe.tags)
              ? cafe.tags.filter((t): t is string => typeof t === 'string')
              : [],
            price_bracket: typeof cafe.price_bracket === 'string' ? cafe.price_bracket : undefined,
          }),
        );
        setCafes(cafesData);
      }
      setLoading(false);
    };
    fetchCafes();
  }, [t]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    cafes.forEach((cafe) => {
      cafe.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [cafes]);

  const priceRanges = useMemo(() => {
    const prices = new Set<string>();
    cafes.forEach((cafe) => {
      if (cafe.price_bracket) {
        prices.add(cafe.price_bracket);
      }
    });
    return Array.from(prices).sort((a, b) => a.length - b.length);
  }, [cafes]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const filteredCafes = useMemo(() => {
    return cafes.filter((cafe) => {
      const tagsMatch =
        selectedTags.length === 0 || selectedTags.every((tag) => cafe.tags?.includes(tag));
      const priceMatch = !selectedPrice || cafe.price_bracket === selectedPrice;
      return tagsMatch && priceMatch;
    });
  }, [cafes, selectedTags, selectedPrice]);

  const handleFindRandomCafe = () => {
    setRandomCafe(null);
    setSelectedCafe(null);
    setScheduleStatus(null);
    setSuggestionMessage(null);

    let cafeToSuggest: Cafe | null = null;

    if (filteredCafes.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredCafes.length);
      cafeToSuggest = filteredCafes[randomIndex];
    } else if (cafes.length > 0) {
      const randomIndex = Math.floor(Math.random() * cafes.length);
      cafeToSuggest = cafes[randomIndex];
      setSuggestionMessage(t('solo.noMatchSuggestion'));
    }

    if (cafeToSuggest) {
      setRandomCafe(cafeToSuggest);
      setSelectedCafe(cafeToSuggest);
    } else {
      setScheduleStatus({ type: 'error', msg: t('solo.error.noMatch') });
    }
  };

  const handleSelectCafe = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setRandomCafe(null);
    setScheduleStatus(null);
    setSuggestionMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScheduleAdventure = async () => {
    if (!selectedCafe || !adventureDate || !adventureTime) {
      setScheduleStatus({ type: 'error', msg: t('solo.error.missingDateTime') });
      return;
    }
    setScheduling(true);
    setScheduleStatus(null);
    setSuggestionMessage(null);

    const timeSlotMap: { [key: string]: string } = {
      morning: '09:00:00',
      afternoon: '14:00:00',
      evening: '18:00:00',
    };
    const specificTime = timeSlotMap[adventureTime] || '09:00:00';

    try {
      const { error } = await supabase.functions.invoke('schedule-solo-adventure', {
        body: {
          cafeId: selectedCafe.id,
          date: adventureDate.toISOString().split('T')[0],
          time: specificTime,
        },
      });

      if (error) throw error;

      setScheduleStatus({
        type: 'success',
        msg: t('solo.successTimeSlot', {
          cafe: selectedCafe.name,
          date: adventureDate.toLocaleDateString(),
          timeSlot: t(`common.${adventureTime}`),
        }),
      });
    } catch (err: unknown) {
      let errorMessage = t('common.error');
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message: string }).message === 'string'
      ) {
        try {
          const parsed = JSON.parse((err as { message: string }).message);
          if (parsed.error) {
            errorMessage = parsed.error;
          }
        } catch (e) {
          errorMessage = (err as { message: string }).message;
        }
      }

      const formattedMessage = errorMessage
        .replace(/_/g, ' ')
        .replace(/(\w)/, (c) => c.toUpperCase());

      setScheduleStatus({ type: 'error', msg: formattedMessage });
    } finally {
      setScheduling(false);
    }
  };

  const formatTag = (tag: string) => {
    return tag.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto p-4 grid gap-10">
        <h1 className="text-4xl font-bold text-primary-800 text-center">{t('solo.title')}</h1>

        {selectedCafe && (
          <div className="bg-gradient-to-br from-[#fff7f3] to-[#b2dfdb]/30 p-6 rounded-2xl shadow-xl border border-white/50 animate-fade-in">
            {suggestionMessage && (
              <div className="mb-4">
                <FormStatus type="info" msg={suggestionMessage} />
              </div>
            )}
            <h2 className="text-2xl font-bold text-primary-800">{selectedCafe.name}</h2>
            <p className="text-gray-600 mt-1">{selectedCafe.address}</p>
            <p className="mt-4 text-primary-700">
              {randomCafe ? t('solo.randomSuggestion') : t('solo.yourChoice')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCafe.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                >
                  {formatTag(tag)}
                </span>
              ))}
            </div>

            <div className="mt-6 border-t border-primary-100 pt-4">
              <h3 className="font-semibold text-primary-800 mb-2">{t('solo.scheduleTitle')}</h3>
              <SimpleDateTimePicker
                selectedDate={adventureDate}
                onDateChange={setAdventureDate}
                selectedTime={adventureTime}
                onTimeChange={setAdventureTime}
              />
              <button
                onClick={handleScheduleAdventure}
                disabled={scheduling}
                className="w-full mt-4 bg-primary-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-primary-600 transition-all disabled:bg-gray-400"
              >
                {scheduling ? t('common.loading') : t('solo.scheduleButton')}
              </button>
              {scheduleStatus && (
                <div className="mt-4">
                  <FormStatus type={scheduleStatus.type} msg={scheduleStatus.msg} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Random Cafe Finder */}
        <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-primary-100/30">
          <h2 className="text-2xl font-semibold mb-4 text-primary-800">{t('solo.findTitle')}</h2>

          {/* Tag Filters */}
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">{t('solo.tags')}</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-4 py-2 rounded-full border-2 transition-all text-sm font-medium ${selectedTags.includes(tag) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white hover:border-primary-300'}`}
                >
                  {formatTag(tag)}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filters */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">{t('solo.price')}</h3>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((price) => (
                <button
                  key={price}
                  onClick={() => setSelectedPrice(price === selectedPrice ? null : price)}
                  className={`px-4 py-2 rounded-full border-2 transition-all text-sm font-medium ${selectedPrice === price ? 'bg-primary-500 text-white border-primary-500' : 'bg-white hover:border-primary-300'}`}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFindRandomCafe}
            className="w-full bg-secondary-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-secondary-600 transition-all transform hover:scale-102 active:bg-secondary-700 flex items-center justify-center gap-3 text-lg"
          >
            {t('solo.findButton')}
          </button>
        </div>

        {/* All Cafes List */}
        <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-primary-100/30">
          <h2 className="text-2xl font-semibold mb-4 text-primary-800">{t('solo.listTitle')}</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonLoader className="h-24" />
              <SkeletonLoader className="h-24" />
              <SkeletonLoader className="h-24" />
              <SkeletonLoader className="h-24" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cafes.map((cafe) => (
                <div
                  key={cafe.id}
                  onClick={() => handleSelectCafe(cafe)}
                  className="bg-white/80 p-4 rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <h3 className="font-bold text-primary-700">{cafe.name}</h3>
                  <p className="text-sm text-gray-600">{cafe.address}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cafe.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs"
                      >
                        {formatTag(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {!cafes && !error && <SkeletonLoader />}
        {error && <FormStatus type="error" msg={error} />}

        {scheduleStatus && !selectedCafe && (
          <div className="mt-4">
            <FormStatus type={scheduleStatus.type} msg={scheduleStatus.msg} />
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {t('solo.orSelect')}
          </h3>
          <button
            onClick={handleFindRandomCafe}
            className="w-full bg-secondary-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-secondary-600 transition-all transform hover:scale-102 active:bg-secondary-700 flex items-center justify-center gap-3 text-lg"
          >
            {t('solo.findButton')}
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}
