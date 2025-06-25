export class LanguageService {
  static get(): string {
    return (
      localStorage.getItem('lang') ??
      ['en', 'nl'].find((l) => navigator.language.startsWith(l)) ??
      'en'
    );
  }
  static set(lang: string) {
    localStorage.setItem('lang', lang);
  }
}
