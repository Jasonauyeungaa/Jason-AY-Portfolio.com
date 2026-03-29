(() => {
  const searchButton = document.getElementById('siteSearchToggle');
  if (!searchButton) return;

  const site = window.JasonSite || {};
  const i18n = window.JasonI18n || {};
  const pageTitles = i18n.pageTitles || {};
  const indexCache = {};
  const suggestionCache = {};
  const pendingHighlightStorageKey = 'jason-portfolio-search-highlight';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let isOpen = false;
  let modal;
  let backdrop;
  let input;
  let status;
  let results;
  let closeButton;
  let autocomplete;
  let activeHighlightTimeout = null;
  let isInputActive = false;
  let keepSuggestionsOnBlur = false;

  const updateSearchUiState = () => {
    if (!modal || !input || !searchButton) return;
    const hasQuery = Boolean(String(input.value || '').trim());
    modal.classList.toggle('has-query', hasQuery);
    searchButton.classList.toggle('is-search-open', isOpen);
    searchButton.classList.toggle('is-search-active', hasQuery);
  };

  const getLang = () => {
    if (typeof i18n.getCurrentLanguage === 'function') {
      return i18n.getCurrentLanguage() || document.documentElement.lang || 'en';
    }
    return document.documentElement.lang || 'en';
  };

  const translate = (key, fallback, lang) => {
    if (typeof i18n.translate === 'function') {
      return i18n.translate(key, lang || getLang()) || fallback || key;
    }
    return fallback || key;
  };

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const stripHtml = (value) => String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const unique = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = normalizeText(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getPageTitle = (pageId, lang) => {
    const titles = pageTitles[pageId] || {};
    return titles[lang] || titles.en || pageId;
  };

  const getCurrentPageFile = () => window.location.pathname.split('/').pop() || 'index.html';

  const getFileFromHref = (href) => {
    const raw = String(href || '').split('#')[0];
    if (!raw) return getCurrentPageFile();
    const file = raw.split('/').pop();
    return file || 'index.html';
  };

  const buildHref = (url) => {
    const parts = String(url || '').split('#');
    const file = parts[0] || 'index.html';
    const hash = parts[1] ? `#${parts[1]}` : '';
    if (getCurrentPageFile() === file) {
      return hash || file;
    }
    return `${file}${hash}`;
  };

  const getCannedSuggestions = (lang) => {
    const suggestions = {
      en: [
        'Education',
        'Education background',
        'HKUST',
        'Skills',
        'Featured Projects',
        'AWS Hackathon',
        'HAECO Co-op experience',
        'Bay Management System',
        'Final Year Project',
        'Contact information',
        'Resume / CV'
      ],
      'zh-TW': [
        '教育背景',
        'HKUST',
        '技能',
        '精選項目',
        'AWS黑客松',
        'HAECO Co-op experience',
        'Bay Management System',
        '畢業專題',
        '聯絡資料',
        '履歷'
      ],
      'zh-CN': [
        '教育背景',
        'HKUST',
        '技能',
        '精选项目',
        'AWS黑客松',
        'HAECO Co-op experience',
        'Bay Management System',
        '毕业专题',
        '联络资料',
        '履历'
      ],
      es: [
        'Educacion',
        'HKUST',
        'Habilidades',
        'Proyectos destacados',
        'AWS Hackathon',
        'Experiencia Co-op en HAECO',
        'Bay Management System',
        'Proyecto final',
        'Informacion de contacto',
        'CV'
      ]
    };

    return suggestions[lang] || suggestions.en;
  };

  const addEntry = (entries, config) => {
    const pageTitle = getPageTitle(config.pageId, config.lang);
    const heading = config.heading;
    const text = unique(config.textParts || []).join(' ');
    const suggestionKeywords = unique(config.suggestionKeywords || []);
    entries.push({
      pageId: config.pageId,
      pageTitle,
      heading,
      href: buildHref(config.href),
      text,
      suggestionKeywords,
      searchText: normalizeText([pageTitle, heading, text].join(' '))
    });
  };

  const buildSearchIndex = (lang) => {
    if (indexCache[lang]) return indexCache[lang];

    const entries = [];
    const t = (key, fallback) => translate(key, fallback, lang);

    addEntry(entries, {
      lang,
      pageId: 'home',
      href: 'index.html#home',
      heading: t('nav.about', 'About'),
      textParts: [
        t('hero.tagline', 'Industrial Engineering x Data x AI Systems'),
        t('hero.intro', ''),
        t('hero.rail.focus.value', ''),
        t('hero.rail.focus.desc', '')
      ],
      suggestionKeywords: ['Jason Au-Yeung', 'Industrial Engineering', 'Data', 'AI Systems']
    });

    addEntry(entries, {
      lang,
      pageId: 'home',
      href: 'index.html#awards',
      heading: t('awards.title', 'Awards & Achievements'),
      textParts: [
        t('awards.hackathon.desc', ''),
        t('awards.techathon.desc', ''),
        t('awards.leanday.desc', ''),
        t('awards.academic.desc', '')
      ],
      suggestionKeywords: ['AWS AI Hackathon', 'Grand Prize', 'Academic Excellence', 'Lean Day', 'Techathon']
    });

    addEntry(entries, {
      lang,
      pageId: 'home',
      href: 'index.html#experience',
      heading: t('exp.title', 'Professional Experience'),
      textParts: [
        t('exp.haeco.title', ''),
        t('exp.haeco.company', ''),
        t('exp.haeco.dept', ''),
        t('exp.hkust.title', ''),
        t('exp.hkust.company', ''),
        t('exp.speedy.title', ''),
        t('exp.speedy.company', '')
      ],
      suggestionKeywords: ['HAECO', 'Co-op', 'ITSO', 'Speedy Group', 'Asset Management']
    });

    addEntry(entries, {
      lang,
      pageId: 'home',
      href: 'index.html#projects',
      heading: t('proj.title', 'Featured Projects'),
      textParts: [
        t('proj.haeco.title', ''),
        t('proj.haeco.desc', ''),
        t('proj.haeco.ach1', ''),
        t('proj.haeco.ach2', ''),
        t('proj.haeco.ach3', ''),
        t('proj.haeco.ach4', ''),
        t('proj.fyp.title', ''),
        t('proj.fyp.desc', ''),
        t('proj.fyp.method1', ''),
        t('proj.fyp.method2', ''),
        t('proj.fyp.method3', ''),
        t('proj.fyp.method4', ''),
        t('proj.christmas.title', ''),
        t('proj.christmas.desc', ''),
        t('proj.youtube.title', ''),
        t('proj.youtube.desc', ''),
        t('proj.tag.awsq', ''),
        t('proj.tag.kiro', ''),
        t('proj.tag.python', ''),
        t('proj.tag.automl', ''),
        t('proj.tag.simulation', ''),
        t('proj.tag.optimization', ''),
        t('proj.tag.datamining', ''),
        t('proj.tag.stats', ''),
        t('proj.tag.sqlite', ''),
        t('proj.tag.dbdesign', ''),
        t('proj.tag.sql', '')
      ],
      suggestionKeywords: ['Bay Management System', 'Kiro', 'AWS Q Developer', 'SQLite', 'AutoML', 'Simulation', 'Optimization', 'Data Mining', 'SQL']
    });

    addEntry(entries, {
      lang,
      pageId: 'home',
      href: 'index.html#education',
      heading: t('edu.title', 'Education'),
      textParts: [
        t('edu.hkust.name', ''),
        t('edu.hkust.degree', ''),
        t('edu.hkust.minor.value', ''),
        t('edu.hkust.fyp.value', ''),
        t('edu.hku.name', ''),
        t('edu.hku.degree', ''),
        t('edu.hku.award1', ''),
        t('edu.hku.award2', ''),
        t('edu.hku.leadership.value', '')
      ],
      suggestionKeywords: ['HKUST', 'HKU SPACE', 'Big Data Technology', 'Data Science', 'Class Representative']
    });

    addEntry(entries, {
      lang,
      pageId: 'home',
      href: 'index.html#skills',
      heading: t('skills.title', 'Skills & Expertise'),
      textParts: [
        t('skills.programming.title', ''),
        t('skills.ai.title', ''),
        t('skills.creative.title', ''),
        t('skills.soft.title', ''),
        'Python',
        'R',
        'Octave',
        'SQLite',
        'SQL',
        'AWS Q Developer',
        'Kiro',
        'OpenAI Codex',
        'AutoML',
        t('skills.creative.msoffice', ''),
        t('skills.creative.canva', ''),
        t('skills.creative.adobe', ''),
        t('skills.creative.photo', ''),
        t('skills.creative.video', ''),
        t('skills.soft.critical', ''),
        t('skills.soft.decision', ''),
        t('skills.soft.teamwork', ''),
        t('skills.soft.negotiation', ''),
        t('skills.soft.leadership', ''),
        t('skills.soft.problem', ''),
        t('skills.languages.title', ''),
        t('skills.languages.english', ''),
        t('skills.languages.cantonese', ''),
        t('skills.languages.mandarin', ''),
        t('skills.certs.title', ''),
        t('skills.certs.cert1', ''),
        t('skills.certs.cert2', '')
      ],
      suggestionKeywords: ['Python', 'SQLite', 'SQL', 'AWS Q Developer', 'Kiro', 'OpenAI Codex', 'Canva', 'Adobe Creative']
    });

    addEntry(entries, {
      lang,
      pageId: 'home',
      href: 'index.html#contact',
      heading: t('contact.title', 'Get in Touch'),
      textParts: [
        t('contact.intro', ''),
        t('contact.email', 'Email'),
        t('contact.github', 'GitHub'),
        t('contact.resume', 'Resume'),
        'wcauyeungaa@connect.ust.hk',
        'github.com/jasonauyeungaa'
      ],
      suggestionKeywords: ['Email', 'GitHub', 'Resume / CV', 'wcauyeungaa@connect.ust.hk']
    });

    addEntry(entries, {
      lang,
      pageId: 'coop',
      href: 'coop.html#overview',
      heading: t('coop.nav.overview', 'Overview'),
      textParts: [
        t('coop.hero.title', ''),
        t('coop.hero.department', ''),
        t('coop.hero.period', ''),
        t('coop.hero.intro', '')
      ],
      suggestionKeywords: ['HAECO Co-op', 'Transformation & Technology', 'Technology Innovation Team', '5 months']
    });

    addEntry(entries, {
      lang,
      pageId: 'coop',
      href: 'coop.html#highlights',
      heading: t('coop.nav.highlights', 'Highlights'),
      textParts: [
        t('coop.highlights.title', ''),
        t('coop.highlights.hackathon.title', ''),
        t('coop.highlights.hackathon.desc', ''),
        t('coop.highlights.techathon.title', ''),
        t('coop.highlights.techathon.desc', ''),
        t('coop.highlights.leanday.title', ''),
        t('coop.highlights.leanday.desc', ''),
        t('coop.highlights.reinvent.title', ''),
        t('coop.highlights.reinvent.desc', '')
      ],
      suggestionKeywords: ['Techathon', 'Lean Day', 'AWS re:Invent', 'Media Interviews']
    });

    addEntry(entries, {
      lang,
      pageId: 'coop',
      href: 'coop.html#learnings',
      heading: t('coop.nav.learnings', 'Learnings'),
      textParts: [
        t('coop.learnings.title', ''),
        t('coop.learnings.intro', ''),
        t('coop.learnings.tech.item1', ''),
        t('coop.learnings.strategy.item1', ''),
        t('coop.learnings.innovation.item1', '')
      ],
      suggestionKeywords: ['Leadership', 'Operations', 'AI', 'Reflection']
    });

    addEntry(entries, {
      lang,
      pageId: 'hackathon',
      href: 'hackathon.html#award',
      heading: t('hack.nav.award', 'Award'),
      textParts: [
        t('hack.hero.title', ''),
        t('hack.hero.subtitle', ''),
        t('hack.hero.tagline', '')
      ],
      suggestionKeywords: ['AWS AI Hackathon', 'Grand Prize', '130+ teams', '14 days']
    });

    addEntry(entries, {
      lang,
      pageId: 'hackathon',
      href: 'hackathon.html#challenge',
      heading: t('hack.nav.challenge', 'Challenge'),
      textParts: [
        t('hack.challenge.title', ''),
        t('hack.challenge.heading', ''),
        t('hack.challenge.desc', '')
      ],
      suggestionKeywords: ['Aircraft Bay Assignment', 'Manual Planning', 'Constraints']
    });

    addEntry(entries, {
      lang,
      pageId: 'hackathon',
      href: 'hackathon.html#solution',
      heading: t('hack.nav.solution', 'Solution'),
      textParts: [
        t('hack.solution.title', ''),
        t('hack.solution.item1.title', ''),
        t('hack.solution.item1.desc', ''),
        t('hack.solution.item2.title', ''),
        t('hack.solution.item2.desc', ''),
        t('hack.solution.item4.title', ''),
        t('hack.solution.item4.desc', '')
      ],
      suggestionKeywords: ['Optimization', 'Real-time Visualization', 'Dashboard', 'Chatbot']
    });

    addEntry(entries, {
      lang,
      pageId: 'hackathon',
      href: 'hackathon.html#media',
      heading: t('hack.nav.impact', 'Impact'),
      textParts: [
        t('hack.impact.title', ''),
        t('hack.impact.media.title', ''),
        t('hack.impact.media.item1', ''),
        t('hack.impact.media.item2', ''),
        t('hack.impact.global.desc1', ''),
        t('hack.impact.global.desc2', '')
      ],
      suggestionKeywords: ['SCMP', 'unwire.hk', 'AWS Hong Kong', 'Las Vegas', 're:Invent']
    });

    addEntry(entries, {
      lang,
      pageId: 'hackathon',
      href: 'hackathon.html#reflection',
      heading: t('hack.reflection.title', 'Reflection'),
      textParts: [
        t('hack.reflection.intro', ''),
        t('hack.reflection.meaning.body', ''),
        t('hack.reflection.future.body', '')
      ],
      suggestionKeywords: ['Reflection', 'Future', 'Practical AI']
    });

    addEntry(entries, {
      lang,
      pageId: 'policy',
      href: 'policy.html#purpose',
      heading: t('policy.purpose.title', 'Purpose of This Website'),
      textParts: [
        stripHtml(t('policy.purpose.body', ''))
      ],
      suggestionKeywords: ['Policy', 'Website Purpose']
    });

    addEntry(entries, {
      lang,
      pageId: 'policy',
      href: 'policy.html#accuracy',
      heading: t('policy.accuracy.title', 'Accuracy and CV Precedence'),
      textParts: [
        stripHtml(t('policy.accuracy.body', ''))
      ],
      suggestionKeywords: ['Accuracy', 'CV Precedence', 'Official CV']
    });

    addEntry(entries, {
      lang,
      pageId: 'policy',
      href: 'policy.html#chatbot',
      heading: t('policy.chatbot.title', 'Chatbot Notice'),
      textParts: [
        stripHtml(t('policy.chatbot.body', ''))
      ],
      suggestionKeywords: ['Chatbot Notice', 'AI-generated', 'Search vs Chatbot']
    });

    indexCache[lang] = entries;
    return entries;
  };

  const buildSuggestionPool = (lang) => {
    if (suggestionCache[lang]) return suggestionCache[lang];

    const index = buildSearchIndex(lang);
    const pool = [];

    index.forEach((entry) => {
      pool.push(entry.heading);
      pool.push(`${entry.pageTitle} ${entry.heading}`);
      entry.suggestionKeywords.forEach((keyword) => pool.push(keyword));
    });

    getCannedSuggestions(lang).forEach((item) => pool.push(item));

    suggestionCache[lang] = unique(pool);
    return suggestionCache[lang];
  };

  const scoreSuggestion = (query, suggestion) => {
    const normalizedQuery = normalizeText(query);
    const normalizedSuggestion = normalizeText(suggestion);
    if (!normalizedQuery || !normalizedSuggestion.includes(normalizedQuery)) return -1;
    if (normalizedSuggestion === normalizedQuery) return 100;
    if (normalizedSuggestion.indexOf(normalizedQuery) === 0) return 90;
    if (normalizedSuggestion.indexOf(` ${normalizedQuery}`) !== -1) return 80;
    return 60 - Math.min(normalizedSuggestion.indexOf(normalizedQuery), 40);
  };

  const getHighlightTarget = (target) => {
    if (!target) return null;

    if (target.matches('.section-title, h1, h2, h3, h4, h5, h6')) {
      return target;
    }

    return target.querySelector('.section-title, h1, h2, h3, h4, h5, h6') || target;
  };

  const storePendingHighlight = (href, query) => {
    try {
      window.sessionStorage.setItem(pendingHighlightStorageKey, JSON.stringify({
        file: getFileFromHref(href),
        hash: String(href || '').includes('#') ? `#${String(href).split('#')[1]}` : '',
        query: String(query || '').trim(),
        ts: Date.now()
      }));
    } catch (error) {
      // Ignore storage failures so navigation still works.
    }
  };

  const applyTargetHighlight = (target) => {
    const highlightTarget = getHighlightTarget(target);
    if (!highlightTarget) return;

    if (activeHighlightTimeout) {
      window.clearTimeout(activeHighlightTimeout);
      activeHighlightTimeout = null;
    }

    highlightTarget.classList.remove('site-search-target-highlight');
    void highlightTarget.offsetWidth;
    highlightTarget.classList.add('site-search-target-highlight');

    activeHighlightTimeout = window.setTimeout(() => {
      highlightTarget.classList.remove('site-search-target-highlight');
      activeHighlightTimeout = null;
    }, 2000);
  };

  const navigateToHashTarget = (hash, { updateHistory = true } = {}) => {
    if (!hash) return false;

    const target = document.querySelector(hash);
    if (!target) return false;

    if (updateHistory) {
      const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
      window.history.pushState(null, '', nextUrl);
    }

    const scrollTarget = getHighlightTarget(target);
    if (typeof site.scrollToElement === 'function') {
      site.scrollToElement(scrollTarget || target, {
        extraOffset: 16
      });
    } else {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    }

    const highlightDelay = prefersReducedMotion ? 0 : 260;
    window.setTimeout(() => applyTargetHighlight(target), highlightDelay);
    return true;
  };

  const consumePendingHighlight = () => {
    let payload = null;

    try {
      payload = JSON.parse(window.sessionStorage.getItem(pendingHighlightStorageKey) || 'null');
    } catch (error) {
      payload = null;
    }

    if (!payload) return;

    const isStale = Math.abs(Date.now() - Number(payload.ts || 0)) > 15000;
    const sameFile = payload.file === getCurrentPageFile();
    const sameHash = !payload.hash || payload.hash === window.location.hash;

    try {
      window.sessionStorage.removeItem(pendingHighlightStorageKey);
    } catch (error) {
      // Ignore storage failures after reading the payload.
    }

    if (isStale || !sameFile || !sameHash || !payload.hash) return;

    window.requestAnimationFrame(() => {
      navigateToHashTarget(payload.hash, { updateHistory: false });
    });
  };

  const getSuggestions = (query, lang) => {
    const pool = buildSuggestionPool(lang);
    return pool
      .map((item) => ({ item, score: scoreSuggestion(query, item) }))
      .filter((item) => item.score >= 0)
      .sort((left, right) => right.score - left.score || left.item.length - right.item.length)
      .slice(0, 6)
      .map((item) => item.item);
  };

  const hideSuggestions = () => {
    if (!autocomplete) return;
    autocomplete.hidden = true;
    autocomplete.innerHTML = '';
  };

  const createSnippet = (entry, query) => {
    const text = entry.text || entry.heading;
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return text;

    const words = normalizedQuery.split(' ').filter(Boolean);
    const lowered = text.toLowerCase();
    let index = -1;

    words.forEach((word) => {
      const nextIndex = lowered.indexOf(word.toLowerCase());
      if (nextIndex !== -1 && (index === -1 || nextIndex < index)) {
        index = nextIndex;
      }
    });

    const start = Math.max(0, index - 60);
    const end = Math.min(text.length, start + 180);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    return `${prefix}${text.slice(start, end).trim()}${suffix}`;
  };

  const scoreEntry = (entry, query) => {
    const normalizedQuery = normalizeText(query);
    const terms = normalizedQuery.split(' ').filter(Boolean);
    if (!terms.length) return -1;

    let score = 0;
    const heading = normalizeText(entry.heading);
    const pageTitle = normalizeText(entry.pageTitle);

    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      if (entry.searchText.indexOf(term) === -1) return -1;
      if (heading === term) score += 40;
      else if (heading.indexOf(term) === 0) score += 28;
      else if (heading.indexOf(` ${term}`) !== -1) score += 18;
      if (pageTitle.indexOf(term) !== -1) score += 10;
      score += Math.max(1, entry.searchText.split(term).length - 1);
    }

    return score;
  };

  const renderSuggestions = (query) => {
    if (!autocomplete) return;

    const trimmed = String(query || '').trim();
    if (!trimmed || !isInputActive) {
      hideSuggestions();
      return;
    }

    const suggestions = getSuggestions(trimmed, getLang());
    if (!suggestions.length) {
      hideSuggestions();
      return;
    }

    autocomplete.hidden = false;
    autocomplete.innerHTML = suggestions.map((suggestion) => (
      `<button type="button" class="site-search-suggestion" data-suggestion="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`
    )).join('');

    autocomplete.querySelectorAll('.site-search-suggestion').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.dataset.suggestion || button.textContent || '';
        isInputActive = false;
        hideSuggestions();
        performSearch(input.value);
        input.focus();
      });
    });
  };

  const renderEmptyState = () => {
    status.textContent = '';
    results.innerHTML = `<p class="site-search-empty">${escapeHtml(translate('search.empty', 'Type words that appear on the pages.'))}</p>`;
    results.scrollTop = 0;
  };

  const renderResults = (matches, query) => {
    const count = matches.length;
    const label = count === 1
      ? translate('search.result', 'result')
      : translate('search.results', 'results');

    status.textContent = `${count} ${label}`;

    if (!count) {
      results.innerHTML = `<p class="site-search-empty">${escapeHtml(translate('search.noResults', 'No matching page text found.'))}</p>`;
      results.scrollTop = 0;
      return;
    }

    results.innerHTML = matches.map((match) => `
      <a class="site-search-result" href="${escapeHtml(match.href)}">
        <span class="site-search-page">${escapeHtml(match.pageTitle)}</span>
        <strong class="site-search-heading">${escapeHtml(match.heading)}</strong>
        <p class="site-search-snippet">${escapeHtml(createSnippet(match, query))}</p>
      </a>
    `).join('');
    results.scrollTop = 0;
  };

  const performSearch = (query) => {
    const trimmed = String(query || '').trim();
    renderSuggestions(trimmed);

    if (!trimmed) {
      renderEmptyState();
      updateSearchUiState();
      return;
    }

    const index = buildSearchIndex(getLang());
    const matches = index
      .map((entry) => ({
        entry,
        score: scoreEntry(entry, trimmed)
      }))
      .filter((item) => item.score >= 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 24)
      .map((item) => item.entry);

    renderResults(matches, trimmed);
    updateSearchUiState();
  };

  const syncUiText = () => {
    const openLabel = translate('search.open', 'Open search');
    searchButton.setAttribute('aria-label', openLabel);
    searchButton.setAttribute('title', openLabel);

    if (!modal) return;

    modal.querySelector('.site-search-title').textContent = translate('search.title', 'Search page text');
    input.placeholder = translate('search.placeholder', 'Search words on all pages');
    closeButton.setAttribute('aria-label', translate('search.close', 'Close search'));
    closeButton.setAttribute('title', translate('search.close', 'Close search'));
    performSearch(input.value);
  };

  const openSearch = () => {
    if (!modal) return;
    isOpen = true;
    document.body.classList.add('search-open');
    document.querySelectorAll('.lang-dropdown').forEach((dropdown) => dropdown.classList.remove('show'));
    backdrop.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('active');
    modal.classList.add('is-open');
    syncUiText();
    updateSearchUiState();
    window.requestAnimationFrame(() => input.focus());
  };

  const closeSearch = () => {
    if (!modal || !isOpen) return;
    isOpen = false;
    document.body.classList.remove('search-open');
    backdrop.classList.remove('active');
    modal.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-hidden', 'true');
    autocomplete.hidden = true;
    updateSearchUiState();
    searchButton.focus();
  };

  const createModal = () => {
    backdrop = document.createElement('div');
    backdrop.className = 'site-search-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    modal = document.createElement('section');
    modal.className = 'site-search-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'siteSearchTitle');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="site-search-shell">
        <div class="site-search-header">
          <h2 id="siteSearchTitle" class="site-search-title"></h2>
          <button type="button" class="site-search-close control-btn">×</button>
        </div>
        <div class="site-search-input-row">
          <label class="site-search-input-shell" for="siteSearchInput">
            <input id="siteSearchInput" class="site-search-input" type="search" autocomplete="off" spellcheck="false">
            <span class="site-search-icon" aria-hidden="true"></span>
          </label>
        </div>
        <div class="site-search-autocomplete" hidden></div>
        <div class="site-search-status" aria-live="polite"></div>
        <div class="site-search-results"></div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    input = modal.querySelector('#siteSearchInput');
    status = modal.querySelector('.site-search-status');
    results = modal.querySelector('.site-search-results');
    closeButton = modal.querySelector('.site-search-close');
    autocomplete = modal.querySelector('.site-search-autocomplete');

    backdrop.addEventListener('click', closeSearch);
    closeButton.addEventListener('click', closeSearch);

    input.addEventListener('input', () => {
      isInputActive = true;
      performSearch(input.value);
    });

    input.addEventListener('focus', () => {
      isInputActive = true;
      renderSuggestions(input.value);
    });

    input.addEventListener('pointerdown', () => {
      isInputActive = true;
      window.setTimeout(() => renderSuggestions(input.value), 0);
    });

    input.addEventListener('keydown', () => {
      isInputActive = true;
    });

    input.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (keepSuggestionsOnBlur) {
          keepSuggestionsOnBlur = false;
          return;
        }

        isInputActive = false;
        hideSuggestions();
      }, 0);
    });

    input.addEventListener('search', () => {
      performSearch(input.value);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
      }
      if (event.key === 'Enter') {
        const firstSuggestion = autocomplete.querySelector('.site-search-suggestion');
        if (firstSuggestion && normalizeText(firstSuggestion.textContent).indexOf(normalizeText(input.value)) === 0) {
          event.preventDefault();
          firstSuggestion.click();
        }
      }
    });

    autocomplete.addEventListener('pointerdown', () => {
      keepSuggestionsOnBlur = true;
    });

    autocomplete.addEventListener('focusin', () => {
      isInputActive = true;
    });

    autocomplete.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (autocomplete.contains(document.activeElement) || document.activeElement === input) return;
        isInputActive = false;
        hideSuggestions();
      }, 0);
    });

    results.addEventListener('scroll', () => {
      isInputActive = false;
      hideSuggestions();
    }, { passive: true });

    results.addEventListener('pointerdown', () => {
      isInputActive = false;
      hideSuggestions();
    });

    results.addEventListener('click', (event) => {
      const link = event.target.closest('a.site-search-result');
      if (!link) return;

      event.preventDefault();

      const href = link.getAttribute('href') || '';
      const destinationFile = getFileFromHref(href);
      const hash = href.includes('#') ? `#${href.split('#')[1]}` : '';

      storePendingHighlight(href, input?.value || '');
      closeSearch();

      if (destinationFile === getCurrentPageFile() && hash) {
        navigateToHashTarget(hash);
        return;
      }

      window.location.href = href;
    });

    syncUiText();
    renderEmptyState();
  };

  const onKeydown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (isOpen) closeSearch();
      else openSearch();
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeSearch();
    }
  };

  const init = () => {
    createModal();
    searchButton.addEventListener('click', openSearch);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('site:languagechange', () => {
      syncUiText();
    });
    consumePendingHighlight();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
