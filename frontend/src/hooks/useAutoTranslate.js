import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';

// In-memory cache to avoid repeated API calls
const translationCache = {};

/**
 * Hook to auto-translate user-generated content (priest bios, service names, reviews).
 * Returns the translated text if available, otherwise returns original.
 * Caches results in memory to minimize API calls.
 * 
 * Usage: const translated = useAutoTranslate(priest.bio);
 */
export function useAutoTranslate(text) {
  const { i18n } = useTranslation();
  const [translated, setTranslated] = useState(text || '');
  const prevText = useRef(text);
  const prevLang = useRef(i18n.language);

  useEffect(() => {
    if (!text) { setTranslated(''); return; }

    // No translation needed for English
    if (i18n.language === 'en') { setTranslated(text); return; }

    const cacheKey = `${i18n.language}:${text.slice(0, 100)}`;

    // Check cache first
    if (translationCache[cacheKey]) {
      setTranslated(translationCache[cacheKey]);
      return;
    }

    // If language or text changed, translate
    if (text !== prevText.current || i18n.language !== prevLang.current) {
      prevText.current = text;
      prevLang.current = i18n.language;
    }

    let cancelled = false;
    const doTranslate = async () => {
      try {
        const res = await api.post('/api/translate', {
          text: text.slice(0, 1500),
          target_lang: i18n.language
        });
        if (!cancelled && res.data.status === 'ok') {
          translationCache[cacheKey] = res.data.translated;
          setTranslated(res.data.translated);
        }
      } catch {
        // Fallback to original text on error
        if (!cancelled) setTranslated(text);
      }
    };

    // Debounce: small delay to batch rapid changes
    const timer = setTimeout(doTranslate, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [text, i18n.language]);

  return translated;
}

/**
 * Batch translate multiple texts at once.
 * Returns a map of original -> translated.
 * 
 * Usage: const translations = useAutoTranslateBatch(['text1', 'text2']);
 */
export function useAutoTranslateBatch(texts) {
  const { i18n } = useTranslation();
  const [results, setResults] = useState({});

  useEffect(() => {
    if (!texts || texts.length === 0) return;
    if (i18n.language === 'en') {
      const map = {};
      texts.forEach(t => { map[t] = t; });
      setResults(map);
      return;
    }

    let cancelled = false;
    const doTranslate = async () => {
      const map = {};
      const toTranslate = [];

      texts.forEach(text => {
        if (!text) return;
        const cacheKey = `${i18n.language}:${text.slice(0, 100)}`;
        if (translationCache[cacheKey]) {
          map[text] = translationCache[cacheKey];
        } else {
          toTranslate.push(text);
        }
      });

      // Translate uncached texts one at a time (API doesn't support batch)
      for (const text of toTranslate) {
        if (cancelled) break;
        try {
          const res = await api.post('/api/translate', {
            text: text.slice(0, 1500),
            target_lang: i18n.language
          });
          if (res.data.status === 'ok') {
            const cacheKey = `${i18n.language}:${text.slice(0, 100)}`;
            translationCache[cacheKey] = res.data.translated;
            map[text] = res.data.translated;
          } else {
            map[text] = text;
          }
        } catch {
          map[text] = text;
        }
      }

      if (!cancelled) setResults(map);
    };

    const timer = setTimeout(doTranslate, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [texts?.join('|'), i18n.language]);

  return results;
}
