// Jason AI Assistant - Enhanced Intelligent Chatbot

class JasonAssistant {
  constructor() {
    this.conversationStart = new Date();
    this.messageCount = 0;
    this.knowledgeBase = [];
    this.knowledgeIndex = null;
    this.intentHistory = [];
    this.lastIntentPicks = {};
    this.currentLang = 'en';
    this.loadKnowledge();
    this.detectLanguage();
    
    this.knowledge = {
      profile: {
        name: "Jason Au-Yeung",
        title: "IEEM × Data × Tech | AI & Operations Innovation",
        education: "HKUST BEng IEEM + Minor in Big Data Technology",
        currentStatus: "Completed 5-month Co-op at HAECO (Sep 2025 - Jan 2026)"
      },
      
      funFacts: [
        "🎬 Jason produced the 3-minute demo video for the AWS Hackathon project.",
        "🎤 Jason served as MC at HAECO Lean Day 2025, engaging with executives and attendees.",
        "🌍 Jason attended AWS re:Invent in Las Vegas and was interviewed on-site.",
        "💡 Jason organized HAECO's first Techathon, including framework design and GM presentations.",
        "📊 Jason served as Class Representative for 80+ students in the Data Science program.",
        "🏆 Jason's team competed against 130+ teams in the AWS AI Hackathon Hong Kong 2025.",
        "⚡ The Bay Management System was developed in 14 days during the hackathon.",
        "🎉 Jason participated in HAECO's 75th Anniversary celebration.",
        "🤖 Jason uses AI tools like AWS Q Developer and Krio for development.",
        "🌏 Jason communicates in three languages: English, Cantonese, and Mandarin.",
        "📸 Jason has experience in photo and video editing with Adobe Creative Suite.",
        "🎯 Jason's Final Year Project focuses on Inventory Control using data-driven methods."
      ],
      
      awards: [
        "Grand Prize - AWS AI Hackathon Hong Kong 2025 (130+ teams)",
        "Master of Ceremony - HAECO Lean Day 2025",
        "Lead Organizer - HAECO Techathon 2026",
        "Academic Excellence Award - HKU SPACE",
        "Principal's Honor List - HKU SPACE"
      ],
      
      skills: {
        programming: ["Python", "R", "Octave", "SQLite", "SQL"],
        ai: ["AWS Q Developer", "Krio", "OpenAI Codex", "AutoML"],
        tools: ["MS Office", "Canva", "Adobe Creative"],
        soft: ["Critical Thinking", "Leadership", "Teamwork", "Negotiation"],
        languages: ["English", "Cantonese", "Mandarin"]
      }
    };
    
    this.init();
  }

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good morning';
    if (hour < 18) return '☀️ Good afternoon';
    return '🌙 Good evening';
  }
  
  async loadKnowledge() {
    try {
      const response = await fetch('assets/bot/knowledge.json');
      const data = await response.json();
      this.knowledgeBase = data.snippets;
      this.buildIndex();
    } catch (error) {
      console.warn('Knowledge base not loaded, using fallback');
      this.knowledgeBase = [];
    }
  }
  
  buildIndex() {
    this.knowledgeIndex = this.knowledgeBase.map(snippet => ({
      id: snippet.id,
      tokens: this.tokenize(snippet.text + ' ' + snippet.tags.join(' ')),
      snippet
    }));
  }
  
  detectLanguage() {
    this.currentLang = localStorage.getItem('preferredLanguage') || 'en';
    
    // Listen for language changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'preferredLanguage') {
        this.currentLang = e.newValue || 'en';
        this.refreshWelcomeMessage();
      }
    });
    
    // Check periodically for language changes
    setInterval(() => {
      const newLang = localStorage.getItem('preferredLanguage') || 'en';
      if (newLang !== this.currentLang) {
        this.currentLang = newLang;
        this.refreshWelcomeMessage();
      }
    }, 1000);
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
    
    if (chatTitle) chatTitle.textContent = this.t('chatTitle');
    if (chatStatus) chatStatus.textContent = this.t('chatStatus');
    if (suggestionsTitle) suggestionsTitle.textContent = '💡 ' + this.t('suggestedQuestions');
    if (chatInput) chatInput.placeholder = this.t('inputPlaceholder');
    
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
  }
  
  t(key) {
    const translations = {
      en: {
        greeting: ['Good morning', 'Good afternoon', 'Good evening'],
        intro: "I'm Jason's AI assistant. How can I help you today?",
        aboutIntro: "👋 Meet Jason Au-Yeung\n\nIEEM × Data × Tech | AI & Operations Innovation\n\nJason is a HKUST student specializing in Industrial Engineering with a passion for AI-driven solutions and operations optimization.\n\n🌟 Recent Highlights:\n• 🏆 Grand Prize Winner - AWS AI Hackathon HK 2025\n• 🚀 Completed 5-month Co-op at HAECO\n• 🎤 MC at HAECO Lean Day 2025\n• 💡 Organized HAECO's first Techathon\n\n🎓 Education:\n• HKUST - BEng IEEM + Big Data Technology Minor\n• HKU SPACE - Higher Diploma in Data Science\n\n💪 Expertise:\nAI/ML, Data Analytics, Operations Optimization, Python, AWS, Leadership",
        ready: 'Ready to learn about Jason\'s journey in AI and operations?',
        ask: 'Ask me anything about Jason\'s projects and achievements!',
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
        techStackValue: 'HTML, CSS, JavaScript, AWS Q Developer, Kiro AI',
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
        hkustDegree: 'BEng in Industrial Engineering and Engineering Management',
        hkustMinor: 'Minor in Big Data Technology',
        hkustPeriod: '2023 - Present',
        hkustFYP: 'FYP: Efficient Data-Driven Methods for Inventory Control',
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
        contactTitle: 'Get in Touch with Jason',
        contactIntro: 'Interested in AI-driven solutions, operations optimization, or innovation projects?',
        contactEmail: 'Email:',
        contactGitHub: 'GitHub:',
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
        chatTitle: 'Jason AI Assistant',
        chatStatus: 'Online • Ready to help',
        suggestedQuestions: 'Suggested Questions:',
        suggestionAbout: 'Tell me about Jason',
        suggestionHackathon: 'AWS Hackathon',
        suggestionHaeco: 'HAECO experience',
        suggestionFunFact: 'Fun fact',
        suggestionTime: 'What time?',
        suggestionChatTime: 'Chat time',
        inputPlaceholder: 'Ask me anything about Jason...',
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
        intro: '我是Jason的AI助理。有什麼可以幫到你？',
        aboutIntro: "👋 認識Jason Au-Yeung\n\n工業工程 × 數據 × 科技 | 人工智能與營運創新\n\nJason是香港科技大學學生，專攻工業工程，熱衷於人工智能驅動方案和營運優化。\n\n🌟 近期亮點：\n• 🏆 總冠軍 - 2025年AWS人工智能黑客松香港區\n• 🚀 完成港機（香港）5個月Co-op實習\n• 🎤 擔任2025年港機（香港）精益日司儀\n• 💡 組織港機（香港）首個創科馬拉松\n\n🎓 教育：\n• 香港科技大學 - 工業工程及工程管理學士 + 大數據技術副修\n• 香港大學專業進修學院 - 數據科學高級文憑\n\n💪 專長：\n人工智能/機器學習、數據分析、營運優化、Python、AWS、領導力",
        ready: '準備好了解Jason在人工智能和營運方面的旅程嗎？',
        ask: '問我任何關於Jason的項目和成就！',
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
        hackathonTitle: 'AWS人工智能黑客松香港2025 - 總冠軍！',
        hackathonIntro: 'Jason的團隊開發了**港機（香港）機位管理系統** - 基於人工智能的飛機機位調度優化平台。',
        keyAchievements: '主要成就：',
        hackathonAch1: '於**130+支入圍隊伍**中奪得總冠軍',
        hackathonAch2: '僅用**14天**建成',
        hackathonAch3: '獲**4次媒體訪問** (unwire.hk, SCMP, 港機, AWS香港)',
        hackathonAch4: '於拉斯維加斯**AWS re:Invent**接受訪問',
        techStack: '技術堆疊：',
        techStackValue: 'HTML, CSS, JavaScript, AWS Q Developer, Kiro AI',
        systemFeature: '系統自動化飛機機位分配，優化排程，並為港機營運提供實時分析。',
        // HAECO Co-op
        coopTitle: '港機（香港）Co-op實習經驗 (2025年9月 - 2026年1月)',
        coopIntro: 'Jason完成了在港機（香港）科技創新部門為期**5個月**的Co-op實習。',
        majorAchievements: '主要成就：',
        coopAch1: '🏆 奪得AWS人工智能黑客松總冠軍',
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
        hkustDegree: '工業工程及工程管理學士',
        hkustMinor: '副修大數據技術',
        hkustPeriod: '2023 - 現在',
        hkustFYP: '畢業專題：高效數據驅動的庫存控制方法',
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
        award1: '**總冠軍** - AWS人工智能黑客松香港2025 (130+隊)',
        award2: '**司儀** - 港機精益日2025',
        award3: '**首席組織者** - 港機創科馬拉松2026',
        award4: '**學術卓越獎** - 香港大學專業進修學院',
        award5: '**校長榮譽錄** - 香港大學專業進修學院',
        award6: '**班代表** - 數據科學 (80+名學生)',
        award7: '**傑出成就證書** - 港機2025',
        // Contact
        contactTitle: '聯絡Jason',
        contactIntro: '對人工智能驅動方案、營運優化或創新項目感興趣？',
        contactEmail: '電郵：',
        contactGitHub: 'GitHub：',
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
        chatTitle: 'Jason AI助理',
        chatStatus: '在線 • 準備協助',
        suggestedQuestions: '建議問題：',
        suggestionAbout: '告訴我關於Jason',
        suggestionHackathon: 'AWS黑客松',
        suggestionHaeco: '港機經驗',
        suggestionFunFact: '趣事',
        suggestionTime: '現在幾點？',
        suggestionChatTime: '聊天時間',
        inputPlaceholder: '問我任何關於Jason的問題...',
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
        intro: '我是Jason的AI助理。有什么可以帮到你？',
        aboutIntro: "👋 认识Jason Au-Yeung\n\n工业工程 × 数据 × 科技 | 人工智能与运营创新\n\nJason是香港科技大学学生，专攻工业工程，热衷于人工智能驱动方案和运营优化。\n\n🌟 近期亮点：\n• 🏆 总冠军 - 2025年AWS人工智能黑客松香港区\n• 🚀 完成港机（香港）5个月Co-op实习\n• 🎤 担任2025年港机（香港）精益日司仪\n• 💡 组织港机（香港）首个创科马拉松\n\n🎓 教育：\n• 香港科技大学 - 工业工程及工程管理学士 + 大数据技术副修\n• 香港大学专业进修学院 - 数据科学高级文凭\n\n💪 专长：\n人工智能/机器学习、数据分析、运营优化、Python、AWS、领导力",
        ready: '准备好了解Jason在人工智能和运营方面的旅程吗？',
        ask: '问我任何关于Jason的项目和成就！',
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
        hackathonTitle: 'AWS人工智能黑客松香港2025 - 总冠军！',
        hackathonIntro: 'Jason的团队开发了**港机（香港）机位管理系统** - 基于人工智能的飞机机位调度优化平台。',
        keyAchievements: '主要成就：',
        hackathonAch1: '于**130+支入围队伍**中夺得总冠军',
        hackathonAch2: '仅用**14天**建成',
        hackathonAch3: '获**4次媒体访问** (unwire.hk, SCMP, 港机, AWS香港)',
        hackathonAch4: '于拉斯维加斯**AWS re:Invent**接受访问',
        techStack: '技术堆栈：',
        techStackValue: 'HTML, CSS, JavaScript, AWS Q Developer, Kiro AI',
        systemFeature: '系统自动化飞机机位分配，优化排程，并为港机运营提供实时分析。',
        // HAECO Co-op
        coopTitle: '港机（香港）Co-op实习经验 (2025年9月 - 2026年1月)',
        coopIntro: 'Jason完成了在港机（香港）科技创新部门为期**5个月**的Co-op实习。',
        majorAchievements: '主要成就：',
        coopAch1: '🏆 夺得AWS人工智能黑客松总冠军',
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
        hkustDegree: '工业工程及工程管理学士',
        hkustMinor: '副修大数据技术',
        hkustPeriod: '2023 - 现在',
        hkustFYP: '毕业专题：高效数据驱动的库存控制方法',
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
        award1: '**总冠军** - AWS人工智能黑客松香港2025 (130+队)',
        award2: '**司仪** - 港机精益日2025',
        award3: '**首席组织者** - 港机创科马拉松2026',
        award4: '**学术卓越奖** - 香港大学专业进修学院',
        award5: '**校长荣誉录** - 香港大学专业进修学院',
        award6: '**班代表** - 数据科学 (80+名学生)',
        award7: '**杰出成就证书** - 港机2025',
        // Contact
        contactTitle: '联系Jason',
        contactIntro: '对人工智能驱动方案、运营优化或创新项目感兴趣？',
        contactEmail: '电邮：',
        contactGitHub: 'GitHub：',
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
        chatTitle: 'Jason AI助理',
        chatStatus: '在线 • 准备协助',
        suggestedQuestions: '建议问题：',
        suggestionAbout: '告诉我关于Jason',
        suggestionHackathon: 'AWS黑客松',
        suggestionHaeco: '港机经验',
        suggestionFunFact: '趣事',
        suggestionTime: '现在几点？',
        suggestionChatTime: '聊天时间',
        inputPlaceholder: '问我任何关于Jason的问题...',
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
        intro: 'Soy el asistente de IA de Jason. ¿Cómo puedo ayudarte hoy?',
        aboutIntro: "👋 Conoce a Jason Au-Yeung\n\nIEEM × Data × Tech | IA e Innovación en Operaciones\n\nJason es un estudiante de HKUST especializado en Ingeniería Industrial con pasión por soluciones impulsadas por IA y optimización de operaciones.\n\n🌟 Aspectos Destacados Recientes:\n• 🏆 Ganador del Gran Premio - AWS AI Hackathon HK 2025\n• 🚀 Completó Co-op de 5 meses en HAECO\n• 🎤 MC en HAECO Lean Day 2025\n• 💡 Organizó el primer Techathon de HAECO\n\n🎓 Educación:\n• HKUST - Licenciatura en IEEM + Minor en Tecnología de Big Data\n• HKU SPACE - Diploma Superior en Ciencia de Datos\n\n💪 Experiencia:\nIA/ML, Análisis de Datos, Optimización de Operaciones, Python, AWS, Liderazgo",
        ready: '¿Listo para conocer el viaje de Jason en IA y operaciones?',
        ask: '¡Pregúntame sobre los proyectos y logros de Jason!',
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
        techStackValue: 'HTML, CSS, JavaScript, AWS Q Developer, Kiro AI',
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
        hkustDegree: 'Licenciatura en Ingeniería Industrial y Gestión de Ingeniería',
        hkustMinor: 'Minor en Tecnología de Big Data',
        hkustPeriod: '2023 - Presente',
        hkustFYP: 'Proyecto Final: Métodos Eficientes Basados en Datos para Control de Inventario',
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
        contactTitle: 'Contáctate con Jason',
        contactIntro: '¿Interesado en soluciones impulsadas por IA, optimización de operaciones o proyectos de innovación?',
        contactEmail: 'Correo:',
        contactGitHub: 'GitHub:',
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
        chatTitle: 'Asistente IA de Jason',
        chatStatus: 'En línea • Listo para ayudar',
        suggestedQuestions: 'Preguntas Sugeridas:',
        suggestionAbout: 'Cuéntame sobre Jason',
        suggestionHackathon: 'AWS Hackathon',
        suggestionHaeco: 'Experiencia HAECO',
        suggestionFunFact: 'Dato curioso',
        suggestionTime: '¿Qué hora es?',
        suggestionChatTime: 'Tiempo de chat',
        inputPlaceholder: 'Pregúntame sobre Jason...',
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
        const months = Math.floor((coopEnd - coopStart) / (1000 * 60 * 60 * 24 * 30));
        return { type: 'coop_duration', value: '5 months', detail: 'September 2025 to January 2026' };
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
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
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
    const chosen = available[Math.floor(Math.random() * available.length)];
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
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
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
        "🏆 Jason的團隊在AWS人工智能黑客松香港2025中與130多支隊伍競爭。",
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
        "🏆 Jason的团队在AWS人工智能黑客松香港2025中与130多支队伍竞争。",
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
    return facts[Math.floor(Math.random() * facts.length)];
  }
  
  handleLoop(intent, snippets) {
    const variants = [
      `I notice you're asking about ${intent} again! 😊 Let me offer a different angle.`,
      `Testing my variety? 🎯 Here's another perspective on ${intent}!`,
      `You seem interested in ${intent}! Let me share something new.`
    ];
    return {
      text: this.pickVariant('loop', variants) + '\n\nTry: "Tell me about Techathon" or "What are Jason\'s skills?" or "Download CV"',
      actions: [],
      suggestions: ['Techathon details', 'Skills overview', 'Education background', 'Fun fact']
    };
  }

  init() {
    this.createChatUI();
    this.attachEvents();
    this.showWelcomeMessage();
  }

  createChatUI() {
    const chatHTML = `
      <button id="chatToggle" class="chat-toggle" title="Ask Jason AI">
        <span class="chat-icon">💬</span>
      </button>
      
      <div id="chatWindow" class="chat-window">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">👨‍💻</div>
            <div>
              <h3 id="chatTitle">${this.t('chatTitle')}</h3>
              <p class="chat-status" id="chatStatus">${this.t('chatStatus')}</p>
            </div>
          </div>
          <button id="chatClose" class="chat-close">×</button>
        </div>
        
        <div class="chat-suggestions" id="chatSuggestions">
          <p class="suggestions-title" id="suggestionsTitle">💡 ${this.t('suggestedQuestions')}</p>
          <button class="suggestion-chip" data-query="queryAbout" id="suggest1">${this.t('suggestionAbout')}</button>
          <button class="suggestion-chip" data-query="queryHackathon" id="suggest2">${this.t('suggestionHackathon')}</button>
          <button class="suggestion-chip" data-query="queryHaeco" id="suggest3">${this.t('suggestionHaeco')}</button>
          <button class="suggestion-chip" data-query="queryFunFact" id="suggest4">${this.t('suggestionFunFact')}</button>
          <button class="suggestion-chip" data-query="queryTime" id="suggest5">${this.t('suggestionTime')}</button>
          <button class="suggestion-chip" data-query="queryChatTime" id="suggest6">${this.t('suggestionChatTime')}</button>
        </div>
        
        <div class="chat-messages" id="chatMessages"></div>
        
        <div class="chat-input-area">
          <input type="text" id="chatInput" class="chat-input" placeholder="${this.t('inputPlaceholder')}" />
          <button id="chatSend" class="chat-send">
            <span>➤</span>
          </button>
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
    const window = document.getElementById('chatWindow');
    
    toggle.addEventListener('click', () => {
      window.classList.toggle('active');
      if (window.classList.contains('active')) {
        input.focus();
      }
    });
    
    close.addEventListener('click', () => {
      window.classList.remove('active');
    });
    
    send.addEventListener('click', () => this.handleSend());
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSend();
    });
    
    // Smart autocomplete
    input.addEventListener('input', (e) => this.handleAutocomplete(e));
    
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const queryKey = chip.dataset.query;
        const question = this.t(queryKey);
        document.getElementById('chatInput').value = question;
        this.handleSend();
      });
    });
  }

  handleSend() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    this.messageCount++;
    this.addMessage(message, 'user');
    input.value = '';
    
    document.getElementById('chatSuggestions').style.display = 'none';
    this.showTyping();
    
    setTimeout(() => {
      this.hideTyping();
      const response = this.generateResponse(message);
      this.addMessage(response.text, 'bot', response.actions, response.suggestions);
    }, 800);
  }

  generateResponse(message) {
    const msg = this.normalize(message);
    const snippets = this.retrieveSnippets(message);
    
    // Check for math calculation
    const mathResult = this.calculateMath(message);
    if (mathResult) {
      return {
        text: `🧮 **Calculator:**\n\n${mathResult.num1} ${mathResult.operator} ${mathResult.num2} = **${mathResult.result}**\n\n${this.t('anythingElse')}`,
        actions: [],
        suggestions: ['Tell me about Jason', 'Fun fact', 'What time is it?', 'Chat stats']
      };
    }
    
    // Check for date calculations
    const dateResult = this.calculateDateDiff(message);
    if (dateResult) {
      let text = '';
      if (dateResult.type === 'coop_duration') {
        text = `📅 **Co-op Duration:**\n\nJason's HAECO Co-op lasted **${dateResult.value}** (${dateResult.detail}).\n\n${this.t('anythingElse')}`;
      } else if (dateResult.type === 'days_until') {
        text = `📅 **Days Until ${dateResult.event}:**\n\n**${dateResult.value} days**\n\n${this.t('anythingElse')}`;
      } else if (dateResult.type === 'days_since') {
        text = `📅 **Days Since ${dateResult.event}:**\n\n**${dateResult.value} days ago**\n\n${this.t('anythingElse')}`;
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
    
    // Check for loop
    if (this.isLooping()) {
      return this.handleLoop(intent, snippets);
    }
    
    // Greeting responses
    if (intent === 'greeting') {
      const greetings = this.t('greeting');
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
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
      return {
        text: `🎉 **${this.t('funFact')}**\n\n${this.getRandomFunFact()}\n\n${this.t('anotherFact')}`,
        actions: [{ text: '🏆 Learn More About Jason', link: 'index.html' }],
        suggestions: ['Another fun fact', 'AWS Hackathon story', 'What time is it?', 'Chat stats']
      };
    }
    
    // Conversation time
    if (intent === 'chat_stats') {
      return {
        text: `⏱️ **${this.t('chatStats')}**\n\n• ${this.t('timeChatting')} **${this.getConversationTime()}**\n• ${this.t('messagesSent')} **${this.messageCount}**\n• ${this.t('started')} **${this.conversationStart.toLocaleTimeString()}**\n\n${this.t('keepAsking')}`,
        actions: [],
        suggestions: ['Tell me about Jason', 'AWS Hackathon', 'Fun fact', 'What time is it?']
      };
    }
    
    // Time and date queries
    if (intent === 'time_date') {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const greetings = this.t('greeting');
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
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
          text: `🏆 Taking you to the AWS Hackathon page...`,
          actions: [{ text: '🚀 View AWS Hackathon Project', link: 'hackathon.html' }],
          suggestions: ['Tell me about HAECO', 'What are his skills?', 'Fun fact']
        };
      }
      if (msg.includes('coop') || msg.includes('co-op')) {
        return {
          text: `🚀 Taking you to the HAECO Co-op page...`,
          actions: [{ text: '📅 View Co-op Experience', link: 'coop.html' }],
          suggestions: ['AWS Hackathon details', 'Education background', 'Projects']
        };
      }
      if (msg.includes('home') || msg.includes('main')) {
        return {
          text: `🏠 Taking you to the home page...`,
          actions: [{ text: '🏠 Go to Home', link: 'index.html' }],
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
      return {
        text: `🏆 **${this.t('hackathonTitle')}**\n\n${this.t('hackathonIntro')}\n\n✨ **${this.t('keyAchievements')}**\n• ${this.t('hackathonAch1')}\n• ${this.t('hackathonAch2')}\n• ${this.t('hackathonAch3')}\n• ${this.t('hackathonAch4')}\n\n🛠️ **${this.t('techStack')}** ${this.t('techStackValue')}\n\n💡 ${this.t('systemFeature')}`,
        actions: [
          { text: '📄 View Full Project Details', link: 'hackathon.html' },
          { text: '🎥 Watch Demo Video', link: 'hackathon.html#demo' }
        ],
        suggestions: ['HAECO Co-op experience', 'Techathon details', 'Skills', 'Fun fact']
      };
    }
    
    // HAECO Co-op queries
    if (intent === 'coop') {
      return {
        text: `🚀 **${this.t('coopTitle')}**\n\n${this.t('coopIntro')}\n\n🌟 **${this.t('majorAchievements')}**\n${this.t('coopAch1')}\n${this.t('coopAch2')}\n${this.t('coopAch3')}\n${this.t('coopAch4')}\n${this.t('coopAch5')}\n${this.t('coopAch6')}\n\n📊 **${this.t('keyProjects')}**\n• ${this.t('coopProj1')}\n• ${this.t('coopProj2')}\n• ${this.t('coopProj3')}\n• ${this.t('coopProj4')}\n• ${this.t('coopProj5')}`,
        actions: [
          { text: '📅 View 5-Month Timeline', link: 'coop.html' },
          { text: '📸 See Photos & Videos', link: 'coop.html' }
        ],
        suggestions: ['Techathon details', 'Lean Day MC', 'AWS Hackathon', 'Education']
      };
    }
    
    // Skills queries
    if (intent === 'skills') {
      return {
        text: `🛠️ **${this.t('skillsTitle')}**\n\n**💻 ${this.t('programmingData')}**\nPython, R, Octave, SQLite, SQL\n\n**🤖 ${this.t('aiTools')}**\nAWS Q Developer, Krio, OpenAI Codex, AutoML\n\n**🎨 ${this.t('creativeTools')}**\nMS Office, Canva, Adobe Creative Suite\n\n**🧠 ${this.t('softSkills')}**\n${this.t('softSkillsList')}\n\n**🌍 ${this.t('languagesSpoken')}**\n${this.t('languagesList')}`,
        actions: [{ text: '📋 View Full CV', link: 'index.html#skills' }],
        suggestions: ['Education background', 'Projects', 'Awards', 'Contact info']
      };
    }
    
    // Education queries
    if (intent === 'education') {
      return {
        text: `🎓 **${this.t('educationTitle')}**\n\n**Hong Kong University of Science and Technology (HKUST)**\n• ${this.t('hkustDegree')}\n• ${this.t('hkustMinor')}\n• ${this.t('hkustPeriod')}\n• ${this.t('hkustFYP')}\n\n**HKU SPACE Community College**\n• ${this.t('hkuDegree')}\n• ${this.t('hkuPeriod')}\n• ${this.t('hkuAwards')}\n• ${this.t('hkuLeadership')}`,
        actions: [{ text: '📚 View Education Details', link: 'index.html#education' }],
        suggestions: ['Skills overview', 'Projects', 'HAECO Co-op', 'Fun fact']
      };
    }
    
    // Projects queries
    if (intent === 'projects') {
      return {
        text: `🚀 **Featured Projects**\n\n**1. HAECO Bay Management System** 🏆\n• Grand Prize Winner - AWS AI Hackathon\n• AI-based aircraft bay scheduling\n• Built in 14 days\n\n**2. Inventory Control Research**\n• HKUST Final Year Project\n• JIT, Monte Carlo, AutoML, Multi-Agent Systems\n\n**3. Christmas Effects Study**\n• Data Science project analyzing livestock pricing\n\n**4. YouTube Database System**\n• SQLite database design and implementation`,
        actions: [
          { text: '🎯 View All Projects', link: 'index.html#projects' },
          { text: '🏆 AWS Hackathon Details', link: 'hackathon.html' }
        ],
        suggestions: ['AWS Hackathon story', 'Skills', 'Education', 'Contact']
      };
    }
    
    // Awards queries
    if (intent === 'awards') {
      return {
        text: `🏆 **Awards & Achievements**\n\n• **Grand Prize Winner** - AWS AI Hackathon Hong Kong 2025 (130+ teams)\n• **Master of Ceremony** - HAECO Lean Day 2025\n• **Lead Organizer** - HAECO Techathon 2026\n• **Academic Excellence Award** - HKU SPACE\n• **Principal's Honor List** - HKU SPACE\n• **Class Representative** - Data Science (80+ students)\n• **Certificate of Outstanding Achievement** - HAECO 2025`,
        actions: [{ text: '🌟 View All Achievements', link: 'index.html#awards' }],
        suggestions: ['AWS Hackathon details', 'HAECO Co-op', 'Education', 'Fun fact']
      };
    }
    
    // Contact queries
    if (intent === 'contact') {
      return {
        text: `📬 **Get in Touch with Jason**\n\nInterested in AI-driven solutions, operations optimization, or innovation projects?\n\n📧 **Email:** wcauyeungaa@connect.ust.hk\n💼 **Jason AU-YEUNG**\n💻 **GitHub:** github.com/jasonauyeungaa`,
        actions: [
          { text: '📧 Send Email', link: 'mailto:wcauyeungaa@connect.ust.hk' },
          { text: '💻 View GitHub', link: 'https://github.com/Jasonauyeungaa' }
        ],
        suggestions: ['Tell me about Jason', 'Skills', 'Projects', 'Fun fact']
      };
    }
    
    // Experience queries
    if (intent === 'experience') {
      return {
        text: `💼 **Professional Experience**\n\n**1. HAECO Co-op Intern** (Sep 2025 - Jan 2026)\n• Technology Innovation department\n• AI-driven solutions for operations\n• Won AWS Hackathon Grand Prize\n\n**2. HKUST ITSO Internship** (Feb 2026 - Jun 2026)\n• IT support and asset management\n\n**3. Speedy Group IT Support** (Jul 2021 - Present)\n• Part-time IT operations\n• Digital media production`,
        actions: [
          { text: '💼 View Full Experience', link: 'index.html#experience' },
          { text: '🚀 HAECO Co-op Details', link: 'coop.html' }
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
    return {
      text: `I'm Jason's AI assistant! 🤖\n\nI can help you learn about:\n\n• 🏆 **AWS Hackathon** - Grand Prize winning project\n• 🚀 **HAECO Co-op** - 5-month internship journey\n• 🛠️ **Skills** - Programming, AI tools, expertise\n• 🎓 **Education** - HKUST and HKU SPACE\n• 💼 **Experience** - Professional background\n• 🎉 **Fun Facts** - Interesting things about Jason\n• 📬 **Contact** - How to reach Jason\n• 🕐 **Time & Date** - Current time and day\n• ⏱️ **Chat Stats** - How long we've been talking`,
      actions: [],
      suggestions: ['Tell me about Jason', 'AWS Hackathon', 'Fun fact', 'What time is it?']
    };
  }

  addMessage(text, sender, actions = [], suggestions = []) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    let actionsHTML = '';
    if (actions.length > 0) {
      actionsHTML = '<div class="message-actions">' +
        actions.map(action => 
          `<a href="${action.link}" class="action-btn">${action.text}</a>`
        ).join('') +
        '</div>';
    }
    
    let suggestHTML = '';
    if (sender === 'bot' && suggestions.length > 0) {
      suggestHTML = '<div class="suggest-wrap">' +
        suggestions.map(q => `<button class="suggest-btn" data-q="${q}">${q}</button>`).join('') +
        '</div>';
    }
    
    messageDiv.innerHTML = `
      <div class="message-content">${formattedText.replace(/\n/g, '<br>')}</div>
      ${actionsHTML}
      ${suggestHTML}
    `;
    
    messagesDiv.appendChild(messageDiv);
    
    if (sender === 'bot') {
      messageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
      messageDiv.querySelectorAll('.suggest-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('chatInput').value = btn.dataset.q;
          this.handleSend();
        });
      });
    } else {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  showTyping() {
    const messagesDiv = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
        'What is Jason\'s GitHub?',
        'Download Jason\'s CV'
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
        'Jason的GitHub是什麼？',
        '下載Jason的履歷'
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
        'Jason的GitHub是什么？',
        '下载Jason的履历'
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
        'Descargar CV de Jason'
      ]
    };
    
    const langQueries = queries[this.currentLang] || queries.en;
    return langQueries.filter(q => q.toLowerCase().includes(input)).slice(0, 5);
  }
  
  showAutocomplete(suggestions) {
    let dropdown = document.getElementById('autocompleteDropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'autocompleteDropdown';
      dropdown.className = 'autocomplete-dropdown';
      document.querySelector('.chat-input-area').appendChild(dropdown);
    }
    
    dropdown.innerHTML = suggestions.map(s => 
      `<div class="autocomplete-item" data-text="${s}">${s}</div>`
    ).join('');
    
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        document.getElementById('chatInput').value = item.dataset.text;
        this.hideAutocomplete();
        this.handleSend();
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
      const greetings = this.t('greeting');
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      const funFact = this.getRandomFunFact();
      this.addMessage(
        `${greeting}! 👋 ${this.t('intro')}\n\n${this.t('ready')}\n\n🎉 **${this.t('funFact')}**\n${funFact}\n\n💡 ${this.t('askAnything')}`,
        'bot'
      );
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
