import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../components/ErrorBoundary';
import { requestBrowserNotificationPermission } from '../utils/browserNotifications';
import { User } from 'lucide-react';
import { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Nederlands' },
];

const Account: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');

  const [isUpdatingEmoji, setIsUpdatingEmoji] = useState<boolean>(false);
  const [emojiError, setEmojiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not logged in');
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile(data);
          setPreferredLanguage(data.preferred_language || 'en');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async (field: string, value: any) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }
      setProfile({ ...profile, [field]: value });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEditingField(null);
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setPreferredLanguage(newLang);
    await handleUpdate('preferred_language', newLang);
    i18n.changeLanguage(newLang);
  };

  const updateProfileEmoji = async (emoji: string) => {
    if (!profile) return;

    setIsUpdatingEmoji(true);
    setEmojiError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ emoji })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }
      setProfile({ ...profile, emoji });
    } catch (err: any) {
      setEmojiError(err.message);
    } finally {
      setIsUpdatingEmoji(false);
    }
  };

  const handleNotificationsToggle = async (wantsNotifications: boolean) => {
    if (!profile) return;
    try {
      if (wantsNotifications) {
        const permission = await requestBrowserNotificationPermission();
        if (permission !== 'granted') {
          return;
        }
      }
      await handleUpdate('wantsnotifications', wantsNotifications);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>{t('account.loading', 'Loading...')}</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!profile)
    return (
      <div className="text-center p-4">{t('account.notAvailable')}</div>
    );

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={48} className="text-gray-500" />
                  </div>
                )}
                <button
                  onClick={() => setEditingField('emoji')}
                  className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow"
                >
                  {profile.emoji || '👤'}
                </button>
              </div>
              {editingField === 'emoji' && (
                <div className="mb-4">
                  <input
                    type="text"
                    defaultValue={profile.emoji || ''}
                    onBlur={(e) => updateProfileEmoji(e.target.value)}
                    className="input-field text-center"
                    maxLength={2}
                  />
                  {isUpdatingEmoji && <p>Updating...</p>}
                  {emojiError && <p className="text-red-500">{emojiError}</p>}
                </div>
              )}
              <h2 className="text-2xl font-bold">{profile.fullname}</h2>
              <p className="text-gray-500">{profile.email}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h3 className="text-xl font-bold mb-4">{t('account.settings')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="language-select">{t('account.language')}</label>
                  <select
                    id="language-select"
                    value={preferredLanguage}
                    onChange={handleLanguageChange}
                    className="input-field"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="notifications-toggle">
                    {t('account.browserNotifications')}
                  </label>
                  <input
                    type="checkbox"
                    id="notifications-toggle"
                    checked={profile.wantsnotifications || false}
                    onChange={(e) =>
                      handleNotificationsToggle(e.target.checked)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">{t('account.activity')}</h3>
              <div className="flex items-center gap-4">
                <p className="mobile-text mb-1">{t('account.lastSeen')}:</p>
                <p className="mobile-text text-gray-500">
                  {profile.lastseen
                    ? new Date(profile.lastseen).toLocaleString()
                    : t('account.notAvailable')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Account;
