// Jason AI Assistant - Enhanced Intelligent Chatbot

class JasonAssistant {
  constructor() {
    this.runtimePrefs = window.JasonRuntimePrefs || (window.JasonRuntimePrefs = {});
    this.conversationStart = new Date();
    this.messageCount = 0;
    this.knowledgeData = null;
    this.knowledgeBase = [];
    this.knowledgeIndex = null;
    this.intentHistory = [];
    this.lastIntentPicks = {};
    this.pendingFollowUp = null;
    this.currentLang = 'en';
    this.eyeReactionTimer = null;
    this.pointerX = window.innerWidth * 0.5;
    this.pointerY = window.innerHeight * 0.5;
    this.page = document.body?.dataset.page || 'home';
    this.activeSectionId = null;
    this.contextPromptTimer = null;
    this.contextIdlePromptTimer = null;
    this.contextPromptHideTimer = null;
    this.contextPromptSeen = new Set();
    this.contextPromptMeta = new Map();
    this.contextPromptInteracting = false;
    this.initialIntroPromptActive = false;
    this.introPromptSeenInSession = false;
    this.sectionPromptMap = null;
    this.domContext = window.PortfolioDomContext ? new window.PortfolioDomContext({ page: this.page }) : null;
    this.engine = window.JasonAssistantEngine ? new window.JasonAssistantEngine({
      page: this.page,
      domContext: this.domContext
    }) : null;
    this.loadKnowledge();
    this.detectLanguage();
    
    this.init();
  }
  
  loadKnowledge() {
    const embeddedData = window.JASON_ASSISTANT_KNOWLEDGE;
    if (!embeddedData) {
      console.warn('Embedded assistant knowledge not found, using fallback');
      this.knowledgeData = null;
      this.knowledgeBase = [];
      this.engine?.setKnowledge({});
      return;
    }

    this.knowledgeData = embeddedData;
    this.knowledgeBase = Array.isArray(embeddedData.snippets)
      ? embeddedData.snippets
      : (embeddedData.entries || []).map((entry) => this.toLegacySnippet(entry)).filter(Boolean);
    this.buildIndex();
    this.engine?.setKnowledge(embeddedData);
  }

  toLegacySnippet(entry) {
    if (!entry) return null;

    const text = entry.summary_long || entry.summary_short || entry.title;
    const tags = [
      entry.topic,
      ...(entry.keywords || []),
      ...(entry.aliases || [])
    ].filter(Boolean);

    return {
      id: entry.id,
      title: entry.title || entry.id,
      text,
      tags,
      url: entry.url || (entry.page ? `${entry.page}${entry.section ? `#${entry.section}` : ''}` : '')
    };
  }
  
  buildIndex() {
    this.knowledgeIndex = this.knowledgeBase.map(snippet => ({
      id: snippet.id,
      tokens: this.tokenize(`${snippet.text || ''} ${(snippet.tags || []).join(' ')}`),
      snippet
    }));
  }
  
  detectLanguage() {
    this.currentLang = this.runtimePrefs.language || document.documentElement.lang || 'en';

    const syncLanguage = (lang) => {
      const nextLang = lang || this.runtimePrefs.language || document.documentElement.lang || 'en';
      if (nextLang === this.currentLang) return;
      this.currentLang = nextLang;
      this.refreshWelcomeMessage();
    };

    window.addEventListener('site:languagechange', (event) => {
      syncLanguage(event.detail?.lang);
    });
  }
  
  refreshWelcomeMessage() {
    const messagesDiv = document.getElementById('chatMessages');
    if (messagesDiv && messagesDiv.children.length === 1) {
      messagesDiv.innerHTML = '';
      this.showWelcomeMessage();
    }
    // Update UI text
    this.updateChatUI();
  }
  
  updateChatUI() {
    const chatTitle = document.getElementById('chatTitle');
    const chatStatus = document.getElementById('chatStatus');
    const suggestionsTitle = document.getElementById('suggestionsTitle');
    const chatInput = document.getElementById('chatInput');
    const chatInputNote = document.getElementById('chatInputNote');
    
    if (chatTitle) chatTitle.textContent = this.t('chatTitle');
    if (chatStatus) chatStatus.textContent = this.t('chatStatus');
    if (suggestionsTitle) suggestionsTitle.textContent = this.t('suggestedQuestions');
    if (chatInput) chatInput.placeholder = this.t('inputPlaceholder');
    if (chatInputNote) chatInputNote.textContent = this.t('inputNote');
    
    // Update suggestion buttons text and queries
    const suggest1 = document.getElementById('suggest1');
    const suggest2 = document.getElementById('suggest2');
    const suggest3 = document.getElementById('suggest3');
    const suggest4 = document.getElementById('suggest4');
    const suggest5 = document.getElementById('suggest5');
    const suggest6 = document.getElementById('suggest6');
    
    if (suggest1) {
      suggest1.textContent = this.t('suggestionAbout');
      suggest1.dataset.query = 'queryAbout';
    }
    if (suggest2) {
      suggest2.textContent = this.t('suggestionHackathon');
      suggest2.dataset.query = 'queryHackathon';
    }
    if (suggest3) {
      suggest3.textContent = this.t('suggestionHaeco');
      suggest3.dataset.query = 'queryHaeco';
    }
    if (suggest4) {
      suggest4.textContent = this.t('suggestionFunFact');
      suggest4.dataset.query = 'queryFunFact';
    }
    if (suggest5) {
      suggest5.textContent = this.t('suggestionTime');
      suggest5.dataset.query = 'queryTime';
    }
    if (suggest6) {
      suggest6.textContent = this.t('suggestionChatTime');
      suggest6.dataset.query = 'queryChatTime';
    }

    this.updateDynamicSuggestionButtons();
    this.refreshContextPrompt();
  }

  getSuggestionCatalog() {
    return {
      aboutJason: {
        en: 'Tell me about Jason',
        'zh-TW': '告訴我關於Jason',
        'zh-CN': '告诉我关于Jason',
        es: 'Cuéntame sobre Jason'
      },
      funFact: {
        en: 'Fun fact',
        'zh-TW': '趣事',
        'zh-CN': '趣事',
        es: 'Dato curioso'
      },
      tellFunFact: {
        en: 'Tell me a fun fact',
        'zh-TW': '告訴我一個趣事',
        'zh-CN': '告诉我一个趣事',
        es: 'Cuéntame un dato curioso'
      },
      anotherFunFact: {
        en: 'Another fun fact',
        'zh-TW': '另一個趣事',
        'zh-CN': '另一个趣事',
        es: 'Otro dato curioso'
      },
      whatTime: {
        en: 'What time is it?',
        'zh-TW': '現在幾點？',
        'zh-CN': '现在几点？',
        es: '¿Qué hora es?'
      },
      chatStats: {
        en: 'Chat stats',
        'zh-TW': '聊天統計',
        'zh-CN': '聊天统计',
        es: 'Estadisticas del chat'
      },
      awsHackathon: {
        en: 'AWS Hackathon',
        'zh-TW': 'AWS黑客松',
        'zh-CN': 'AWS黑客松',
        es: 'AWS Hackathon'
      },
      awsHackathonDetails: {
        en: 'AWS Hackathon details',
        'zh-TW': 'AWS黑客松詳情',
        'zh-CN': 'AWS黑客松详情',
        es: 'Detalles del AWS Hackathon'
      },
      awsHackathonStory: {
        en: 'AWS Hackathon story',
        'zh-TW': 'AWS黑客松故事',
        'zh-CN': 'AWS黑客松故事',
        es: 'Historia del AWS Hackathon'
      },
      haecoCoop: {
        en: 'HAECO Co-op',
        'zh-TW': '港機Co-op',
        'zh-CN': '港机Co-op',
        es: 'Co-op en HAECO'
      },
      haecoCoopDetails: {
        en: 'HAECO Co-op details',
        'zh-TW': '港機Co-op詳情',
        'zh-CN': '港机Co-op详情',
        es: 'Detalles del Co-op en HAECO'
      },
      haecoCoopExperience: {
        en: 'HAECO Co-op experience',
        'zh-TW': '港機Co-op經驗',
        'zh-CN': '港机Co-op经验',
        es: 'Experiencia Co-op en HAECO'
      },
      haecoExperience: {
        en: 'Tell me about HAECO',
        'zh-TW': '告訴我關於港機',
        'zh-CN': '告诉我关于港机',
        es: 'Cuentame sobre HAECO'
      },
      techathonDetails: {
        en: 'Techathon details',
        'zh-TW': '創科馬拉松詳情',
        'zh-CN': '创科马拉松详情',
        es: 'Detalles del Techathon'
      },
      leanDayMc: {
        en: 'Lean Day MC',
        'zh-TW': '精益日司儀',
        'zh-CN': '精益日司仪',
        es: 'MC de Lean Day'
      },
      skills: {
        en: 'Skills',
        'zh-TW': '技能',
        'zh-CN': '技能',
        es: 'Habilidades'
      },
      skillsOverview: {
        en: 'Skills overview',
        'zh-TW': '技能概覽',
        'zh-CN': '技能概览',
        es: 'Resumen de habilidades'
      },
      hisSkills: {
        en: 'What are his skills?',
        'zh-TW': '他的技能是什麼？',
        'zh-CN': '他的技能是什么？',
        es: 'Cuales son sus habilidades'
      },
      education: {
        en: 'Education',
        'zh-TW': '教育',
        'zh-CN': '教育',
        es: 'Educacion'
      },
      educationBackground: {
        en: 'Education background',
        'zh-TW': '教育背景',
        'zh-CN': '教育背景',
        es: 'Formacion academica'
      },
      projects: {
        en: 'Projects',
        'zh-TW': '項目',
        'zh-CN': '项目',
        es: 'Proyectos'
      },
      awards: {
        en: 'Awards',
        'zh-TW': '獎項',
        'zh-CN': '奖项',
        es: 'Premios'
      },
      contact: {
        en: 'Contact',
        'zh-TW': '聯絡',
        'zh-CN': '联络',
        es: 'Contacto'
      },
      contactInfo: {
        en: 'Contact info',
        'zh-TW': '聯絡資訊',
        'zh-CN': '联络信息',
        es: 'Informacion de contacto'
      },
      experience: {
        en: 'Experience',
        'zh-TW': '經驗',
        'zh-CN': '经验',
        es: 'Experiencia'
      },
      bayManagementSystem: {
        en: 'What is the Bay Management System?',
        'zh-TW': '什麼是機位管理系統？',
        'zh-CN': '什么是机位管理系统？',
        es: 'Que es el Sistema de Gestion de Bahias'
      },
      awsWhen: {
        en: 'When was the AWS Hackathon?',
        'zh-TW': 'AWS黑客松是什麼時候？',
        'zh-CN': 'AWS黑客松是什么时候？',
        es: 'Cuando fue el AWS Hackathon'
      },
      awsTeams: {
        en: 'How many teams were in the hackathon?',
        'zh-TW': '黑客松有多少隊伍？',
        'zh-CN': '黑客松有多少队伍？',
        es: 'Cuantos equipos habia en el hackathon'
      },
      downloadCv: {
        en: "View Jason's resume",
        'zh-TW': '查看Jason的履歷',
        'zh-CN': '查看Jason的履历',
        es: 'Ver el CV de Jason'
      },
      englishResume: {
        en: "View Jason's English resume",
        'zh-TW': '查看Jason的英文履歷',
        'zh-CN': '查看Jason的英文履历',
        es: 'Ver el CV de Jason en inglés'
      },
      chineseResume: {
        en: "View Jason's Chinese resume",
        'zh-TW': '查看Jason的中文履歷',
        'zh-CN': '查看Jason的中文履历',
        es: 'Ver el CV de Jason en chino'
      },
      githubProfile: {
        en: "What is Jason's GitHub?",
        'zh-TW': 'Jason 的 GitHub 是什麼？',
        'zh-CN': 'Jason 的 GitHub 是什么？',
        es: '¿Cuál es el GitHub de Jason?'
      }
    };
  }

  getSuggestionKey(text) {
    return this.findCatalogMatch(text, this.getSuggestionCatalog())?.key || null;
  }

  findCatalogMatch(text, catalog = {}) {
    const normalized = this.normalize(text);

    for (const [key, labels] of Object.entries(catalog)) {
      for (const label of Object.values(labels)) {
        if (this.normalize(label) === normalized) {
          return { key, labels };
        }
      }
    }

    return null;
  }

  matchDynamicAssistantQuery(text = '') {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const patterns = [
      {
        type: 'page_summary',
        patterns: [
          /^summarize this page$/i,
          /^總結這一頁$/u,
          /^总结这一页$/u,
          /^resume esta página$/iu,
          /^resume esta pagina$/iu
        ]
      },
      {
        type: 'section_summary',
        patterns: [
          /^summarize this section$/i,
          /^summarize the (.+) section$/i,
          /^總結這個部分$/u,
          /^總結「(.+)」這部分$/u,
          /^总结这个部分$/u,
          /^总结“(.+)”这部分$/u,
          /^resume esta sección$/iu,
          /^resume la sección "(.+)"$/iu,
          /^resume esta seccion$/iu,
          /^resume la seccion "(.+)"$/iu
        ]
      },
      {
        type: 'section_focus',
        patterns: [
          /^tell me about this section$/i,
          /^tell me about the (.+) section$/i,
          /^告訴我這個部分的重點$/u,
          /^告訴我「(.+)」這部分的重點$/u,
          /^告诉我这个部分的重点$/u,
          /^告诉我“(.+)”这部分的重点$/u,
          /^cuéntame sobre esta sección$/iu,
          /^cuéntame sobre la sección "(.+)"$/iu,
          /^cuentame sobre esta seccion$/iu,
          /^cuentame sobre la seccion "(.+)"$/iu
        ]
      }
    ];

    for (const matcher of patterns) {
      for (const pattern of matcher.patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          return {
            type: matcher.type,
            title: match[1] || ''
          };
        }
      }
    }

    return null;
  }

  translateSuggestion(text) {
    const match = this.findCatalogMatch(text, this.getSuggestionCatalog());
    if (!match) return text;

    return match.labels[this.currentLang] || match.labels.en || text;
  }

  localizeSuggestionText(text) {
    if (!text) return text;
    return this.localizePromptQuery(this.translateSuggestion(text));
  }

