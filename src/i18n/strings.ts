export type Locale = 'tr' | 'en';
export const LOCALES: Locale[] = ['tr', 'en'];
export const DEFAULT_LOCALE: Locale = 'tr';

type Dict = Record<string, string>;
const strings: Record<Locale, Dict> = {
  tr: {
    'home.subtitle': 'Diskografi',
    'filter.all': 'Hepsi',
    'filter.albums': 'Albümler',
    'filter.singles': 'Tekliler',
    'release.type.album': 'Albüm',
    'release.type.single': 'Tekli',
    'release.tracks.heading': 'Şarkılar',
    'release.tracks.count': '{count} şarkı',
    'release.album.label': 'Albüm',
    'dsp.heading': 'Dinle',
    'dsp.cta': 'Sevdiğin platformda dinle',
    'dsp.listenOn.spotify': "Spotify'da Dinle",
    'dsp.listenOn.appleMusic': "Apple Music'de Dinle",
    'dsp.spotify.prefix': "Spotify'da ",
    'dsp.spotify.suffix': '',
    'dsp.spotify.verb.listen': 'Dinle',
    'dsp.spotify.verb.save': 'Kaydet',
    'dsp.appleMusic.prefix': "Apple Music'de ",
    'dsp.appleMusic.suffix': '',
    'dsp.appleMusic.verb.listen': 'Dinle',
    'dsp.appleMusic.verb.save': 'Kaydet',
    'dsp.short.spotify': 'Spotify',
    'dsp.short.appleMusic': 'Apple Music',
    'dsp.supportHint.spotify': 'Dinledikten sonra (+) ile kütüphanenize eklemeyi unutmayın',
    'dsp.supportHint.appleMusic': 'Dinledikten sonra (+) ile kütüphanenize eklemeyi unutmayın',
    'share.heading': 'Paylaş',
    'share.copy': 'Linki Kopyala',
    'share.copied': 'Kopyalandı',
    'bio.heading.fallback': 'Sanatçı',
    'nav.home': 'Ana sayfa',
    'lang.tr': 'TR',
    'lang.en': 'EN',
    'lang.switchTo': 'English',
    'footer.rights': 'Tüm hakları saklıdır.',
    '404.title': '404 — Sayfa Bulunamadı',
    '404.heading': '404',
    '404.message': 'Aradığın sayfa burada değil.',
    '404.back': 'Diskografiye Dön',
    'breadcrumb.artist': 'Sentezhane',
  },
  en: {
    'home.subtitle': 'Discography',
    'filter.all': 'All',
    'filter.albums': 'Albums',
    'filter.singles': 'Singles',
    'release.type.album': 'Album',
    'release.type.single': 'Single',
    'release.tracks.heading': 'Tracks',
    'release.tracks.count': '{count} tracks',
    'release.album.label': 'Album',
    'dsp.heading': 'Listen',
    'dsp.cta': 'Listen on your favorite platform',
    'dsp.listenOn.spotify': 'Listen on Spotify',
    'dsp.listenOn.appleMusic': 'Listen on Apple Music',
    'dsp.spotify.prefix': '',
    'dsp.spotify.suffix': ' on Spotify',
    'dsp.spotify.verb.listen': 'Listen',
    'dsp.spotify.verb.save': 'Save',
    'dsp.appleMusic.prefix': '',
    'dsp.appleMusic.suffix': ' on Apple Music',
    'dsp.appleMusic.verb.listen': 'Listen',
    'dsp.appleMusic.verb.save': 'Save',
    'dsp.short.spotify': 'Spotify',
    'dsp.short.appleMusic': 'Apple Music',
    'dsp.supportHint.spotify': 'After listening, tap (+) to add it to your library',
    'dsp.supportHint.appleMusic': 'After listening, tap (+) to add it to your library',
    'share.heading': 'Share',
    'share.copy': 'Copy link',
    'share.copied': 'Copied',
    'bio.heading.fallback': 'Artist',
    'nav.home': 'Home',
    'lang.tr': 'TR',
    'lang.en': 'EN',
    'lang.switchTo': 'Türkçe',
    'footer.rights': 'All rights reserved.',
    '404.title': '404 — Page Not Found',
    '404.heading': '404',
    '404.message': "The page you're looking for isn't here.",
    '404.back': 'Back to discography',
    'breadcrumb.artist': 'Sentezhane',
  },
};

export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let s = strings[locale]?.[key] ?? strings[DEFAULT_LOCALE][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function localizedPath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return ('/' + locale + path).replace(/\/+/g, '/');
}

export function getLocaleFromPath(pathname: string): Locale {
  if (pathname === '/en' || pathname === '/en/' || pathname.startsWith('/en/')) return 'en';
  return 'tr';
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/en' || pathname === '/en/') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3);
  return pathname;
}
