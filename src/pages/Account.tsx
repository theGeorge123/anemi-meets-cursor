import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { supabase } from '../supabaseClient';
import { useToast } from '../components/use-toast';
import { EditableField } from '../components/EditableField';
import { SectionCard } from '../components/SectionCard';
import { Button } from '../components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { Switch } from '../components/ui/switch';
import { Chip } from '../components/Chip';
import { TablesUpdate } from '../types/supabase';

function Account() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullname: '',
    email: '',
    emoji: '',
    age: '',
    bio: '',
    preferred_language: '',
    isprivate: false,
    wantsnotifications: false,
    wantsreminders: false,
    wantsupdates: false,
    favorite_tags: [] as string[],
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Oeps, profiel niet gevonden',
          description: 'We konden je profielgegevens niet ophalen.',
        });
      } else if (data && isMounted) {
        setProfile({
          fullname: data.fullname || '',
          email: data.email || '',
          emoji: data.emoji || '',
          age: typeof data.age === 'number' && isFinite(data.age) ? String(data.age) : '',
          bio: data.bio || '',
          preferred_language: data.preferred_language || '',
          isprivate: !!data.isprivate,
          wantsnotifications: !!data.wantsnotifications,
          wantsreminders: !!data.wantsreminders,
          wantsupdates: !!data.wantsupdates,
          favorite_tags: data.favorite_tags || [],
        });
      }
      if (isMounted) setLoading(false);
    };
    getProfile();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Helper to safely update profile state with correct age type
  function safeSetProfile(prev: typeof profile, updates: Partial<typeof profile>): typeof profile {
    let newAge = prev.age;
    if ('age' in updates && typeof updates.age === 'string') {
      newAge = updates.age;
    }
    const { age, ...rest } = updates;
    return { ...prev, ...rest, age: newAge };
  }

  const updateProfile = async (updates: Partial<typeof profile>, successMessage: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      // Prepare updates for Supabase with correct types
      const updatesCopy = { ...updates };
      let ageToSend: number | null | undefined = undefined;
      if ('age' in updatesCopy) {
        if (updatesCopy.age === '' || updatesCopy.age === undefined) {
          ageToSend = null;
        } else if (typeof updatesCopy.age === 'string') {
          const parsed = Number(updatesCopy.age);
          ageToSend = isNaN(parsed) ? null : parsed;
        }
        delete updatesCopy.age;
      }
      const updatesToSend: TablesUpdate<'profiles'> = {
        ...updatesCopy,
        ...(ageToSend !== undefined ? { age: ageToSend } : {}),
      };
      const { error } = await supabase.from('profiles').update(updatesToSend).eq('id', user.id);
      if (error) throw error;
      setProfile((prev) => safeSetProfile(prev, updates));
      toast({ title: 'Gelukt!', description: successMessage });
    } catch (error: unknown) {
      let message = 'De wijziging kon niet worden opgeslagen.';
      if (error instanceof Error) message = error.message;
      toast({ variant: 'destructive', title: 'Oeps, er ging iets mis', description: message });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      toast({
        title: 'Account verwijderd',
        description: 'Je account wordt verwijderd. We sturen je zo snel mogelijk een bevestiging.',
      });
      await supabase.auth.signOut();
    } catch (error: unknown) {
      let message = 'Er is een onbekende fout opgetreden. Probeer het later opnieuw.';
      if (error instanceof Error) message = error.message;
      toast({ variant: 'destructive', title: 'Fout bij verwijderen', description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <header className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <span role="img" aria-label="profile">
            👤
          </span>{' '}
          Jouw Account
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Beheer hier je gegevens, voorkeuren en instellingen.
        </p>
      </header>

      <SectionCard
        title="Profiel"
        description="Deze gegevens zijn zichtbaar voor andere gebruikers."
      >
        <EditableField
          label={t('account.fullname', 'Naam')}
          value={profile.fullname}
          onSave={(value) => updateProfile({ fullname: value }, 'Je naam is bijgewerkt.')}
        />
        <EditableField
          label={t('account.email', 'E-mail')}
          value={profile.email}
          onSave={(value) => updateProfile({ email: value }, 'Je e-mail is bijgewerkt.')}
        />
        <EditableField
          label={t('account.emoji', 'Emoji vibe')}
          value={profile.emoji}
          onSave={(value) => updateProfile({ emoji: value }, 'Je emoji is bijgewerkt.')}
        />
        <EditableField
          label={t('account.age', 'Leeftijd')}
          value={profile.age}
          onSave={(value) =>
            updateProfile(
              { age: value === '' ? null : Number(value) },
              'Je leeftijd is bijgewerkt.',
            )
          }
        />
        <EditableField
          label={t('account.bio', 'Bio')}
          value={profile.bio}
          onSave={(value) => updateProfile({ bio: value }, 'Je bio is bijgewerkt.')}
        />
      </SectionCard>

      <SectionCard title="Voorkeuren" description="Taal, privacy en favoriete tags.">
        <EditableField
          label={t('account.preferred_language', 'Voorkeurstaal')}
          value={profile.preferred_language}
          onSave={(value) =>
            updateProfile({ preferred_language: value }, 'Voorkeurstaal bijgewerkt.')
          }
        />
        <div className="flex items-center gap-4 py-3 border-b">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span role="img" aria-label="lock">
              🔒
            </span>{' '}
            {t('account.isPrivate', 'Privé profiel')}
          </span>
          <Switch
            checked={profile.isprivate}
            onCheckedChange={(checked: boolean) =>
              updateProfile({ isprivate: checked }, 'Privacy-instelling bijgewerkt.')
            }
          />
        </div>
        <div className="flex flex-col gap-2 py-3 border-b">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span role="img" aria-label="tag">
              🏷️
            </span>{' '}
            {t('account.favorite_tags', 'Favoriete tags')}
          </span>
          <div className="flex flex-wrap gap-2">
            {profile.favorite_tags && profile.favorite_tags.length > 0 ? (
              profile.favorite_tags.map((tag: string) => (
                <Chip key={tag} label={tag} isSelected={true} onToggle={() => {}} />
              ))
            ) : (
              <span className="text-gray-400">Geen tags ingesteld</span>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Notificaties" description="Beheer je notificatievoorkeuren.">
        <div className="flex items-center gap-4 py-3 border-b">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span role="img" aria-label="bell">
              🔔
            </span>{' '}
            {t('account.wantsnotifications', 'Browser notificaties')}
          </span>
          <Switch
            checked={profile.wantsnotifications}
            onCheckedChange={(checked: boolean) =>
              updateProfile({ wantsnotifications: checked }, 'Notificatievoorkeur bijgewerkt.')
            }
          />
        </div>
        <div className="flex items-center gap-4 py-3 border-b">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span role="img" aria-label="reminder">
              ⏰
            </span>{' '}
            {t('account.wantsreminders', 'Herinneringen voor meetups')}
          </span>
          <Switch
            checked={profile.wantsreminders}
            onCheckedChange={(checked: boolean) =>
              updateProfile({ wantsreminders: checked }, 'Herinneringsvoorkeur bijgewerkt.')
            }
          />
        </div>
        <div className="flex items-center gap-4 py-3">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span role="img" aria-label="update">
              📬
            </span>{' '}
            {t('account.wantsupdates', 'Updates ontvangen')}
          </span>
          <Switch
            checked={profile.wantsupdates}
            onCheckedChange={(checked: boolean) =>
              updateProfile({ wantsupdates: checked }, 'Updatevoorkeur bijgewerkt.')
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title={String(
          <span className="flex items-center gap-2 text-red-700">
            ⚠️ {t('account.dangerZone.title', 'Danger Zone')}
          </span>,
        )}
        description={t(
          'account.dangerZone.description',
          'These actions are permanent and cannot be undone.',
        )}
        variant="danger"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2" disabled={isDeleting}>
              <span className="text-2xl">🗑️</span>
              {t('account.dangerZone.deleteAccountButton', 'Verwijder mijn account')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t(
                  'account.dangerZone.deleteAccountConfirm',
                  'Weet je zeker dat je je account wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'account.dangerZone.description',
                  'Deze acties zijn permanent en kunnen niet ongedaan worden gemaakt.',
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel', 'Annuleren')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {t('account.dangerZone.deleteAccountButton', 'Verwijder mijn account')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SectionCard>
    </div>
  );
}

export default Account;
