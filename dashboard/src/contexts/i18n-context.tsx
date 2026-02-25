import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, get, put } from '../lib/api';
import { useAuth } from './auth-context';

interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string;
  is_rtl: boolean;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
}

interface LanguageListResponse {
  items: Language[];
  total: number;
}

interface TranslationMapResponse {
  namespace: string;
  translations: Record<string, string>;
}

interface I18nState {
  languageCode: string;
  languages: Language[];
  isLoading: boolean;
  error: string | null;
  setLanguageCode: (code: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [localLanguageCode, setLocalLanguageCode] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languageCode = user?.language_pref ?? localLanguageCode;

  const loadLanguages = useCallback(async () => {
    const res = await get<LanguageListResponse>('/languages?active_only=true');
    const sorted = res.items.slice().sort((a, b) => a.sort_order - b.sort_order);
    setLanguages(sorted);
  }, []);

  const loadTranslations = useCallback(
    async (code: string) => {
      if (!code) return;
      const q = new URLSearchParams();
      q.set('language_code', code);
      q.set('namespace', 'common');
      if (user?.tenant_id) q.set('tenant_id', user.tenant_id);
      const res = await get<TranslationMapResponse>(`/translations/map?${q.toString()}`);
      setTranslations(res.translations ?? {});
    },
    [user],
  );

  useEffect(() => {
    if (!user) return;
    const initialCode = user.language_pref ?? 'en';
    let cancelled = false;

    async function refresh() {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([loadLanguages(), loadTranslations(initialCode)]);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load localization data';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void refresh();
    return () => {
      cancelled = true;
    };
  }, [user, loadLanguages, loadTranslations]);

  const setLanguageCode = useCallback(
    async (code: string) => {
      const next = code.trim();
      if (!next) return;
      setError(null);
      try {
        if (user) {
          await put('/users/me', { language_pref: next });
          await refreshUser();
        } else {
          setLocalLanguageCode(next);
        }
        await loadTranslations(next);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to change language';
        setError(message);
      }
    },
    [user, refreshUser, loadTranslations],
  );

  const t = useCallback(
    (key: string, fallback?: string) => {
      return translations[key] ?? fallback ?? key;
    },
    [translations],
  );

  const value = useMemo<I18nState>(
    () => ({
      languageCode,
      languages,
      isLoading,
      error,
      setLanguageCode,
      t,
    }),
    [languageCode, languages, isLoading, error, setLanguageCode, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

