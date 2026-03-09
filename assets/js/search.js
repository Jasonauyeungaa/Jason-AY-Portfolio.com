(() => {
  const searchButton = document.getElementById('siteSearchToggle');
  if (!searchButton) return;

  const i18n = window.JasonI18n || {};
  const pageTitles = i18n.pageTitles || {};
  const indexCache = {};
  const suggestionCache = {};

  let isOpen = false;
  let modal;
  let backdrop;
  let input;
  let status;
  let results;
  let closeButton;
  let autocomplete;

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

  const buildHref = (url) => {
    const parts = String(url || '').split('#');
    const file = parts[0] || 'index.html';
    const hash = parts[1] ? `#${parts[1]}` : '';
    if (getCurrentPageFile() === file) {
      return hash || file;
    }
    return `${file}${hash}`;
  };

  const aliasGroups = {
    about: [
      'about', 'jason', 'introduction', 'intro', 'who is jason', 'profile',
      '關於', '关于', '介紹', '介绍', '自我介紹', '自我介绍',
      'sobre', 'perfil', 'quien es jason', 'quién es jason', 'introduccion', 'introducción'
    ],
    awards: [
      'awards', 'achievements', 'prize', 'winner', 'grand prize', 'award', 'champion',
      '獎項', '奖项', '成就', '得獎', '得奖', '冠軍', '冠军', '總冠軍', '总冠军',
      'premios', 'premio', 'logros', 'ganador', 'gran premio', 'campeon', 'campeón'
    ],
    experience: [
      'experience', 'work experience', 'professional experience', 'job', 'career', 'haeco', 'co-op', 'coop', 'internship',
      '工作經驗', '工作经验', '經驗', '经验', '實習', '实习', '職業', '职业', '工作',
      'experiencia', 'experiencia profesional', 'practica', 'práctica', 'pasantia', 'pasantía', 'trabajo', 'carrera'
    ],
    projects: [
      'projects', 'project', 'portfolio', 'fyp', 'final year project', 'bay management system', 'inventory control', 'youtube database', 'christmas effects',
      '項目', '项目', '專題', '专题', '作品', '畢業專題', '毕业专题', '機位管理系統', '机位管理系统', '庫存控制', '库存控制',
      'proyectos', 'proyecto', 'portafolio', 'proyecto final', 'control de inventario', 'sistema de gestion de bahias', 'sistema de gestión de bahías'
    ],
    education: [
      'education', 'edu', 'education background', 'hkust', 'hku', 'hku space', 'university', 'school', 'degree', 'study',
      '教育', '教育背景', '學歷', '学历', '大學', '大学', '學校', '学校', '學位', '学位', '讀書', '读书',
      'educacion', 'educación', 'formacion academica', 'formación académica', 'universidad', 'estudios', 'titulo', 'título'
    ],
    skills: [
      'skills', 'skill', 'programming', 'python', 'sql', 'r', 'octave', 'ai tools', 'aws q developer', 'krio', 'automl', 'languages',
      '技能', '技術', '技术', '編程', '编程', '程式', '程序', '語言', '语言', '工具',
      'habilidades', 'habilidad', 'programacion', 'programación', 'lenguajes', 'herramientas', 'ia'
    ],
    contact: [
      'contact', 'contact info', 'email', 'github', 'resume', 'cv',
      '聯絡', '联络', '聯繫', '联系', '電郵', '电邮', '履歷', '履历', '簡歷', '简历',
      'contacto', 'informacion de contacto', 'información de contacto', 'correo', 'curriculum', 'currículum', 'github'
    ],
    hackathon: [
      'aws hackathon', 'hackathon', 'bay management', 'aircraft bay', 'award', 'challenge', 'solution', 'demo', 'media', 're:invent',
      '黑客松', '黑客松aws', '機位管理', '机位管理', '挑戰', '挑战', '方案', '示範', '演示', '影響', '影响',
      'hackathon aws', 'desafio', 'desafío', 'solucion', 'solución', 'demo', 'impacto', 'medios', 'reinvent', 're invent'
    ],
    coop: [
      'haeco co-op', 'haeco coop', 'co-op', 'internship', 'techathon', 'lean day', 'timeline', 'learnings',
      '港機', '港机', '實習', '实习', '收穫', '收获', '時間線', '时间线', '亮點', '亮点', '精益日',
      'experiencia co-op', 'co-op haeco', 'pasantia', 'pasantía', 'aprendizajes', 'cronologia', 'cronología', 'logros', 'lean day'
    ],
    policy: [
      'policy', 'statement', 'chatbot notice', 'accuracy', 'disclaimer', 'purpose',
      '政策', '聲明', '声明', '準確性', '准确性', '免責聲明', '免责声明', '用途',
      'politica', 'política', 'declaracion', 'declaración', 'aviso del chatbot', 'precision', 'precisión', 'descargo', 'proposito', 'propósito'
    ]
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
    const keywords = unique(config.keywords || []);
    entries.push({
      pageId: config.pageId,
      pageTitle,
      heading,
      href: buildHref(config.href),
      text,
      keywords,
      searchText: normalizeText([pageTitle, heading, text, keywords.join(' ')].join(' '))
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
      keywords: aliasGroups.about.concat(['ieem', 'data', 'ai', 'industrial engineering'])
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
      keywords: aliasGroups.awards.concat(['champion', 'academic excellence', 'lean day', 'techathon'])
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
      keywords: aliasGroups.experience.concat(['itso', 'speedy group', 'asset management'])
    });

    addEntry(entries, {
      lang,
      pageId: 'home',
      href: 'index.html#projects',
      heading: t('proj.title', 'Featured Projects'),
      textParts: [
        t('proj.haeco.title', ''),
        t('proj.haeco.desc', ''),
        t('proj.fyp.title', ''),
        t('proj.fyp.desc', ''),
        t('proj.christmas.title', ''),
        t('proj.christmas.desc', ''),
        t('proj.youtube.title', ''),
        t('proj.youtube.desc', '')
      ],
      keywords: aliasGroups.projects.concat(['jit', 'monte carlo', 'sqlite', 'data mining'])
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
      keywords: aliasGroups.education.concat(['big data technology', 'data science', 'class representative'])
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
        t('skills.languages.title', ''),
        t('skills.languages.english', ''),
        t('skills.languages.cantonese', ''),
        t('skills.languages.mandarin', '')
      ],
      keywords: aliasGroups.skills.concat(['python', 'sql', 'openai codex', 'aws q developer', 'canva', 'adobe'])
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
      keywords: aliasGroups.contact.concat(['wcauyeungaa', 'connect.ust.hk', 'github'])
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
      keywords: aliasGroups.coop.concat(['technology innovation', 'transformation and technology', '5 months'])
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
      keywords: aliasGroups.coop.concat(['techathon', 'lean day', 're:invent', 'media interviews'])
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
      keywords: aliasGroups.coop.concat(['reflection', 'personal reflection', 'leadership', 'operations', 'ai'])
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
      keywords: aliasGroups.hackathon.concat(['grand prize', '130 teams', '14 days'])
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
      keywords: aliasGroups.hackathon.concat(['aircraft bay assignment', 'manual planning', 'constraints'])
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
      keywords: aliasGroups.hackathon.concat(['optimization', 'real-time visualization', 'dashboard', 'chatbot'])
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
      keywords: aliasGroups.hackathon.concat(['scmp', 'unwire', 'aws hong kong', 'las vegas', 're:invent'])
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
      keywords: aliasGroups.hackathon.concat(['reflection', 'future', 'practical ai'])
    });

    addEntry(entries, {
      lang,
      pageId: 'policy',
      href: 'policy.html#purpose',
      heading: t('policy.purpose.title', 'Purpose of This Website'),
      textParts: [
        stripHtml(t('policy.purpose.body', ''))
      ],
      keywords: aliasGroups.policy.concat(['portfolio policy', 'website purpose'])
    });

    addEntry(entries, {
      lang,
      pageId: 'policy',
      href: 'policy.html#accuracy',
      heading: t('policy.accuracy.title', 'Accuracy and CV Precedence'),
      textParts: [
        stripHtml(t('policy.accuracy.body', ''))
      ],
      keywords: aliasGroups.policy.concat(['accuracy', 'cv precedence', 'official cv'])
    });

    addEntry(entries, {
      lang,
      pageId: 'policy',
      href: 'policy.html#chatbot',
      heading: t('policy.chatbot.title', 'Chatbot Notice'),
      textParts: [
        stripHtml(t('policy.chatbot.body', ''))
      ],
      keywords: aliasGroups.policy.concat(['chatbot', 'ai-generated', 'probabilistic', 'search vs chatbot'])
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
      entry.keywords.forEach((keyword) => pool.push(keyword));
    });

    getCannedSuggestions(lang).forEach((item) => pool.push(item));
    aliasGroups.education.forEach((item) => pool.push(item));
    aliasGroups.projects.forEach((item) => pool.push(item));
    aliasGroups.hackathon.forEach((item) => pool.push(item));
    aliasGroups.coop.forEach((item) => pool.push(item));
    aliasGroups.skills.forEach((item) => pool.push(item));
    aliasGroups.contact.forEach((item) => pool.push(item));

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

  const getSuggestions = (query, lang) => {
    const pool = buildSuggestionPool(lang);
    return pool
      .map((item) => ({ item, score: scoreSuggestion(query, item) }))
      .filter((item) => item.score >= 0)
      .sort((left, right) => right.score - left.score || left.item.length - right.item.length)
      .slice(0, 6)
      .map((item) => item.item);
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
    const keywordText = normalizeText(entry.keywords.join(' '));

    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      if (entry.searchText.indexOf(term) === -1) return -1;
      if (heading === term) score += 40;
      else if (heading.indexOf(term) === 0) score += 28;
      else if (heading.indexOf(` ${term}`) !== -1) score += 18;
      if (pageTitle.indexOf(term) !== -1) score += 10;
      if (keywordText.indexOf(term) !== -1) score += 18;
      score += Math.max(1, entry.searchText.split(term).length - 1);
    }

    return score;
  };

  const renderSuggestions = (query) => {
    if (!autocomplete) return;

    const trimmed = String(query || '').trim();
    if (!trimmed) {
      autocomplete.hidden = true;
      autocomplete.innerHTML = '';
      return;
    }

    const suggestions = getSuggestions(trimmed, getLang());
    if (!suggestions.length) {
      autocomplete.hidden = true;
      autocomplete.innerHTML = '';
      return;
    }

    autocomplete.hidden = false;
    autocomplete.innerHTML = suggestions.map((suggestion) => (
      `<button type="button" class="site-search-suggestion" data-suggestion="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`
    )).join('');

    autocomplete.querySelectorAll('.site-search-suggestion').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.dataset.suggestion || button.textContent || '';
        renderSuggestions(input.value);
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
      performSearch(input.value);
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

    results.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        closeSearch();
      }
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
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
