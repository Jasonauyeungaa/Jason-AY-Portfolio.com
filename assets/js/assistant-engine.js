(() => {
  class PortfolioDomContext {
    constructor({ page } = {}) {
      this.page = page || document.body?.dataset.page || 'home';
    }

    normalize(text = '') {
      return text
        .toLowerCase()
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    getMain() {
      return document.querySelector('main');
    }

    getSections() {
      return Array.from(document.querySelectorAll('main section[id]'));
    }

    getSection(sectionId) {
      if (!sectionId) return null;
      return document.getElementById(sectionId);
    }

    getSectionTitle(sectionOrId) {
      const section = typeof sectionOrId === 'string' ? this.getSection(sectionOrId) : sectionOrId;
      if (!section) return '';

      const heading = section.querySelector('h1, h2, h3');
      return heading?.textContent?.replace(/\s+/g, ' ').trim() || '';
    }

    getNodeText(node) {
      return node?.textContent?.replace(/\s+/g, ' ').trim() || '';
    }

    containsCjk(text = '') {
      return /[\u3400-\u9fff]/u.test(text);
    }

    formatDetailText(label = '', value = '') {
      const cleanLabel = label.replace(/[：:]\s*$/, '').trim();
      const separator = label.includes('：') ? '：' : ':';
      return cleanLabel && value ? `${cleanLabel}${separator} ${value}` : '';
    }

    getEducationDetailPriority(label = '') {
      const norm = this.normalize(label);
      if (!norm) return 99;
      if (/(minor|副修)/.test(norm)) return 1;
      if (/(final year project|fyp|畢業專題|毕业专题)/.test(norm)) return 2;
      if (/(projects|project|項目|项目)/.test(norm)) return 3;
      if (/(awards|award|honou|honor|獎項|奖项|獎|奖)/.test(norm)) return 4;
      if (/(leadership|class representative|領導|领导|代表)/.test(norm)) return 5;
      if (/(methodologies|methodology|methods|方法)/.test(norm)) return 6;
      if (/(courses|course|課程|课程)/.test(norm)) return 7;
      return 8;
    }

    collectEducationCards(section, mode = 'normal') {
      if (!section) return [];

      return Array.from(section.querySelectorAll('.education-card')).map((card) => {
        const title = this.getNodeText(card.querySelector('h3'));
        const degree = this.getNodeText(card.querySelector('.edu-degree'));
        const period = this.getNodeText(card.querySelector('.edu-period'));
        const detailRoot = card.querySelector('.edu-details');
        const children = detailRoot ? Array.from(detailRoot.children) : [];
        const details = [];
        const seen = new Set();

        children.forEach((child, index) => {
          if (child.tagName !== 'P') return;

          const labelNode = child.querySelector('strong');
          const valueNode = child.querySelector('span');
          const label = this.getNodeText(labelNode);
          const value = this.getNodeText(valueNode);

          if (label && value) {
            const text = this.formatDetailText(label, value);
            if (text && !seen.has(text)) {
              seen.add(text);
              details.push({
                label,
                text,
                priority: this.getEducationDetailPriority(label)
              });
            }
            return;
          }

          if (!label) return;

          const next = children[index + 1];
          if (next?.tagName !== 'UL') return;

          const listItems = Array.from(next.querySelectorAll('li'))
            .map((node) => this.getNodeText(node))
            .filter(Boolean)
            .slice(0, mode === 'short' ? 1 : 2);

          if (!listItems.length) return;

          const joiner = this.containsCjk(label) ? '、' : ' / ';
          const text = this.formatDetailText(label, listItems.join(joiner));

          if (text && !seen.has(text)) {
            seen.add(text);
            details.push({
              label,
              text,
              priority: this.getEducationDetailPriority(label)
            });
          }
        });

        details.sort((a, b) => a.priority - b.priority);

        return {
          title,
          degree,
          period,
          details
        };
      }).filter((card) => card.title || card.degree);
    }

    buildEducationSummary(section, mode = 'normal') {
      const title = this.getSectionTitle(section);
      const cards = this.collectEducationCards(section, mode);
      const highlights = cards
        .flatMap((card) => card.details.slice(0, mode === 'short' ? 1 : 2).map((detail) => detail.text))
        .slice(0, mode === 'short' ? 2 : 4);

      return {
        sectionId: 'education',
        title,
        paragraphs: [],
        tags: [],
        highlights,
        cards,
        url: `${window.location.pathname.split('/').pop() || ''}#education`
      };
    }

    collectTeamCards(section, mode = 'normal') {
      if (!section) return [];

      return Array.from(section.querySelectorAll('.team-focus-copy[data-team-member]'))
        .map((card) => {
          const title = this.getNodeText(card.querySelector('.team-name'));
          const role = this.getNodeText(card.querySelector('.team-main-role strong'));
          const summary = this.getNodeText(card.querySelector('.team-focus-summary'));
          const contributions = Array.from(card.querySelectorAll('.team-details li'))
            .map((node) => this.getNodeText(node))
            .filter(Boolean)
            .slice(0, mode === 'short' ? 1 : 2)
            .map((text) => ({ text }));

          const details = [];

          if (summary) {
            details.push({ text: summary });
          }

          contributions.forEach((item) => {
            if (!details.some((detail) => detail.text === item.text)) {
              details.push(item);
            }
          });

          return {
            title,
            degree: role,
            period: '',
            details
          };
        })
        .filter((card) => card.title);
    }

    buildTeamSummary(section, mode = 'normal') {
      const title = this.getSectionTitle(section);
      const cards = this.collectTeamCards(section, mode);
      const highlights = cards.map((card) => card.title).filter(Boolean);

      return {
        sectionId: 'team',
        title,
        paragraphs: [],
        tags: [],
        highlights,
        cards,
        url: `${window.location.pathname.split('/').pop() || ''}#team`
      };
    }

    collectParagraphs(root, limit = 3) {
      if (!root) return [];
      return Array.from(root.querySelectorAll('p'))
        .map((node) => node.textContent.replace(/\s+/g, ' ').trim())
        .filter((text) => text.length >= 50)
        .slice(0, limit);
    }

    collectListItems(root, limit = 4) {
      if (!root) return [];
      return Array.from(root.querySelectorAll('li'))
        .map((node) => node.textContent.replace(/\s+/g, ' ').trim())
        .filter((text) => text.length >= 12)
        .slice(0, limit);
    }

    collectCardHighlights(root, limit = 3) {
      if (!root) return [];

      const selector = [
        '.award-card h3',
        '.timeline-item h3',
        '.highlight-card h3',
        '.solution-card h3',
        '.feature-item h3',
        '.month-section h3',
        '.task-item h5',
        '.skill-category h3',
        '.policy-card h2',
        '.team-step h3',
        '.rail-card strong',
        '.home-snapshot-item .metric-label',
        '.contact-panel-title',
        '.contact-support-title',
        '.contact-form-heading h3'
      ].join(', ');

      const seen = new Set();
      return Array.from(root.querySelectorAll(selector))
        .map((node) => node.textContent.replace(/\s+/g, ' ').trim())
        .filter((text) => {
          if (!text || text.length < 3 || seen.has(text)) return false;
          seen.add(text);
          return true;
        })
        .slice(0, limit);
    }

    collectTagHighlights(root, limit = 6) {
      if (!root) return [];

      const selector = [
        '.skill-category .tag',
        '.timeline-tags .tag',
        '.award-tags .tag',
        '.challenge-item h4',
        '.feature-list li',
        '.media-chip',
        '.media-caption',
        '.cert-list li',
        '.contact-support-list li'
      ].join(', ');

      const seen = new Set();
      return Array.from(root.querySelectorAll(selector))
        .map((node) => node.textContent.replace(/\s+/g, ' ').trim())
        .filter((text) => {
          if (!text || text.length < 2 || seen.has(text)) return false;
          seen.add(text);
          return true;
        })
        .slice(0, limit);
    }

    buildSectionSummary(sectionId, mode = 'normal') {
      const section = this.getSection(sectionId);
      if (!section) return null;

      if (sectionId === 'education') {
        return this.buildEducationSummary(section, mode);
      }

      if (sectionId === 'team') {
        return this.buildTeamSummary(section, mode);
      }

      const title = this.getSectionTitle(section);
      const paragraphs = this.collectParagraphs(section, mode === 'short' ? 1 : 2);
      const listItems = this.collectListItems(section, mode === 'short' ? 2 : 3);
      const cards = this.collectCardHighlights(section, mode === 'short' ? 2 : 3);
      const tags = this.collectTagHighlights(section, mode === 'short' ? 3 : 6);

      const highlights = [];
      cards.forEach((item) => {
        if (!highlights.includes(item)) highlights.push(item);
      });
      listItems.forEach((item) => {
        if (!highlights.includes(item)) highlights.push(item);
      });
      tags.forEach((item) => {
        if (!highlights.includes(item)) highlights.push(item);
      });

      return {
        sectionId,
        title,
        paragraphs,
        tags,
        highlights: highlights.slice(0, mode === 'short' ? 2 : 4),
        url: `${window.location.pathname.split('/').pop() || ''}#${sectionId}`
      };
    }

    buildPageSummary(mode = 'normal') {
      const main = this.getMain();
      if (!main) return null;

      const pageHeading = main.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()
        || document.title.replace(/\s+/g, ' ').trim();

      const sections = this.getSections();
      const firstParagraphs = [];
      const highlights = [];

      sections.slice(0, mode === 'short' ? 4 : 6).forEach((section) => {
        const title = this.getSectionTitle(section);
        if (title && !highlights.includes(title)) {
          highlights.push(title);
        }
      });

      this.collectParagraphs(main, mode === 'short' ? 1 : 3).forEach((text) => {
        if (!firstParagraphs.includes(text)) firstParagraphs.push(text);
      });

      return {
        title: pageHeading,
        paragraphs: firstParagraphs,
        highlights,
        url: window.location.pathname.split('/').pop() || ''
      };
    }
  }

  class JasonAssistantEngine {
    constructor({ page, domContext } = {}) {
      this.page = page || document.body?.dataset.page || 'home';
      this.domContext = domContext || new PortfolioDomContext({ page: this.page });
      this.entries = [];
      this.entryIndex = [];
      this.suggestedQueries = {};
      this.memory = {
        lastEntries: [],
        lastMode: 'normal',
        lastQuery: '',
        lastSectionId: null
      };
    }

    setKnowledge(data = {}) {
      this.entries = Array.isArray(data.entries) ? data.entries.slice() : [];
      this.suggestedQueries = data.suggestedQueries || {};
      this.entryIndex = this.entries.map((entry) => ({
        entry,
        haystack: this.normalize([
          entry.title,
          entry.summary_short,
          entry.summary_long,
          ...(entry.facts || []),
          ...(entry.keywords || []),
          ...(entry.aliases || [])
        ].join(' ')),
        tokens: this.tokenize([
          entry.title,
          entry.summary_short,
          entry.summary_long,
          ...(entry.facts || []),
          ...(entry.keywords || []),
          ...(entry.aliases || [])
        ].join(' '))
      }));
    }

    getCopy(lang = 'en') {
      const copy = {
        en: {
          sectionSummary: 'Section Summary',
          pageSummary: 'Page Summary',
          assistantIntroTitle: 'About Jason Bot',
          quickTake: 'Quick take',
          keyPoints: 'Key points',
          relatedLinks: 'Open related section',
          sectionSummaryLead: 'Here is the quick read of the part you are on.',
          sectionHighlightsLead: 'This section focuses on',
          basedOnCurrentSection: 'I kept this answer tied to the section currently on screen.',
          basedOnCurrentPage: 'I kept this answer tied to the page you are viewing.',
          askNext: 'You can also ask:',
          noMatch: "I'm not fully sure which part you mean yet. Did you want Jason's HAECO work, the hackathon project, skills, education, awards, experience, contact details, or a summary of this page or section?",
          promptQuestion: 'Want the 20-second summary of',
          promptAction: 'Summarize this section',
          pagePromptQuestion: 'Want the quick summary of this page?',
          pagePromptAction: 'Summarize this page',
          assistantIntro: "I'm the portfolio assistant for Jason Au-Yeung. I answer from the content on this site, summarize sections, and help people quickly understand his projects, HAECO experience, skills, education, awards, and contact details.",
          assistantFollowup: 'Try asking about HAECO, the hackathon project, skills, education, or the section you are looking at now.',
          openPage: 'Open page',
          openSection: 'Open section'
        },
        'zh-TW': {
          sectionSummary: '部分摘要',
          pageSummary: '頁面摘要',
          quickTake: '重點摘要',
          keyPoints: '重點',
          relatedLinks: '打開相關部分',
          sectionSummaryLead: '以下是你目前看到這部分的快速整理。',
          sectionHighlightsLead: '這個部分主要在講',
          basedOnCurrentSection: '我把回答聚焦在你目前螢幕上的這一部分。',
          basedOnCurrentPage: '我把回答聚焦在你目前正在看的頁面。',
          askNext: '你也可以問：',
          noMatch: '我未完全確定你想問哪一部分。你是想問 Jason 的黑客松、港機 Co-op、項目、技能、教育、獎項、經驗、聯絡資訊，還是目前頁面或這個部分的摘要？',
          promptQuestion: '想看這個部分的 20 秒摘要嗎：',
          promptAction: '總結這個部分',
          pagePromptQuestion: '想看這一頁的快速摘要嗎？',
          pagePromptAction: '總結這一頁',
          openPage: '打開頁面',
          openSection: '打開部分'
        },
        'zh-CN': {
          sectionSummary: '部分摘要',
          pageSummary: '页面摘要',
          quickTake: '重点摘要',
          keyPoints: '重点',
          relatedLinks: '打开相关部分',
          sectionSummaryLead: '下面是你现在看到这一部分的快速整理。',
          sectionHighlightsLead: '这部分主要在讲',
          basedOnCurrentSection: '我把回答聚焦在你现在屏幕上的这一部分。',
          basedOnCurrentPage: '我把回答聚焦在你当前正在看的页面。',
          askNext: '你也可以问：',
          noMatch: '我还不太确定你想问哪一部分。你是想问 Jason 的黑客松、港机 Co-op、项目、技能、教育、奖项、经验、联络信息，还是当前页面或这个部分的摘要？',
          promptQuestion: '想看这个部分的 20 秒摘要吗：',
          promptAction: '总结这个部分',
          pagePromptQuestion: '想看这一页的快速摘要吗？',
          pagePromptAction: '总结这一页',
          openPage: '打开页面',
          openSection: '打开部分'
        },
        es: {
          sectionSummary: 'Resumen de la seccion',
          pageSummary: 'Resumen de la pagina',
          quickTake: 'Resumen rapido',
          keyPoints: 'Puntos clave',
          relatedLinks: 'Abrir seccion relacionada',
          sectionSummaryLead: 'Aqui tienes la lectura rapida de la parte que estas viendo.',
          sectionHighlightsLead: 'Esta seccion se centra en',
          basedOnCurrentSection: 'Mantengo esta respuesta enfocada en la seccion que tienes en pantalla.',
          basedOnCurrentPage: 'Mantengo esta respuesta enfocada en la pagina que estas viendo.',
          askNext: 'Tambien puedes preguntar:',
          noMatch: 'Todavia no estoy totalmente seguro de que parte quieres decir. Quieres preguntar por el hackathon, el Co-op en HAECO, proyectos, habilidades, educacion, premios, experiencia, contacto o un resumen de esta pagina o seccion?',
          promptQuestion: 'Quieres el resumen de 20 segundos de',
          promptAction: 'Resume esta seccion',
          pagePromptQuestion: 'Quieres el resumen rapido de esta pagina?',
          pagePromptAction: 'Resume esta pagina',
          openPage: 'Abrir pagina',
          openSection: 'Abrir seccion'
        }
      };

      return copy[lang] || copy.en;
    }

    normalize(text = '') {
      return text
        .toLowerCase()
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    tokenize(text = '') {
      return (this.normalize(text).match(/[\p{L}\p{N}]+/gu) || [])
        .filter((token) => token.length > 1);
    }

    unique(items) {
      return Array.from(new Set(items.filter(Boolean)));
    }

    getDefaultSuggestions(lang = 'en', limit = 4) {
      return this.unique(this.suggestedQueries[lang] || this.suggestedQueries.en || []).slice(0, limit);
    }

    joinList(items = [], lang = 'en') {
      const values = this.unique(items);
      if (values.length <= 1) return values[0] || '';
      if (values.length === 2) {
        const connector = lang === 'es' ? ' y ' : (lang === 'zh-TW' || lang === 'zh-CN' ? '、' : ' and ');
        return values.join(connector);
      }

      const last = values[values.length - 1];
      const leading = values.slice(0, -1);

      if (lang === 'zh-TW' || lang === 'zh-CN') {
        return `${leading.join('、')}、${last}`;
      }

      const tail = lang === 'es' ? ` y ${last}` : `, and ${last}`;
      return `${leading.join(', ')}${tail}`;
    }

    composeHighlightSentence(summary, lang = 'en') {
      const copy = this.getCopy(lang);
      const items = this.unique([
        ...(summary?.highlights || []),
        ...(summary?.tags || [])
      ]).slice(0, 4);

      if (!items.length) return '';
      return `${copy.sectionHighlightsLead} ${this.joinList(items, lang)}.`;
    }

    buildSectionSuggestions(sectionId, lang = 'en', summary = null) {
      const copy = this.getCopy(lang);
      const title = summary?.title || sectionId;
      const dynamicPrompt = {
        en: `Tell me about the ${title} section`,
        'zh-TW': `告訴我「${title}」這部分的重點`,
        'zh-CN': `告诉我“${title}”这部分的重点`,
        es: `Cuéntame sobre la sección "${title}"`
      };
      const promptCatalog = this.getPromptCatalog(lang);
      const sectionPrompts = promptCatalog[sectionId] || [];

      return this.unique([
        dynamicPrompt[lang] || dynamicPrompt.en,
        ...sectionPrompts.map((prompt) => prompt.query),
        copy.pagePromptAction,
        ...(this.suggestedQueries[lang] || this.suggestedQueries.en || [])
      ]).slice(0, 4);
    }

    getSharedIdlePrompts(summary, lang = 'en') {
      const title = summary?.title || '';
      const prompts = {
        en: [
          { label: 'Ask me anything', question: `Want the quick version of ${title}?`, query: 'Summarize this section' },
          { label: 'Anything I can do?', question: 'Anything I can do for you here?', query: 'Summarize this section' },
          { label: 'Need a hand?', question: 'You can ask me anything about this part.', query: 'Tell me about this section' }
        ],
        'zh-TW': [
          { label: '隨便問我', question: `想快速了解「${title}」嗎？`, query: '總結這個部分' },
          { label: '需要我幫忙嗎？', question: '這裡有什麼想讓我解釋的嗎？', query: '總結這個部分' },
          { label: '我可以幫你', question: '你可以直接問我這部分的內容。', query: '告訴我這個部分的重點' }
        ],
        'zh-CN': [
          { label: '随便问我', question: `想快速了解“${title}”吗？`, query: '总结这个部分' },
          { label: '需要我帮忙吗？', question: '这里有什么想让我解释的吗？', query: '总结这个部分' },
          { label: '我可以帮你', question: '你可以直接问我这部分的内容。', query: '告诉我这个部分的重点' }
        ],
        es: [
          { label: 'Preguntame algo', question: `Quieres la version rapida de ${title}?`, query: 'Resume esta seccion' },
          { label: 'Puedo ayudar?', question: 'Hay algo de esta parte que quieras que explique?', query: 'Resume esta seccion' },
          { label: 'Estoy aqui', question: 'Puedes preguntarme cualquier cosa sobre esta seccion.', query: 'Cuentame sobre esta seccion' }
        ]
      };

      return prompts[lang] || prompts.en;
    }

    getPromptCatalog(lang = 'en') {
      const catalog = {
        en: {
          home: [
            { label: 'Start here', question: "Want the quick version of who Jason is?", query: 'Tell me about Jason' },
            { label: 'Did you know?', question: 'Did you know Jason combines IEEM, big data, and hands-on HAECO project work in one story?', query: 'Tell me about Jason' }
          ],
          awards: [
            { label: 'Awards', question: 'This is where the big wins are. Want the short breakdown?', query: 'What awards has Jason won?' },
            { label: 'Did you know?', question: 'Did you know the AWS hackathon result is the headline achievement here?', query: 'Why did the hackathon project win?' }
          ],
          experience: [
            { label: 'Experience', question: 'Want the short version of Jason’s work experience so far?', query: "What is Jason's experience?" },
            { label: 'Did you know?', question: 'HAECO is the main work story in this portfolio. Want the key highlights?', query: 'What did Jason do at HAECO?' }
          ],
          projects: [
            { label: 'Projects', question: 'Not sure where to start? I can point out the most important project first.', query: 'What projects should I look at first?' },
            { label: 'Did you know?', question: 'The Bay Management System is the flagship project here. Want the plain-English version?', query: 'What is the Bay Management System?' }
          ],
          education: [
            { label: 'Education', question: 'Want the short version of Jason’s academic background?', query: "What is Jason's education background?" },
            { label: 'Did you know?', question: 'This section ties engineering, data, and his final-year project together. Want the summary?', query: 'Summarize this section' }
          ],
          skills: [
            { label: 'Skills', question: 'Want the focused breakdown of Jason’s technical and soft skills?', query: "What are Jason's skills?" },
            { label: 'Did you know?', question: 'His skills mix programming, AI tools, and operations thinking. Want the quick version?', query: 'Summarize this section' }
          ],
          contact: [
            { label: 'Contact', question: 'Want the quickest way to send Jason a message?', query: 'How can I contact Jason?' },
            { label: 'Did you know?', question: 'This section now centers on the message form and CV. Want the short version?', query: 'Summarize this section' }
          ],
          overview: [
            { label: 'HAECO Co-op', question: 'Want the quick story of Jason’s five months at HAECO?', query: 'What did Jason do at HAECO?' },
            { label: 'Did you know?', question: 'This whole page is basically the HAECO chapter of the portfolio. Want the summary?', query: 'Summarize this page' }
          ],
          highlights: [
            { label: 'Highlights', question: 'This section has the biggest HAECO moments. Want the short version?', query: 'What did Jason do at HAECO?' },
            { label: 'Did you know?', question: 'The hackathon win, Techathon, and Lean Day all connect here. Want me to tie them together?', query: 'Summarize this section' }
          ],
          timeline: [
            { label: 'Timeline', question: 'Want the internship story month by month, without reading the whole timeline?', query: 'Summarize the timeline section' },
            { label: 'Did you know?', question: 'This is where you can see how the work built up over five months. Want the condensed version?', query: 'Summarize this section' }
          ],
          gallery: [
            { label: 'Gallery', question: 'These photos make more sense with context. Want the story behind them?', query: "What's the story behind these photos?" },
            { label: 'Did you know?', question: 'The gallery ties together hackathon, Techathon, Lean Day, and re:Invent moments.', query: 'Summarize this section' }
          ],
          learnings: [
            { label: 'Takeaways', question: 'Want the main things Jason took away from the internship?', query: 'What did Jason learn from HAECO?' },
            { label: 'Did you know?', question: 'This section is more about growth than tasks. Want the quick read?', query: 'Summarize this section' }
          ],
          award: [
            { label: 'Grand Prize', question: 'Want the simple version of why this project won?', query: 'Why did the hackathon project win?' },
            { label: 'Did you know?', question: 'This page starts with the result, but the real story is how the project solved the bay assignment problem.', query: 'What is the Bay Management System?' }
          ],
          challenge: [
            { label: 'The problem', question: 'Want the bay assignment problem explained without the jargon?', query: 'What was the challenge?' },
            { label: 'Did you know?', question: 'The challenge here is not just scheduling, it is handling constraints and constant changes.', query: 'Summarize this section' }
          ],
          solution: [
            { label: 'The solution', question: 'Want the plain-English explanation of how this system works?', query: 'What is the Bay Management System?' },
            { label: 'Did you know?', question: 'This section is the core of the project. Want the feature-by-feature version?', query: 'What are the key features?' }
          ],
          demo: [
            { label: 'Demo', question: 'Want context before you watch the demo?', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'The three-minute demo was a big part of communicating the product clearly.', query: 'Who made the demo video?' }
          ],
          features: [
            { label: 'Features', question: 'Want the short version of what the product can actually do?', query: 'What are the key features?' },
            { label: 'Did you know?', question: 'This is where the project turns from concept into a usable tool.', query: 'Summarize this section' }
          ],
          details: [
            { label: 'Details', question: 'Want the quick version of the hackathon timeline, requirements, and judging rules?', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This section gives the competition format, submission rules, and scale at a glance.', query: 'Tell me about this section' }
          ],
          media: [
            { label: 'Impact', question: 'Want the quick version of the interviews and public visibility?', query: 'What impact did the project have?' },
            { label: 'Did you know?', question: 'The project reached re:Invent after the competition. Want that story?', query: 'Tell me about re:Invent' }
          ],
          reflection: [
            { label: 'Reflection', question: 'Want the main takeaways from this project, not just the result?', query: 'What are the main takeaways?' },
            { label: 'Did you know?', question: 'This section explains what the project says about Jason’s way of working.', query: 'Summarize this section' }
          ]
        }
      };

      return catalog[lang] || catalog.en;
    }

    getIdlePromptCatalog(lang = 'en') {
      const catalog = {
        en: {
          default: [
            { label: 'Need a hand?', question: 'Anything here you want me to explain?', query: 'Summarize this section' },
            { label: 'If you want', question: 'I can break this part down for you.', query: 'Summarize this section' },
            { label: 'Did anything stand out?', question: 'If something here caught your eye, ask me about it.', query: 'Tell me about this section' }
          ],
          home: [
            { label: 'Need a hand?', question: 'Want a quick intro to Jason before you keep scrolling?', query: 'Tell me about Jason' },
            { label: 'If you want', question: 'I can give you the short version of this whole page.', query: 'Summarize this page' },
            { label: 'Did you know?', question: 'Did you know Jason’s profile connects HKUST engineering, HAECO experience, and the AWS hackathon win?', query: 'Tell me about Jason' }
          ],
          awards: [
            { label: 'Need a hand?', question: 'Want me to explain which award matters most here?', query: 'What awards has Jason won?' },
            { label: 'If you want', question: 'I can connect these awards back to the hackathon and HAECO story.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'The AWS result is the one most people ask about first.', query: 'Why did the hackathon project win?' }
          ],
          experience: [
            { label: 'Need a hand?', question: 'Want the short version of Jason’s work experience?', query: "What is Jason's experience?" },
            { label: 'If you want', question: 'I can tell you which role had the biggest impact.', query: 'What did Jason do at HAECO?' },
            { label: 'Did you know?', question: 'HAECO is the main experience story behind a lot of the portfolio.', query: 'What did Jason do at HAECO?' }
          ],
          projects: [
            { label: 'Need a hand?', question: 'Want help picking which project to open first?', query: 'What projects should I look at first?' },
            { label: 'If you want', question: 'I can give you the plain-English version of the flagship project.', query: 'What is the Bay Management System?' },
            { label: 'Did you know?', question: 'The Bay Management System is usually the best place to start here.', query: 'What is the Bay Management System?' }
          ],
          education: [
            { label: 'Need a hand?', question: 'Want the short version of Jason’s academic background?', query: "What is Jason's education background?" },
            { label: 'If you want', question: 'I can connect this section to his final-year project and skills.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This section explains why the portfolio leans so hard into data and systems.', query: 'Summarize this section' }
          ],
          skills: [
            { label: 'Need a hand?', question: 'Want the focused breakdown of Jason’s skills?', query: "What are Jason's skills?" },
            { label: 'If you want', question: 'I can separate the programming, AI, and soft-skill parts for you.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This section mixes technical tools with operations thinking, not just software skills.', query: 'Summarize this section' }
          ],
          contact: [
            { label: 'Need a hand?', question: 'Need the fastest way to contact Jason?', query: 'How can I contact Jason?' },
            { label: 'If you want', question: 'I can point you to the contact form or the CV.', query: 'How can I contact Jason?' },
            { label: 'Did you know?', question: 'The fastest route here is the on-site message form.', query: 'How can I contact Jason?' }
          ],
          overview: [
            { label: 'Need a hand?', question: 'Want the quick story of Jason’s time at HAECO?', query: 'What did Jason do at HAECO?' },
            { label: 'If you want', question: 'I can turn this page into a 30-second summary.', query: 'Summarize this page' },
            { label: 'Did you know?', question: 'This page ties together the hackathon, Techathon, Lean Day, and internship work.', query: 'Summarize this page' }
          ],
          highlights: [
            { label: 'Need a hand?', question: 'Want me to connect these highlights into one story?', query: 'What did Jason do at HAECO?' },
            { label: 'If you want', question: 'I can explain which highlight matters most and why.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'A lot of the portfolio’s strongest moments all pass through this section.', query: 'Summarize this section' }
          ],
          timeline: [
            { label: 'Need a hand?', question: 'Want the month-by-month story without opening every part?', query: 'Summarize the timeline section' },
            { label: 'If you want', question: 'I can compress this whole timeline into the main milestones.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This is the best place to see how the internship actually unfolded over time.', query: 'Summarize this section' }
          ],
          gallery: [
            { label: 'Need a hand?', question: 'Want the context behind what you’re seeing in these photos?', query: "What's the story behind these photos?" },
            { label: 'If you want', question: 'I can explain how the gallery connects to the written story.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'These images cover more than one event, not just the hackathon.', query: 'Summarize this section' }
          ],
          learnings: [
            { label: 'Need a hand?', question: 'Want the main takeaways from this part?', query: 'What did Jason learn from HAECO?' },
            { label: 'If you want', question: 'I can turn this section into the short reflective version.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This section is more about growth and judgment than a task list.', query: 'Summarize this section' }
          ],
          award: [
            { label: 'Need a hand?', question: 'Want the simple reason this project won?', query: 'Why did the hackathon project win?' },
            { label: 'If you want', question: 'I can explain what made the result impressive without the buzzwords.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'The headline result is only half the story, the real value is in the problem it solved.', query: 'What is the Bay Management System?' }
          ],
          challenge: [
            { label: 'Need a hand?', question: 'Want the challenge explained in plain language?', query: 'What was the challenge?' },
            { label: 'If you want', question: 'I can translate the bay assignment problem into a simple example.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This problem is harder than it looks because it changes in real time.', query: 'Summarize this section' }
          ],
          solution: [
            { label: 'Need a hand?', question: 'Want the simple version of how this system works?', query: 'What is the Bay Management System?' },
            { label: 'If you want', question: 'I can break the solution into problem, method, and output.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This section is the core of the whole project story.', query: 'What are the key features?' }
          ],
          demo: [
            { label: 'Need a hand?', question: 'Want the context before you watch the demo?', query: 'Summarize this section' },
            { label: 'If you want', question: 'I can tell you what the demo is meant to show.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'The demo helped make the product understandable fast.', query: 'Who made the demo video?' }
          ],
          features: [
            { label: 'Need a hand?', question: 'Want the short version of the most important features?', query: 'What are the key features?' },
            { label: 'If you want', question: 'I can separate the practical features from the nice-to-have ones.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This is where the project really stops being an idea and starts looking like a product.', query: 'Summarize this section' }
          ],
          details: [
            { label: 'Need a hand?', question: 'Want the hackathon rules, timing, and scale in one quick summary?', query: 'Summarize this section' },
            { label: 'If you want', question: 'I can pull the timeline, requirements, and judging criteria into one short answer.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This section shows the official competition setup, not just Jason’s project outcome.', query: 'Tell me about this section' }
          ],
          media: [
            { label: 'Need a hand?', question: 'Want the quick story of the interviews and visibility?', query: 'What impact did the project have?' },
            { label: 'If you want', question: 'I can explain why the project kept getting attention after the competition.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'The project made it all the way to re:Invent after the win.', query: 'Tell me about re:Invent' }
          ],
          reflection: [
            { label: 'Need a hand?', question: 'Want the main takeaway from this reflection section?', query: 'What are the main takeaways?' },
            { label: 'If you want', question: 'I can turn this into the short “what this project says about Jason” version.', query: 'Summarize this section' },
            { label: 'Did you know?', question: 'This section matters because it shows judgment, not just output.', query: 'Summarize this section' }
          ]
        }
      };

      return catalog[lang] || catalog.en;
    }

    isSmallTalk(norm) {
      return /^(hi|hello|hey|hola|你好|您好|早安|午安|晚安|thanks|thank you|謝謝|谢谢|多謝|gracias|bye|goodbye|再見|再见|adios)$/.test(norm);
    }

    isUtilityQuery(norm) {
      return /(^time$|^date$|^clock$|what time|current time|time now|what day|what date|today s date|today date|chat stats|conversation time|聊天時間|聊天时间|幾點|几点|現在幾點|现在几点|幾號|几号|日期|時間|时间|qué hora|hora actual|fecha)/.test(norm);
    }

    detectMode(norm) {
      if (/(short|brief|quick|tl dr|tldr|簡短|简短|快速|short version|版本短|resumen corto|breve)/.test(norm)) {
        return 'short';
      }
      if (/(detail|detailed|more|tell me more|expand|technical|how does|why did|deeper|詳細|详细|更多|技術|技术|mas detalle|detallado)/.test(norm)) {
        return 'detailed';
      }
      return 'normal';
    }

    detectSummaryIntent(norm) {
      if (/(summarize|summary|overview|what is this page about|quick summary|what is this|what am i looking at|what happened here|總結|总结|摘要|概覽|概览|resume|resumen)/.test(norm)) {
        if (/(section|this section|part|here|this area|部分|這個部分|这个部分|呢部分|本部分|seccion)/.test(norm)) {
          return 'section_summary';
        }
        if (/(page|this page|portfolio|頁面|页面|這一頁|这一页|本頁|本页|呢頁|呢页|pagina)/.test(norm)) {
          return 'page_summary';
        }
      }
      return null;
    }

    detectSectionFocusIntent(norm) {
      return /(tell me about this section|tell me about the .+ section|告訴我這個部分的重點|告訴我「.+」這部分的重點|告诉我这个部分的重点|告诉我“.+”这部分的重点|cuentame sobre esta seccion|cuentame sobre la seccion ".+"|cuéntame sobre esta sección|cuéntame sobre la sección ".+")/.test(norm);
    }

    isFollowUp(norm) {
      return /(tell me more|more detail|shorter|short version|technical side|why|how about|what about|expand|再多一點|更多|短一點|短一点|技術面|技术面|mas detalle|mas corto)/.test(norm);
    }

    findEntryById(id) {
      return this.entries.find((entry) => entry.id === id) || null;
    }

    detectDirectIntent(norm) {
      if (/(who are you|what are you|what can you do|what do you do|introduce yourself|who is this bot|who r you|what can u do)/.test(norm)) {
        return 'assistant_intro';
      }

      if (/(what did jason do at haeco|tell me about haeco|haeco experience|haeco work|what happened at haeco|what did he do at haeco|what was his role at haeco|what did jason work on at haeco)/.test(norm)) {
        return 'haeco_overview';
      }

      if (/(who is jason|tell me about jason|about jason|what is jason about|who is he|tell me about him)/.test(norm)) {
        return 'about_jason';
      }

      if (/(what awards|awards|achievements)/.test(norm)) {
        return 'awards';
      }

      if (/(what are jason s skills|skills|programming languages|ai tools)/.test(norm)) {
        return 'skills';
      }

      return null;
    }

    getEntriesByIds(ids = []) {
      return ids.map((id) => this.findEntryById(id)).filter(Boolean);
    }

    buildDirectResponse(intent, lang, context = {}) {
      const copy = this.getCopy(lang);

      if (intent === 'assistant_intro') {
        const lines = [
          `**${copy.assistantIntroTitle}**`,
          '',
          copy.assistantIntro,
          '',
          copy.assistantFollowup
        ];

        return {
          handled: true,
          text: lines.join('\n'),
          actions: [],
          suggestions: this.getDefaultSuggestions(lang),
          entries: []
        };
      }

      const intentEntries = {
        haeco_overview: ['coop_highlights_summary', 'coop_duration', 'techathon_organize'],
        about_jason: ['about_jason', 'skills_summary', 'education_summary'],
        awards: ['awards_summary', 'hackathon_prize', 'lean_day_mc'],
        skills: ['skills_summary', 'skills_programming', 'skills_ai']
      };

      const entries = this.getEntriesByIds(intentEntries[intent] || []);
      if (!entries.length) return null;

      return this.composeEntryResponse(entries.map((entry, index) => ({ entry, score: 10 - index })), lang, context);
    }

    scoreEntry(query, entryIndex, context = {}) {
      const { entry, haystack, tokens } = entryIndex;
      const norm = this.normalize(query);
      const queryTokens = this.unique(this.tokenize(query));
      const aliases = this.unique([entry.title, ...(entry.aliases || []), ...(entry.keywords || [])]);

      let score = 0;

      aliases.forEach((alias) => {
        const aliasNorm = this.normalize(alias);
        if (!aliasNorm) return;
        if (norm === aliasNorm) score += 5.2;
        else if (norm.includes(aliasNorm)) score += aliasNorm.includes(' ') ? 4.2 : 2.7;
      });

      if (haystack.includes(norm) && norm.length >= 8) score += 2.5;

      let overlap = 0;
      queryTokens.forEach((token) => {
        if (tokens.includes(token)) {
          overlap += 1;
          score += token.length >= 6 ? 1.1 : 0.75;
        }
      });

      if (queryTokens.length > 0) {
        score += (overlap / queryTokens.length) * 2.2;
      }

      if (entry.page === context.currentPage) score += 0.7;
      if (entry.section === context.currentSectionId) score += 1.1;

      if (context.mode === 'detailed' && entry.facts?.length) score += 0.4;
      if (context.mode === 'short' && entry.summary_short) score += 0.2;

      if (context.summaryIntent === 'section_summary' && entry.type === 'section_summary') score += 1.5;
      if (context.summaryIntent === 'page_summary' && entry.type === 'page_summary') score += 1.5;

      if (context.lastEntries?.length) {
        const lastIds = new Set(context.lastEntries.map((item) => item.id));
        if (lastIds.has(entry.id)) score += 1.2;
        if ((entry.related || []).some((id) => lastIds.has(id))) score += 0.9;
      }

      if (entry.priority) score += Math.min(entry.priority / 20, 0.6);

      return score;
    }

    retrieveEntries(query, context = {}) {
      return this.entryIndex
        .map((entryIndex) => ({
          entry: entryIndex.entry,
          score: this.scoreEntry(query, entryIndex, context)
        }))
        .filter((item) => item.score > 1.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
    }

    buildActions(entries, lang) {
      const copy = this.getCopy(lang);
      return this.unique(entries.map((entry, index) => {
        if (!entry?.url) return null;
        return {
          text: `${index === 0 ? copy.openSection : copy.relatedLinks}: ${entry.title}`,
          link: entry.url
        };
      })).slice(0, 2);
    }

    buildSuggestions(entries, lang, context = {}) {
      const suggestions = [];
      if (lang === 'en') {
        entries.forEach((entry) => {
          (entry.followups || []).forEach((question) => suggestions.push(question));
        });
      }

      if (context.currentSectionId) {
        suggestions.push(this.getCopy(lang).promptAction);
      }
      suggestions.push(this.getCopy(lang).pagePromptAction);

      const defaults = this.suggestedQueries[lang] || this.suggestedQueries.en || [];
      defaults.forEach((question) => suggestions.push(question));

      return this.unique(suggestions).slice(0, 4);
    }

    composeSectionFocusResponse(sectionId, lang, context = {}) {
      if (!sectionId) return null;

      const matches = this.entries
        .filter((entry) => entry.page === context.currentPage && entry.section === sectionId)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 3)
        .map((entry, index) => ({ entry, score: 10 - index }));

      if (!matches.length) {
        return this.composeSectionSummary(sectionId, lang, context.mode || 'normal');
      }

      return this.composeEntryResponse(matches, lang, context);
    }

    composeEntryResponse(matches, lang, context = {}) {
      const copy = this.getCopy(lang);
      const entries = matches.map((item) => item.entry);
      const lead = entries[0];
      const support = entries.slice(1, 3);
      const mode = context.mode || 'normal';
      const facts = this.unique([
        ...(lead.facts || []),
        ...support.flatMap((entry) => entry.facts || [])
      ]).slice(0, mode === 'detailed' ? 4 : 3);

      const lines = [];
      lines.push(`**${lead.title}**`);
      lines.push('');
      lines.push(mode === 'short' ? (lead.summary_short || lead.summary_long) : (lead.summary_long || lead.summary_short));

      if (facts.length) {
        lines.push('');
        lines.push(`**${copy.keyPoints}**`);
        facts.forEach((fact) => lines.push(`- ${fact}`));
      }

      if (context.currentSectionId && lead.section === context.currentSectionId) {
        lines.push('');
        lines.push(copy.basedOnCurrentSection);
      } else if (lead.page === context.currentPage) {
        lines.push('');
        lines.push(copy.basedOnCurrentPage);
      }

      return {
        handled: true,
        text: lines.join('\n'),
        actions: this.buildActions(entries, lang),
        suggestions: this.buildSuggestions(entries, lang, context),
        entries
      };
    }

    composeSectionSummary(sectionId, lang, mode = 'normal') {
      const copy = this.getCopy(lang);
      const summary = this.domContext.buildSectionSummary(sectionId, mode);
      if (!summary) return null;

      const lines = [];
      lines.push(`**${summary.title || sectionId}**`);
      lines.push('');
      lines.push(copy.sectionSummaryLead);
      const fallbackSummary = this.composeHighlightSentence(summary, lang);

      if (summary.paragraphs.length) {
        lines.push('');
        lines.push(summary.paragraphs[0]);
      } else if (fallbackSummary) {
        lines.push('');
        lines.push(fallbackSummary);
      }

      if (mode !== 'short' && summary.paragraphs[1]) {
        lines.push('');
        lines.push(summary.paragraphs[1]);
      }

      if (summary.cards?.length) {
        summary.cards.forEach((card) => {
          lines.push('');
          lines.push(`**${card.title}**`);

          if (card.degree) {
            lines.push(card.degree);
          }

          if (card.period) {
            lines.push(card.period);
          }

          card.details
            .slice(0, mode === 'short' ? 1 : 2)
            .forEach((detail) => lines.push(`- ${detail.text}`));
        });
      }

      if (summary.highlights.length && !summary.cards?.length) {
        lines.push('');
        lines.push(`**${copy.keyPoints}**`);
        summary.highlights.forEach((item) => lines.push(`- ${item}`));
      }

      lines.push('');
      lines.push(copy.basedOnCurrentSection);

      return {
        handled: true,
        text: lines.join('\n'),
        actions: summary.url ? [{ text: `${copy.openSection}: ${summary.title || sectionId}`, link: summary.url }] : [],
        suggestions: this.buildSectionSuggestions(sectionId, lang, summary),
        entries: []
      };
    }

    composePageSummary(lang, mode = 'normal') {
      const copy = this.getCopy(lang);
      const summary = this.domContext.buildPageSummary(mode);
      if (!summary) return null;

      const lines = [];
      lines.push(`**${copy.pageSummary}: ${summary.title}**`);
      lines.push('');

      if (summary.paragraphs.length) {
        lines.push(summary.paragraphs[0]);
      }

      if (mode !== 'short' && summary.paragraphs[1]) {
        lines.push('');
        lines.push(summary.paragraphs[1]);
      }

      if (summary.highlights.length) {
        lines.push('');
        lines.push(`**${copy.keyPoints}**`);
        summary.highlights.forEach((item) => lines.push(`- ${item}`));
      }

      lines.push('');
      lines.push(copy.basedOnCurrentPage);

      return {
        handled: true,
        text: lines.join('\n'),
        actions: summary.url ? [{ text: `${copy.openPage}: ${summary.title}`, link: summary.url }] : [],
        suggestions: this.unique(this.suggestedQueries[lang] || this.suggestedQueries.en || []).slice(0, 4),
        entries: []
      };
    }

    respond({ message, lang = 'en', currentPage, currentSectionId } = {}) {
      const norm = this.normalize(message);
      if (!norm || this.isSmallTalk(norm) || this.isUtilityQuery(norm)) return null;

      const mode = this.detectMode(norm);
      const summaryIntent = this.detectSummaryIntent(norm);
      const sectionFocusIntent = this.detectSectionFocusIntent(norm);
      const directIntent = this.detectDirectIntent(norm);

      if (directIntent) {
        const directResponse = this.buildDirectResponse(directIntent, lang, {
          mode,
          summaryIntent,
          currentPage,
          currentSectionId,
          lastEntries: this.isFollowUp(norm) ? this.memory.lastEntries : []
        });
        if (directResponse) {
          this.memory.lastEntries = directResponse.entries || [];
          this.memory.lastMode = mode;
          this.memory.lastQuery = message;
          this.memory.lastSectionId = currentSectionId || null;
          return directResponse;
        }
      }

      if (summaryIntent === 'section_summary' && currentSectionId) {
        const response = this.composeSectionSummary(currentSectionId, lang, mode);
        if (response) {
          this.memory.lastEntries = [];
          this.memory.lastMode = mode;
          this.memory.lastQuery = message;
          this.memory.lastSectionId = currentSectionId;
          return response;
        }
      }

      if (sectionFocusIntent && currentSectionId) {
        if (lang !== 'en') {
          const response = this.composeSectionSummary(currentSectionId, lang, mode);
          if (response) {
            this.memory.lastEntries = [];
            this.memory.lastMode = mode;
            this.memory.lastQuery = message;
            this.memory.lastSectionId = currentSectionId;
            return response;
          }
        }

        const response = this.composeSectionFocusResponse(currentSectionId, lang, {
          mode,
          summaryIntent,
          currentPage,
          currentSectionId,
          lastEntries: this.isFollowUp(norm) ? this.memory.lastEntries : []
        });
        if (response) {
          this.memory.lastEntries = response.entries || [];
          this.memory.lastMode = mode;
          this.memory.lastQuery = message;
          this.memory.lastSectionId = currentSectionId;
          return response;
        }
      }

      if (summaryIntent === 'page_summary') {
        const response = this.composePageSummary(lang, mode);
        if (response) {
          this.memory.lastEntries = [];
          this.memory.lastMode = mode;
          this.memory.lastQuery = message;
          this.memory.lastSectionId = currentSectionId || null;
          return response;
        }
      }

      const context = {
        mode,
        summaryIntent,
        currentPage,
        currentSectionId,
        lastEntries: this.isFollowUp(norm) ? this.memory.lastEntries : []
      };
      const matches = this.retrieveEntries(message, context);

      if (!matches.length) {
        if (currentSectionId && /(this|here|section|部分|這裡|这里|seccion)/.test(norm)) {
          return this.composeSectionSummary(currentSectionId, lang, mode);
        }
        if (/(page|portfolio|頁面|页面|pagina)/.test(norm)) {
          return this.composePageSummary(lang, mode);
        }
        return {
          handled: true,
          text: this.getCopy(lang).noMatch,
          actions: [],
          suggestions: this.getDefaultSuggestions(lang),
          entries: []
        };
      }

      const response = this.composeEntryResponse(matches, lang, context);
      this.memory.lastEntries = response.entries || [];
      this.memory.lastMode = mode;
      this.memory.lastQuery = message;
      this.memory.lastSectionId = currentSectionId || null;
      return response;
    }

    getSectionPrompt({ sectionId, lang = 'en', mode = 'default', cycle = 0 } = {}) {
      if (!sectionId) return null;

      const copy = this.getCopy(lang);
      const summary = this.domContext.buildSectionSummary(sectionId, 'short');
      if (!summary?.title) return null;

      const promptCatalog = mode === 'idle' ? this.getIdlePromptCatalog(lang) : this.getPromptCatalog(lang);
      const baseVariants = promptCatalog[sectionId] || promptCatalog.default || promptCatalog.home || [];
      const variants = mode === 'idle'
        ? [...baseVariants, ...this.getSharedIdlePrompts(summary, lang)]
        : baseVariants;
      const pool = variants.length ? variants : [{
        label: summary.title,
        question: `${copy.promptQuestion} ${summary.title}?`,
        query: lang === 'en' ? 'Summarize this section' : copy.promptAction
      }];
      const base = sectionId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const index = Math.abs(base + cycle) % pool.length;
      const variant = pool[index];

      return {
        label: variant.label || summary.title,
        question: variant.question || `${copy.promptQuestion} ${summary.title}?`,
        query: variant.query || (lang === 'en' ? 'Summarize this section' : copy.promptAction)
      };
    }

    getAutocompleteSuggestions({ input, lang = 'en', currentSectionId } = {}) {
      const norm = this.normalize(input);
      if (!norm || norm.length < 2) return [];

      const suggestions = [];

      (this.suggestedQueries[lang] || this.suggestedQueries.en || []).forEach((question) => {
        if (this.normalize(question).includes(norm)) suggestions.push(question);
      });

      this.entries.forEach((entry) => {
        const candidates = [entry.title, ...(entry.followups || []), ...(entry.aliases || [])];
        candidates.forEach((candidate) => {
          if (this.normalize(candidate).includes(norm)) suggestions.push(candidate);
        });
      });

      if ('summarize this page'.includes(norm) || /summ|page|section|頁|页|摘要|resum/.test(norm)) {
        suggestions.push(this.getCopy(lang).pagePromptAction);
        if (currentSectionId) suggestions.push(this.getCopy(lang).promptAction);
      }

      return this.unique(suggestions).slice(0, 6);
    }
  }

  window.PortfolioDomContext = PortfolioDomContext;
  window.JasonAssistantEngine = JasonAssistantEngine;
})();