  shouldDisplayLocalizedSuggestion(original, localized) {
    if (!localized) return false;
    if (this.currentLang === 'en') return true;
    if (localized !== original) return true;
    if (/[一-鿿]/u.test(localized)) return true;
    if (/[áéíóúñü¿¡]/i.test(localized)) return true;
    return !/^[\x00-\x7F\s"'`?!.,:;()\-_/&]+$/.test(localized);
  }

  getPromptQueryCatalog() {
    return {
      tell_me_about_jason: {
        en: 'Tell me about Jason',
        'zh-TW': '告訴我關於Jason',
        'zh-CN': '告诉我关于Jason',
        es: 'Cuéntame sobre Jason'
      },
      what_awards_has_jason_won: {
        en: 'What awards has Jason won?',
        'zh-TW': 'Jason 獲得了哪些獎項？',
        'zh-CN': 'Jason 获得了哪些奖项？',
        es: '¿Qué premios ha ganado Jason?'
      },
      experience: {
        en: 'Experience',
        'zh-TW': '經驗',
        'zh-CN': '经验',
        es: 'Experiencia'
      },
      what_is_jasons_experience: {
        en: "What is Jason's experience?",
        'zh-TW': 'Jason 的經驗是什麼？',
        'zh-CN': 'Jason 的经验是什么？',
        es: '¿Cuál es la experiencia de Jason?'
      },
      projects: {
        en: 'Projects',
        'zh-TW': '項目',
        'zh-CN': '项目',
        es: 'Proyectos'
      },
      what_projects_should_i_look_at_first: {
        en: 'What projects should I look at first?',
        'zh-TW': '我應該先看哪些項目？',
        'zh-CN': '我应该先看哪些项目？',
        es: '¿Qué proyectos debería ver primero?'
      },
      education_background: {
        en: 'Education background',
        'zh-TW': '教育背景',
        'zh-CN': '教育背景',
        es: 'Formación académica'
      },
      what_is_jasons_education_background: {
        en: "What is Jason's education background?",
        'zh-TW': 'Jason 的教育背景是什麼？',
        'zh-CN': 'Jason 的教育背景是什么？',
        es: '¿Cuál es la formación académica de Jason?'
      },
      what_are_jasons_skills: {
        en: "What are Jason's skills?",
        'zh-TW': 'Jason 有哪些技能？',
        'zh-CN': 'Jason 有哪些技能？',
        es: '¿Cuáles son las habilidades de Jason?'
      },
      what_ai_tools_does_jason_use: {
        en: 'What AI tools does Jason use?',
        'zh-TW': 'Jason 使用哪些 AI 工具？',
        'zh-CN': 'Jason 使用哪些 AI 工具？',
        es: '¿Qué herramientas de IA usa Jason?'
      },
      what_programming_languages_does_jason_know: {
        en: 'What programming languages does Jason know?',
        'zh-TW': 'Jason 會哪些程式語言？',
        'zh-CN': 'Jason 会哪些编程语言？',
        es: '¿Qué lenguajes de programación conoce Jason?'
      },
      techathon_details: {
        en: 'Techathon details',
        'zh-TW': '創科馬拉松詳情',
        'zh-CN': '创科马拉松详情',
        es: 'Detalles del Techathon'
      },
      tell_me_about_the_techathon: {
        en: 'Tell me about the Techathon',
        'zh-TW': '告訴我關於創科馬拉松',
        'zh-CN': '告诉我关于创科马拉松',
        es: 'Cuéntame sobre el Techathon'
      },
      tell_me_about_lean_day: {
        en: 'Tell me about Lean Day',
        'zh-TW': '告訴我關於精益日',
        'zh-CN': '告诉我关于精益日',
        es: 'Cuéntame sobre Lean Day'
      },
      lean_day_mc: {
        en: 'Lean Day MC',
        'zh-TW': '精益日司儀',
        'zh-CN': '精益日司仪',
        es: 'MC de Lean Day'
      },
      contact_info: {
        en: 'Contact info',
        'zh-TW': '聯絡資訊',
        'zh-CN': '联络信息',
        es: 'Información de contacto'
      },
      how_can_i_contact_jason: {
        en: 'How can I contact Jason?',
        'zh-TW': '我可以怎樣聯絡 Jason？',
        'zh-CN': '我可以怎样联系 Jason？',
        es: '¿Cómo puedo contactar a Jason?'
      },
      haeco_coop_experience: {
        en: 'HAECO Co-op experience',
        'zh-TW': 'HAECO Co-op 經驗',
        'zh-CN': 'HAECO Co-op 经验',
        es: 'Experiencia Co-op en HAECO'
      },
      haeco_coop_details: {
        en: 'HAECO Co-op details',
        'zh-TW': 'HAECO Co-op 詳情',
        'zh-CN': 'HAECO Co-op 详情',
        es: 'Detalles del Co-op en HAECO'
      },
      what_did_jason_do_at_haeco: {
        en: 'What did Jason do at HAECO?',
        'zh-TW': 'Jason 在港機做了什麼？',
        'zh-CN': 'Jason 在港机做了什么？',
        es: '¿Qué hizo Jason en HAECO?'
      },
      what_did_jason_learn_from_haeco: {
        en: 'What did Jason learn from HAECO?',
        'zh-TW': 'Jason 從 HAECO 學到了什麼？',
        'zh-CN': 'Jason 从 HAECO 学到了什么？',
        es: '¿Qué aprendió Jason en HAECO?'
      },
      summarize_this_page: {
        en: 'Summarize this page',
        'zh-TW': '總結這一頁',
        'zh-CN': '总结这一页',
        es: 'Resume esta página'
      },
      summarize_this_section: {
        en: 'Summarize this section',
        'zh-TW': '總結這個部分',
        'zh-CN': '总结这个部分',
        es: 'Resume esta sección'
      },
      summarize_timeline_section: {
        en: 'Summarize the timeline section',
        'zh-TW': '總結時間線部分',
        'zh-CN': '总结时间线部分',
        es: 'Resume la sección de cronología'
      },
      tell_me_about_this_section: {
        en: 'Tell me about this section',
        'zh-TW': '告訴我這個部分的重點',
        'zh-CN': '告诉我这个部分的重点',
        es: 'Cuéntame sobre esta sección'
      },
      whats_the_story_behind_these_photos: {
        en: "What's the story behind these photos?",
        'zh-TW': '這些照片背後有什麼故事？',
        'zh-CN': '这些照片背后有什么故事？',
        es: '¿Cuál es la historia detrás de estas fotos?'
      },
      aws_hackathon_details: {
        en: 'AWS Hackathon details',
        'zh-TW': 'AWS 黑客松詳情',
        'zh-CN': 'AWS 黑客松详情',
        es: 'Detalles del AWS Hackathon'
      },
      aws_hackathon_story: {
        en: 'AWS Hackathon story',
        'zh-TW': 'AWS 黑客松故事',
        'zh-CN': 'AWS 黑客松故事',
        es: 'Historia del AWS Hackathon'
      },
      why_did_hackathon_project_win: {
        en: 'Why did the hackathon project win?',
        'zh-TW': '為什麼這個黑客松項目會得獎？',
        'zh-CN': '为什么这个黑客松项目会得奖？',
        es: '¿Por qué ganó el proyecto del hackathon?'
      },
      what_is_bay_management_system: {
        en: 'What is the Bay Management System?',
        'zh-TW': '什麼是機位管理系統？',
        'zh-CN': '什么是机位管理系统？',
        es: '¿Qué es el Sistema de Gestión de Bahías?'
      },
      what_was_the_challenge: {
        en: 'What was the challenge?',
        'zh-TW': '當時的挑戰是什麼？',
        'zh-CN': '当时的挑战是什么？',
        es: '¿Cuál fue el desafío?'
      },
      who_made_demo_video: {
        en: 'Who made the demo video?',
        'zh-TW': '誰製作了示範影片？',
        'zh-CN': '谁制作了示范视频？',
        es: '¿Quién hizo el video demo?'
      },
      what_are_the_key_features: {
        en: 'What are the key features?',
        'zh-TW': '主要功能是什麼？',
        'zh-CN': '主要功能是什么？',
        es: '¿Cuáles son las funciones clave?'
      },
      what_impact_did_project_have: {
        en: 'What impact did the project have?',
        'zh-TW': '這個項目帶來了什麼影響？',
        'zh-CN': '这个项目带来了什么影响？',
        es: '¿Qué impacto tuvo el proyecto?'
      },
      what_media_covered_the_project: {
        en: 'What media covered the project?',
        'zh-TW': '有哪些媒體報導了這個項目？',
        'zh-CN': '有哪些媒体报道了这个项目？',
        es: '¿Qué medios cubrieron el proyecto?'
      },
      tell_me_about_reinvent: {
        en: 'Tell me about re:Invent',
        'zh-TW': '告訴我關於 re:Invent',
        'zh-CN': '告诉我关于 re:Invent',
        es: 'Cuéntame sobre re:Invent'
      },
      download_jasons_cv: {
        en: "View Jason's resume",
        'zh-TW': '查看Jason的履歷',
        'zh-CN': '查看Jason的履历',
        es: 'Ver el CV de Jason'
      },
      view_jasons_english_resume: {
        en: "View Jason's English resume",
        'zh-TW': '查看Jason的英文履歷',
        'zh-CN': '查看Jason的英文履历',
        es: 'Ver el CV de Jason en inglés'
      },
      view_jasons_chinese_resume: {
        en: "View Jason's Chinese resume",
        'zh-TW': '查看Jason的中文履歷',
        'zh-CN': '查看Jason的中文履历',
        es: 'Ver el CV de Jason en chino'
      },
      resume_versions_difference: {
        en: 'What is the difference between the resume versions?',
        'zh-TW': '履歷版本之間有什麼不同？',
        'zh-CN': '履历版本之间有什么不同？',
        es: '¿Qué diferencia hay entre las versiones del CV?'
      },
      what_is_jasons_final_year_project: {
        en: "What is Jason's Final Year Project?",
        'zh-TW': 'Jason 的畢業專題是什麼？',
        'zh-CN': 'Jason 的毕业专题是什么？',
        es: '¿Cuál es el proyecto final de Jason?'
      },
      what_is_jasons_github: {
        en: "What is Jason's GitHub?",
        'zh-TW': 'Jason 的 GitHub 是什麼？',
        'zh-CN': 'Jason 的 GitHub 是什么？',
        es: '¿Cuál es el GitHub de Jason?'
      },
      what_are_the_main_takeaways: {
        en: 'What are the main takeaways?',
        'zh-TW': '主要收穫是什麼？',
        'zh-CN': '主要收获是什么？',
        es: '¿Cuáles son los principales aprendizajes?'
      }
    };
  }

  getCanonicalAssistantQuery(query = '') {
    if (!query) return query;

    const promptMatch = this.findCatalogMatch(query, this.getPromptQueryCatalog());
    if (promptMatch) {
      return promptMatch.labels.en || query;
    }

    const suggestionMatch = this.findCatalogMatch(query, this.getSuggestionCatalog());
    if (suggestionMatch) {
      return suggestionMatch.labels.en || query;
    }

    const dynamicMatch = this.matchDynamicAssistantQuery(query);
    if (!dynamicMatch) return query;

    if (dynamicMatch.type === 'page_summary') {
      return 'Summarize this page';
    }

    if (dynamicMatch.type === 'section_focus') {
      return 'Tell me about this section';
    }

    return 'Summarize this section';
  }

  isGlobalAssistantQuery(query = '') {
    const normalized = this.normalize(query);
    if (!normalized) return false;

    const knownGlobalQueries = new Set([
      ...Object.values(this.getPromptQueryCatalog()).map((labels) => labels.en),
      ...Object.values(this.getSuggestionCatalog()).map((labels) => labels.en),
      'HAECO Co-op',
      'AWS Hackathon',
      'Education',
      'Experience',
      'Projects',
      'Awards',
      'Contact',
      'Skills'
    ].map((item) => this.normalize(item)).filter(Boolean));

    return knownGlobalQueries.has(normalized);
  }

  isSectionFocusedQuery(query = '') {
    const normalized = this.normalize(query);
    return /(section|features|feature|timeline|gallery|photos|story behind|challenge|solution|media|impact|takeaways|learn|learning|highlights|demo|milestones|short version|optimizer|what are the key features|who made the demo video|what media covered|what impact did the project have|what did jason learn from haeco|部分|這部分|这部分|重點|重点|功能|時間線|时间线|圖庫|图库|照片|故事|挑戰|挑战|方案|影響|影响|收穫|收获|亮點|亮点|示範|示范|功能重點|seccion|funciones|cronologia|galeria|fotos|desafio|solucion|impacto|aprendizajes|destacados|demo)/.test(normalized);
  }

  buildSuggestionPayload(query, contextSectionId = '') {
    const display = this.localizeSuggestionText(query);
    const canonical = this.getCanonicalAssistantQuery(query);
    const dynamicMatch = this.matchDynamicAssistantQuery(display) || this.matchDynamicAssistantQuery(query);

    let response = canonical;
    if (dynamicMatch?.type === 'page_summary') {
      response = 'Summarize this page';
    } else if (dynamicMatch?.type === 'section_summary') {
      response = 'Summarize this section';
    } else if (dynamicMatch?.type === 'section_focus') {
      response = 'Tell me about this section';
    } else if (this.currentLang !== 'en' && contextSectionId && !this.isGlobalAssistantQuery(canonical)) {
      response = this.isSectionFocusedQuery(canonical) ? 'Tell me about this section' : 'Summarize this section';
    }

    return {
      display,
      response,
      contextSectionId
    };
  }

  getContextualSuggestionQueries(contextSectionId = '') {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const catalogs = {
      'index.html': {
        home: ['Tell me about Jason', 'What projects should I look at first?', "What did Jason do at HAECO?", "What awards has Jason won?"],
        awards: ["What awards has Jason won?", 'Why did the hackathon project win?', 'Tell me about Lean Day', 'Tell me about the Techathon'],
        experience: ["What is Jason's experience?", "What did Jason do at HAECO?", 'What projects should I look at first?', "How can I contact Jason?"],
        projects: ['What is the Bay Management System?', "What projects should I look at first?", "What is Jason's Final Year Project?", "What are Jason's skills?"],
        education: ["What is Jason's education background?", "What is Jason's Final Year Project?", "What are Jason's skills?", "What awards has Jason won?"],
        skills: ["What are Jason's skills?", 'What AI tools does Jason use?', 'What programming languages does Jason know?', "How can I contact Jason?"],
        contact: ["How can I contact Jason?", "View Jason's resume", "What is Jason's GitHub?", 'Show me Jason\'s projects']
      },
      'coop.html': {
        overview: ["What did Jason do at HAECO?", 'Summarize this page', 'Tell me about the Techathon', 'Tell me about Lean Day'],
        highlights: ["What did Jason do at HAECO?", 'Tell me about the Techathon', 'Tell me about Lean Day', 'Summarize the timeline section'],
        timeline: ['Summarize the timeline section', 'What did Jason do at HAECO?', 'What did Jason learn from HAECO?', 'Tell me about the Techathon'],
        gallery: ["What's the story behind these photos?", 'Tell me about Lean Day', 'Tell me about the Techathon', 'Summarize this page'],
        learnings: ['What did Jason learn from HAECO?', 'Summarize the timeline section', "What did Jason do at HAECO?", 'Summarize this page']
      },
      'hackathon.html': {
        award: ['Why did the hackathon project win?', 'What is the Bay Management System?', 'What was the challenge?', 'What impact did the project have?'],
        challenge: ['What was the challenge?', 'What is the Bay Management System?', 'What are the key features?', 'Why did the hackathon project win?'],
        solution: ['What is the Bay Management System?', 'What are the key features?', 'What was the challenge?', 'Why did the hackathon project win?'],
        demo: ['Who made the demo video?', 'What are the key features?', 'What is the Bay Management System?', 'What impact did the project have?'],
        features: ['What are the key features?', 'What is the Bay Management System?', 'What impact did the project have?', 'Tell me about re:Invent'],
        media: ['What impact did the project have?', 'Tell me about re:Invent', 'What media covered the project?', 'Why did the hackathon project win?'],
        reflection: ['What are the main takeaways?', 'What impact did the project have?', 'What are the key features?', 'What is the Bay Management System?']
      }
    };

    const pageCatalog = catalogs[page] || {};
    const sectionQueries = pageCatalog[contextSectionId] || [];
    const pageFallbacks = {
      'index.html': ['Tell me about Jason', "What did Jason do at HAECO?", 'What is the Bay Management System?', "How can I contact Jason?"],
      'coop.html': ["What did Jason do at HAECO?", 'Tell me about the Techathon', 'Tell me about Lean Day', 'Summarize this page'],
      'hackathon.html': ['What is the Bay Management System?', 'Why did the hackathon project win?', 'What are the key features?', 'What impact did the project have?']
    };

    return [...sectionQueries, ...(pageFallbacks[page] || [])];
  }

  normalizeSuggestionPayloads(suggestions = [], contextSectionId = '', limit = 5) {
    const genericFallbacks = ['Tell me about Jason', "What did Jason do at HAECO?", 'What is the Bay Management System?', "How can I contact Jason?"];
    const candidates = [
      ...suggestions,
      ...this.getContextualSuggestionQueries(contextSectionId),
      ...genericFallbacks
    ];

    const payloads = [];
    const seenResponses = new Set();
    const seenDisplays = new Set();

    candidates.forEach((query) => {
      if (!query || payloads.length >= limit) return;
      const payload = this.buildSuggestionPayload(query, contextSectionId);
      const responseKey = `${payload.response}::${contextSectionId || ''}`;
      const displayKey = this.normalize(payload.display);

      if (!payload.display || seenResponses.has(responseKey) || seenDisplays.has(displayKey)) return;

      seenResponses.add(responseKey);
      seenDisplays.add(displayKey);
      payloads.push({
        ...payload,
        sourceQuery: query
      });
    });

    return payloads.slice(0, limit);
  }

  localizePromptQuery(query) {
    const match = this.findCatalogMatch(query, this.getPromptQueryCatalog());
    if (match) {
      return match.labels[this.currentLang] || match.labels.en || query;
    }

    const dynamicMatch = this.matchDynamicAssistantQuery(query);
    if (dynamicMatch) {
      if (dynamicMatch.type === 'page_summary') {
        const prompts = {
          en: 'Summarize this page',
          'zh-TW': '總結這一頁',
          'zh-CN': '总结这一页',
          es: 'Resume esta página'
        };
        return prompts[this.currentLang] || prompts.en;
      }

      if (dynamicMatch.type === 'section_summary') {
        if (dynamicMatch.title) {
          const templates = {
            en: `Summarize the ${dynamicMatch.title} section`,
            'zh-TW': `總結「${dynamicMatch.title}」這部分`,
            'zh-CN': `总结“${dynamicMatch.title}”这部分`,
            es: `Resume la sección "${dynamicMatch.title}"`
          };
          return templates[this.currentLang] || templates.en;
        }

        const prompts = {
          en: 'Summarize this section',
          'zh-TW': '總結這個部分',
          'zh-CN': '总结这个部分',
          es: 'Resume esta sección'
        };
        return prompts[this.currentLang] || prompts.en;
      }

      if (dynamicMatch.title) {
        const templates = {
          en: `Tell me about the ${dynamicMatch.title} section`,
          'zh-TW': `告訴我「${dynamicMatch.title}」這部分的重點`,
          'zh-CN': `告诉我“${dynamicMatch.title}”这部分的重点`,
          es: `Cuéntame sobre la sección "${dynamicMatch.title}"`
        };
        return templates[this.currentLang] || templates.en;
      }

      const prompts = {
        en: 'Tell me about this section',
        'zh-TW': '告訴我這個部分的重點',
        'zh-CN': '告诉我这个部分的重点',
        es: 'Cuéntame sobre esta sección'
      };
      return prompts[this.currentLang] || prompts.en;
    }

    return query;
  }

  updateDynamicSuggestionButtons() {
    document.querySelectorAll('.suggest-wrap').forEach((wrap) => {
      const buttons = Array.from(wrap.querySelectorAll('.suggest-btn'));
      const contextSectionId = buttons[0]?.dataset.contextSectionId || this.getCurrentSectionId() || '';
      const originals = buttons.map((button) => button.dataset.originalSuggestion || button.textContent.trim());
      const payloads = this.normalizeSuggestionPayloads(originals, contextSectionId, Math.max(buttons.length, 4));

      buttons.forEach((button, index) => {
        const payload = payloads[index];
        if (!payload) {
          button.remove();
          return;
        }
        button.dataset.originalSuggestion = payload.sourceQuery || originals[index] || payload.display;
        button.dataset.contextSectionId = contextSectionId;
        button.textContent = payload.display;
        button.dataset.q = payload.response;
      });
    });
  }

  getLocaleCode() {
    const locales = {
      en: 'en-US',
      'zh-TW': 'zh-HK',
      'zh-CN': 'zh-CN',
      es: 'es-ES'
    };

    return locales[this.currentLang] || locales.en;
  }

  getTimeBasedGreeting(date = new Date()) {
    const greetings = this.t('greeting');
    if (!Array.isArray(greetings) || greetings.length === 0) {
      return 'Hello';
    }

    const hour = date.getHours();
    if (hour >= 5 && hour < 12) {
      return greetings[0] || greetings[greetings.length - 1];
    }
    if (hour >= 12 && hour < 18) {
      return greetings[1] || greetings[0] || greetings[greetings.length - 1];
    }
    return greetings[2] || greetings[greetings.length - 1] || greetings[0];
  }

  getReplyCopy() {
    const copy = {
      en: {
        calculatorTitle: 'Calculator',
        coopDurationTitle: 'Co-op Duration',
        coopDurationText: "Jason's HAECO Co-op lasted",
        daysUntilTitle: 'Days Until',
        daysSinceTitle: 'Days Since',
        days: 'days',
        daysAgo: 'days ago',
        takeHackathon: 'Taking you to the AWS Hackathon page...',
        takeCoop: 'Taking you to the HAECO Co-op page...',
        takeHome: 'Taking you to the home page...',
        goHome: 'Go to Home',
        viewHackathonProject: 'View AWS Hackathon Project',
        viewCoopExperience: 'View Co-op Experience',
        learnMoreJason: 'Learn More About Jason',
        viewHackathonDetails: 'View Full Project Details',
        watchDemo: 'Watch Demo Video',
        viewCoopTimeline: 'View 5-Month Timeline',
        seeCoopMedia: 'See Photos & Videos',
        viewFullCv: 'View Full CV',
        viewEducationDetails: 'View Education Details',
        viewProjects: 'View All Projects',
        viewAchievements: 'View All Achievements',
        sendEmail: 'Open contact form',
        openGithub: 'Open GitHub',
        openResume: 'Open English Resume',
        openEnglishResume: 'Open English Resume',
        openChineseResume: 'Open Chinese Resume',
        askEnglishResume: 'English version',
        askChineseResume: 'Chinese version',
        resumeDifferenceQuestion: 'What is the difference between them?',
        viewExperience: 'View Full Experience',
        viewProjectSection: 'View Projects Section',
        techathonText: "💡 **HAECO Techathon**\n\nJason helped organize HAECO's first Techathon during his Co-op in the Technology Innovation team.\n\n• Designed the event framework and planning flow\n• Prepared materials for multiple GM-level meetings\n• Supported innovation pitching and cross-team coordination\n\nIt was one of the key initiatives highlighted during his HAECO experience.",
        leanDayText: "🎤 **HAECO Lean Day 2025**\n\nJason served as Master of Ceremony for HAECO Lean Day 2025.\n\n• Hosted the event and engaged with executives and attendees\n• Supported event flow and stage coordination\n• Added communication and presentation leadership to his Co-op experience",
        bayManagementText: "⚡ **HAECO Bay Management System**\n\nThe Bay Management System was Jason's AWS Hackathon project.\n\n• An AI-based aircraft bay scheduling optimization platform\n• Built in 14 days during the competition\n• Designed to automate bay assignment, improve scheduling, and support real-time operational visibility",
        hackathonScaleText: "🏆 **AWS Hackathon Scale**\n\nJason's team won the Grand Prize among **130+ shortlisted teams** in AWS AI Hackathon Hong Kong 2025.",
        hackathonWhenText: "📅 **AWS AI Hackathon Hong Kong 2025**\n\nThe portfolio identifies this achievement as **AWS AI Hackathon Hong Kong 2025**.\n\nThe project itself was built in **14 days** for the competition.",
        fypText: "🎯 **Jason's Final Year Project**\n\nJason's HKUST Final Year Project focuses on inventory control using efficient data-driven methods.\n\n• Research area: inventory optimization\n• Methods mentioned in the portfolio include JIT, Monte Carlo, AutoML, and multi-agent systems\n• It is positioned as a data and operations-focused academic project",
        projectsText: "🚀 **Featured Projects**\n\n**1. HAECO Bay Management System** 🏆\n• Grand Prize Winner - AWS AI Hackathon\n• AI-based aircraft bay scheduling\n• Built in 14 days\n\n**2. Inventory Control Research**\n• HKUST Final Year Project\n• JIT, Monte Carlo, AutoML, Multi-Agent Systems\n\n**3. Christmas Effects Study**\n• Data Science project analyzing livestock pricing\n\n**4. YouTube Database System**\n• SQLite database design and implementation",
        awardsText: "🏆 **Awards & Achievements**\n\n• **Grand Prize Winner** - AWS AI Hackathon Hong Kong 2025 (130+ teams)\n• **Master of Ceremony** - HAECO Lean Day 2025\n• **Lead Organizer** - HAECO Techathon 2026\n• **Academic Excellence Award** - HKU SPACE\n• **Principal's Honor List** - HKU SPACE\n• **Class Representative** - Data Science (80+ students)\n• **Certificate of Outstanding Achievement** - HAECO 2025",
        githubText: "💻 **Jason's GitHub**\n\nJason's GitHub is a good place to look at code work and technical repositories.\n\nIf you want the portfolio's formal summary instead, open the resume from the contact section.",
        contactText: "📬 **Get in Touch with Jason**\n\nThe fastest route is the message form in the contact section.\n\nUse it for collaboration, internship, project, or innovation conversations.\n\n📄 **CV:** View it from the same section for formal details.",
        cvText: "📄 **Jason's Resume**\n\nJason has both English and Chinese resume versions on the portfolio.\n\nWhich one do you want to view?",
        cvChoiceText: "📄 **Jason's Resume**\n\nJason has both English and Chinese versions ready.\n\nWhich one do you want to view?",
        cvEnglishText: "📄 **English Resume**\n\nThis is the base version for Jason's formal and up-to-date professional details.\n\nIf any wording differs between versions, use this one as the reference.",
        cvChineseText: "📄 **Chinese Resume**\n\nThis version is there for Chinese reading convenience.\n\nIf any wording differs between versions, the English resume is the base version.",
        cvDifferenceText: "📄 **Resume Versions**\n\nJason has both English and Chinese resume versions.\n\nThe English resume is the base version. The Chinese version is for easier reading in Chinese, but if any wording differs, use the English one as the reference.",
        experienceText: "💼 **Professional Experience**\n\n**1. HAECO Co-op Intern** (Sep 2025 - Jan 2026)\n• Technology Innovation department\n• AI-driven solutions for operations\n• Won AWS Hackathon Grand Prize\n\n**2. HKUST ITSO Internship** (Feb 2026 - Jun 2026)\n• IT support and asset management\n\n**3. Speedy Group IT Support** (Jul 2021 - Present)\n• Part-time IT operations\n• Digital media production",
        defaultText: "I'm Jason's AI assistant.\n\nI can help you learn about:\n\n• **AWS Hackathon**\n• **HAECO Co-op**\n• **Skills**\n• **Education**\n• **Experience**\n• **Fun Facts**\n• **Contact**\n• **Time & Date**\n• **Chat Stats**"
      },
      'zh-TW': {
        calculatorTitle: '計算結果',
        coopDurationTitle: 'Co-op時長',
        coopDurationText: 'Jason在港機的Co-op實習共歷時',
        daysUntilTitle: '距離',
        daysSinceTitle: '自從',
        days: '天',
        daysAgo: '天前',
        takeHackathon: '帶你前往AWS黑客松頁面...',
        takeCoop: '帶你前往港機Co-op頁面...',
        takeHome: '帶你前往主頁...',
        goHome: '前往主頁',
        viewHackathonProject: '查看AWS黑客松項目',
        viewCoopExperience: '查看Co-op經驗',
        learnMoreJason: '了解更多Jason資訊',
        viewHackathonDetails: '查看完整項目詳情',
        watchDemo: '觀看示範影片',
        viewCoopTimeline: '查看5個月時間線',
        seeCoopMedia: '查看照片與影片',
        viewFullCv: '查看完整履歷',
        viewEducationDetails: '查看教育背景',
        viewProjects: '查看所有項目',
        viewAchievements: '查看所有成就',
        sendEmail: '開啟聯絡表格',
        openGithub: '開啟 GitHub',
        openResume: '打開Jason英文履歷',
        openEnglishResume: '打開英文履歷',
        openChineseResume: '打開中文履歷',
        askEnglishResume: '英文版本',
        askChineseResume: '中文版本',
        resumeDifferenceQuestion: '兩個版本有什麼不同？',
        viewExperience: '查看完整經驗',
        viewProjectSection: '查看項目部分',
        techathonText: "💡 **港機創科馬拉松**\n\nJason在港機科技創新團隊Co-op期間，協助籌辦港機首個Techathon。\n\n• 設計活動框架與規劃流程\n• 為多次GM級別會議準備材料\n• 支援創新提案與跨團隊協調\n\n這是他港機實習期間其中一個重點項目。",
        leanDayText: "🎤 **港機精益日2025**\n\nJason於港機精益日2025擔任司儀。\n\n• 主持活動並與管理層及參加者互動\n• 支援活動流程與台上協調\n• 展現其溝通與簡報領導能力",
        bayManagementText: "⚡ **港機機位管理系統**\n\n機位管理系統是Jason團隊在AWS黑客松中的得獎項目。\n\n• 基於人工智能的飛機機位調度優化平台\n• 於比賽中14天內完成\n• 用於自動分配機位、優化排程及提升即時營運可視性",
        hackathonScaleText: "🏆 **AWS黑客松規模**\n\nJason團隊在2025 AWS AI黑客松香港賽事中，於**130+支入圍隊伍**中奪得總冠軍。",
        hackathonWhenText: "📅 **AWS AI黑客松香港2025**\n\n作品集將這項成就標示為**AWS AI黑客松香港2025**。\n\n該項目在比賽中以**14天**完成。",
        fypText: "🎯 **Jason的畢業專題**\n\nJason於HKUST的畢業專題聚焦於以高效數據驅動方法進行庫存控制。\n\n• 研究方向：庫存優化\n• 作品集中提到的方法包括JIT、Monte Carlo、AutoML及多代理系統\n• 屬於數據與營運導向的學術項目",
        projectsText: "🚀 **精選項目**\n\n**1. 港機機位管理系統** 🏆\n• AWS黑客松總冠軍項目\n• 基於AI的機位調度方案\n• 14天內完成\n\n**2. 庫存控制研究**\n• HKUST畢業專題\n• JIT、Monte Carlo、AutoML、多代理系統\n\n**3. 聖誕效應研究**\n• 數據科學項目，分析牲畜價格\n\n**4. YouTube資料庫系統**\n• SQLite資料庫設計與實作",
        awardsText: "🏆 **獎項與成就**\n\n• **總冠軍** - AWS AI黑客松香港2025（130+隊伍）\n• **司儀** - 港機精益日2025\n• **首席籌辦者** - 港機Techathon 2026\n• **學術卓越獎** - HKU SPACE\n• **校長榮譽錄** - HKU SPACE\n• **班代表** - 數據科學（80+名學生）\n• **傑出成就證書** - 港機2025",
        githubText: "💻 **Jason 的 GitHub**\n\n如果你想看 Jason 的程式碼作品與技術儲存庫，可以直接前往他的 GitHub。\n\n如果你想看正式背景摘要，則可從作品集打開履歷。",
        contactText: "📬 **聯絡Jason**\n\n最快的方法是使用聯絡區中的站內訊息表格。\n\n它適合合作、實習、項目或創新相關交流。\n\n📄 **履歷：** 同一區域也可直接開啟，查看較正式的資料。",
        cvText: "📄 **Jason 的履歷**\n\nJason 目前提供英文版與中文版履歷。\n\n你想看哪一個版本？",
        cvChoiceText: "📄 **Jason 的履歷**\n\nJason 目前提供英文版與中文版履歷。\n\n你想看哪一個版本？",
        cvEnglishText: "📄 **英文履歷**\n\n這是 Jason 正式與最新專業資料的基準版本。\n\n如果不同版本內容有差異，請以英文版為準。",
        cvChineseText: "📄 **中文履歷**\n\n這個版本方便以中文閱讀。\n\n如果不同版本內容有差異，請以英文履歷為準。",
        cvDifferenceText: "📄 **履歷版本說明**\n\nJason 目前提供英文版與中文版履歷。\n\n英文履歷是基準版本；中文版方便中文閱讀，但如果內容有差異，請以英文版為準。",
        experienceText: "💼 **專業經驗**\n\n**1. 港機Co-op實習生**（2025年9月 - 2026年1月）\n• 科技創新部門\n• 以AI驅動營運方案\n• 贏得AWS黑客松總冠軍\n\n**2. HKUST ITSO實習**（2026年2月 - 2026年6月）\n• IT支援與資產管理\n\n**3. 環速集團IT支援**（2021年7月 - 現在）\n• 兼職IT營運\n• 數碼媒體製作",
        defaultText: "我是Jason的AI助理。\n\n我可以幫你了解：\n\n• **AWS黑客松**\n• **港機Co-op**\n• **技能**\n• **教育背景**\n• **工作經驗**\n• **趣事**\n• **聯絡方式**\n• **時間與日期**\n• **聊天統計**"
      },
      'zh-CN': {
        calculatorTitle: '计算结果',
        coopDurationTitle: 'Co-op时长',
        coopDurationText: 'Jason在港机的Co-op实习共历时',
        daysUntilTitle: '距离',
        daysSinceTitle: '自从',
        days: '天',
        daysAgo: '天前',
        takeHackathon: '带你前往AWS黑客松页面...',
        takeCoop: '带你前往港机Co-op页面...',
        takeHome: '带你前往主页...',
        goHome: '前往主页',
        viewHackathonProject: '查看AWS黑客松项目',
        viewCoopExperience: '查看Co-op经验',
        learnMoreJason: '了解更多Jason信息',
        viewHackathonDetails: '查看完整项目详情',
        watchDemo: '观看演示视频',
        viewCoopTimeline: '查看5个月时间线',
        seeCoopMedia: '查看照片与视频',
        viewFullCv: '查看完整履历',
        viewEducationDetails: '查看教育背景',
        viewProjects: '查看所有项目',
        viewAchievements: '查看所有成就',
        sendEmail: '打开联系表格',
        openGithub: '打开 GitHub',
        openResume: '打开Jason英文履历',
        openEnglishResume: '打开英文履历',
        openChineseResume: '打开中文履历',
        askEnglishResume: '英文版本',
        askChineseResume: '中文版本',
        resumeDifferenceQuestion: '两个版本有什么不同？',
        viewExperience: '查看完整经验',
        viewProjectSection: '查看项目部分',
        techathonText: "💡 **港机创科马拉松**\n\nJason在港机科技创新团队Co-op期间，协助筹办港机首个Techathon。\n\n• 设计活动框架与规划流程\n• 为多次GM级别会议准备材料\n• 支持创新提案与跨团队协调\n\n这是他港机实习期间其中一个重点项目。",
        leanDayText: "🎤 **港机精益日2025**\n\nJason于港机精益日2025担任司仪。\n\n• 主持活动并与管理层及参与者互动\n• 支持活动流程与台上协调\n• 展现其沟通与演讲领导能力",
        bayManagementText: "⚡ **港机机位管理系统**\n\n机位管理系统是Jason团队在AWS黑客松中的获奖项目。\n\n• 基于人工智能的飞机机位调度优化平台\n• 在比赛中14天内完成\n• 用于自动分配机位、优化排程并提升实时运营可视性",
        hackathonScaleText: "🏆 **AWS黑客松规模**\n\nJason团队在2025 AWS AI黑客松香港赛事中，于**130+支入围队伍**中夺得总冠军。",
        hackathonWhenText: "📅 **AWS AI黑客松香港2025**\n\n作品集将这项成就标示为**AWS AI黑客松香港2025**。\n\n该项目在比赛中以**14天**完成。",
        fypText: "🎯 **Jason的毕业专题**\n\nJason在HKUST的毕业专题聚焦于以高效数据驱动方法进行库存控制。\n\n• 研究方向：库存优化\n• 作品集中提到的方法包括JIT、Monte Carlo、AutoML及多代理系统\n• 属于数据与运营导向的学术项目",
        projectsText: "🚀 **精选项目**\n\n**1. 港机机位管理系统** 🏆\n• AWS黑客松总冠军项目\n• 基于AI的机位调度方案\n• 14天内完成\n\n**2. 库存控制研究**\n• HKUST毕业专题\n• JIT、Monte Carlo、AutoML、多代理系统\n\n**3. 圣诞效应研究**\n• 数据科学项目，分析牲畜价格\n\n**4. YouTube数据库系统**\n• SQLite数据库设计与实现",
        awardsText: "🏆 **奖项与成就**\n\n• **总冠军** - AWS AI黑客松香港2025（130+队伍）\n• **司仪** - 港机精益日2025\n• **首席筹办者** - 港机Techathon 2026\n• **学术卓越奖** - HKU SPACE\n• **校长荣誉录** - HKU SPACE\n• **班代表** - 数据科学（80+名学生）\n• **杰出成就证书** - 港机2025",
        githubText: "💻 **Jason 的 GitHub**\n\n如果你想看 Jason 的代码作品和技术仓库，可以直接前往他的 GitHub。\n\n如果你想看正式背景摘要，则可以从作品集打开履历。",
        contactText: "📬 **联系Jason**\n\n最快的方式是使用联系区里的站内留言表格。\n\n它适合合作、实习、项目或创新相关交流。\n\n📄 **履历：** 同一区域也可以直接打开，用来看正式资料。",
        cvText: "📄 **Jason 的履历**\n\nJason 目前提供英文版与中文版履历。\n\n你想看哪个版本？",
        cvChoiceText: "📄 **Jason 的履历**\n\nJason 目前提供英文版与中文版履历。\n\n你想看哪个版本？",
        cvEnglishText: "📄 **英文履历**\n\n这是 Jason 正式与最新专业资料的基准版本。\n\n如果不同版本内容有差异，请以英文版为准。",
        cvChineseText: "📄 **中文履历**\n\n这个版本方便用中文阅读。\n\n如果不同版本内容有差异，请以英文履历为准。",
        cvDifferenceText: "📄 **履历版本说明**\n\nJason 目前提供英文版与中文版履历。\n\n英文履历是基准版本；中文版方便中文阅读，但如果内容有差异，请以英文版为准。",
        experienceText: "💼 **专业经验**\n\n**1. 港机Co-op实习生**（2025年9月 - 2026年1月）\n• 科技创新部门\n• 以AI驱动运营方案\n• 赢得AWS黑客松总冠军\n\n**2. HKUST ITSO实习**（2026年2月 - 2026年6月）\n• IT支持与资产管理\n\n**3. 环速集团IT支持**（2021年7月 - 现在）\n• 兼职IT运营\n• 数码媒体制作",
        defaultText: "我是Jason的AI助理。\n\n我可以帮你了解：\n\n• **AWS黑客松**\n• **港机Co-op**\n• **技能**\n• **教育背景**\n• **工作经验**\n• **趣事**\n• **联系方式**\n• **时间与日期**\n• **聊天统计**"
      },
      es: {
        calculatorTitle: 'Calculadora',
        coopDurationTitle: 'Duracion del Co-op',
        coopDurationText: 'El Co-op de Jason en HAECO duro',
        daysUntilTitle: 'Dias hasta',
        daysSinceTitle: 'Dias desde',
        days: 'dias',
        daysAgo: 'dias atras',
        takeHackathon: 'Te llevo a la pagina del AWS Hackathon...',
        takeCoop: 'Te llevo a la pagina del Co-op en HAECO...',
        takeHome: 'Te llevo a la pagina principal...',
        goHome: 'Ir al inicio',
        viewHackathonProject: 'Ver proyecto del AWS Hackathon',
        viewCoopExperience: 'Ver experiencia Co-op',
        learnMoreJason: 'Conocer mas sobre Jason',
        viewHackathonDetails: 'Ver detalles completos del proyecto',
        watchDemo: 'Ver video demo',
        viewCoopTimeline: 'Ver cronologia de 5 meses',
        seeCoopMedia: 'Ver fotos y videos',
        viewFullCv: 'Ver CV completo',
        viewEducationDetails: 'Ver educacion',
        viewProjects: 'Ver todos los proyectos',
        viewAchievements: 'Ver todos los logros',
        sendEmail: 'Abrir formulario',
        openGithub: 'Abrir GitHub',
        openResume: 'Abrir CV de Jason',
        openEnglishResume: 'Abrir CV en inglés',
        openChineseResume: 'Abrir CV en chino',
        askEnglishResume: 'Versión en inglés',
        askChineseResume: 'Versión en chino',
        resumeDifferenceQuestion: '¿Qué diferencia hay entre las dos?',
        viewExperience: 'Ver experiencia completa',
        viewProjectSection: 'Ver seccion de proyectos',
        techathonText: "💡 **Techathon de HAECO**\n\nJason ayudo a organizar el primer Techathon de HAECO durante su Co-op en el equipo de Innovacion Tecnologica.\n\n• Diseno el marco del evento y el flujo de planificacion\n• Preparo materiales para varias reuniones de nivel GM\n• Apoyo propuestas de innovacion y coordinacion entre equipos\n\nFue una de las iniciativas clave de su experiencia en HAECO.",
        leanDayText: "🎤 **HAECO Lean Day 2025**\n\nJason fue maestro de ceremonias en HAECO Lean Day 2025.\n\n• Condujo el evento e interactuo con ejecutivos y asistentes\n• Apoyo el flujo del evento y la coordinacion en escenario\n• Aporto liderazgo en comunicacion y presentacion a su experiencia Co-op",
        bayManagementText: "⚡ **Sistema de Gestion de Bahias de HAECO**\n\nEl Sistema de Gestion de Bahias fue el proyecto de Jason en el AWS Hackathon.\n\n• Plataforma de optimizacion de asignacion de bahias para aeronaves basada en IA\n• Desarrollada en 14 dias durante la competencia\n• Diseñada para automatizar asignaciones, mejorar la planificacion y ofrecer visibilidad operativa en tiempo real",
        hackathonScaleText: "🏆 **Escala del AWS Hackathon**\n\nEl equipo de Jason gano el Gran Premio entre **130+ equipos preseleccionados** en AWS AI Hackathon Hong Kong 2025.",
        hackathonWhenText: "📅 **AWS AI Hackathon Hong Kong 2025**\n\nEl portafolio identifica este logro como **AWS AI Hackathon Hong Kong 2025**.\n\nEl proyecto se construyo en **14 dias** para la competencia.",
        fypText: "🎯 **Proyecto Final de Jason**\n\nEl Proyecto Final de Jason en HKUST se centra en control de inventario con metodos eficientes basados en datos.\n\n• Area de investigacion: optimizacion de inventario\n• El portafolio menciona JIT, Monte Carlo, AutoML y sistemas multiagente\n• Es un proyecto academico orientado a datos y operaciones",
        projectsText: "🚀 **Proyectos destacados**\n\n**1. Sistema de Gestion de Bahias de HAECO** 🏆\n• Proyecto ganador del AWS Hackathon\n• Solucion de asignacion de bahias basada en IA\n• Desarrollado en 14 dias\n\n**2. Investigacion de control de inventario**\n• Proyecto final de HKUST\n• JIT, Monte Carlo, AutoML y sistemas multiagente\n\n**3. Estudio de efectos navidenos**\n• Proyecto de ciencia de datos sobre precios de ganado\n\n**4. Sistema de base de datos de YouTube**\n• Diseno e implementacion con SQLite",
        awardsText: "🏆 **Premios y logros**\n\n• **Gran Premio** - AWS AI Hackathon Hong Kong 2025 (130+ equipos)\n• **Maestro de ceremonias** - HAECO Lean Day 2025\n• **Organizador principal** - HAECO Techathon 2026\n• **Premio a la excelencia academica** - HKU SPACE\n• **Lista de honor del director** - HKU SPACE\n• **Representante de clase** - Ciencia de Datos (80+ estudiantes)\n• **Certificado de logro destacado** - HAECO 2025",
        githubText: "💻 **GitHub de Jason**\n\nSi quieres ver trabajo técnico y repositorios de código, puedes abrir el GitHub de Jason.\n\nSi prefieres el resumen formal, abre el CV desde el portafolio.",
        contactText: "📬 **Contactar a Jason**\n\nLa forma más rápida es usar el formulario de mensajes en la sección de contacto.\n\nSirve para colaboraciones, oportunidades, proyectos o conversaciones sobre innovación.\n\n📄 **CV:** También puedes abrirlo desde la misma sección para ver los detalles formales.",
        cvText: "📄 **CV de Jason**\n\nJason ya tiene versiones en inglés y en chino.\n\n¿Cuál quieres ver?",
        cvChoiceText: "📄 **CV de Jason**\n\nJason ya tiene versiones en inglés y en chino.\n\n¿Cuál quieres ver?",
        cvEnglishText: "📄 **CV en inglés**\n\nEsta es la versión base para los detalles formales y actualizados de Jason.\n\nSi hay diferencias entre versiones, usa esta como referencia.",
        cvChineseText: "📄 **CV en chino**\n\nEsta versión está ahí para facilitar la lectura en chino.\n\nSi hay diferencias entre versiones, la versión base es la de inglés.",
        cvDifferenceText: "📄 **Versiones del CV**\n\nJason ya tiene CV en inglés y en chino.\n\nLa versión en inglés es la base; la versión en chino facilita la lectura, pero si hay diferencias, usa la versión en inglés como referencia.",
        experienceText: "💼 **Experiencia profesional**\n\n**1. Co-op en HAECO** (Sep 2025 - Ene 2026)\n• Departamento de Innovacion Tecnologica\n• Soluciones operativas impulsadas por IA\n• Ganador del Gran Premio del AWS Hackathon\n\n**2. Practica en HKUST ITSO** (Feb 2026 - Jun 2026)\n• Soporte TI y gestion de activos\n\n**3. Soporte TI en Speedy Group** (Jul 2021 - Actualidad)\n• Operaciones TI a tiempo parcial\n• Produccion de medios digitales",
        defaultText: "Soy el asistente de IA de Jason.\n\nPuedo ayudarte a conocer:\n\n• **AWS Hackathon**\n• **Co-op en HAECO**\n• **Habilidades**\n• **Educacion**\n• **Experiencia**\n• **Datos curiosos**\n• **Contacto**\n• **Hora y fecha**\n• **Estadisticas del chat**"
      }
    };

    return copy[this.currentLang] || copy.en;
  }
  
  t(key) {
    const translations = {
      en: {
        greeting: ['Good morning', 'Good afternoon', 'Good evening'],
        intro: "I'm Jason Bot. I can explain the section you're reading or help you quickly understand Jason's projects, HAECO work, skills, and awards.",
        aboutIntro: "👋 Meet Jason Au-Yeung\n\nIEEM × Data × Tech | AI & Operations Innovation\n\nJason is a HKUST student specializing in Industrial Engineering with a passion for AI-driven solutions and operations optimization.\n\n🌟 Recent Highlights:\n• 🏆 Grand Prize Winner - AWS AI Hackathon HK 2025\n• 🚀 Completed 5-month Co-op at HAECO\n• 🎤 MC at HAECO Lean Day 2025\n• 💡 Organized HAECO's first Techathon\n\n🎓 Education:\n• HKUST - BEng IEEM + Big Data Technology Minor\n• HKU SPACE - Higher Diploma in Data Science\n\n💪 Expertise:\nAI/ML, Data Analytics, Operations Optimization, Python, AWS, Leadership",
        ready: 'I can give quick summaries, connect the dots, or point you to the right part of the portfolio.',
        ask: 'Ask about the section on screen, or anything else in the portfolio.',
        funFact: 'Fun Fact About Jason:',
        anotherFact: 'Want another fun fact? Just ask!',
        chatStats: 'Conversation Stats:',
        timeChatting: 'Time chatting:',
        messagesSent: 'Messages sent:',
        started: 'Started:',
        keepAsking: 'Keep the questions coming! 😊',
        currentTime: 'Current time:',
        todayIs: 'Today is:',
        anythingElse: 'Anything else you\'d like to know about Jason?',
        welcome: 'You\'re welcome! 😊',
        happyToHelp: 'Happy to help you learn about Jason. Feel free to ask anything else!',
        goodbye: 'Goodbye! Thanks for chatting!',
        weTalked: 'We talked for',
        exchanged: 'and exchanged',
        messages: 'messages',
        comeBack: 'Come back anytime to learn more about Jason! 😊',
        // AWS Hackathon
        hackathonTitle: 'AWS AI Hackathon Hong Kong 2025 - Grand Prize Winner!',
        hackathonIntro: "Jason's team developed the **HAECO Bay Management System** - an AI-based aircraft bay scheduling optimization platform.",
        keyAchievements: 'Key Achievements:',
        hackathonAch1: 'Won Grand Prize among **130+ shortlisted teams**',
        hackathonAch2: 'Built in just **14 days**',
        hackathonAch3: 'Featured in **4 media interviews** (unwire.hk, SCMP, HAECO, AWS HK)',
        hackathonAch4: 'Interviewed at **AWS re:Invent** in Las Vegas',
        techStack: 'Tech Stack:',
        techStackValue: 'HTML, CSS, JavaScript, AWS Q Developer, Kiro',
        systemFeature: 'The system automates aircraft bay assignments, optimizes scheduling, and provides real-time analytics for HAECO\'s operations.',
        // HAECO Co-op
        coopTitle: 'HAECO Co-op Experience (Sep 2025 - Jan 2026)',
        coopIntro: 'Jason completed a **5-month Co-op** at HAECO\'s Technology Innovation department.',
        majorAchievements: 'Major Achievements:',
        coopAch1: '🏆 Won AWS AI Hackathon Grand Prize',
        coopAch2: '💡 Organized HAECO\'s first Techathon',
        coopAch3: '🎤 MC at HAECO Lean Day 2025',
        coopAch4: '🎙️ 4 media interviews',
        coopAch5: '🌍 Attended AWS re:Invent',
        coopAch6: '🎉 Helped with 75th Anniversary celebration',
        keyProjects: 'Key Projects:',
        coopProj1: 'Bay Management System development',
        coopProj2: 'Techathon framework design (3 GM meetings)',
        coopProj3: 'Lean Day coordination',
        coopProj4: 'AR/VR technology exploration',
        coopProj5: 'TI Project Tracker development',
        // Skills
        skillsTitle: "Jason's Skills & Expertise",
        programmingData: 'Programming & Data:',
        aiTools: 'AI & Development Tools:',
        creativeTools: 'Creative Tools:',
        softSkills: 'Soft Skills:',
        softSkillsList: 'Critical Thinking, Leadership, Teamwork, Negotiation, Decision Making',
        languagesSpoken: 'Languages:',
        languagesList: 'English, Cantonese, Mandarin',
        // Education
        educationTitle: 'Education Background',
        hkustSchool: 'Hong Kong University of Science and Technology (HKUST)',
        hkustDegree: 'BEng in Industrial Engineering and Engineering Management',
        hkustMinor: 'Minor in Big Data Technology',
        hkustPeriod: '2023 - Present',
        hkustFYP: 'FYP: Efficient Data-Driven Methods for Inventory Control',
        hkuSchool: 'HKU SPACE Community College',
        hkuDegree: 'Higher Diploma in Data Science',
        hkuPeriod: '2021 - 2023',
        hkuAwards: '🏆 Academic Excellence Award, 🏆 Principal\'s Honor List',
        hkuLeadership: 'Leadership: Class Representative (80+ students)',
        // Projects
        projectsTitle: 'Featured Projects',
        project1: 'HAECO Bay Management System - Grand Prize Winner',
        project2: 'Inventory Control Research - HKUST Final Year Project',
        project3: 'Christmas Effects Study - Data Science project',
        project4: 'YouTube Database System - SQLite project',
        // Awards
        awardsTitle: 'Awards & Achievements',
        award1: '**Grand Prize Winner** - AWS AI Hackathon Hong Kong 2025 (130+ teams)',
        award2: '**Master of Ceremony** - HAECO Lean Day 2025',
        award3: '**Lead Organizer** - HAECO Techathon 2026',
        award4: '**Academic Excellence Award** - HKU SPACE',
        award5: '**Principal\'s Honor List** - HKU SPACE',
        award6: '**Class Representative** - Data Science (80+ students)',
        award7: '**Certificate of Outstanding Achievement** - HAECO 2025',
        // Contact
        contactTitle: 'Send a Message to Jason',
        contactIntro: 'Use the on-site contact form for collaboration, project, or opportunity inquiries.',
        contactEmail: 'Contact form:',
        contactGitHub: 'Resume:',
        // Experience
        experienceTitle: 'Professional Experience',
        exp1Title: 'HAECO Co-op Intern (Sep 2025 - Jan 2026)',
        exp1Desc: 'Technology Innovation department - AI-driven solutions for operations',
        exp2Title: 'HKUST ITSO Internship (Feb 2026 - Jun 2026)',
        exp2Desc: 'IT support and asset management',
        exp3Title: 'Speedy Group IT Support (Jul 2021 - Present)',
        exp3Desc: 'Part-time IT operations and digital media production',
        // General
        learnMore: 'Learn more',
        viewDetails: 'View details',
        fullPortfolio: 'View Full Portfolio',
        askAnything: 'Ask me anything!',
        // Chat UI
        chatTitle: 'Jason Bot',
        chatStatus: 'Online • Following your reading',
        chatKicker: 'Portfolio Intelligence',
        chatBlurb: "Grounded in Jason's portfolio content.",
        suggestedQuestions: 'Suggested prompts',
        suggestionAbout: 'Tell me about Jason',
        suggestionHackathon: 'AWS Hackathon',
        suggestionHaeco: 'HAECO experience',
        suggestionFunFact: 'Fun fact',
        suggestionTime: 'What time?',
        suggestionChatTime: 'Chat time',
        inputPlaceholder: 'Ask me anything about Jason...',
        inputNote: "I answer from this portfolio. Jason's CV is still the best source for formal details.",
        // Suggestion queries (what gets sent when clicked)
        queryAbout: 'Tell me about Jason',
        queryHackathon: 'What is the AWS Hackathon project?',
        queryHaeco: 'What did Jason do at HAECO?',
        queryFunFact: 'Tell me a fun fact',
        queryTime: 'What time is it?',
        queryChatTime: 'How long have we been talking?'
      },
      'zh-TW': {
        greeting: ['早安', '午安', '晚安'],
        intro: '我是 Jason Bot，可以根據你現在看到的部分，快速解釋內容、整理重點，或帶你了解 Jason 的項目與經驗。',
        aboutIntro: "👋 認識Jason Au-Yeung\n\n工業工程 × 數據 × 科技 | 人工智能與營運創新\n\nJason是香港科技大學學生，專攻工業工程，熱衷於人工智能驅動方案和營運優化。\n\n🌟 近期亮點：\n• 🏆 總冠軍 - AWS人工智能黑客松香港 2025\n• 🚀 完成港機（香港）5個月Co-op實習\n• 🎤 擔任2025年港機（香港）精益日司儀\n• 💡 組織港機（香港）首個創科馬拉松\n\n🎓 教育：\n• 香港科技大學 - 工業工程及工程管理學士 + 大數據技術副修\n• 香港大學專業進修學院 - 數據科學高級文憑\n\n💪 專長：\n人工智能/機器學習、數據分析、營運優化、Python、AWS、領導力",
        ready: '我可以幫你快速總結、串連重點，或直接帶你看最值得先了解的部分。',
        ask: '你可以直接問目前螢幕上的部分，或作品集裡的任何內容。',
        funFact: '關於Jason的趣事：',
        anotherFact: '想知道更多趣事？儘管問！',
        chatStats: '對話統計：',
        timeChatting: '聊天時間：',
        messagesSent: '發送訊息：',
        started: '開始時間：',
        keepAsking: '繼續提問吧！😊',
        currentTime: '現在時間：',
        todayIs: '今天是：',
        anythingElse: '還想了解Jason的其他事情嗎？',
        welcome: '不客氣！😊',
        happyToHelp: '很高興能幫助你了解Jason。隨時提問！',
        goodbye: '再見！感謝聊天！',
        weTalked: '我們聊了',
        exchanged: '並交換了',
        messages: '條訊息',
        comeBack: '隨時回來了解更多關於Jason的資訊！😊',
        // AWS Hackathon
        hackathonTitle: 'AWS人工智能黑客松香港 2025 - 總冠軍！',
        hackathonIntro: 'Jason的團隊開發了**港機（香港）機位管理系統** - 基於人工智能的飛機機位調度優化平台。',
        keyAchievements: '主要成就：',
        hackathonAch1: '於**130+支入圍隊伍**中奪得總冠軍',
        hackathonAch2: '僅用**14天**建成',
        hackathonAch3: '獲**4次媒體訪問** (unwire.hk, SCMP, 港機, AWS香港)',
        hackathonAch4: '於拉斯維加斯**AWS re:Invent**接受訪問',
        techStack: '技術堆疊：',
        techStackValue: 'HTML, CSS, JavaScript, AWS Q Developer, Kiro',
        systemFeature: '系統自動化飛機機位分配，優化排程，並為港機營運提供實時分析。',
        // HAECO Co-op
        coopTitle: '港機（香港）Co-op實習經驗 (2025年9月 - 2026年1月)',
        coopIntro: 'Jason完成了在港機（香港）科技創新部門為期**5個月**的Co-op實習。',
        majorAchievements: '主要成就：',
        coopAch1: '🏆 奪得AWS人工智能黑客松香港 2025總冠軍',
        coopAch2: '💡 組織港機首個創科馬拉松',
        coopAch3: '🎤 擔任港機精益日司儀',
        coopAch4: '🎙️ 4次媒體訪問',
        coopAch5: '🌍 出席AWS re:Invent',
        coopAch6: '🎉 協助75週年慶典',
        keyProjects: '主要項目：',
        coopProj1: '機位管理系統開發',
        coopProj2: '創科馬拉松框架設計（3次GM會議）',
        coopProj3: '精益日協調',
        coopProj4: 'AR/VR技術探索',
        coopProj5: 'TI項目追蹤器開發',
        // Skills
        skillsTitle: 'Jason的技能與專長',
        programmingData: '編程與數據：',
        aiTools: '人工智能與開發工具：',
        creativeTools: '創意工具：',
        softSkills: '軟技能：',
        softSkillsList: '批判性思維、領導力、團隊合作、談判技巧、決策能力',
        languagesSpoken: '語言：',
        languagesList: '英語、廣東話、普通話',
        // Education
        educationTitle: '教育背景',
        hkustSchool: '香港科技大學',
        hkustDegree: '工業工程及工程管理學士',
        hkustMinor: '副修大數據技術',
        hkustPeriod: '2023 - 現在',
        hkustFYP: '畢業專題：高效數據驅動的庫存控制方法',
        hkuSchool: '香港大學專業進修學院',
        hkuDegree: '數據科學高級文憑',
        hkuPeriod: '2021 - 2023',
        hkuAwards: '🏆 學術卓越獎、🏆 校長榮譽錄',
        hkuLeadership: '領導力：班代表（80+名學生）',
        // Projects
        projectsTitle: '精選項目',
        project1: '港機機位管理系統 - 總冠軍',
        project2: '庫存控制研究 - HKUST畢業專題',
        project3: '聖誕節影響研究 - 數據科學項目',
        project4: 'YouTube數據庫系統 - SQLite項目',
        // Awards
        awardsTitle: '獎項與成就',
        award1: '**總冠軍** - AWS人工智能黑客松香港 2025 (130+隊)',
        award2: '**司儀** - 港機精益日2025',
        award3: '**首席組織者** - 港機創科馬拉松2026',
        award4: '**學術卓越獎** - 香港大學專業進修學院',
        award5: '**校長榮譽錄** - 香港大學專業進修學院',
        award6: '**班代表** - 數據科學 (80+名學生)',
        award7: '**傑出成就證書** - 港機2025',
        // Contact
        contactTitle: '向Jason發送訊息',
        contactIntro: '如想合作、討論項目或機會，可使用網站內的聯絡表格。',
        contactEmail: '聯絡表格：',
        contactGitHub: '履歷：',
        // Experience
        experienceTitle: '專業經驗',
        exp1Title: '港機Co-op實習生 (2025年9月 - 2026年1月)',
        exp1Desc: '科技創新部門 - 人工智能驅動的營運方案',
        exp2Title: 'HKUST ITSO實習 (2026年2月 - 2026年6月)',
        exp2Desc: 'IT支援及資產管理',
        exp3Title: '環速集團IT支援 (2021年7月 - 現在)',
        exp3Desc: '兼職IT營運及數碼媒體製作',
        // General
        learnMore: '了解更多',
        viewDetails: '查看詳情',
        fullPortfolio: '查看完整作品集',
        askAnything: '問我任何問題！',
        // Chat UI
        chatTitle: 'Jason Bot',
        chatStatus: '在線 • 正在跟著你的閱讀位置',
        chatKicker: '作品集智能助理',
        chatBlurb: '答案基於Jason網站內容。',
        suggestedQuestions: '建議提示',
        suggestionAbout: '告訴我關於Jason',
        suggestionHackathon: 'AWS黑客松',
        suggestionHaeco: '港機經驗',
        suggestionFunFact: '趣事',
        suggestionTime: '現在幾點？',
        suggestionChatTime: '聊天時間',
        inputPlaceholder: '問我任何關於Jason的問題...',
        inputNote: '我的回答以這個作品集內容為主；正式資料仍以 Jason 的履歷最準確。',
        // Suggestion queries
        queryAbout: '告訴我關於Jason',
        queryHackathon: 'AWS黑客松項目是什麼？',
        queryHaeco: 'Jason在港機做了什麼？',
        queryFunFact: '告訴我一個趣事',
        queryTime: '現在幾點？',
        queryChatTime: '我們聊了多久？'
      },
      'zh-CN': {
        greeting: ['早安', '午安', '晚安'],
        intro: '我是 Jason Bot，可以根据你现在看到的部分，快速解释内容、整理重点，或带你了解 Jason 的项目与经历。',
        aboutIntro: "👋 认识Jason Au-Yeung\n\n工业工程 × 数据 × 科技 | 人工智能与运营创新\n\nJason是香港科技大学学生，专攻工业工程，热衷于人工智能驱动方案和运营优化。\n\n🌟 近期亮点：\n• 🏆 总冠军 - AWS人工智能黑客松香港 2025\n• 🚀 完成港机（香港）5个月Co-op实习\n• 🎤 担任2025年港机（香港）精益日司仪\n• 💡 组织港机（香港）首个创科马拉松\n\n🎓 教育：\n• 香港科技大学 - 工业工程及工程管理学士 + 大数据技术副修\n• 香港大学专业进修学院 - 数据科学高级文凭\n\n💪 专长：\n人工智能/机器学习、数据分析、运营优化、Python、AWS、领导力",
        ready: '我可以帮你快速总结、串起重点，或直接带你看最值得先了解的部分。',
        ask: '你可以直接问当前屏幕上的部分，或作品集里的任何内容。',
        funFact: '关于Jason的趣事：',
        anotherFact: '想知道更多趣事？尽管问！',
        chatStats: '对话统计：',
        timeChatting: '聊天时间：',
        messagesSent: '发送消息：',
        started: '开始时间：',
        keepAsking: '继续提问吧！😊',
        currentTime: '现在时间：',
        todayIs: '今天是：',
        anythingElse: '还想了解Jason的其他事情吗？',
        welcome: '不客气！😊',
        happyToHelp: '很高兴能帮助你了解Jason。随时提问！',
        goodbye: '再见！感谢聊天！',
        weTalked: '我们聊了',
        exchanged: '并交换了',
        messages: '条消息',
        comeBack: '随时回来了解更多关于Jason的信息！😊',
        // AWS Hackathon
        hackathonTitle: 'AWS人工智能黑客松香港 2025 - 总冠军！',
        hackathonIntro: 'Jason的团队开发了**港机（香港）机位管理系统** - 基于人工智能的飞机机位调度优化平台。',
        keyAchievements: '主要成就：',
        hackathonAch1: '于**130+支入围队伍**中夺得总冠军',
        hackathonAch2: '仅用**14天**建成',
        hackathonAch3: '获**4次媒体访问** (unwire.hk, SCMP, 港机, AWS香港)',
        hackathonAch4: '于拉斯维加斯**AWS re:Invent**接受访问',
        techStack: '技术堆栈：',
        techStackValue: 'HTML, CSS, JavaScript, AWS Q Developer, Kiro',
        systemFeature: '系统自动化飞机机位分配，优化排程，并为港机运营提供实时分析。',
        // HAECO Co-op
        coopTitle: '港机（香港）Co-op实习经验 (2025年9月 - 2026年1月)',
        coopIntro: 'Jason完成了在港机（香港）科技创新部门为期**5个月**的Co-op实习。',
        majorAchievements: '主要成就：',
        coopAch1: '🏆 夺得AWS人工智能黑客松香港 2025总冠军',
        coopAch2: '💡 组织港机首个创科马拉松',
        coopAch3: '🎤 担任港机精益日司仪',
        coopAch4: '🎙️ 4次媒体访问',
        coopAch5: '🌍 出席AWS re:Invent',
        coopAch6: '🎉 协助75周年庆典',
        keyProjects: '主要项目：',
        coopProj1: '机位管理系统开发',
        coopProj2: '创科马拉松框架设计（3次GM会议）',
        coopProj3: '精益日协调',
        coopProj4: 'AR/VR技术探索',
        coopProj5: 'TI项目追踪器开发',
        // Skills
        skillsTitle: 'Jason的技能与专长',
        programmingData: '编程与数据：',
        aiTools: '人工智能与开发工具：',
        creativeTools: '创意工具：',
        softSkills: '软技能：',
        softSkillsList: '批判性思维、领导力、团队合作、谈判技巧、决策能力',
        languagesSpoken: '语言：',
        languagesList: '英语、广东话、普通话',
        // Education
        educationTitle: '教育背景',
        hkustSchool: '香港科技大学',
        hkustDegree: '工业工程及工程管理学士',
        hkustMinor: '副修大数据技术',
        hkustPeriod: '2023 - 现在',
        hkustFYP: '毕业专题：高效数据驱动的库存控制方法',
        hkuSchool: '香港大学专业进修学院',
        hkuDegree: '数据科学高级文凭',
        hkuPeriod: '2021 - 2023',
        hkuAwards: '🏆 学术卓越奖、🏆 校长荣誉录',
        hkuLeadership: '领导力：班代表（80+名学生）',
        // Projects
        projectsTitle: '精选项目',
        project1: '港机机位管理系统 - 总冠军',
        project2: '库存控制研究 - HKUST毕业专题',
        project3: '圣诞节影响研究 - 数据科学项目',
        project4: 'YouTube数据库系统 - SQLite项目',
        // Awards
        awardsTitle: '奖项与成就',
        award1: '**总冠军** - AWS人工智能黑客松香港 2025 (130+队)',
        award2: '**司仪** - 港机精益日2025',
        award3: '**首席组织者** - 港机创科马拉松2026',
        award4: '**学术卓越奖** - 香港大学专业进修学院',
        award5: '**校长荣誉录** - 香港大学专业进修学院',
        award6: '**班代表** - 数据科学 (80+名学生)',
        award7: '**杰出成就证书** - 港机2025',
        // Contact
        contactTitle: '向Jason发送消息',
        contactIntro: '如果想讨论合作、项目或机会，可以使用站内联系表格。',
        contactEmail: '联系表格：',
        contactGitHub: '履历：',
        // Experience
        experienceTitle: '专业经验',
        exp1Title: '港机Co-op实习生 (2025年9月 - 2026年1月)',
        exp1Desc: '科技创新部门 - 人工智能驱动的运营方案',
        exp2Title: 'HKUST ITSO实习 (2026年2月 - 2026年6月)',
        exp2Desc: 'IT支持及资产管理',
        exp3Title: '环速集团IT支持 (2021年7月 - 现在)',
        exp3Desc: '兼职IT运营及数码媒体制作',
        // General
        learnMore: '了解更多',
        viewDetails: '查看详情',
        fullPortfolio: '查看完整作品集',
        askAnything: '问我任何问题！',
        // Chat UI
        chatTitle: 'Jason Bot',
        chatStatus: '在线 • 正在跟着你的阅读位置',
        chatKicker: '作品集智能助理',
        chatBlurb: '回答基于Jason网站内容。',
        suggestedQuestions: '建议提示',
        suggestionAbout: '告诉我关于Jason',
        suggestionHackathon: 'AWS黑客松',
        suggestionHaeco: '港机经验',
        suggestionFunFact: '趣事',
        suggestionTime: '现在几点？',
        suggestionChatTime: '聊天时间',
        inputPlaceholder: '问我任何关于Jason的问题...',
        inputNote: '我的回答以这个作品集内容为主；正式资料仍以 Jason 的履历最准确。',
        // Suggestion queries
        queryAbout: '告诉我关于Jason',
        queryHackathon: 'AWS黑客松项目是什么？',
        queryHaeco: 'Jason在港机做了什么？',
        queryFunFact: '告诉我一个趣事',
        queryTime: '现在几点？',
        queryChatTime: '我们聊了多久？'
      },
      es: {
        greeting: ['Buenos días', 'Buenas tardes', 'Buenas noches'],
        intro: 'Soy Jason Bot. Puedo explicarte la sección que estás leyendo o ayudarte a entender rápidamente los proyectos, la experiencia en HAECO, las habilidades y los logros de Jason.',
        aboutIntro: "👋 Conoce a Jason Au-Yeung\n\nIEEM × Data × Tech | IA e Innovación en Operaciones\n\nJason es un estudiante de HKUST especializado en Ingeniería Industrial con pasión por soluciones impulsadas por IA y optimización de operaciones.\n\n🌟 Aspectos Destacados Recientes:\n• 🏆 Ganador del Gran Premio - AWS AI Hackathon HK 2025\n• 🚀 Completó Co-op de 5 meses en HAECO\n• 🎤 MC en HAECO Lean Day 2025\n• 💡 Organizó el primer Techathon de HAECO\n\n🎓 Educación:\n• HKUST - Licenciatura en IEEM + Minor en Tecnología de Big Data\n• HKU SPACE - Diploma Superior en Ciencia de Datos\n\n💪 Experiencia:\nIA/ML, Análisis de Datos, Optimización de Operaciones, Python, AWS, Liderazgo",
        ready: 'Puedo darte resúmenes rápidos, conectar ideas o llevarte a la parte correcta del portafolio.',
        ask: 'Pregúntame por la sección que tienes en pantalla o por cualquier parte del portafolio.',
        funFact: 'Dato Curioso Sobre Jason:',
        anotherFact: '¿Quieres otro dato curioso? ¡Solo pregunta!',
        chatStats: 'Estadísticas de Conversación:',
        timeChatting: 'Tiempo charlando:',
        messagesSent: 'Mensajes enviados:',
        started: 'Iniciado:',
        keepAsking: '¡Sigue preguntando! 😊',
        currentTime: 'Hora actual:',
        todayIs: 'Hoy es:',
        anythingElse: '¿Algo más que te gustaría saber sobre Jason?',
        welcome: '¡De nada! 😊',
        happyToHelp: 'Encantado de ayudarte a conocer a Jason. ¡Pregunta lo que quieras!',
        goodbye: '¡Adiós! ¡Gracias por charlar!',
        weTalked: 'Hablamos durante',
        exchanged: 'e intercambiamos',
        messages: 'mensajes',
        comeBack: '¡Vuelve cuando quieras para saber más sobre Jason! 😊',
        // AWS Hackathon
        hackathonTitle: 'AWS AI Hackathon Hong Kong 2025 - ¡Gran Premio!',
        hackathonIntro: 'El equipo de Jason desarrolló el **Sistema de Gestión de Bahías de HAECO** - una plataforma de optimización de programación de bahías de aeronaves basada en IA.',
        keyAchievements: 'Logros Clave:',
        hackathonAch1: 'Ganó el Gran Premio entre **más de 130 equipos preseleccionados**',
        hackathonAch2: 'Construido en solo **14 días**',
        hackathonAch3: 'Destacado en **4 entrevistas de medios** (unwire.hk, SCMP, HAECO, AWS HK)',
        hackathonAch4: 'Entrevistado en **AWS re:Invent** en Las Vegas',
        techStack: 'Pila Tecnológica:',
        techStackValue: 'HTML, CSS, JavaScript, AWS Q Developer, Kiro',
        systemFeature: 'El sistema automatiza las asignaciones de bahías de aeronaves, optimiza la programación y proporciona análisis en tiempo real para las operaciones de HAECO.',
        // HAECO Co-op
        coopTitle: 'Experiencia Co-op en HAECO (Sep 2025 - Ene 2026)',
        coopIntro: 'Jason completó un **Co-op de 5 meses** en el departamento de Innovación Tecnológica de HAECO.',
        majorAchievements: 'Logros Principales:',
        coopAch1: '🏆 Ganó el Gran Premio del AWS AI Hackathon',
        coopAch2: '💡 Organizó el primer Techathon de HAECO',
        coopAch3: '🎤 MC en HAECO Lean Day 2025',
        coopAch4: '🎙️ 4 entrevistas de medios',
        coopAch5: '🌍 Asistió a AWS re:Invent',
        coopAch6: '🎉 Ayudó con la celebración del 75º aniversario',
        keyProjects: 'Proyectos Clave:',
        coopProj1: 'Desarrollo del Sistema de Gestión de Bahías',
        coopProj2: 'Diseño del marco del Techathon (3 reuniones GM)',
        coopProj3: 'Coordinación del Lean Day',
        coopProj4: 'Exploración de tecnología AR/VR',
        coopProj5: 'Desarrollo del Rastreador de Proyectos TI',
        // Skills
        skillsTitle: 'Habilidades y Experiencia de Jason',
        programmingData: 'Programación y Datos:',
        aiTools: 'IA y Herramientas de Desarrollo:',
        creativeTools: 'Herramientas Creativas:',
        softSkills: 'Habilidades Blandas:',
        softSkillsList: 'Pensamiento Crítico, Liderazgo, Trabajo en Equipo, Negociación, Toma de Decisiones',
        languagesSpoken: 'Idiomas:',
        languagesList: 'Inglés, Cantonés, Mandarín',
        // Education
        educationTitle: 'Formación Académica',
        hkustSchool: 'Hong Kong University of Science and Technology (HKUST)',
        hkustDegree: 'Licenciatura en Ingeniería Industrial y Gestión de Ingeniería',
        hkustMinor: 'Minor en Tecnología de Big Data',
        hkustPeriod: '2023 - Presente',
        hkustFYP: 'Proyecto Final: Métodos Eficientes Basados en Datos para Control de Inventario',
        hkuSchool: 'HKU SPACE Community College',
        hkuDegree: 'Diploma Superior en Ciencia de Datos',
        hkuPeriod: '2021 - 2023',
        hkuAwards: '🏆 Premio de Excelencia Académica, 🏆 Lista de Honores del Director',
        hkuLeadership: 'Liderazgo: Representante de Clase (80+ estudiantes)',
        // Projects
        projectsTitle: 'Proyectos Destacados',
        project1: 'Sistema de Gestión de Bahías de HAECO - Gran Premio',
        project2: 'Investigación de Control de Inventario - Proyecto Final HKUST',
        project3: 'Estudio de Efectos Navideños - Proyecto de Ciencia de Datos',
        project4: 'Sistema de Base de Datos de YouTube - Proyecto SQLite',
        // Awards
        awardsTitle: 'Premios y Logros',
        award1: '**Gran Premio** - AWS AI Hackathon Hong Kong 2025 (130+ equipos)',
        award2: '**Maestro de Ceremonias** - HAECO Lean Day 2025',
        award3: '**Organizador Principal** - HAECO Techathon 2026',
        award4: '**Premio de Excelencia Académica** - HKU SPACE',
        award5: '**Lista de Honores del Director** - HKU SPACE',
        award6: '**Representante de Clase** - Ciencia de Datos (80+ estudiantes)',
        award7: '**Certificado de Logro Sobresaliente** - HAECO 2025',
        // Contact
        contactTitle: 'Envíale un mensaje a Jason',
        contactIntro: 'Usa el formulario del sitio para colaboraciones, proyectos u oportunidades.',
        contactEmail: 'Formulario:',
        contactGitHub: 'CV:',
        // Experience
        experienceTitle: 'Experiencia Profesional',
        exp1Title: 'Pasante Co-op de HAECO (Sep 2025 - Ene 2026)',
        exp1Desc: 'Departamento de Innovación Tecnológica - Soluciones impulsadas por IA para operaciones',
        exp2Title: 'Pasantía HKUST ITSO (Feb 2026 - Jun 2026)',
        exp2Desc: 'Soporte IT y gestión de activos',
        exp3Title: 'Soporte IT Speedy Group (Jul 2021 - Presente)',
        exp3Desc: 'Operaciones IT a tiempo parcial y producción de medios digitales',
        // General
        learnMore: 'Saber más',
        viewDetails: 'Ver detalles',
        fullPortfolio: 'Ver Portafolio Completo',
        askAnything: '¡Pregúntame lo que quieras!',
        // Chat UI
        chatTitle: 'Jason Bot',
        chatStatus: 'En línea • Siguiendo tu lectura',
        chatKicker: 'Inteligencia del portafolio',
        chatBlurb: 'Respuestas basadas en el sitio de Jason.',
        suggestedQuestions: 'Sugerencias',
        suggestionAbout: 'Cuéntame sobre Jason',
        suggestionHackathon: 'AWS Hackathon',
        suggestionHaeco: 'Experiencia HAECO',
        suggestionFunFact: 'Dato curioso',
        suggestionTime: '¿Qué hora es?',
        suggestionChatTime: 'Tiempo de chat',
        inputPlaceholder: 'Pregúntame sobre Jason...',
        inputNote: 'Respondo desde este portafolio. El CV de Jason sigue siendo la fuente más precisa para datos formales.',
        // Suggestion queries
        queryAbout: 'Cuéntame sobre Jason',
        queryHackathon: '¿Cuál es el proyecto del AWS Hackathon?',
        queryHaeco: '¿Qué hizo Jason en HAECO?',
        queryFunFact: 'Cuéntame un dato curioso',
        queryTime: '¿Qué hora es?',
        queryChatTime: '¿Cuánto tiempo hemos estado hablando?'
      }
    };
    
    return translations[this.currentLang]?.[key] || translations['en'][key];
  }
  
  calculateMath(query) {
    // Extract math expression
    const mathPattern = /([\d.]+)\s*(\+|\-|\*|\/|\×|\÷)\s*([\d.]+)/;
    const match = query.match(mathPattern);
    
    if (!match) return null;
    
    const num1 = parseFloat(match[1]);
    const operator = match[2];
    const num2 = parseFloat(match[3]);
    
    let result;
    switch(operator) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '*':
      case '×':
        result = num1 * num2;
        break;
      case '/':
      case '÷':
        result = num2 !== 0 ? num1 / num2 : 'Error: Division by zero';
        break;
      default:
        return null;
    }
    
    return { num1, operator, num2, result };
  }
  
