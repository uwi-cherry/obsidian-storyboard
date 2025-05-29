import { App, moment } from 'obsidian';
import ja from './i18n/ja';
import en from './i18n/en';
import { I18nStrings, Language } from './i18n/types';

let app: App | null = null;

export function setAppInstance(appInstance: App): void {
  app = appInstance;
}

const translations: Record<Language, I18nStrings> = { ja, en };

export function t(key: keyof I18nStrings): string {
  if (!app) {
    console.warn('App instance not set for i18n');
    return key;
  }

  const locale = moment.locale() as Language;
  const dict = translations[locale] ?? translations.en;
  return dict[key] ?? key;
}
