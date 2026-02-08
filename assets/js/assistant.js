// Jason AI Assistant - Enhanced Intelligent Chatbot

class JasonAssistant {
  constructor() {
    this.conversationStart = new Date();
    this.messageCount = 0;
    this.knowledgeBase = [];
    this.knowledgeIndex = null;
    this.intentHistory = [];
    this.lastIntentPicks = {};
    this.loadKnowledge();
    
    this.knowledge = {
      profile: {
        name: "Jason Au-Yeung",
        title: "IEEM × Data × Tech | AI & Operations Innovation",
        education: "HKUST BEng IEEM + Minor in Big Data Technology",
        currentStatus: "Completed 5-month Co-op at HAECO (Sep 2025 - Jan 2026)"
      },
      
      funFacts: [
        "🎬 Jason produced the 3-minute AWS Hackathon demo video that helped win Grand Prize!",
        "🎤 Jason was MC at HAECO Lean Day 2025, engaging executives in front of all senior management at HAECO!",
        "🌍 Jason traveled to Las Vegas for AWS re:Invent and was interviewed on-site!",
        "💡 Jason solely organized HAECO's first-ever Techathon from scratch!",
        "📊 Jason managed 80+ students as Class Representative in Data Science!",
        "🏆 Jason's team beat 130+ teams in Hong Kong's first and largest AWS AI Hackathon!",
        "⚡ Jason built the Bay Management System in just 14 days!",
        "🎉 Jason helped celebrate HAECO's 75th Birthday!",
        "🤖 Jason uses AI tools like AWS Q Developer and Krio for rapid development!",
        "🌏 Jason speaks 3 languages: English, Cantonese, and Mandarin!",
        "📸 Jason is proficient in photo and video editing with Adobe Creative Suite!",
        "🎯 Jason's FYP focuses on Inventory Control using JIT, Monte Carlo, and Multi-Agent Systems!"
      ],
      
      awards: [
        "Grand Prize Winner - AWS AI Hackathon Hong Kong 2025 (130+ teams)",
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
  
  normalize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  
  tokenize(text) {
    return this.normalize(text).split(' ').filter(t => t.length > 2);
  }
  
  retrieveSnippets(query, topK = 5) {
    if (!this.knowledgeIndex || this.knowledgeIndex.length === 0) return [];
    
    const queryTokens = this.tokenize(query);
    const scores = this.knowledgeIndex.map(item => {
      const commonTokens = queryTokens.filter(qt => item.tokens.includes(qt)).length;
      const score = commonTokens / Math.sqrt(queryTokens.length * item.tokens.length + 0.001);
      return { snippet: item.snippet, score };
    });
    
    return scores
      .filter(s => s.score > 0.1)
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
    return this.knowledge.funFacts[Math.floor(Math.random() * this.knowledge.funFacts.length)];
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
              <h3>Jason AI Assistant</h3>
              <p class="chat-status">Online • Ready to help</p>
            </div>
          </div>
          <button id="chatClose" class="chat-close">×</button>
        </div>
        
        <div class="chat-suggestions" id="chatSuggestions">
          <p class="suggestions-title">💡 Suggested Questions:</p>
          <button class="suggestion-chip" data-question="Tell me about Jason">Tell me about Jason</button>
          <button class="suggestion-chip" data-question="What is the AWS Hackathon project?">AWS Hackathon</button>
          <button class="suggestion-chip" data-question="What did Jason do at HAECO?">HAECO experience</button>
          <button class="suggestion-chip" data-question="Tell me a fun fact">Fun fact</button>
          <button class="suggestion-chip" data-question="What time is it?">What time?</button>
          <button class="suggestion-chip" data-question="How long have we been talking?">Chat time</button>
        </div>
        
        <div class="chat-messages" id="chatMessages"></div>
        
        <div class="chat-input-area">
          <input type="text" id="chatInput" class="chat-input" placeholder="Ask me anything about Jason..." />
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
    
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const question = chip.dataset.question;
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
    
    // Detect intent
    let intent = 'general';
    if (/\b(hi|hello|hey|hola|morning|afternoon|evening)\b/.test(msg)) intent = 'greeting';
    else if (/\b(fun fact|interesting|cool thing)\b/.test(msg)) intent = 'fun_fact';
    else if (/\b(time|date|today|day)\b/.test(msg)) intent = 'time_date';
    else if (/\b(how long|conversation time|talking|chat time|chat stat|chat stats)\b/.test(msg)) intent = 'chat_stats';
    else if (/\b(thank|thanks)\b/.test(msg)) intent = 'thanks';
    else if (/\b(bye|goodbye|see you|later)\b/.test(msg)) intent = 'bye';
    else if (/\b(aws|hackathon|bay management|re invent|reinvent)\b/.test(msg)) intent = 'hackathon';
    else if (/\b(haeco|coop|co op|co-op|internship)\b/.test(msg)) intent = 'coop';
    else if (/\b(techathon|pitch|roadmap)\b/.test(msg)) intent = 'techathon';
    else if (/\b(lean day|mc|master of ceremony)\b/.test(msg)) intent = 'lean_day';
    else if (/\b(skill|skills|programming|language|tech|tool)\b/.test(msg)) intent = 'skills';
    else if (/\b(education|school|university|hkust|hku|study)\b/.test(msg)) intent = 'education';
    else if (/\b(project|projects|work|portfolio|fyp)\b/.test(msg)) intent = 'projects';
    else if (/\b(award|awards|achievement|achieve|prize|win)\b/.test(msg)) intent = 'awards';
    else if (/\b(contact|email|reach|github)\b/.test(msg)) intent = 'contact';
    else if (/\b(experience|job|work history)\b/.test(msg)) intent = 'experience';
    else if (/\b(who|about|tell me|introduce|think about jason|opinion)\b/.test(msg)) intent = 'about_jason';
    else if (/\b(go to|show me|navigate|open page)\b/.test(msg)) intent = 'navigate';
    
    this.trackIntent(intent);
    
    // Check for loop
    if (this.isLooping()) {
      return this.handleLoop(intent, snippets);
    }
    
    // Greeting responses
    if (intent === 'greeting') {
      const variants = [
        `${this.getGreeting()}! 👋 I'm Jason's AI assistant. How can I help you today?`,
        `${this.getGreeting()}! 😊 Ready to learn about Jason's journey in AI and operations?`,
        `${this.getGreeting()}! 🌟 Ask me anything about Jason's projects and achievements!`
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
        text: `🎉 **Fun Fact About Jason:**\n\n${this.getRandomFunFact()}\n\nWant another fun fact? Just ask!`,
        actions: [{ text: '🏆 Learn More About Jason', link: 'index.html' }],
        suggestions: ['Another fun fact', 'AWS Hackathon story', 'What time is it?', 'Chat stats']
      };
    }
    
    // Conversation time
    if (intent === 'chat_stats') {
      return {
        text: `⏱️ **Conversation Stats:**\n\n• Time chatting: **${this.getConversationTime()}**\n• Messages sent: **${this.messageCount}**\n• Started: **${this.conversationStart.toLocaleTimeString()}**\n\nKeep the questions coming! 😊`,
        actions: [],
        suggestions: ['Tell me about Jason', 'AWS Hackathon', 'Fun fact', 'What time is it?']
      };
    }
    
    // Time and date queries
    if (intent === 'time_date') {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const greeting = this.getGreeting();
      return {
        text: `${greeting}!\n\n🕐 **Current time:** ${time}\n📅 **Today is:** ${date}\n\nAnything else you'd like to know about Jason?`,
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
        text: `You're welcome! 😊\n\nHappy to help you learn about Jason. Feel free to ask anything else!`,
        actions: [],
        suggestions: ['Fun fact', 'AWS Hackathon', 'Skills', 'Chat stats']
      };
    }
    
    // Goodbye responses
    if (intent === 'bye') {
      return {
        text: `👋 Goodbye! Thanks for chatting!\n\nWe talked for **${this.getConversationTime()}** and exchanged **${this.messageCount} messages**.\n\nCome back anytime to learn more about Jason! 😊`,
        actions: [],
        suggestions: []
      };
    }
    
    // AWS Hackathon queries
    if (intent === 'hackathon') {
      return {
        text: `🏆 **AWS AI Hackathon Hong Kong 2025 - Grand Prize Winner!**\n\nJason's team developed the **HAECO Bay Management System** - an AI-based aircraft bay scheduling optimization platform.\n\n✨ **Key Achievements:**\n• Won Grand Prize among **130+ shortlisted teams**\n• Built in just **14 days**\n• Featured in **4 media interviews** (unwire.hk, SCMP, HAECO, AWS HK)\n• Interviewed at **AWS re:Invent** in Las Vegas\n\n🛠️ **Tech Stack:** HTML, CSS, JavaScript, AWS Q Developer, Kiro AI\n\n💡 The system automates aircraft bay assignments, optimizes scheduling, and provides real-time analytics for HAECO's operations.`,
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
        text: `🚀 **HAECO Co-op Experience (Sep 2025 - Jan 2026)**\n\nJason completed a **5-month Co-op** at HAECO's Technology Innovation department.\n\n🌟 **Major Achievements:**\n• 🏆 Won AWS AI Hackathon Grand Prize\n• 💡 Organized HAECO's first Techathon\n• 🎤 MC at HAECO Lean Day 2025\n• 🎙️ 4 media interviews\n• 🌍 Attended AWS re:Invent\n• 🎉 Helped with 75th Anniversary celebration\n\n📊 **Key Projects:**\n• Bay Management System development\n• Techathon framework design (3 GM meetings)\n• Lean Day coordination\n• AR/VR technology exploration\n• TI Project Tracker development`,
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
        text: `🛠️ **Jason's Skills & Expertise**\n\n**💻 Programming & Data:**\nPython, R, Octave, SQLite, SQL\n\n**🤖 AI & Development Tools:**\nAWS Q Developer, Krio, OpenAI Codex, AutoML\n\n**🎨 Creative Tools:**\nMS Office, Canva, Adobe Creative Suite\n\n**🧠 Soft Skills:**\nCritical Thinking, Leadership, Teamwork, Negotiation, Decision Making\n\n**🌍 Languages:**\nEnglish, Cantonese, Mandarin`,
        actions: [{ text: '📋 View Full CV', link: 'index.html#skills' }],
        suggestions: ['Education background', 'Projects', 'Awards', 'Contact info']
      };
    }
    
    // Education queries
    if (intent === 'education') {
      return {
        text: `🎓 **Education Background**\n\n**Hong Kong University of Science and Technology (HKUST)**\n• BEng in Industrial Engineering and Engineering Management\n• Minor in Big Data Technology\n• Period: 2023 - Present\n• FYP: Efficient Data-Driven Methods for Inventory Control\n\n**HKU SPACE Community College**\n• Higher Diploma in Data Science\n• Period: 2021 - 2023\n• 🏆 Academic Excellence Award\n• 🏆 Principal's Honor List\n• Leadership: Class Representative (80+ students)`,
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
        text: `👋 **Meet Jason Au-Yeung**\n\n**IEEM × Data × Tech | AI & Operations Innovation**\n\nJason is a HKUST student specializing in Industrial Engineering with a passion for AI-driven solutions and operations optimization.\n\n🌟 **Recent Highlights:**\n• 🏆 Grand Prize Winner - AWS AI Hackathon HK 2025\n• 🚀 Completed 5-month Co-op at HAECO\n• 🎤 MC at HAECO Lean Day 2025\n• 💡 Organized HAECO's first Techathon\n\n🎓 **Education:**\n• HKUST - BEng IEEM + Big Data Technology Minor\n• HKU SPACE - Higher Diploma in Data Science\n\n💪 **Expertise:**\nAI/ML, Data Analytics, Operations Optimization, Python, AWS, Leadership\n\n🎉 **Fun Fact:** ${this.getRandomFunFact()}`,
        actions: [
          { text: '📄 View Full Portfolio', link: 'index.html' },
          { text: '🏆 AWS Hackathon Project', link: 'hackathon.html' }
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

  showWelcomeMessage() {
    setTimeout(() => {
      const greeting = this.getGreeting();
      const funFact = this.getRandomFunFact();
      this.addMessage(
        `${greeting}! 👋 I'm Jason's AI Assistant.\n\nI can answer questions about Jason's experience, skills, projects, and achievements.\n\n🎉 **Random Fun Fact:**\n${funFact}\n\n💡 Try the suggested questions below or ask me anything!`,
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
