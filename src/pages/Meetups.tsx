import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { getMeetupCount } from '../services/invitationService';
import { Database } from '../types/supabase';
import { hasBadge, awardBadge } from '../services/badgeService';
import { ErrorService } from '../services/error/ErrorService';

type MeetupRow = Database['public']['Tables']['invitations']['Row'];

const LOCAL_CACHE_KEY = 'meetups_cache_v1';

import type { TFunction } from 'i18next';

interface MeetupListItemProps {
  meetup: MeetupRow;
  onView: (id: string) => void;
  onJoin: (id: string) => void;
  t: TFunction;
  joining: boolean;
  joinLoadingId: string | null;
}

const MeetupListItem = React.memo(function MeetupListItem({
  meetup,
  onView,
  onJoin,
  t,
  joining,
  joinLoadingId,
}: MeetupListItemProps) {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-300" key={meetup.id}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="mobile-heading text-primary-700 mb-2">
            {meetup.cafe_id || t('meetups.untitled', 'Meetup')}
          </h2>
          <p className="mobile-text text-gray-600 mb-4 line-clamp-2">
            {meetup.personal_note || ''}
          </p>
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="mobile-text">
                {new Date(meetup.selected_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="mobile-text">{meetup.selected_time}</span>
            </div>
            {meetup.status && (
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${meetup.status === 'confirmed' ? 'bg-green-100 text-green-700' : meetup.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}`}
              >
                {t(`meetups.status.${meetup.status}`, meetup.status)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn-primary flex-1" onClick={() => onView(meetup.id)}>
            {t('meetups.view', 'Bekijk')}
          </button>
          <button
            className="btn-secondary flex-1 flex items-center justify-center"
            onClick={() => onJoin(meetup.id)}
            disabled={joining && joinLoadingId === meetup.id}
          >
            {joining && joinLoadingId === meetup.id ? (
              <>
                <span className="mr-2">
                  <svg className="animate-spin h-5 w-5 text-primary-600" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                </span>
                {t('common.loading')}
              </>
            ) : (
              t('meetups.join', 'Deelnemen')
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

const Meetups: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['meetups', 'common']);
  const [meetups, setMeetups] = useState<MeetupRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [usingCache, setUsingCache] = useState(false);
  const [joinLoadingId, setJoinLoadingId] = useState<string | null>(null);

  // Detecteer online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ophalen en cachen van meetups
  useEffect(() => {
    setLoading(true);
    setError(null);
    setUsingCache(false);
    const fetchMeetups = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(t('common:errorLoadingSession', 'Fout bij ophalen sessie.'));
        setLoading(false);
        return;
      }
      const session = sessionData?.session;
      if (!session?.user) {
        setError(t('meetups:notLoggedIn', 'Je moet ingelogd zijn om je meetups te zien.'));
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .or(
            `invitee_id.eq.${session.user.id},email_b.eq."${session.user.email}",email_a.eq."${session.user.email}"`,
          )
          .order('selected_date', { ascending: true });
        if (error || !data) throw error || new Error('No data');
        setMeetups(data || []);
        setLoading(false);
        setUsingCache(false);
        // Cache in localStorage
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data));
      } catch (err) {
        // Bij fout: probeer cache
        const cached = localStorage.getItem(LOCAL_CACHE_KEY);
        if (cached) {
          setMeetups(JSON.parse(cached));
          setUsingCache(true);
        } else {
          setMeetups([]);
        }
        const details = err instanceof Error ? err.message : String(err);
        setError(t('meetups:errorLoading', { details }));
        setLoading(false);
      }
    };
    fetchMeetups();
  }, [t, isOffline]);

  const filteredMeetups = useMemo(() => {
    return meetups
      .filter((meetup) => {
        const query = searchQuery.toLowerCase();
        return (
          (meetup.personal_note?.toLowerCase().includes(query) ||
            meetup.cafe_id?.toLowerCase().includes(query)) ??
          true
        );
      })
      .filter((meetup) => {
        const matchesStatus =
          filterStatus === 'all' || (meetup.status || 'upcoming') === filterStatus;
        return matchesStatus;
      });
  }, [meetups, searchQuery, filterStatus]);

  const handleViewMeetup = useCallback(
    (id: string) => {
      navigate(`/meetup/${id}`);
    },
    [navigate],
  );

  const handleJoinMeetup = useCallback(
    async (id: string) => {
      setJoinLoadingId(id);
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.user) {
          throw new Error(sessionError?.message || 'No active session');
        }
        const meetup = meetups.find((m) => m.id === id);
        if (!meetup) throw new Error('Meetup not found');

        const body = {
          token: meetup.token,
          email_b: sessionData.session.user.email,
          selected_date: meetup.selected_date,
          selected_time: meetup.selected_time,
          cafe_id: meetup.cafe_id,
        };

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-meeting-confirmation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(body),
          },
        );
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Join failed');

        setMeetups((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'confirmed' } : m)));
        ErrorService.toast(
          '🥤 First Sip! You just earned a badge for joining your first meetup!',
          'success',
        );
        const userId = sessionData.session.user.id;
        if (!(await hasBadge(userId, 'first_meetup'))) {
          await awardBadge(userId, 'first_meetup');
        }
        const meetupCount = await getMeetupCount(userId);
        if (meetupCount >= 5 && !(await hasBadge(userId, 'five_meetups'))) {
          await awardBadge(userId, 'five_meetups');
          ErrorService.toast(
            '🎉 Meetup Master! You attended 5 meetups and earned a badge!',
            'success',
          );
        }
      } catch (err) {
        ErrorService.toast('Failed to join meetup. Please try again.', 'error');
      } finally {
        setJoinLoadingId(null);
      }
    },
    [meetups],
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#e0f2f1] to-[#b2dfdb]">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {(isOffline || usingCache) && (
          <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 text-center font-semibold">
            {isOffline
              ? t('meetups:offlineNotice', 'Je bent offline. Gecachte meetups worden getoond.')
              : t('meetups:cacheNotice', 'Gecachte meetups worden getoond.')}
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="mobile-heading text-primary-700">{t('meetups:title', 'Meetups')}</h1>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder={t('meetups:searchPlaceholder', 'Zoek meetups...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full sm:w-64"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-full sm:w-48"
            >
              <option value="all">{t('meetups:allStatus', 'Alle statussen')}</option>
              <option value="upcoming">{t('meetups:upcoming', 'Aankomend')}</option>
              <option value="pending">{t('meetups:pending', 'In afwachting')}</option>
              <option value="confirmed">{t('meetups:confirmed', 'Bevestigd')}</option>
              <option value="cancelled">{t('meetups:cancelled', 'Geannuleerd')}</option>
              <option value="declined">{t('meetups:declined', 'Geweigerd')}</option>
              <option value="past">{t('meetups:past', 'Verlopen')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="mobile-text text-gray-600">{t('common:loading', 'Laden...')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="mobile-text text-red-600" aria-live="assertive">
              {error}
            </p>
          </div>
        ) : (
          <section
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-label={t('meetups:listAriaLabel', 'Meetup list')}
          >
            {filteredMeetups.map((meetup) => (
              <MeetupListItem
                key={meetup.id}
                meetup={meetup}
                onView={handleViewMeetup}
                onJoin={handleJoinMeetup}
                t={t}
                joining={!!joinLoadingId}
                joinLoadingId={joinLoadingId}
              />
            ))}
          </section>
        )}

        {!loading && !error && filteredMeetups.length === 0 && (
          <div className="text-center py-12">
            <p className="mobile-text text-gray-600">
              {t('meetups:noMeetups', 'Geen meetups gevonden')}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Meetups;
