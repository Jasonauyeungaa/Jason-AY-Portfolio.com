(() => {
  const root = document.documentElement;
  const runtimePrefs = window.JasonRuntimePrefs || (window.JasonRuntimePrefs = {});
  const supportedLanguages = new Set(['en', 'zh-TW', 'zh-CN', 'es']);
  const supportedThemes = new Set(['dark', 'light']);
  let storedPrefs = {};

  try {
    storedPrefs = JSON.parse(window.localStorage.getItem('jason-portfolio-prefs') || '{}') || {};
  } catch (error) {
    storedPrefs = {};
  }

  const language = supportedLanguages.has(storedPrefs.language)
    ? storedPrefs.language
    : (runtimePrefs.language || root.lang || 'en');
  const theme = supportedThemes.has(storedPrefs.theme)
    ? storedPrefs.theme
    : (runtimePrefs.theme || root.getAttribute('data-theme') || 'dark');

  root.lang = language;
  root.setAttribute('data-theme', theme);
  runtimePrefs.language = root.lang;
  runtimePrefs.theme = root.getAttribute('data-theme');
})();