  moderateContent(text) {
    // Remove exaggerated words in all languages
    const exaggerations = {
      en: ['amazing', 'incredible', 'awesome', 'fantastic', 'best ever', 'perfect', 'flawless', 'unbelievable', 'extraordinary'],
      'zh-TW': ['驚人', '難以置信', '完美', '最好', '無與倫比', '非凡'],
      'zh-CN': ['惊人', '难以置信', '完美', '最好', '无与伦比', '非凡'],
      es: ['increíble', 'asombroso', 'fantástico', 'perfecto', 'extraordinario']
    };
    
    let moderated = text;
    const langExaggerations = exaggerations[this.currentLang] || exaggerations.en;
    
    langExaggerations.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      moderated = moderated.replace(regex, '');
    });
    
    // Remove multiple exclamation marks
    moderated = moderated.replace(/!{2,}/g, '.');
    
    // Clean up extra spaces
    moderated = moderated.replace(/\s+/g, ' ').trim();
    
    return moderated;
  }
  
  calculateDateDiff(query) {
    // Check for age/duration queries
    if (/how old|age|years old/i.test(query)) {
      // Jason's Co-op: Sep 2025 - Jan 2026
      const coopStart = new Date('2025-09-01');
      const coopEnd = new Date('2026-01-31');
      const now = new Date();
      
      if (query.includes('coop') || query.includes('co-op') || query.includes('internship')) {
        const detailByLang = {
          en: 'September 2025 to January 2026',
          'zh-TW': '2025年9月至2026年1月',
          'zh-CN': '2025年9月至2026年1月',
          es: 'de septiembre de 2025 a enero de 2026'
        };
        const valueByLang = {
          en: '5 months',
          'zh-TW': '5個月',
          'zh-CN': '5个月',
          es: '5 meses'
        };
        const months = Math.floor((coopEnd - coopStart) / (1000 * 60 * 60 * 24 * 30));
        return {
          type: 'coop_duration',
          value: valueByLang[this.currentLang] || valueByLang.en,
          detail: detailByLang[this.currentLang] || detailByLang.en
        };
      }
    }
    
    // Calculate days until/since events
    if (/how many days|days until|days since/i.test(query)) {
      const now = new Date();
      const coopEnd = new Date('2026-01-31');
      const daysDiff = Math.floor((coopEnd - now) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0) {
        return { type: 'days_until', value: daysDiff, event: 'Co-op completion' };
      } else {
        return { type: 'days_since', value: Math.abs(daysDiff), event: 'Co-op completion' };
      }
    }
    
    return null;
  }
  
  normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  tokenize(text) {
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'what', 'tell', 'me', 'my', 'i', 'you', 'your', 'he', 'she', 'it', 'they', 'them', 'their', 'this', 'that', 'these', 'those', 'am', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'doing'];
    return this.normalize(text).split(' ').filter(t => t.length > 2 && !stopWords.includes(t));
  }
  
  getTokenWeight(token, isQuery = false) {
    const highPriority = ['hackathon', 'aws', 'haeco', 'techathon', 'reinvent', 'lean', 'day', 'event', 'mc', 'ceremony', 'coop', 'internship', 'hkust', 'hku', 'prize', 'winner', 'champion'];
    const mediumPriority = ['project', 'skill', 'education', 'experience', 'award', 'achievement', 'innovation', 'technology', 'ai', 'data', 'development'];
    
    if (highPriority.includes(token)) return 3.0;
    if (mediumPriority.includes(token)) return 2.0;
    return 1.0;
  }
  
  calculateTFIDF(queryTokens, docTokens) {
    let score = 0;
    const docFreq = {};
    docTokens.forEach(t => docFreq[t] = (docFreq[t] || 0) + 1);
    
    queryTokens.forEach(qt => {
      if (docTokens.includes(qt)) {
        const tf = docFreq[qt] / docTokens.length;
        const weight = this.getTokenWeight(qt, true);
        score += tf * weight;
      }
    });
    
    return score;
  }
  
  detectPhrases(text) {
    const phrases = {
      'lean day': ['lean', 'day', 'event'],
      'lean day event': ['lean', 'day', 'event'],
      'master of ceremony': ['mc', 'ceremony', 'presentation'],
      'aws hackathon': ['aws', 'hackathon', 'competition'],
      'bay management': ['bay', 'management', 'system'],
      'co-op': ['coop', 'internship', 'haeco'],
      'fun fact': ['fun', 'fact', 'interesting']
    };
    
    const normalized = this.normalize(text);
    const detected = [];
    
    for (const [phrase, tokens] of Object.entries(phrases)) {
      if (normalized.includes(phrase)) {
        detected.push(...tokens);
      }
    }
    
    return detected;
  }
  
  getContextBoost(query, snippet) {
    let boost = 0;
    const queryNorm = this.normalize(query);
    const snippetText = this.normalize(snippet.text + ' ' + snippet.tags.join(' '));
    
    // Boost for exact phrase matches
    if (queryNorm.includes('lean day') && snippetText.includes('lean day')) boost += 2.0;
    if (queryNorm.includes('what time') || queryNorm.includes('what day')) boost -= 1.0; // Reduce for time queries
    if (queryNorm.includes('today') && snippetText.includes('lean day')) boost -= 1.5; // Prevent confusion
    
    return boost;
  }
  
  retrieveSnippets(query, topK = 5) {
    if (!this.knowledgeIndex || this.knowledgeIndex.length === 0) return [];
    
    const queryTokens = this.tokenize(query);
    const phraseTokens = this.detectPhrases(query);
    const allQueryTokens = [...new Set([...queryTokens, ...phraseTokens])];
    
    const scores = this.knowledgeIndex.map(item => {
      // TF-IDF score
      const tfidfScore = this.calculateTFIDF(allQueryTokens, item.tokens);
      
      // Context boost
      const contextBoost = this.getContextBoost(query, item.snippet);
      
      // Exact match bonus
      let exactBonus = 0;
      const queryNorm = this.normalize(query);
      const snippetNorm = this.normalize(item.snippet.text);
      if (snippetNorm.includes(queryNorm) || queryNorm.includes(snippetNorm.substring(0, 20))) {
        exactBonus = 1.5;
      }
      
      const finalScore = tfidfScore + contextBoost + exactBonus;
      return { snippet: item.snippet, score: finalScore };
    });
    
    return scores
      .filter(s => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.snippet);
  }
  
  pickVariant(intent, variants) {
    const lastPick = this.lastIntentPicks[intent] || -1;
    const available = variants.filter((_, i) => i !== lastPick);
    const pool = available.length ? available : variants;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    this.lastIntentPicks[intent] = variants.indexOf(chosen);
    return chosen;
  }
  
  trackIntent(intent) {
    this.intentHistory.push(intent);
    if (this.intentHistory.length > 6) this.intentHistory.shift();
  }
  
  isLooping() {
    if (this.intentHistory.length < 3) return false;
    const recent = this.intentHistory.slice(-3);
    return recent.every(i => i === recent[0]);
  }
  
  getConversationTime() {
    const now = new Date();
    const diff = Math.floor((now - this.conversationStart) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    const units = {
      en: { min: 'm', sec: 's' },
      'zh-TW': { min: '分', sec: '秒' },
      'zh-CN': { min: '分', sec: '秒' },
      es: { min: 'min', sec: 's' }
    };
    const unit = units[this.currentLang] || units.en;
    return mins > 0 ? `${mins}${unit.min} ${secs}${unit.sec}` : `${secs}${unit.sec}`;
  }
  
  getRandomFunFact() {
    const funFacts = {
      en: [
        "🎬 Jason produced the 3-minute demo video for the AWS Hackathon project.",
        "🎤 Jason served as MC at HAECO Lean Day 2025, engaging with executives and attendees.",
        "🌍 Jason attended AWS re:Invent in Las Vegas and was interviewed on-site.",
        "💡 Jason organized HAECO's first Techathon, including framework design and GM presentations.",
        "📊 Jason served as Class Representative for 80+ students in the Data Science program.",
        "🏆 Jason's team competed against 130+ teams in the AWS AI Hackathon Hong Kong 2025.",
        "⚡ The Bay Management System was developed in 14 days during the hackathon.",
        "🎉 Jason participated in HAECO's 75th Anniversary celebration.",
        "🤖 Jason uses AI tools like AWS Q Developer and Kiro for development.",
        "🌏 Jason communicates in three languages: English, Cantonese, and Mandarin.",
        "📸 Jason has experience in photo and video editing with Adobe Creative Suite.",
        "🎯 Jason's Final Year Project focuses on Inventory Control using data-driven methods."
      ],
      'zh-TW': [
        "🎬 Jason為AWS黑客松項目製作了3分鐘演示影片。",
        "🎤 Jason擔任港機精益日2025司儀，與高層及參與者互動。",
        "🌍 Jason出席拉斯維加斯AWS re:Invent並接受現場訪問。",
        "💡 Jason組織港機首個創科馬拉松，包括框架設計和GM簡報。",
        "📊 Jason擔任數據科學課程80多名學生的班代表。",
        "🏆 Jason的團隊在AWS人工智能黑客松香港 2025中與130多支隊伍競爭。",
        "⚡ 機位管理系統在黑客松期間14天內開發完成。",
        "🎉 Jason參與港機75週年慶典。",
        "🤖 Jason使用AWS Q Developer和Kiro等AI工具進行開發。",
        "🌏 Jason能用三種語言溝通：英語、廣東話和普通話。",
        "📸 Jason擁有使用Adobe Creative Suite進行照片和影片編輯的經驗。",
        "🎯 Jason的畢業專題專注於使用數據驅動方法的庫存控制。"
      ],
      'zh-CN': [
        "🎬 Jason为AWS黑客松项目制作了3分钟演示视频。",
        "🎤 Jason担任港机精益日2025司仪，与高层及参与者互动。",
        "🌍 Jason出席拉斯维加斯AWS re:Invent并接受现场访问。",
        "💡 Jason组织港机首个创科马拉松，包括框架设计和GM简报。",
        "📊 Jason担任数据科学课程80多名学生的班代表。",
        "🏆 Jason的团队在AWS人工智能黑客松香港 2025中与130多支队伍竞争。",
        "⚡ 机位管理系统在黑客松期间14天内开发完成。",
        "🎉 Jason参与港机75周年庆典。",
        "🤖 Jason使用AWS Q Developer和Kiro等AI工具进行开发。",
        "🌏 Jason能用三种语言沟通：英语、广东话和普通话。",
        "📸 Jason拥有使用Adobe Creative Suite进行照片和视频编辑的经验。",
        "🎯 Jason的毕业专题专注于使用数据驱动方法的库存控制。"
      ],
      es: [
        "🎬 Jason produjo el video demo de 3 minutos para el proyecto del AWS Hackathon.",
        "🎤 Jason fue MC en HAECO Lean Day 2025, interactuando con ejecutivos y asistentes.",
        "🌍 Jason asistió a AWS re:Invent en Las Vegas y fue entrevistado en el sitio.",
        "💡 Jason organizó el primer Techathon de HAECO, incluyendo diseño de marco y presentaciones GM.",
        "📊 Jason fue Representante de Clase para más de 80 estudiantes en el programa de Ciencia de Datos.",
        "🏆 El equipo de Jason compitió contra más de 130 equipos en el AWS AI Hackathon Hong Kong 2025.",
        "⚡ El Sistema de Gestión de Bahías fue desarrollado en 14 días durante el hackathon.",
        "🎉 Jason participó en la celebración del 75º aniversario de HAECO.",
        "🤖 Jason usa herramientas de IA como AWS Q Developer y Kiro para desarrollo.",
        "🌏 Jason se comunica en tres idiomas: inglés, cantonés y mandarín.",
        "📸 Jason tiene experiencia en edición de fotos y videos con Adobe Creative Suite.",
        "🎯 El Proyecto Final de Jason se enfoca en Control de Inventario usando métodos basados en datos."
      ]
    };
    
    const facts = funFacts[this.currentLang] || funFacts.en;
    return this.pickVariant(`fun_fact_${this.currentLang}`, facts);
  }

  buildFunFactResponse() {
    const reply = this.getReplyCopy();
    return {
      text: `🎉 **${this.t('funFact')}**\n\n${this.getRandomFunFact()}\n\n${this.t('anotherFact')}`,
      actions: [{ text: `🏆 ${reply.learnMoreJason}`, link: 'index.html' }],
      suggestions: ['Another fun fact', 'AWS Hackathon story', 'What time is it?', 'Chat stats']
    };
  }

  getClarificationCopy() {
    const copy = {
      en: {
        title: "I'm not fully sure what you mean yet.",
        body: "Did you want Jason's HAECO work, the hackathon project, skills, education, awards, contact details, or a summary of this page or section?"
      },
      'zh-TW': {
        title: '我未完全確定你想問哪一部分。',
        body: '你是想問 Jason 在港機的工作、黑客松項目、技能、教育、獎項、聯絡方式，還是目前頁面或這個部分的摘要？'
      },
      'zh-CN': {
        title: '我还不太确定你想问哪一部分。',
        body: '你是想问 Jason 在港机的工作、黑客松项目、技能、教育、奖项、联系方式，还是当前页面或这个部分的摘要？'
      },
      es: {
        title: 'Todavia no estoy totalmente seguro de lo que quieres decir.',
        body: 'Quieres preguntar por el trabajo de Jason en HAECO, el proyecto del hackathon, habilidades, educacion, premios, contacto o un resumen de esta pagina o seccion?'
      }
    };

    return copy[this.currentLang] || copy.en;
  }

  buildClarificationResponse() {
    const copy = this.getClarificationCopy();
    return {
      text: `🤔 **${copy.title}**\n\n${copy.body}`,
      actions: [],
      suggestions: ['Tell me about Jason', 'What did Jason do at HAECO?', 'What is the Bay Management System?', 'Summarize this page']
    };
  }

  getLoopCopy() {
    const copy = {
      en: {
        title: "I'm still not fully sure which direction you want.",
        variants: [
          'Try one of these clearer prompts:',
          'These options should help me answer more precisely:',
          'Pick one of these and I can respond more directly:'
        ],
      },
      'zh-TW': {
        title: '我仲未完全確定你想問邊個方向。',
        variants: [
          '你可以試下用以下其中一個問法：',
          '以下幾個問題會令我更容易答得準確：',
          '揀其中一個方向，我可以答得更直接：'
        ],
      },
      'zh-CN': {
        title: '我还不太确定你想问哪个方向。',
        variants: [
          '你可以试试下面其中一种问法：',
          '下面这些问题会让我更容易答准确：',
          '选一个方向，我可以回答得更直接：'
        ],
      },
      es: {
        title: 'Todavia no tengo claro que direccion quieres tomar.',
        variants: [
          'Prueba una de estas preguntas mas claras:',
          'Estas opciones me ayudaran a responder con mas precision:',
          'Elige una de estas y te respondo de forma mas directa:'
        ],
      }
    };

    return copy[this.currentLang] || copy.en;
  }

  isFunFactRequest(message = '') {
    const normalized = this.normalize(message);
    const suggestionKey = this.getSuggestionKey(message);

    if (suggestionKey === 'funFact' || suggestionKey === 'tellFunFact' || suggestionKey === 'anotherFunFact') {
      return true;
    }

    return /(fun fact|another fun fact|tell me a fun fact|趣事|有趣的事|有趣的事情|dato curioso|dato interesante)/.test(normalized);
  }
  
  handleLoop(intent, snippets) {
    const copy = this.getLoopCopy();
    const examples = [
      'Techathon details',
      "What are Jason's skills?",
      "View Jason's resume"
    ].map((query) => `• ${this.localizePromptQuery(query)}`).join('\n');

    return {
      text: `🤔 **${copy.title}**\n\n${this.pickVariant(`loop_${this.currentLang}`, copy.variants)}\n\n${examples}`,
      actions: [],
      suggestions: ['Techathon details', 'Skills overview', 'Education background', 'Fun fact']
    };
  }

  getSectionPromptMap() {
    const catalog = {
      home: {
        home: {
          label: {
            en: 'About Jason',
            'zh-TW': '關於 Jason',
            'zh-CN': '关于 Jason',
            es: 'Sobre Jason'
          },
          question: {
            en: 'Want a quick introduction to Jason and this portfolio?',
            'zh-TW': '想快速了解 Jason 和這個作品集嗎？',
            'zh-CN': '想快速了解 Jason 和这个作品集吗？',
            es: '¿Quieres una introducción rápida a Jason y este portafolio?'
          },
          query: 'Tell me about Jason'
        },
        awards: {
          label: {
            en: 'Awards',
            'zh-TW': '獎項',
            'zh-CN': '奖项',
            es: 'Premios'
          },
          question: {
            en: 'Want the short version of Jason’s main awards and recognitions?',
            'zh-TW': '想看 Jason 主要獎項與認可的精簡版嗎？',
            'zh-CN': '想看 Jason 主要奖项与认可的精简版吗？',
            es: '¿Quieres la versión corta de los premios y reconocimientos principales de Jason?'
          },
          query: 'What awards has Jason won?'
        },
        experience: {
          label: {
            en: 'Experience',
            'zh-TW': '經驗',
            'zh-CN': '经验',
            es: 'Experiencia'
          },
          question: {
            en: 'Want a summary of Jason’s work experience so far?',
            'zh-TW': '想看 Jason 目前工作經驗的摘要嗎？',
            'zh-CN': '想看 Jason 目前工作经验的摘要吗？',
            es: '¿Quieres un resumen de la experiencia profesional de Jason?'
          },
          query: 'Experience'
        },
        projects: {
          label: {
            en: 'Projects',
            'zh-TW': '項目',
            'zh-CN': '项目',
            es: 'Proyectos'
          },
          question: {
            en: 'Want help choosing which project to open first?',
            'zh-TW': '想讓我幫你判斷先看哪個項目嗎？',
            'zh-CN': '想让我帮你判断先看哪个项目吗？',
            es: '¿Quieres ayuda para decidir qué proyecto abrir primero?'
          },
          query: 'Projects'
        },
        education: {
          label: {
            en: 'Education',
            'zh-TW': '教育',
            'zh-CN': '教育',
            es: 'Educación'
          },
          question: {
            en: 'Want the short academic background summary?',
            'zh-TW': '想看精簡版的學歷背景嗎？',
            'zh-CN': '想看精简版的学历背景吗？',
            es: '¿Quieres el resumen corto de su formación académica?'
          },
          query: 'Education background'
        },
        skills: {
          label: {
            en: 'Skills',
            'zh-TW': '技能',
            'zh-CN': '技能',
            es: 'Habilidades'
          },
          question: {
            en: 'Want a focused breakdown of Jason’s skills?',
            'zh-TW': '想看 Jason 技能的重點整理嗎？',
            'zh-CN': '想看 Jason 技能的重点整理吗？',
            es: '¿Quieres un desglose enfocado de las habilidades de Jason?'
          },
          query: "What are Jason's skills?"
        },
        contact: {
          label: {
            en: 'Contact',
            'zh-TW': '聯絡',
            'zh-CN': '联络',
            es: 'Contacto'
          },
          question: {
            en: 'Want the fastest way to contact Jason?',
            'zh-TW': '想知道最快聯絡 Jason 的方式嗎？',
            'zh-CN': '想知道最快联系 Jason 的方式吗？',
            es: '¿Quieres la forma más rápida de contactar a Jason?'
          },
          query: 'Contact info'
        }
      },
      coop: {
        overview: {
          label: {
            en: 'Co-op overview',
            'zh-TW': 'Co-op 概覽',
            'zh-CN': 'Co-op 概览',
            es: 'Resumen del Co-op'
          },
          question: {
            en: 'Want the 30-second summary of Jason’s HAECO internship?',
            'zh-TW': '想看 Jason 在 HAECO 實習的 30 秒摘要嗎？',
            'zh-CN': '想看 Jason 在 HAECO 实习的 30 秒摘要吗？',
            es: '¿Quieres el resumen de 30 segundos de la pasantía de Jason en HAECO?'
          },
          query: 'HAECO Co-op experience'
        },
        highlights: {
          label: {
            en: 'Key highlights',
            'zh-TW': '重點亮點',
            'zh-CN': '重点亮点',
            es: 'Aspectos destacados'
          },
          question: {
            en: 'Want me to explain the biggest Co-op highlights?',
            'zh-TW': '想讓我解釋這段 Co-op 的主要亮點嗎？',
            'zh-CN': '想让我解释这段 Co-op 的主要亮点吗？',
            es: '¿Quieres que explique los aspectos destacados más importantes del Co-op?'
          },
          query: 'HAECO Co-op details'
        },
        timeline: {
          label: {
            en: 'Timeline',
            'zh-TW': '時間線',
            'zh-CN': '时间线',
            es: 'Cronología'
          },
          question: {
            en: 'Want a quick walkthrough of the 5-month internship timeline?',
            'zh-TW': '想快速看完這 5 個月實習的時間線嗎？',
            'zh-CN': '想快速看完这 5 个月实习的时间线吗？',
            es: '¿Quieres un recorrido rápido por la cronología de 5 meses de la pasantía?'
          },
          query: 'HAECO Co-op details'
        },
        gallery: {
          label: {
            en: 'Gallery',
            'zh-TW': '圖庫',
            'zh-CN': '图库',
            es: 'Galería'
          },
          question: {
            en: 'These photos cover hackathon, Lean Day, Techathon and re:Invent. Want the story behind them?',
            'zh-TW': '這些照片涵蓋黑客松、Lean Day、Techathon 和 re:Invent。想知道背後故事嗎？',
            'zh-CN': '这些照片涵盖黑客松、Lean Day、Techathon 和 re:Invent。想知道背后故事吗？',
            es: 'Estas fotos incluyen hackathon, Lean Day, Techathon y re:Invent. ¿Quieres conocer la historia detrás?'
          },
          query: 'HAECO Co-op experience'
        },
        learnings: {
          label: {
            en: 'Takeaways',
            'zh-TW': '收穫',
            'zh-CN': '收获',
            es: 'Aprendizajes'
          },
          question: {
            en: 'Want the key takeaways from the internship?',
            'zh-TW': '想看這段實習的核心收穫嗎？',
            'zh-CN': '想看这段实习的核心收获吗？',
            es: '¿Quieres los aprendizajes clave de la pasantía?'
          },
          query: 'HAECO Co-op details'
        }
      },
      hackathon: {
        award: {
          label: {
            en: 'Award',
            'zh-TW': '獎項',
            'zh-CN': '奖项',
            es: 'Premio'
          },
          question: {
            en: 'Want the quick version of why this project won Grand Prize?',
            'zh-TW': '想看這個項目如何贏得總冠軍的精簡版嗎？',
            'zh-CN': '想看这个项目如何赢得总冠军的精简版吗？',
            es: '¿Quieres la versión corta de por qué este proyecto ganó el Gran Premio?'
          },
          query: 'AWS Hackathon details'
        },
        challenge: {
          label: {
            en: 'Challenge',
            'zh-TW': '挑戰',
            'zh-CN': '挑战',
            es: 'Desafío'
          },
          question: {
            en: 'Want a plain-language explanation of the bay assignment problem?',
            'zh-TW': '想看白話版的機位分配問題說明嗎？',
            'zh-CN': '想看白话版的机位分配问题说明吗？',
            es: '¿Quieres una explicación sencilla del problema de asignación de bahías?'
          },
          query: 'What is the Bay Management System?'
        },
        solution: {
          label: {
            en: 'Solution',
            'zh-TW': '方案',
            'zh-CN': '方案',
            es: 'Solución'
          },
          question: {
            en: 'Want the short explanation of how the solution works?',
            'zh-TW': '想看這套方案如何運作的簡短說明嗎？',
            'zh-CN': '想看这套方案如何运作的简短说明吗？',
            es: '¿Quieres una explicación corta de cómo funciona la solución?'
          },
          query: 'What is the Bay Management System?'
        },
        demo: {
          label: {
            en: 'Demo',
            'zh-TW': '演示',
            'zh-CN': '演示',
            es: 'Demo'
          },
          question: {
            en: 'Want context before watching the demo video?',
            'zh-TW': '想在看示範影片前先了解重點嗎？',
            'zh-CN': '想在看示范影片前先了解重点吗？',
            es: '¿Quieres contexto antes de ver el video demo?'
          },
          query: 'AWS Hackathon story'
        },
        gallery: {
          label: {
            en: 'Gallery',
            'zh-TW': '圖庫',
            'zh-CN': '图库',
            es: 'Galería'
          },
          question: {
            en: 'Want the story behind these hackathon photos?',
            'zh-TW': '想知道這些黑客松照片背後的故事嗎？',
            'zh-CN': '想知道这些黑客松照片背后的故事吗？',
            es: '¿Quieres conocer la historia detrás de estas fotos del hackathon?'
          },
          query: 'AWS Hackathon story'
        },
        features: {
          label: {
            en: 'Features',
            'zh-TW': '功能',
            'zh-CN': '功能',
            es: 'Funciones'
          },
          question: {
            en: 'Want me to point out the most important product features?',
            'zh-TW': '想讓我指出最重要的產品功能嗎？',
            'zh-CN': '想让我指出最重要的产品功能吗？',
            es: '¿Quieres que destaque las funciones más importantes del producto?'
          },
          query: 'What is the Bay Management System?'
        },
        details: {
          label: {
            en: 'Details',
            'zh-TW': '詳情',
            'zh-CN': '详情',
            es: 'Detalles'
          },
          question: {
            en: 'Want the quick summary of the hackathon details and timeline?',
            'zh-TW': '想快速看黑客松詳情、時間表和要求嗎？',
            'zh-CN': '想快速看黑客松详情、时间表和要求吗？',
            es: '¿Quieres el resumen rápido de los detalles, cronograma y requisitos del hackathon?'
          },
          query: 'Summarize this section'
        },
        media: {
          label: {
            en: 'Impact',
            'zh-TW': '影響',
            'zh-CN': '影响',
            es: 'Impacto'
          },
          question: {
            en: 'Want the short version of the media coverage and impact?',
            'zh-TW': '想看媒體報導和影響力的精簡版嗎？',
            'zh-CN': '想看媒体报道和影响力的精简版吗？',
            es: '¿Quieres la versión corta de la cobertura mediática y el impacto?'
          },
          query: 'AWS Hackathon details'
        },
        links: {
          label: {
            en: 'Links',
            'zh-TW': '連結',
            'zh-CN': '链接',
            es: 'Enlaces'
          },
          question: {
            en: 'Need help deciding which external link to open?',
            'zh-TW': '需要我幫你判斷先開哪個外部連結嗎？',
            'zh-CN': '需要我帮你判断先开哪个外部链接吗？',
            es: '¿Necesitas ayuda para decidir qué enlace externo abrir?'
          },
          query: 'AWS Hackathon details'
        }
      }
    };

    return catalog[this.page] || {};
  }

  getLocalizedPrompt(prompt) {
    if (!prompt) return null;
    const lang = this.currentLang;
    const queryValue = typeof prompt.query === 'string'
      ? prompt.query
      : (prompt.query?.[lang] || prompt.query?.en || '');
    const canonicalQuery = typeof prompt.query === 'string'
      ? prompt.query
      : (prompt.query?.en || queryValue);

    return {
      label: prompt.label?.[lang] || prompt.label?.en || '',
      question: prompt.question?.[lang] || prompt.question?.en || '',
      query: queryValue,
      canonicalQuery
    };
  }

  renderContextPrompt(nudge, prompt) {
    if (!nudge || !prompt) return;

    const label = prompt.label ? `<span class="chat-nudge-label">${prompt.label}</span>` : '';
    const question = prompt.question ? `<span class="chat-nudge-question">${prompt.question}</span>` : '';
    nudge.innerHTML = `<span class="chat-nudge-content">${label}${question}</span>`;
    nudge.setAttribute('aria-label', prompt.question || prompt.label || '');
  }

  shouldAutoLocalizePrompt(prompt = {}) {
    if (this.currentLang === 'en') return false;

    const combined = `${prompt.label || ''} ${prompt.question || ''}`.trim();
    if (!combined) return false;

    return !this.shouldDisplayLocalizedSuggestion(combined, combined);
  }

  autoLocalizeContextPrompt(prompt, sectionId, mode = 'default') {
    if (!this.shouldAutoLocalizePrompt(prompt)) return prompt;

    const sectionTitle = this.domContext?.getSectionTitle?.(sectionId) || prompt.label || this.t('chatTitle');
    const normalizedQuery = this.normalize(prompt.canonicalQuery || prompt.query || '');
    const isPagePrompt = /\bpage\b|頁面|页面|這一頁|这一页|pagina/.test(normalizedQuery);
    const isSectionFocusPrompt = /\btell me about\b|告訴我|告诉我|cuentame|cuéntame/.test(normalizedQuery);

    const localized = {
      'zh-TW': {
        label: mode === 'idle' ? '需要我幫忙嗎？' : '我可以幫你',
        pageQuestion: '想看這一頁的快速摘要嗎？',
        sectionSummaryQuestion: `想快速了解「${sectionTitle}」這部分嗎？`,
        sectionFocusQuestion: `想了解「${sectionTitle}」這部分的重點嗎？`
      },
      'zh-CN': {
        label: mode === 'idle' ? '需要我帮忙吗？' : '我可以帮你',
        pageQuestion: '想看这一页的快速摘要吗？',
        sectionSummaryQuestion: `想快速了解“${sectionTitle}”这一部分吗？`,
        sectionFocusQuestion: `想了解“${sectionTitle}”这部分的重点吗？`
      },
      es: {
        label: mode === 'idle' ? 'Puedo ayudar?' : 'Estoy aqui',
        pageQuestion: 'Quieres el resumen rapido de esta pagina?',
        sectionSummaryQuestion: `Quieres la version rapida de ${sectionTitle}?`,
        sectionFocusQuestion: `Quieres los puntos clave de la seccion "${sectionTitle}"?`
      }
    };

    const copy = localized[this.currentLang];
    if (!copy) return prompt;

    return {
      ...prompt,
      label: copy.label,
      question: isPagePrompt
        ? copy.pageQuestion
        : (isSectionFocusPrompt ? copy.sectionFocusQuestion : copy.sectionSummaryQuestion)
    };
  }

  resolveContextPrompt(sectionId, mode = 'default') {
    const localizedPrompt = this.getLocalizedPrompt(this.sectionPromptMap?.[sectionId]);
    if (localizedPrompt?.query) {
      return {
        ...localizedPrompt,
        canonicalQuery: localizedPrompt.canonicalQuery || localizedPrompt.query,
        query: this.localizePromptQuery(localizedPrompt.query)
      };
    }

    if (this.engine?.getSectionPrompt) {
      const promptMeta = this.contextPromptMeta.get(sectionId);
      const prompt = this.engine.getSectionPrompt({
        sectionId,
        lang: this.currentLang,
        mode,
        cycle: promptMeta?.count || 0
      });
      if (prompt?.query) {
        const localizedEnginePrompt = this.autoLocalizeContextPrompt(prompt, sectionId, mode);
        return {
          ...localizedEnginePrompt,
          canonicalQuery: prompt.query,
          query: this.localizePromptQuery(prompt.query)
        };
      }
    }

    return null;
  }

  getIntroContextPrompt() {
    const prompts = {
      en: {
        label: this.t('chatTitle'),
        question: "I'm Jason Bot. I can walk you through Jason's projects, HAECO work, and hackathon story."
      },
      'zh-TW': {
        label: this.t('chatTitle'),
        question: '我是 Jason Bot，可以帶你快速了解 Jason 的項目、港機經驗和黑客松故事。'
      },
      'zh-CN': {
        label: this.t('chatTitle'),
        question: '我是 Jason Bot，可以带你快速了解 Jason 的项目、港机经历和黑客松故事。'
      },
      es: {
        label: this.t('chatTitle'),
        question: 'Soy Jason Bot. Puedo guiarte por los proyectos de Jason, su trabajo en HAECO y la historia del hackathon.'
      }
    };

    return prompts[this.currentLang] || prompts.en;
  }

  hasSeenIntroContextPrompt() {
    return this.introPromptSeenInSession;
  }

  markIntroContextPromptSeen() {
    this.introPromptSeenInSession = true;
  }

  shouldShowInitialIntroPrompt() {
    return this.page === 'home' && !this.hasSeenIntroContextPrompt();
  }

  refreshContextPrompt() {
    const nudge = document.getElementById('chatNudge');
    if (!nudge || !nudge.classList.contains('active')) return;
    if (nudge.dataset.promptKind === 'intro') {
      const introPrompt = this.getIntroContextPrompt();
      this.renderContextPrompt(nudge, introPrompt);
      return;
    }
    const sectionId = nudge.dataset.sectionId;
    const mode = nudge.dataset.promptMode || 'default';
    const prompt = this.resolveContextPrompt(sectionId, mode);
    if (!prompt) return;

    this.renderContextPrompt(nudge, prompt);
    nudge.dataset.query = prompt.query;
    nudge.dataset.canonicalQuery = prompt.canonicalQuery || prompt.query;
  }

  hideContextPrompt() {
    const nudge = document.getElementById('chatNudge');
    window.clearTimeout(this.contextPromptTimer);
    window.clearTimeout(this.contextIdlePromptTimer);
    window.clearTimeout(this.contextPromptHideTimer);
    if (!nudge) return;
    const wasIntroPrompt = nudge.classList.contains('active') && nudge.dataset.promptKind === 'intro';
    this.contextPromptInteracting = false;
    this.initialIntroPromptActive = false;
    nudge.classList.remove('active');
    delete nudge.dataset.sectionId;
    delete nudge.dataset.promptMode;
    delete nudge.dataset.query;
    delete nudge.dataset.canonicalQuery;
    delete nudge.dataset.promptKind;
    if (wasIntroPrompt && !document.body.classList.contains('chat-open')) {
      window.setTimeout(() => this.updateActiveSectionPrompt(), 120);
    }
  }

  scheduleContextPromptHide(delay = 7200) {
    window.clearTimeout(this.contextPromptHideTimer);

    const nudge = document.getElementById('chatNudge');
    if (!nudge?.classList.contains('active') || this.contextPromptInteracting || document.body.classList.contains('chat-open')) {
      return;
    }

    this.contextPromptHideTimer = window.setTimeout(() => {
      if (!this.contextPromptInteracting) {
        this.hideContextPrompt();
      }
    }, delay);
  }

  setContextPromptInteraction(isInteracting) {
    this.contextPromptInteracting = isInteracting;
    if (isInteracting) {
      window.clearTimeout(this.contextPromptHideTimer);
      return;
    }

    this.scheduleContextPromptHide(2200);
  }

  showContextPrompt(sectionId, mode = 'default') {
    const nudge = document.getElementById('chatNudge');
    const prompt = this.resolveContextPrompt(sectionId, mode);
    if (!nudge || !prompt || !prompt.query || document.body.classList.contains('chat-open') || this.initialIntroPromptActive) return;

    this.renderContextPrompt(nudge, prompt);
    nudge.dataset.sectionId = sectionId;
    nudge.dataset.promptMode = mode;
    nudge.dataset.query = prompt.query;
    nudge.dataset.canonicalQuery = prompt.canonicalQuery || prompt.query;
    nudge.dataset.promptKind = 'section';
    nudge.classList.add('active');
    this.contextPromptSeen.add(sectionId);
    this.contextPromptMeta.set(sectionId, {
      lastShownAt: Date.now(),
      count: (this.contextPromptMeta.get(sectionId)?.count || 0) + 1
    });
    this.contextPromptInteracting = false;
    this.scheduleContextPromptHide();
  }

  queueContextPrompt(sectionId) {
    window.clearTimeout(this.contextPromptTimer);
    window.clearTimeout(this.contextIdlePromptTimer);
    window.clearTimeout(this.contextPromptHideTimer);

    if (this.initialIntroPromptActive) return;

    const prompt = this.resolveContextPrompt(sectionId, 'default');
    const promptMeta = this.contextPromptMeta.get(sectionId);
    const recentlyShown = promptMeta && Date.now() - promptMeta.lastShownAt < 45000;

    if (!sectionId || !prompt || recentlyShown || document.body.classList.contains('chat-open')) {
      this.hideContextPrompt();
      return;
    }

    this.contextPromptTimer = window.setTimeout(() => this.showContextPrompt(sectionId, 'default'), 1200);
  }

  queueIdleContextPrompt(sectionId) {
    window.clearTimeout(this.contextIdlePromptTimer);
    if (this.initialIntroPromptActive) return;

    const nudge = document.getElementById('chatNudge');
    const prompt = this.resolveContextPrompt(sectionId, 'idle');
    const promptMeta = this.contextPromptMeta.get(sectionId);
    const recentlyShown = promptMeta && Date.now() - promptMeta.lastShownAt < 18000;
    const alreadyVisibleForSection = nudge?.classList.contains('active') && nudge?.dataset.sectionId === sectionId;

    if (!sectionId || !prompt || recentlyShown || alreadyVisibleForSection || document.body.classList.contains('chat-open')) {
      return;
    }

    this.contextIdlePromptTimer = window.setTimeout(() => {
      this.showContextPrompt(sectionId, 'idle');
    }, 5200);
  }

  updateActiveSectionPrompt() {
    if (this.initialIntroPromptActive) return;
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    if (!sections.length) return;

    const navHeight = document.querySelector('.glass-nav')?.offsetHeight || 0;
    const anchor = navHeight + Math.min(window.innerHeight * 0.24, 180);

    let bestSection = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom <= navHeight + 24 || rect.top >= window.innerHeight) return;

      const distance = Math.abs(rect.top - anchor);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSection = section;
      }
    });

    const nextSectionId = bestSection?.id || sections[0].id;
    if (nextSectionId === this.activeSectionId) {
      this.queueIdleContextPrompt(nextSectionId);
      return;
    }

    this.activeSectionId = nextSectionId;
    this.queueContextPrompt(nextSectionId);
    this.queueIdleContextPrompt(nextSectionId);
  }

  showInitialIntroPrompt() {
    const nudge = document.getElementById('chatNudge');
    const introPrompt = this.getIntroContextPrompt();

    if (!nudge || !introPrompt || document.body.classList.contains('chat-open')) return false;

    this.renderContextPrompt(nudge, introPrompt);
    nudge.dataset.promptKind = 'intro';
    nudge.dataset.query = '';
    nudge.classList.add('active');
    this.initialIntroPromptActive = true;
    this.contextPromptInteracting = false;
    this.markIntroContextPromptSeen();
    this.scheduleContextPromptHide(8200);
    this.setReaction('happy', 900);
    return true;
  }

  initContextualPrompts() {
    this.sectionPromptMap = this.getSectionPromptMap();
    const supportsSectionPrompts = Object.keys(this.sectionPromptMap).length > 0 || Boolean(this.engine?.getSectionPrompt);

    if (this.shouldShowInitialIntroPrompt()) {
      window.setTimeout(() => this.showInitialIntroPrompt(), 950);
      if (!supportsSectionPrompts) return;
    } else if (!supportsSectionPrompts) {
      return;
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        this.updateActiveSectionPrompt();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    if (!this.shouldShowInitialIntroPrompt()) {
      window.setTimeout(() => this.updateActiveSectionPrompt(), 1200);
    }
  }

  handleContextPromptClick() {
    const nudge = document.getElementById('chatNudge');
    if (nudge?.dataset.promptKind === 'intro') {
      this.hideContextPrompt();
      this.openChat();
      return;
    }
    const displayQuery = nudge?.dataset.query?.trim();
    const canonicalQuery = nudge?.dataset.canonicalQuery?.trim() || displayQuery;
    const sectionId = nudge?.dataset.sectionId?.trim() || this.getCurrentSectionId();
    if (!displayQuery) return;

    this.hideContextPrompt();
    this.openChat();
    this.handleSend({
      displayMessage: this.getSectionPromptDisplayMessage(sectionId, canonicalQuery),
      responseMessage: this.buildSectionPromptResponseMessage(sectionId, canonicalQuery),
      contextSectionId: sectionId
    });
  }

  init() {
    this.createChatUI();
    this.attachEvents();
    this.trackEyes(this.pointerX, this.pointerY);
    this.showWelcomeMessage();
    this.initContextualPrompts();
  }

  getEyeMarkup(extraClass = '') {
    return `
      <span class="chat-bot-shell ${extraClass}" data-reaction="idle">
        <span class="chat-bot-antenna" aria-hidden="true"></span>
        <span class="chat-toggle-bot" aria-hidden="true"></span>
        <span class="chat-bot-body" aria-hidden="true"></span>
        <span class="chat-bot-feet" aria-hidden="true"><span></span><span></span></span>
        <span class="chat-bot-brows" aria-hidden="true">
          <span class="bot-brow"></span>
          <span class="bot-brow"></span>
        </span>
        <span class="chat-bot-cheek bot-cheek-left" aria-hidden="true"></span>
        <span class="chat-bot-cheek bot-cheek-right" aria-hidden="true"></span>
        <span class="chat-eyes" aria-hidden="true">
          <span class="bot-eye"><span class="bot-eye-core"></span></span>
          <span class="bot-eye"><span class="bot-eye-core"></span></span>
        </span>
        <span class="chat-bot-mouth" aria-hidden="true"></span>
      </span>
    `;
  }

  createChatUI() {
    const chatHTML = `
      <button id="chatToggle" class="chat-toggle" title="${this.t('chatTitle')}" aria-label="${this.t('chatTitle')}">
        <span class="chat-toggle-ring" aria-hidden="true"></span>
        ${this.getEyeMarkup('chat-toggle-face')}
      </button>

      <button id="chatNudge" class="chat-nudge" type="button" aria-live="polite"></button>

      <div id="chatBackdrop" class="chat-backdrop"></div>

      <div id="chatWindow" class="chat-window" aria-hidden="true">
            <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">
              ${this.getEyeMarkup('chat-avatar-face')}
            </div>
            <div class="chat-header-copy">
              <div class="chat-title-row">
                <h3 id="chatTitle">${this.t('chatTitle')}</h3>
                <span class="chat-online-dot" aria-hidden="true"></span>
              </div>
              <p class="chat-status" id="chatStatus">${this.t('chatStatus')}</p>
            </div>
          </div>
          <button id="chatClose" class="chat-close" aria-label="Close chat">×</button>
        </div>

        <div class="chat-suggestions" id="chatSuggestions">
          <p class="suggestions-title" id="suggestionsTitle">${this.t('suggestedQuestions')}</p>
          <div class="suggestions-grid">
            <button class="suggestion-chip" data-query="queryAbout" id="suggest1">${this.t('suggestionAbout')}</button>
            <button class="suggestion-chip" data-query="queryHackathon" id="suggest2">${this.t('suggestionHackathon')}</button>
            <button class="suggestion-chip" data-query="queryHaeco" id="suggest3">${this.t('suggestionHaeco')}</button>
            <button class="suggestion-chip" data-query="queryFunFact" id="suggest4">${this.t('suggestionFunFact')}</button>
            <button class="suggestion-chip" data-query="queryTime" id="suggest5">${this.t('suggestionTime')}</button>
            <button class="suggestion-chip" data-query="queryChatTime" id="suggest6">${this.t('suggestionChatTime')}</button>
          </div>
        </div>

        <div class="chat-messages" id="chatMessages"></div>

        <div class="chat-input-area">
          <div class="chat-input-shell">
            <input type="text" id="chatInput" class="chat-input" placeholder="${this.t('inputPlaceholder')}" />
            <button id="chatSend" class="chat-send" aria-label="Send message">
              <span>➤</span>
            </button>
          </div>
          <p class="chat-input-note" id="chatInputNote">${this.t('inputNote')}</p>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);
  }

  attachEvents() {
    const toggle = document.getElementById('chatToggle');
    const close = document.getElementById('chatClose');
    const send = document.getElementById('chatSend');
    const input = document.getElementById('chatInput');
    const chatWindow = document.getElementById('chatWindow');
    const backdrop = document.getElementById('chatBackdrop');
    const nudge = document.getElementById('chatNudge');

    toggle.addEventListener('click', () => this.openChat());
    close.addEventListener('click', () => this.closeChat());
    backdrop.addEventListener('click', () => this.closeChat());
    nudge?.addEventListener('click', () => this.handleContextPromptClick());
    nudge?.addEventListener('mouseenter', () => this.setContextPromptInteraction(true));
    nudge?.addEventListener('mouseleave', () => this.setContextPromptInteraction(false));
    nudge?.addEventListener('focus', () => this.setContextPromptInteraction(true));
    nudge?.addEventListener('blur', () => this.setContextPromptInteraction(false));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && chatWindow.classList.contains('active')) {
        this.closeChat();
      }
    });

    document.addEventListener('mousemove', (event) => {
      this.trackEyes(event.clientX, event.clientY);
    });

    send.addEventListener('click', () => this.handleSend());

    input.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') this.handleSend();
    });

    input.addEventListener('focus', () => {
      this.focusEyesOnElement(input);
      this.setReaction('curious', 420);
    });

    input.addEventListener('input', (event) => {
      this.focusEyesOnElement(input);
      this.setReaction(event.target.value.trim() ? 'thinking' : 'idle', event.target.value.trim() ? 420 : 0);
      this.handleAutocomplete(event);
    });

    input.addEventListener('blur', () => {
      window.setTimeout(() => {
        this.hideAutocomplete();
        this.setReaction('idle');
      }, 120);
    });

    document.querySelectorAll('.suggestion-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const queryKey = chip.dataset.query;
        const rawQuery = this.t(queryKey);
        const payload = this.buildSuggestionPayload(rawQuery, this.getCurrentSectionId() || '');
        this.handleSend({
          displayMessage: payload.display,
          responseMessage: payload.response,
          contextSectionId: payload.contextSectionId
        });
      });
    });
  }

  openChat() {
    const chatWindow = document.getElementById('chatWindow');
    const backdrop = document.getElementById('chatBackdrop');
    const toggle = document.getElementById('chatToggle');
    const input = document.getElementById('chatInput');

    chatWindow.classList.add('active');
    chatWindow.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('active');
    toggle.classList.add('is-hidden');
    document.body.classList.add('chat-open');
    this.hideContextPrompt();
    this.focusEyesOnElement(input);
    this.setReaction('happy', 720);
    input.focus();
  }

  closeChat() {
    const chatWindow = document.getElementById('chatWindow');
    const backdrop = document.getElementById('chatBackdrop');
    const toggle = document.getElementById('chatToggle');

    chatWindow.classList.remove('active');
    chatWindow.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('active');
    toggle.classList.remove('is-hidden');
    document.body.classList.remove('chat-open');
    this.hideAutocomplete();
    this.setReaction('idle');
    window.setTimeout(() => this.updateActiveSectionPrompt(), 800);
  }

  trackEyes(clientX, clientY) {
    this.pointerX = clientX;
    this.pointerY = clientY;

    document.querySelectorAll('.chat-bot-shell').forEach((shell) => {
      const head = shell.querySelector('.chat-toggle-bot');
      const rect = head?.getBoundingClientRect() || shell.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const offsetX = Math.max(-3, Math.min(3, (clientX - centerX) / 18));
      const offsetY = Math.max(-2.5, Math.min(2.5, (clientY - centerY) / 22));
      shell.style.setProperty('--eye-shift-x', `${offsetX}px`);
      shell.style.setProperty('--eye-shift-y', `${offsetY}px`);
    });
  }

  focusEyesOnElement(element) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    this.trackEyes(rect.left + rect.width * 0.72, rect.top + rect.height * 0.5);
  }

  setReaction(reaction = 'idle', duration = 0) {
    if (this.eyeReactionTimer) {
      clearTimeout(this.eyeReactionTimer);
      this.eyeReactionTimer = null;
    }

    document.querySelectorAll('.chat-bot-shell').forEach((shell) => {
      shell.dataset.reaction = reaction;
      shell.classList.toggle('is-reacting', reaction !== 'idle');
    });

    if (reaction !== 'idle' && duration > 0) {
      this.eyeReactionTimer = window.setTimeout(() => {
        this.setReaction('idle');
      }, duration);
    }
  }

  getResponseReaction(message, response) {
    const msg = this.normalize(message);

    if (/(bye|goodbye|see you|再見|再见|adios|hasta luego)/.test(msg)) {
      return 'sad';
    }

    if (/(hello|hi|hey|你好|您好|hola|thanks|thank you|多謝|谢谢|gracias)/.test(msg)) {
      return 'happy';
    }

    if (/didn t get a strong match|i can still help with|我可以總結目前頁面|我可以总结当前页面|puedo resumir la pagina/i.test(this.normalize(response.text))) {
      return 'questionable';
    }

    if (/i m not fully sure|i am not fully sure|did you want|我未完全確定|我还不太确定|todavia no estoy totalmente seguro/i.test(this.normalize(response.text))) {
      return 'questionable';
    }

    if (/i can help you learn about|我可以幫你了解|我可以帮你了解|puedo ayudarte a conocer/i.test(response.text)) {
      return 'curious';
    }

    if (/section summary|page summary|部分摘要|頁面摘要|页面摘要|resumen de la seccion|resumen de la pagina/i.test(this.normalize(response.text))) {
      return 'thinking';
    }

    if (/(what|how|why|tell me about|explain|which|where|who|什麼|什么|為什麼|为什么|怎樣|怎么|cuentame|explica|por que|cual)/.test(msg)) {
      return 'curious';
    }

    return 'happy';
  }

  getResumeAssets() {
    return {
      en: 'assets/images/CV/Jason Resume (EN).pdf',
      cn: 'assets/images/CV/Jason Resume (CN).pdf'
    };
  }

  detectResumeVariantPreference(message = '') {
    const msg = this.normalize(message);
    const wantsEnglish = /(english|英文|英語|英语|\ben\b|base version|base resume|英文版)/.test(msg);
    const wantsChinese = /(chinese|中文|繁體|繁体|简体|簡體|\bcn\b|zh|中文版|中文版本|simplified|traditional)/.test(msg);

    if (wantsEnglish && !wantsChinese) return 'en';
    if (wantsChinese && !wantsEnglish) return 'cn';
    return null;
  }

  buildResumeChoiceResponse(reply) {
    this.pendingFollowUp = { type: 'resume_variant' };

    return {
      text: reply.cvChoiceText,
      actions: [
        { text: `📄 ${reply.openEnglishResume}`, link: this.getResumeAssets().en },
        { text: `📄 ${reply.openChineseResume}`, link: this.getResumeAssets().cn }
      ],
      suggestions: [
        "View Jason's English resume",
        "View Jason's Chinese resume",
        'What is the difference between the resume versions?',
        "What is Jason's GitHub?"
      ]
    };
  }

  buildResumeVariantResponse(reply, variant = 'en') {
    this.pendingFollowUp = null;
    const isEnglish = variant === 'en';
    const link = isEnglish ? this.getResumeAssets().en : this.getResumeAssets().cn;

    return {
      text: isEnglish ? reply.cvEnglishText : reply.cvChineseText,
      actions: [
        { text: `📋 ${isEnglish ? reply.openEnglishResume : reply.openChineseResume}`, link }
      ],
      suggestions: [
        isEnglish ? "View Jason's Chinese resume" : "View Jason's English resume",
        'What is the difference between the resume versions?',
        "How can I contact Jason?",
        "What is Jason's GitHub?"
      ]
    };
  }

  buildResumeDifferenceResponse(reply) {
    return {
      text: reply.cvDifferenceText,
      actions: [
        { text: `📄 ${reply.openEnglishResume}`, link: this.getResumeAssets().en },
        { text: `📄 ${reply.openChineseResume}`, link: this.getResumeAssets().cn }
      ],
      suggestions: [
        "View Jason's English resume",
        "View Jason's Chinese resume",
        "How can I contact Jason?",
        "What is Jason's GitHub?"
      ]
    };
  }

  resolvePendingFollowUp(message) {
    if (!this.pendingFollowUp) return null;
    const reply = this.getReplyCopy();
    const msg = this.normalize(message);

    if (this.pendingFollowUp.type === 'resume_variant') {
      const variant = this.detectResumeVariantPreference(message);
      if (variant) {
        return this.buildResumeVariantResponse(reply, variant);
      }

      if (/(difference|different|which one|compare|base|有什麼不同|有什么不同|差別|差别|以哪個為準|以哪个为准|哪個版本|哪个版本|有何不同)/.test(msg)) {
        return this.buildResumeDifferenceResponse(reply);
      }
    }

    return null;
  }

  shouldKeepPendingFollowUp(message) {
    if (!this.pendingFollowUp) return false;

    const msg = this.normalize(message);

    if (this.pendingFollowUp.type === 'resume_variant') {
      if (this.detectResumeVariantPreference(message)) return true;

      return /(difference|different|which one|compare|base|resume|cv|pdf|english|chinese|有什麼不同|有什么不同|差別|差别|以哪個為準|以哪个为准|哪個版本|哪个版本|有何不同|履歷|履历|英文|中文)/.test(msg);
    }

    return false;
  }

  getAssistantResponseDelay(message = '') {
    const msg = `${message}`.trim();
    const wordCount = msg ? msg.split(/\s+/).length : 0;
    const shortPrompt = wordCount <= 4 || msg.length <= 24;
    const delay = 140 + Math.min(260, Math.round(msg.length * 3.5));
    return shortPrompt ? Math.min(delay, 220) : Math.min(delay + 80, 420);
  }

  handleSend(messageOverride = '') {
    const input = document.getElementById('chatInput');
    const displayMessage = typeof messageOverride === 'object'
      ? (messageOverride.displayMessage || '').trim()
      : (messageOverride || input.value || '').trim();
    const responseMessage = typeof messageOverride === 'object'
      ? (messageOverride.responseMessage || displayMessage).trim()
      : displayMessage;
    const contextSectionId = typeof messageOverride === 'object'
      ? (messageOverride.contextSectionId || '').trim()
      : '';
    const message = displayMessage;
    
    if (!message) return;
    
    this.messageCount++;
    this.addMessage(message, 'user');
    input.value = '';

    document.getElementById('chatSuggestions').style.display = 'none';
    this.hideAutocomplete();
    this.showTyping();
    
    setTimeout(() => {
      this.hideTyping();
      const response = this.generateResponse(responseMessage, contextSectionId || null);
      this.addMessage(response.text, 'assistant', response.actions, response.suggestions);
      this.setReaction(this.getResponseReaction(responseMessage, response), 1200);
    }, this.getAssistantResponseDelay(responseMessage));
  }

  generateLegacyResponse(message) {
    const msg = this.normalize(message);
    const snippets = this.retrieveSnippets(message);
    const reply = this.getReplyCopy();
    const locale = this.getLocaleCode();
    
    // Check for math calculation
    const mathResult = this.calculateMath(message);
    if (mathResult) {
      return {
        text: `🧮 **${reply.calculatorTitle}**\n\n${mathResult.num1} ${mathResult.operator} ${mathResult.num2} = **${mathResult.result}**\n\n${this.t('anythingElse')}`,
        actions: [],
        suggestions: ['Tell me about Jason', 'Fun fact', 'What time is it?', 'Chat stats']
      };
    }
    
    // Check for date calculations
    const dateResult = this.calculateDateDiff(message);
    if (dateResult) {
      let text = '';
      if (dateResult.type === 'coop_duration') {
        text = `📅 **${reply.coopDurationTitle}**\n\n${reply.coopDurationText} **${dateResult.value}** (${dateResult.detail}).\n\n${this.t('anythingElse')}`;
      } else if (dateResult.type === 'days_until') {
        text = `📅 **${reply.daysUntilTitle} ${dateResult.event}**\n\n**${dateResult.value} ${reply.days}**\n\n${this.t('anythingElse')}`;
      } else if (dateResult.type === 'days_since') {
        text = `📅 **${reply.daysSinceTitle} ${dateResult.event}**\n\n**${dateResult.value} ${reply.daysAgo}**\n\n${this.t('anythingElse')}`;
      }
      return {
        text,
        actions: [],
        suggestions: ['HAECO Co-op details', 'What time is it?', 'Fun fact', 'Chat stats']
      };
    }
    
    // Detect intent with weighted neural network-style scoring
    let intent = 'general';
    
    // Multilingual keywords with weights (like neural network)
    const keywordWeights = {
      greeting: {
        high: ['hello', 'hi', '你好', '您好', 'hola', '早安', '午安', '晚安', '早上好', '下午好', '晚上好', 'buenos días', 'buenas tardes', 'buenas noches'],
        medium: ['hey', 'morning', 'afternoon', 'evening', '嗨', '哈囉', '哈喽', 'ey'],
        low: ['greet', '問候', '问候', 'saludo']
      },
      fun_fact: {
        high: ['fun fact', '趣事', 'dato curioso', '有趣的事', '有趣的事情'],
        medium: ['interesting', 'cool thing', '有趣', '好玩', 'interesante', 'curioso', '趣味'],
        low: ['fact', 'tell', '事實', '事实', 'cuéntame']
      },
      time_date: {
        high: ['what time', 'what day', '幾點', '几点', '現在幾點', '现在几点', 'qué hora', '今天幾號', '今天几号'],
        medium: ['time', 'date', 'today', '時間', '时间', '日期', '今天', 'hora', 'fecha', 'hoy'],
        low: ['day', 'clock', '天', '鐘', '钟', 'día', 'reloj']
      },
      chat_stats: {
        high: ['chat stats', 'conversation time', '聊天時間', '聊天时间', '聊了多久', 'estadísticas de chat', 'tiempo de conversación'],
        medium: ['how long', 'chat time', '多久', '多長時間', '多长时间', 'cuánto tiempo', 'tiempo charlando'],
        low: ['talking', 'stat', '統計', '统计', 'tiempo']
      },
      thanks: {
        high: ['thank you', 'thanks', '謝謝', '谢谢', '多謝', '多谢', 'gracias', 'muchas gracias'],
        medium: ['thank', 'thx', '感謝', '感谢', 'gracias'],
        low: ['appreciate', '感激', 'agradezco']
      },
      bye: {
        high: ['goodbye', 'bye bye', '再見', '再见', '拜拜', 'adiós', 'hasta luego'],
        medium: ['bye', 'see you', 'later', '回見', '回见', 'chao', 'nos vemos'],
        low: ['leave', 'go', '走', '離開', '离开', 'salir']
      },
      hackathon: {
        high: ['aws hackathon', 'bay management', '機位管理', '机位管理', 'aws黑客松', 'aws黑客松', 'hackathon aws'],
        medium: ['hackathon', 'aws', '黑客松', '駭客松', 're:invent', 'reinvent', 'hackaton'],
        low: ['competition', 'bay', '比賽', '比赛', '機位', '机位', 'competencia']
      },
      coop: {
        high: ['haeco coop', 'haeco internship', '港機實習', '港机实习', 'haeco co-op', 'pasantía haeco'],
        medium: ['haeco', 'coop', 'co-op', 'internship', '港機', '港机', '實習', '实习', 'pasantía'],
        low: ['intern', '實習生', '实习生', 'pasante']
      },
      techathon: {
        high: ['haeco techathon', '創科馬拉松', '创科马拉松', 'techathon haeco', 'tecatón haeco'],
        medium: ['techathon', '創科', '创科', 'tecatón', 'pitch meeting'],
        low: ['innovation', 'roadmap', '創新', '创新', 'innovación']
      },
      lean_day: {
        high: ['lean day', 'haeco lean day', '精益日', 'lean day haeco', 'día lean'],
        medium: ['lean', 'mc', 'master of ceremony', '司儀', '司仪', '精益', '主持人', 'maestro de ceremonias'],
        low: ['ceremony', 'host', '主持', 'presentador']
      },
      skills: {
        high: ['what skills', 'programming skills', '什麼技能', '什么技能', '編程技能', '编程技能', 'qué habilidades'],
        medium: ['skills', 'programming', 'tech', '技能', '技術', '技术', '編程', '编程', 'habilidades', 'programación'],
        low: ['tool', 'language', '工具', '語言', '语言', 'herramienta', 'lenguaje']
      },
      education: {
        high: ['education background', 'university', 'hkust', 'hku', '教育背景', '大學', '大学', 'formación académica'],
        medium: ['education', 'school', 'study', '教育', '學校', '学校', '學歷', '学历', 'educación', 'universidad'],
        low: ['learn', 'degree', '學習', '学习', '學位', '学位', 'estudiar', 'grado']
      },
      projects: {
        high: ['what projects', 'your projects', '什麼項目', '什么项目', '你的項目', '你的项目', 'qué proyectos'],
        medium: ['projects', 'portfolio', 'fyp', '項目', '项目', '作品', '專題', '专题', 'proyectos'],
        low: ['work', 'build', '工作', '建立', 'trabajo', 'construir']
      },
      awards: {
        high: ['what awards', 'achievements', '什麼獎項', '什么奖项', '成就', 'qué premios', 'logros'],
        medium: ['awards', 'prize', 'achievement', '獎項', '奖项', '獎', '奖', 'premios', 'premio'],
        low: ['win', 'honor', '贏', '赢', '榮譽', '荣誉', 'ganar', 'honor']
      },
      contact: {
        high: ['contact jason', 'email jason', '聯絡jason', '联络jason', 'contactar jason'],
        medium: ['contact', 'email', 'reach', 'github', '聯絡', '联络', '電郵', '电邮', 'contacto', 'correo'],
        low: ['connect', 'message', '聯繫', '联系', '訊息', '消息', 'mensaje']
      },
      cv: {
        high: ['download cv', 'download resume', 'jason resume', 'jason cv', 'english resume', 'chinese resume', '英文履歷', '中文履歷', '英文履历', '中文履历', '下載履歷', '下载履历', 'descargar cv'],
        medium: ['resume', 'cv', '履歷', '履历', 'currículum', 'base version', 'base resume', 'en version', 'cn version'],
        low: ['pdf', 'formal details']
      },
      experience: {
        high: ['work experience', 'professional experience', '工作經驗', '工作经验', 'experiencia profesional'],
        medium: ['experience', 'job', 'work history', '經驗', '经验', '工作', 'experiencia', 'trabajo'],
        low: ['career', 'position', '職業', '职业', '職位', '职位', 'carrera', 'puesto']
      },
      about_jason: {
        high: ['who is jason', 'about jason', 'tell me about jason', '關於jason', '关于jason', 'jason是誰', 'jason是谁', 'quién es jason'],
        medium: ['about', 'who', 'introduce', '關於', '关于', '介紹', '介绍', '是誰', '是谁', 'sobre', 'quién'],
        low: ['jason', 'person', '人', 'persona']
      },
      navigate: {
        high: ['go to page', 'open page', '前往頁面', '前往页面', '打開頁面', '打开页面', 'ir a página'],
        medium: ['go to', 'show me', 'navigate', '去', '前往', '打開', '打开', '顯示', '显示', 'ir a', 'mostrar'],
        low: ['page', 'link', '頁面', '页面', '連結', '链接', 'página', 'enlace']
      }
    };
    
    // Calculate weighted scores for each intent (neural network style)
    const intentScores = {};
    const weights = { high: 3.0, medium: 1.5, low: 0.5 };
    
    for (const [intentName, layers] of Object.entries(keywordWeights)) {
      let score = 0;
      
      // Layer 1: High priority keywords
      for (const keyword of layers.high) {
        if (msg.includes(keyword.toLowerCase())) {
          score += weights.high;
        }
      }
      
      // Layer 2: Medium priority keywords
      for (const keyword of layers.medium) {
        if (msg.includes(keyword.toLowerCase())) {
          score += weights.medium;
        }
      }
      
      // Layer 3: Low priority keywords
      for (const keyword of layers.low) {
        if (msg.includes(keyword.toLowerCase())) {
          score += weights.low;
        }
      }
      
      if (score > 0) {
        intentScores[intentName] = score;
      }
    }
    
    // Get intent with highest score (activation function)
    if (Object.keys(intentScores).length > 0) {
      intent = Object.entries(intentScores)
        .sort((a, b) => b[1] - a[1])[0][0];
    }
    
    this.trackIntent(intent);
    if (intent !== 'cv') {
      this.pendingFollowUp = null;
    }
    
    // Check for loop
    if (this.isLooping()) {
      return this.handleLoop(intent, snippets);
    }
    
    // Greeting responses
    if (intent === 'greeting') {
      const greeting = this.getTimeBasedGreeting();
      const variants = [
        `${greeting}! 👋 ${this.t('intro')}`,
        `${greeting}! 😊 ${this.t('ready')}`,
        `${greeting}! 🌟 ${this.t('ask')}`
      ];
      return {
        text: this.pickVariant('greeting', variants),
        actions: [],
        suggestions: ['AWS Hackathon details', 'HAECO Co-op experience', 'Tell me a fun fact', 'What time is it?']
      };
    }
    
    // Fun facts
    if (intent === 'fun_fact') {
      return this.buildFunFactResponse();
    }
    
    // Conversation time
    if (intent === 'chat_stats') {
      return {
        text: `⏱️ **${this.t('chatStats')}**\n\n• ${this.t('timeChatting')} **${this.getConversationTime()}**\n• ${this.t('messagesSent')} **${this.messageCount}**\n• ${this.t('started')} **${this.conversationStart.toLocaleTimeString(locale)}**\n\n${this.t('keepAsking')}`,
        actions: [],
        suggestions: ['Tell me about Jason', 'AWS Hackathon', 'Fun fact', 'What time is it?']
      };
    }
    
    // Time and date queries
    if (intent === 'time_date') {
      const now = new Date();
      const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const date = now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const greeting = this.getTimeBasedGreeting(now);
      return {
        text: `${greeting}!\n\n🕐 **${this.t('currentTime')}** ${time}\n📅 **${this.t('todayIs')}** ${date}\n\n${this.t('anythingElse')}`,
        actions: [],
        suggestions: ['Tell me about Jason', 'HAECO Co-op', 'Chat stats', 'Fun fact']
      };
    }
    
    // Navigation queries
    if (intent === 'navigate') {
      if (msg.includes('hackathon')) {
        return {
          text: `🏆 ${reply.takeHackathon}`,
          actions: [{ text: `🚀 ${reply.viewHackathonProject}`, link: 'hackathon.html' }],
          suggestions: ['Tell me about HAECO', 'What are his skills?', 'Fun fact']
        };
      }
      if (msg.includes('coop') || msg.includes('co-op')) {
        return {
          text: `🚀 ${reply.takeCoop}`,
          actions: [{ text: `📅 ${reply.viewCoopExperience}`, link: 'coop.html' }],
          suggestions: ['AWS Hackathon details', 'Education background', 'Projects']
        };
      }
      if (msg.includes('home') || msg.includes('main')) {
        return {
          text: `🏠 ${reply.takeHome}`,
          actions: [{ text: `🏠 ${reply.goHome}`, link: 'index.html' }],
          suggestions: ['Tell me about Jason', 'Fun fact', 'What time is it?']
        };
      }
    }
    
    // Thank you responses
    if (intent === 'thanks') {
      return {
        text: `${this.t('welcome')}\n\n${this.t('happyToHelp')}`,
        actions: [],
        suggestions: ['Fun fact', 'AWS Hackathon', 'Skills', 'Chat stats']
      };
    }
    
    // Goodbye responses
    if (intent === 'bye') {
      return {
        text: `👋 ${this.t('goodbye')}\n\n${this.t('weTalked')} **${this.getConversationTime()}** ${this.t('exchanged')} **${this.messageCount} ${this.t('messages')}**.\n\n${this.t('comeBack')}`,
        actions: [],
        suggestions: []
      };
    }
    
    // AWS Hackathon queries
    if (intent === 'hackathon') {
      if (/bay management system|機位管理|机位管理/.test(msg)) {
        return {
          text: reply.bayManagementText,
          actions: [{ text: `🏆 ${reply.viewHackathonProject}`, link: 'hackathon.html' }],
          suggestions: ['AWS Hackathon details', 'HAECO Co-op experience', 'Techathon details', 'Skills']
        };
      }

      if (/how many teams|多少隊伍|多少队伍|cuántos equipos/.test(msg)) {
        return {
          text: reply.hackathonScaleText,
          actions: [{ text: `🏆 ${reply.viewHackathonProject}`, link: 'hackathon.html' }],
          suggestions: ['What is the Bay Management System?', 'When was the AWS Hackathon?', 'HAECO Co-op experience', 'Awards']
        };
      }

      if (/when was|什麼時候|什么时候|cuándo fue/.test(msg)) {
        return {
          text: reply.hackathonWhenText,
          actions: [{ text: `🏆 ${reply.viewHackathonProject}`, link: 'hackathon.html' }],
          suggestions: ['How many teams were in the hackathon?', 'What is the Bay Management System?', 'Awards', 'HAECO Co-op experience']
        };
      }

      return {
        text: `🏆 **${this.t('hackathonTitle')}**\n\n${this.t('hackathonIntro')}\n\n✨ **${this.t('keyAchievements')}**\n• ${this.t('hackathonAch1')}\n• ${this.t('hackathonAch2')}\n• ${this.t('hackathonAch3')}\n• ${this.t('hackathonAch4')}\n\n🛠️ **${this.t('techStack')}** ${this.t('techStackValue')}\n\n💡 ${this.t('systemFeature')}`,
        actions: [
          { text: `📄 ${reply.viewHackathonDetails}`, link: 'hackathon.html' },
          { text: `🎥 ${reply.watchDemo}`, link: 'hackathon.html#demo' }
        ],
        suggestions: ['HAECO Co-op experience', 'Techathon details', 'Skills', 'Fun fact']
      };
    }

    if (intent === 'techathon') {
      return {
        text: reply.techathonText,
        actions: [{ text: `🚀 ${reply.viewCoopExperience}`, link: 'coop.html' }],
        suggestions: ['Lean Day MC', 'AWS Hackathon', 'HAECO Co-op experience', 'Awards']
      };
    }

    if (intent === 'lean_day') {
      return {
        text: reply.leanDayText,
        actions: [{ text: `📅 ${reply.viewCoopTimeline}`, link: 'coop.html' }],
        suggestions: ['Techathon details', 'HAECO Co-op experience', 'Awards', 'Fun fact']
      };
    }
    
    // HAECO Co-op queries
    if (intent === 'coop') {
      return {
        text: `🚀 **${this.t('coopTitle')}**\n\n${this.t('coopIntro')}\n\n🌟 **${this.t('majorAchievements')}**\n${this.t('coopAch1')}\n${this.t('coopAch2')}\n${this.t('coopAch3')}\n${this.t('coopAch4')}\n${this.t('coopAch5')}\n${this.t('coopAch6')}\n\n📊 **${this.t('keyProjects')}**\n• ${this.t('coopProj1')}\n• ${this.t('coopProj2')}\n• ${this.t('coopProj3')}\n• ${this.t('coopProj4')}\n• ${this.t('coopProj5')}`,
        actions: [
          { text: `📅 ${reply.viewCoopTimeline}`, link: 'coop.html' },
          { text: `📸 ${reply.seeCoopMedia}`, link: 'coop.html' }
        ],
        suggestions: ['Techathon details', 'Lean Day MC', 'AWS Hackathon', 'Education']
      };
    }
    
    // Skills queries
    if (intent === 'skills') {
      return {
        text: `🛠️ **${this.t('skillsTitle')}**\n\n**💻 ${this.t('programmingData')}**\nPython, R, Octave, SQLite, SQL\n\n**🤖 ${this.t('aiTools')}**\nAWS Q Developer, Kiro, OpenAI Codex, AutoML\n\n**🎨 ${this.t('creativeTools')}**\nMS Office, Canva, Adobe Creative Suite\n\n**🧠 ${this.t('softSkills')}**\n${this.t('softSkillsList')}\n\n**🌍 ${this.t('languagesSpoken')}**\n${this.t('languagesList')}`,
        actions: [{ text: `📋 ${reply.viewFullCv}`, link: 'index.html#skills' }],
        suggestions: ['Education background', 'Projects', 'Awards', 'Contact info']
      };
    }
    
    // Education queries
    if (intent === 'education') {
      return {
        text: `🎓 **${this.t('educationTitle')}**\n\n**${this.t('hkustSchool')}**\n• ${this.t('hkustDegree')}\n• ${this.t('hkustMinor')}\n• ${this.t('hkustPeriod')}\n• ${this.t('hkustFYP')}\n\n**${this.t('hkuSchool')}**\n• ${this.t('hkuDegree')}\n• ${this.t('hkuPeriod')}\n• ${this.t('hkuAwards')}\n• ${this.t('hkuLeadership')}`,
        actions: [{ text: `📚 ${reply.viewEducationDetails}`, link: 'index.html#education' }],
        suggestions: ['Skills overview', 'Projects', 'HAECO Co-op', 'Fun fact']
      };
    }
    
    // Projects queries
    if (intent === 'projects') {
      if (/final year project|\bfyp\b|畢業專題|毕业专题|proyecto final/.test(msg)) {
        return {
          text: reply.fypText,
          actions: [{ text: `🎯 ${reply.viewProjectSection}`, link: 'index.html#projects' }],
          suggestions: ['Education background', 'Skills', 'AWS Hackathon', 'Contact info']
        };
      }

      return {
        text: reply.projectsText,
        actions: [
          { text: `🎯 ${reply.viewProjects}`, link: 'index.html#projects' },
          { text: `🏆 ${reply.viewHackathonDetails}`, link: 'hackathon.html' }
        ],
        suggestions: ['AWS Hackathon story', 'Skills', 'Education', 'Contact']
      };
    }
    
    // Awards queries
    if (intent === 'awards') {
      return {
        text: reply.awardsText,
        actions: [{ text: `🌟 ${reply.viewAchievements}`, link: 'index.html#awards' }],
        suggestions: ['AWS Hackathon details', 'HAECO Co-op', 'Education', 'Fun fact']
      };
    }
    
    // Contact queries
    if (intent === 'contact') {
      if (/github/.test(msg)) {
        return {
          text: reply.githubText,
          actions: [
            { text: `💻 ${reply.openGithub}`, link: 'https://github.com/Jasonauyeungaa' },
            { text: `🚀 ${reply.viewProjects}`, link: 'index.html#projects' }
          ],
          suggestions: ['Projects', 'Skills', "View Jason's resume", 'Contact info']
        };
      }

      return {
        text: reply.contactText,
        actions: [
          { text: `📬 ${reply.sendEmail}`, link: 'index.html#contact' },
          { text: `📄 ${reply.openEnglishResume}`, link: this.getResumeAssets().en },
          { text: `📄 ${reply.openChineseResume}`, link: this.getResumeAssets().cn }
        ],
        suggestions: ['Tell me about Jason', 'Skills', 'Projects', 'Fun fact']
      };
    }

    if (intent === 'cv') {
      if (/(difference|different|which one|compare|base|有什麼不同|有什么不同|差別|差别|以哪個為準|以哪个为准)/.test(msg)) {
        return this.buildResumeDifferenceResponse(reply);
      }

      const variant = this.detectResumeVariantPreference(message);
      if (variant) {
        return this.buildResumeVariantResponse(reply, variant);
      }

      return this.buildResumeChoiceResponse(reply);
    }
    
    // Experience queries
    if (intent === 'experience') {
      return {
        text: reply.experienceText,
        actions: [
          { text: `💼 ${reply.viewExperience}`, link: 'index.html#experience' },
          { text: `🚀 ${reply.viewCoopExperience}`, link: 'coop.html' }
        ],
        suggestions: ['HAECO Co-op details', 'Skills', 'Education', 'Awards']
      };
    }
    
    // General about Jason
    if (intent === 'about_jason') {
      return {
        text: this.t('aboutIntro'),
        actions: [
          { text: '📄 ' + this.t('fullPortfolio'), link: 'index.html' },
          { text: '🏆 ' + this.t('hackathonTitle'), link: 'hackathon.html' }
        ],
        suggestions: ['AWS Hackathon', 'HAECO Co-op', 'Skills', 'Contact']
      };
    }
    
    // Default response with suggestions
    return this.buildClarificationResponse();
  }

  getCurrentSectionId() {
    return this.activeSectionId || this.domContext?.getSections?.()[0]?.id || null;
  }

  getSectionPromptDisplayMessage(sectionId, canonicalQuery = '') {
    const sectionTitle = this.domContext?.getSectionTitle?.(sectionId) || sectionId || this.t('chatTitle');
    const normalized = this.normalize(canonicalQuery);

    if (/page/.test(normalized)) {
      return this.localizePromptQuery('Summarize this page');
    }

    const copy = {
      en: normalized.includes('summar')
        ? `Summarize the ${sectionTitle} section`
        : `Tell me about the ${sectionTitle} section`,
      'zh-TW': normalized.includes('總結') || normalized.includes('summar')
        ? `總結「${sectionTitle}」這部分`
        : `告訴我「${sectionTitle}」這部分的重點`,
      'zh-CN': normalized.includes('总结') || normalized.includes('summar')
        ? `总结“${sectionTitle}”这部分`
        : `告诉我“${sectionTitle}”这部分的重点`,
      es: normalized.includes('resum')
        ? `Resume la sección "${sectionTitle}"`
        : `Cuéntame sobre la sección "${sectionTitle}"`
    };

    return copy[this.currentLang] || copy.en;
  }

  buildSectionPromptResponseMessage(sectionId, canonicalQuery = '') {
    const normalized = this.normalize(canonicalQuery);

    if (/page/.test(normalized)) {
      return this.localizePromptQuery('Summarize this page');
    }

    return this.localizePromptQuery('Summarize this section');
  }

  shouldPreferLegacyResponse(message = '') {
    const normalized = this.normalize(message);
    if (!normalized) return false;

    if (this.matchDynamicAssistantQuery(message)) {
      return false;
    }

    if (/(summarize|summary|section|page|總結|总结|摘要|概覽|概览|resumen|resume esta)/.test(normalized)) {
      return false;
    }

    return /(github|git hub|resume|cv|curriculum|currículum|履歷|履历|英文履歷|中文履歷|英文履历|中文履历|contact|email|聯絡|联络|電郵|电邮|correo)/.test(normalized);
  }

  getEngineResponse(message, contextSectionId = null) {
    if (!this.engine?.respond) return null;

    const canonicalMessage = this.getCanonicalAssistantQuery(message);
    if (this.shouldPreferLegacyResponse(message) || this.shouldPreferLegacyResponse(canonicalMessage)) {
      return null;
    }

    const dynamicMatch = this.matchDynamicAssistantQuery(message) || this.matchDynamicAssistantQuery(canonicalMessage);
    const summaryIntent = this.engine?.detectSummaryIntent?.(message) || this.engine?.detectSummaryIntent?.(canonicalMessage) || null;
    const hasContextualFallback = this.currentLang !== 'en'
      && Boolean(contextSectionId || this.getCurrentSectionId())
      && !this.isGlobalAssistantQuery(canonicalMessage)
      && (this.matchDynamicAssistantQuery(message) || this.isSectionFocusedQuery(message) || canonicalMessage !== message);

    const canUseLocalizedEngine = summaryIntent
      || dynamicMatch?.type === 'section_summary'
      || dynamicMatch?.type === 'section_focus'
      || dynamicMatch?.type === 'page_summary'
      || hasContextualFallback;

    if (this.currentLang !== 'en' && !canUseLocalizedEngine) {
      return null;
    }

    let engineMessage = canonicalMessage;
    if (hasContextualFallback && !summaryIntent) {
      engineMessage = this.isSectionFocusedQuery(canonicalMessage) ? 'Tell me about this section' : 'Summarize this section';
    }

    const response = this.engine.respond({
      message: engineMessage,
      lang: this.currentLang,
      currentPage: window.location.pathname.split('/').pop() || 'index.html',
      currentSectionId: contextSectionId || this.getCurrentSectionId()
    });

    if (!response?.handled) return null;

    return {
      text: response.text,
      actions: response.actions || [],
      suggestions: response.suggestions || []
    };
  }

  generateResponse(message, contextSectionId = null) {
    if (this.isFunFactRequest(message)) {
      return this.buildFunFactResponse();
    }

    const followUpResponse = this.resolvePendingFollowUp(message);
    if (followUpResponse) return followUpResponse;

    if (!this.shouldKeepPendingFollowUp(message)) {
      this.pendingFollowUp = null;
    }

    const engineResponse = this.getEngineResponse(message, contextSectionId);
    if (engineResponse) return engineResponse;
    return this.generateLegacyResponse(message);
  }

  formatInline(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  formatMessageText(text) {
    const lines = text.split('\n');
    const blocks = [];
    let listItems = [];

    const flushList = () => {
      if (listItems.length === 0) return;
      blocks.push(`<ul class="message-list">${listItems.map((item) => `<li>${this.formatInline(item)}</li>`).join('')}</ul>`);
      listItems = [];
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      if (/^[•*-]\s+/.test(trimmed)) {
        listItems.push(trimmed.replace(/^[•*-]\s+/, ''));
        return;
      }

      flushList();
      blocks.push(`<p>${this.formatInline(trimmed)}</p>`);
    });

    flushList();
    return blocks.join('');
  }

  addMessage(text, sender, actions = [], suggestions = []) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    const senderClass = sender === 'bot' ? 'assistant' : sender;
    messageDiv.className = `chat-message ${senderClass}`;
    
    let actionsHTML = '';
    if (actions.length > 0) {
      actionsHTML = '<div class="message-actions">' +
        actions.map(action => 
          `<a href="${action.link}" class="action-btn">${action.text}</a>`
        ).join('') +
        '</div>';
    }
    
    let suggestHTML = '';
    if (senderClass === 'assistant' && suggestions.length > 0) {
      const contextSectionId = this.getCurrentSectionId() || '';
      const payloads = this.normalizeSuggestionPayloads(suggestions, contextSectionId);
      suggestHTML = '<div class="suggest-wrap">' +
        payloads.map((payload, index) => {
          const original = payload.sourceQuery || suggestions[index] || payload.display;
          return `<button class="suggest-btn" data-original-suggestion="${original}" data-context-section-id="${payload.contextSectionId}" data-q="${payload.response}">${payload.display}</button>`;
        }).join('') +
        '</div>';
    }
    
    messageDiv.innerHTML = `
      <div class="message-content">${this.formatMessageText(text)}</div>
      ${actionsHTML}
      ${suggestHTML}
    `;
    
    messagesDiv.appendChild(messageDiv);
    
    if (senderClass === 'assistant') {
      messageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
      messageDiv.querySelectorAll('.suggest-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.handleSend({
            displayMessage: btn.textContent.trim(),
            responseMessage: btn.dataset.q,
            contextSectionId: btn.dataset.contextSectionId || ''
          });
        });
      });
      this.updateDynamicSuggestionButtons();
    } else {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  showTyping() {
    const messagesDiv = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message assistant typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    this.setReaction('thinking', 1100);
  }

  hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
  }

  handleAutocomplete(e) {
    const input = e.target.value.toLowerCase().trim();
    if (input.length < 2) {
      this.hideAutocomplete();
      return;
    }
    
    const suggestions = this.getAutocompleteSuggestions(input);
    if (suggestions.length > 0) {
      this.showAutocomplete(suggestions);
    } else {
      this.hideAutocomplete();
    }
  }
  
  getAutocompleteSuggestions(input) {
    const queries = {
      en: [
        'Tell me about Jason',
        'What is the AWS Hackathon project?',
        'What did Jason do at HAECO?',
        'Tell me a fun fact',
        'What time is it?',
        'How long have we been talking?',
        'What are Jason\'s skills?',
        'What is Jason\'s education?',
        'Show me Jason\'s projects',
        'What awards did Jason win?',
        'How can I contact Jason?',
        'What is Jason\'s experience?',
        'Tell me about the Techathon',
        'What is Lean Day?',
        'Show me the Co-op experience',
        'What programming languages does Jason know?',
        'What AI tools does Jason use?',
        'Where did Jason study?',
        'What is Jason\'s Final Year Project?',
        'Tell me about HAECO',
        'What is the Bay Management System?',
        'How many teams were in the hackathon?',
        'When was the AWS Hackathon?',
        "What is Jason's GitHub?",
        "View Jason's resume",
        'View Jason\'s English resume',
        'View Jason\'s Chinese resume'
      ],
      'zh-TW': [
        '告訴我關於Jason',
        'AWS黑客松項目是什麼？',
        'Jason在港機做了什麼？',
        '告訴我一個趣事',
        '現在幾點？',
        '我們聊了多久？',
        'Jason的技能是什麼？',
        'Jason的教育背景是什麼？',
        '顯示Jason的項目',
        'Jason獲得了什麼獎項？',
        '如何聯絡Jason？',
        'Jason的經驗是什麼？',
        '告訴我關於創科馬拉松',
        '什麼是精益日？',
        '顯示Co-op經驗',
        'Jason會什麼編程語言？',
        'Jason使用什麼AI工具？',
        'Jason在哪裡學習？',
        'Jason的畢業專題是什麼？',
        '告訴我關於港機',
        '什麼是機位管理系統？',
        '黑客松有多少隊伍？',
        'AWS黑客松是什麼時候？',
        'Jason 的 GitHub 是什麼？',
        '查看Jason的履歷',
        '查看Jason的英文履歷',
        '查看Jason的中文履歷'
      ],
      'zh-CN': [
        '告诉我关于Jason',
        'AWS黑客松项目是什么？',
        'Jason在港机做了什么？',
        '告诉我一个趣事',
        '现在几点？',
        '我们聊了多久？',
        'Jason的技能是什么？',
        'Jason的教育背景是什么？',
        '显示Jason的项目',
        'Jason获得了什么奖项？',
        '如何联络Jason？',
        'Jason的经验是什么？',
        '告诉我关于创科马拉松',
        '什么是精益日？',
        '显示Co-op经验',
        'Jason会什么编程语言？',
        'Jason使用什么AI工具？',
        'Jason在哪里学习？',
        'Jason的毕业专题是什么？',
        '告诉我关于港机',
        '什么是机位管理系统？',
        '黑客松有多少队伍？',
        'AWS黑客松是什么时候？',
        'Jason 的 GitHub 是什么？',
        '查看Jason的履历',
        '查看Jason的英文履历',
        '查看Jason的中文履历'
      ],
      es: [
        'Cuéntame sobre Jason',
        '¿Cuál es el proyecto del AWS Hackathon?',
        '¿Qué hizo Jason en HAECO?',
        'Cuéntame un dato curioso',
        '¿Qué hora es?',
        '¿Cuánto tiempo hemos estado hablando?',
        '¿Cuáles son las habilidades de Jason?',
        '¿Cuál es la educación de Jason?',
        'Muéstrame los proyectos de Jason',
        '¿Qué premios ganó Jason?',
        '¿Cómo puedo contactar a Jason?',
        '¿Cuál es la experiencia de Jason?',
        'Cuéntame sobre el Techathon',
        '¿Qué es el Lean Day?',
        'Muéstrame la experiencia Co-op',
        '¿Qué lenguajes de programación conoce Jason?',
        '¿Qué herramientas de IA usa Jason?',
        '¿Dónde estudió Jason?',
        '¿Cuál es el Proyecto Final de Jason?',
        'Cuéntame sobre HAECO',
        '¿Qué es el Sistema de Gestión de Bahías?',
        '¿Cuántos equipos había en el hackathon?',
        '¿Cuándo fue el AWS Hackathon?',
        '¿Cuál es el GitHub de Jason?',
        'Ver el CV de Jason',
        'Ver CV de Jason en inglés',
        'Ver CV de Jason en chino'
      ]
    };
    
    const langQueries = queries[this.currentLang] || queries.en;
    const fallbackSuggestions = langQueries.filter(q => q.toLowerCase().includes(input));
    const engineSuggestions = this.engine?.getAutocompleteSuggestions
      ? this.engine.getAutocompleteSuggestions({
          input,
          lang: this.currentLang,
          currentSectionId: this.getCurrentSectionId()
        })
      : [];

    return [...new Set([...engineSuggestions, ...fallbackSuggestions])]
      .map((suggestion) => ({
        original: suggestion,
        payload: this.buildSuggestionPayload(suggestion, this.getCurrentSectionId() || '')
      }))
      .filter(({ original, payload }) => this.shouldDisplayLocalizedSuggestion(original, payload.display))
      .map(({ payload }) => payload)
      .slice(0, 6);
  }
  
  showAutocomplete(suggestions) {
    let dropdown = document.getElementById('autocompleteDropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'autocompleteDropdown';
      dropdown.className = 'autocomplete-dropdown';
      document.querySelector('.chat-input-shell').appendChild(dropdown);
    }
    
    dropdown.innerHTML = suggestions.map((suggestion) => {
      const item = typeof suggestion === 'string'
        ? this.buildSuggestionPayload(suggestion, this.getCurrentSectionId() || '')
        : suggestion;
      return `<div class="autocomplete-item" data-text="${item.display}" data-response="${item.response}" data-context-section-id="${item.contextSectionId || ''}">${item.display}</div>`;
    }
    ).join('');
    
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        this.hideAutocomplete();
        this.handleSend({
          displayMessage: item.dataset.text,
          responseMessage: item.dataset.response || item.dataset.text,
          contextSectionId: item.dataset.contextSectionId || ''
        });
      });
    });
    
    dropdown.style.display = 'block';
  }
  
  hideAutocomplete() {
    const dropdown = document.getElementById('autocompleteDropdown');
    if (dropdown) dropdown.style.display = 'none';
  }
  
  showWelcomeMessage() {
    setTimeout(() => {
      const greeting = this.getTimeBasedGreeting();
      const funFact = this.getRandomFunFact();
      this.addMessage(
        `${greeting}. ${this.t('intro')}\n\n${this.t('ready')}\n\n**${this.t('funFact')}**\n${funFact}\n\n${this.t('askAnything')}`,
        'assistant'
      );
      this.setReaction('happy', 1000);
    }, 500);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.jasonAI = new JasonAssistant();
  });
} else {
  window.jasonAI = new JasonAssistant();
}
