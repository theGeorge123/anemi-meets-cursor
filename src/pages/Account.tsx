import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { supabase } from '../supabaseClient';
import { useToast } from '../components/use-toast';
import { EditableField } from '../components/EditableField';
import { SectionCard } from '../components/SectionCard';
import { Chip } from '../components/Chip';
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
import { TablesUpdate } from '../types/supabase';

const priceOptions = ['low', 'mid', 'high'];

function Account() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [favoriteTags, setFavoriteTags] = useState<string[]>([]);
  const [pricePreference, setPricePreference] = useState<string[]>([]);
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
        .select(`username, website, favorite_tags, price_preference`)
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn(error);
        toast({
          variant: 'destructive',
          title: 'Oeps, profiel niet gevonden',
          description: 'We konden je profielgegevens niet ophalen.',
        });
      } else if (data && isMounted) {
        setUsername(data.username || '');
        setWebsite(data.website || '');
        setFavoriteTags(data.favorite_tags || []);
        setPricePreference(data.price_preference || []);
      }
    };

    const fetchAllTags = async () => {
      const { data, error } = await supabase.from('cafes').select('tags');
      if (error) {
        console.warn(error);
      } else if (data) {
        const uniqueTags = [...new Set(data.flatMap((cafe) => cafe.tags || []))];
        if (isMounted) {
          setAllTags(uniqueTags);
        }
      }
    };

    const fetchProfileAndTags = async () => {
      setLoading(true);
      await Promise.all([getProfile(), fetchAllTags()]);
      if (isMounted) {
        setLoading(false);
      }
    };

    fetchProfileAndTags();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const updateProfile = async (updates: TablesUpdate<'profiles'>, successMessage: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Gelukt!',
        description: successMessage,
      });
    } catch (error: unknown) {
      let message = 'De wijziging kon niet worden opgeslagen.';
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Oeps, er ging iets mis',
        description: message,
      });
    }
  };

  const handleToggleTag = async (tag: string) => {
    const newTags = favoriteTags.includes(tag)
      ? favoriteTags.filter((t) => t !== tag)
      : [...favoriteTags, tag];
    setFavoriteTags(newTags);
    await updateProfile({ favorite_tags: newTags }, 'Je favoriete vibes zijn bijgewerkt.');
  };

  const handleTogglePrice = async (price: string) => {
    const newPrices = pricePreference.includes(price)
      ? pricePreference.filter((p) => p !== price)
      : [...pricePreference, price];
    setPricePreference(newPrices);
    await updateProfile({ price_preference: newPrices }, 'Je prijsvoorkeur is bijgewerkt.');
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
      // Log de gebruiker uit na het verzoek
      await supabase.auth.signOut();
    } catch (error: unknown) {
      let message = 'Er is een onbekende fout opgetreden. Probeer het later opnieuw.';
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Fout bij verwijderen',
        description: message,
      });
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Jouw Account</h1>
        <p className="mt-2 text-lg text-gray-600">
          Beheer hier je gegevens, voorkeuren en instellingen.
        </p>
      </header>

      <SectionCard
        title="Profielgegevens"
        description="Deze gegevens zijn zichtbaar voor andere gebruikers."
      >
        <EditableField
          label={t('account.username')}
          value={username}
          onSave={(value) => updateProfile({ username: value }, 'Je gebruikersnaam is bijgewerkt.')}
        />
        <EditableField
          label={t('account.website')}
          value={website}
          onSave={(value) => updateProfile({ website: value }, 'Je website is bijgewerkt.')}
        />
      </SectionCard>

      <SectionCard
        title="Jouw favoriete vibes"
        description="Selecteer de sferen die jij het leukst vindt in een café. Deze gebruiken we om betere suggesties te doen."
      >
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              isSelected={favoriteTags.includes(tag)}
              onToggle={() => handleToggleTag(tag)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Jouw prijsklasse"
        description="Wat mag een kop koffie voor jou ongeveer kosten?"
      >
        <div className="flex flex-wrap gap-2">
          {priceOptions.map((price) => (
            <Chip
              key={price}
              label={price}
              isSelected={pricePreference.includes(price)}
              onToggle={() => handleTogglePrice(price)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={t('account.dangerZone.title')}
        description={t('account.dangerZone.description')}
        variant="danger"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('account.dangerZone.deleteAccountButton')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('account.dangerZone.confirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('account.dangerZone.confirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('account.dangerZone.cancelButton')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount}>
                {t('account.dangerZone.confirmButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SectionCard>
    </div>
  );
}

export default Account;
