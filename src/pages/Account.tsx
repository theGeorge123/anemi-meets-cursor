import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../components/ErrorBoundary';
import { requestBrowserNotificationPermission } from '../utils/browserNotifications';
import { User, Cake, Type, Languages, Bell, Eye, Trash2, Edit } from 'lucide-react';
import { Database } from '../types/supabase';
import { useNavigate } from 'react-router-dom';
import { displayCafeTag } from '../utils/display';
import Toast from '../components/Toast';

type Profile = Database['public']['Tables']['profiles']['Row'];
type CafePreferences = {
  tags: string[];
  price_bracket: string;
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Nederlands' },
];

const CAFE_TAGS = ['vegan', 'cozy', 'laptop_friendly', 'quiet', 'outdoor_seating'];

const PRICE_BRACKETS = ['low', 'mid', 'high'];

const EMOJI_OPTIONS = [
  '😀', '😎', '🥳', '☕️', '🐶', '🐱', '🦄', '🌈', '🍰', '🎉', '🚴', '🧑‍🤝‍🧑',
  '🧑‍💻', '📚', '🌻', '🍀',
];

// Reusable Modal Component for Editing Fields
const EditFieldModal: React.FC<{
  field: string;
  label: string;
  currentValue: any;
  onSave: (field: string, value: any) => void;
  onClose: () => void;
  inputType?: 'text' | 'number' | 'textarea';
}> = ({ field, label, currentValue, onSave, onClose, inputType = 'text' }) => {
  const [value, setValue] = useState(currentValue);

  const handleSave = () => {
    onSave(field, value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">{label}</h3>
        {inputType === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            className="input-field w-full"
            rows={4}
          />
        ) : (
          <input
            type={inputType}
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            className="input-field w-full"
          />
        )}
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Account: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [cafePreferences, setCafePreferences] = useState<CafePreferences>({
    tags: [],
    price_bracket: '',
  });

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);
  const [savePrefsSuccess, setSavePrefsSuccess] = useState<boolean>(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;

      if (data) {
        setProfile(data);
        i18n.changeLanguage(data.preferred_language || 'en');
        if (data.cafe_preferences && typeof data.cafe_preferences === 'object') {
          setCafePreferences(data.cafe_preferences as CafePreferences);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [i18n]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdate = async (field: string, value: any) => {
    if (!profile) return;
    const isPrefs = field === 'cafe_preferences';
    try {
      if (isPrefs) {
        setIsSavingPrefs(true);
        setSavePrefsSuccess(false);
      }
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', profile.id);
      if (error) throw error;
      await fetchProfile(); // Refetch profile to get latest data
      if (isPrefs) setSavePrefsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setEditingField(null);
      if (isPrefs) setIsSavingPrefs(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('account.deleteConfirm'))) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error(t('account.errorSession'));
      const response = await supabase.functions.invoke('delete-account');
      if (response.error) throw new Error(response.error.message);
      await supabase.auth.signOut();
      navigate('/');
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreferencesChange = (
    type: 'tags' | 'price_bracket',
    value: string,
    isChecked?: boolean,
  ) => {
    setCafePreferences((prev) => {
      const newPrefs = { ...prev };
      if (type === 'tags') {
        const currentTags = newPrefs.tags || [];
        newPrefs.tags = isChecked
          ? [...currentTags, value]
          : currentTags.filter((tag) => tag !== value);
      } else {
        newPrefs.price_bracket = value;
      }
      return newPrefs;
    });
  };

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    handleUpdate('emoji', emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const InfoRow: React.FC<{
    label: string;
    value: React.ReactNode;
    field: string;
    icon: React.ReactNode;
  }> = ({ label, value, field, icon }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-600">{value || t('account.notSpecified')}</span>
        <button onClick={() => setEditingField(field)} className="text-primary-500 hover:text-primary-700">
          <Edit size={16} />
        </button>
      </div>
    </div>
  );

  const handlePasswordReset = async () => {
    // Implement password reset logic
    console.log('Password reset');
  };

  if (loading && !profile) return <div className="text-center p-8">{t('account.loading')}</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!profile) return <div className="text-center p-4">{t('account.notAvailable')}</div>;

  return (
    <ErrorBoundary>
      {editingField && (
        <EditFieldModal
          field={editingField}
          label={t(`account.${editingField}`)}
          currentValue={(profile as any)[editingField]}
          onSave={handleUpdate}
          onClose={() => setEditingField(null)}
          inputType={editingField === 'bio' ? 'textarea' : editingField === 'age' ? 'number' : 'text'}
        />
      )}
      <div className="container mx-auto p-4 sm:p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 text-center relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="relative w-32 h-32 mx-auto mb-4 group"
              >
                <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center text-6xl shadow-inner">
                  {profile.emoji || '👤'}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-opacity">
                  <Edit size={32} className="text-white opacity-0 group-hover:opacity-100" />
                </div>
              </button>
              {showEmojiPicker && (
                <div className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-2">
                  <div className="bg-white rounded-lg shadow-2xl p-4 border border-gray-200 min-w-[260px]">
                    <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 mb-2">{t('account.emoji')}</h3>
                    <div className="grid grid-cols-6 gap-2 mb-2">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          className={`text-2xl p-2 rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 hover:bg-primary-50 hover:border-primary-300 ${profile.emoji === emoji ? 'bg-primary-100 border-primary-400' : 'border-transparent'}`}
                          onClick={() => {
                            onEmojiClick({ emoji });
                          }}
                          aria-label={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <button className="text-xs text-gray-500 hover:text-primary-600" onClick={() => setShowEmojiPicker(false)}>{t('common.cancel')}</button>
                  </div>
                </div>
              )}
              <h2 className="text-2xl font-bold">{profile.fullname}</h2>
              <p className="text-gray-500">{profile.email}</p>
              <div className="mt-4 flex flex-col gap-2">
                <button onClick={() => setEditingField('email')} className="btn-secondary btn-sm">{t('account.changeEmail')}</button>
                <button onClick={handlePasswordReset} className="btn-secondary btn-sm">{t('account.password')}</button>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-2">{t('account.profileInfo')}</h3>
              <InfoRow label={t('account.name')} value={profile.fullname} field="fullname" icon={<User size={18} />} />
              <InfoRow label={t('account.age')} value={profile.age || t('account.immortal')} field="age" icon={<Cake size={18} />} />
              <InfoRow label={t('account.gender')} value={profile.gender} field="gender" icon={<Type size={18} />} />
              <InfoRow label={t('account.bio')} value={profile.bio} field="bio" icon={<User size={18} />} />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-2">{t('account.settings')}</h3>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Languages size={18} />
                        <label htmlFor="language-select">{t('account.language')}</label>
                    </div>
                    <select id="language-select" value={i18n.language} onChange={(e) => handleUpdate('preferred_language', e.target.value)} className="input-field py-1">
                        {LANGUAGES.map((lang) => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                    </select>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3"><Bell size={18} /><label>{t('account.wantsNotifications')}</label></div>
                    <input type="checkbox" checked={profile.wantsnotifications || false} onChange={(e) => handleUpdate('wantsnotifications', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"/>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3"><Bell size={18} /><label>{t('account.wantsReminders')}</label></div>
                    <input type="checkbox" checked={profile.wantsreminders || false} onChange={(e) => handleUpdate('wantsreminders', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"/>
                </div>
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3"><Eye size={18} /><label>{t('account.isPrivate')}</label></div>
                    <input type="checkbox" checked={profile.isprivate || false} onChange={(e) => handleUpdate('isprivate', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"/>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">{t('account.tastePreferences')}</h3>
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">{t('account.tagsTitle')}</h4>
                <div className="flex flex-wrap gap-2">
                  {CAFE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handlePreferencesChange('tags', tag, !cafePreferences.tags.includes(tag))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        cafePreferences.tags.includes(tag)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {displayCafeTag(tag)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">{t('account.priceBracketTitle')}</h4>
                <div className="flex flex-wrap gap-2">
                  {PRICE_BRACKETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePreferencesChange('price_bracket', p)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        cafePreferences.price_bracket === p
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {t(`account.priceBrackets.${p}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-right">
                <button onClick={() => handleUpdate('cafe_preferences', cafePreferences)} className="btn-primary" disabled={isSavingPrefs}>
                  {isSavingPrefs ? t('account.saving') : t('account.savePreferences')}
                </button>
                {savePrefsSuccess && <span className="text-green-600 ml-4">{t('account.savedSuccess')}</span>}
              </div>
            </div>

            <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-2">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-700">{t('account.dangerZone')}</h3>
              <p className="text-red-600 text-sm mb-4">{t('account.dangerZoneInfo')}</p>
              <button onClick={handleDeleteAccount} className="btn-danger" disabled={isDeleting}>
                {isDeleting ? t('common.loading') : t('account.deleteAccount')}
              </button>
              {deleteError && <p className="text-red-500 mt-2 text-sm">{deleteError}</p>}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Account;
