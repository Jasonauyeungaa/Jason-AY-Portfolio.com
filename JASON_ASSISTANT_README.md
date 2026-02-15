# Jason AI Assistant 🤖

An intelligent, multilingual chatbot integrated into Jason Au-Yeung's portfolio website to help visitors learn about his experience, projects, and achievements.

## 🌟 Features

### Smart Autocomplete
- Real-time suggestions as you type (minimum 2 characters)
- Shows up to 5 matching queries from 25+ predefined questions
- Supports all 4 languages
- Click to auto-fill and send

### Multilingual Support
- **English** (en)
- **繁體中文** (zh-TW)
- **简体中文** (zh-CN)
- **Español** (es)

All responses, suggestions, and UI elements automatically adapt to the selected language.

### Intelligent Intent Detection
- Neural network-style keyword weighting (high/medium/low priority)
- Multilingual keyword matching
- Context-aware responses
- Loop detection to prevent repetitive answers

### Conversation Features
- **Fun Facts** - Random interesting facts about Jason
- **Time & Date** - Current time and date queries
- **Chat Statistics** - Track conversation duration and message count
- **Math Calculator** - Basic arithmetic operations
- **Navigation** - Quick links to portfolio pages

### Response Categories
1. **About Jason** - Introduction, highlights, education, expertise
2. **AWS Hackathon** - Grand Prize project details
3. **HAECO Co-op** - 5-month internship experience
4. **Skills** - Programming, AI tools, soft skills, languages
5. **Education** - HKUST and HKU SPACE background
6. **Projects** - Featured projects and achievements
7. **Awards** - Recognition and accomplishments
8. **Contact** - Email, GitHub, resume links
9. **Experience** - Professional work history

## 📁 File Structure

```
assets/
├── js/
│   ├── assistant.js       # Main chatbot logic
│   └── translations.js    # i18n translations
├── css/
│   └── chat.css          # Chatbot styling
└── bot/
    └── knowledge.json    # Knowledge base (optional)
```

## 🚀 Usage

### Basic Integration

```html
<!-- Include CSS -->
<link rel="stylesheet" href="assets/css/chat.css">

<!-- Include JavaScript -->
<script src="assets/js/translations.js"></script>
<script src="assets/js/assistant.js"></script>
```

The chatbot automatically initializes when the DOM is ready.

### Autocomplete Queries

**English:**
- Tell me about Jason
- What is the AWS Hackathon project?
- What did Jason do at HAECO?
- What are Jason's skills?
- How can I contact Jason?
- Download Jason's CV

**繁體中文:**
- 告訴我關於Jason
- AWS黑客松項目是什麼？
- Jason在港機做了什麼？
- Jason的技能是什麼？
- 如何聯絡Jason？
- 下載Jason的履歷

**简体中文:**
- 告诉我关于Jason
- AWS黑客松项目是什么？
- Jason在港机做了什么？
- Jason的技能是什么？
- 如何联络Jason？
- 下载Jason的履历

**Español:**
- Cuéntame sobre Jason
- ¿Cuál es el proyecto del AWS Hackathon?
- ¿Qué hizo Jason en HAECO?
- ¿Cuáles son las habilidades de Jason?
- ¿Cómo puedo contactar a Jason?
- Descargar CV de Jason

## 🎨 Customization

### Adding New Responses

Edit `assistant.js` and add to the `generateResponse()` method:

```javascript
if (intent === 'your_intent') {
  return {
    text: 'Your response text',
    actions: [
      { text: 'Button Text', link: 'url.html' }
    ],
    suggestions: ['Follow-up 1', 'Follow-up 2']
  };
}
```

### Adding Translations

Edit `translations.js` and add keys to all language objects:

```javascript
en: {
  'your.key': 'English text',
  // ...
},
'zh-TW': {
  'your.key': '繁體中文文字',
  // ...
},
'zh-CN': {
  'your.key': '简体中文文字',
  // ...
},
es: {
  'your.key': 'Texto en español',
  // ...
}
```

### Adding Autocomplete Queries

Edit the `getAutocompleteSuggestions()` method in `assistant.js`:

```javascript
const queries = {
  en: [
    'Your new query',
    // ... existing queries
  ],
  'zh-TW': [
    '你的新查詢',
    // ... existing queries
  ],
  // ... other languages
};
```

## 🧠 Intent Detection

The assistant uses a weighted scoring system:

- **High Priority** (3.0x): Specific terms like "aws hackathon", "haeco coop"
- **Medium Priority** (1.5x): General terms like "skills", "education"
- **Low Priority** (0.5x): Common words like "tell", "show"

Intents are matched across all languages simultaneously.

## 💬 Chat UI Components

- **Chat Toggle** - Floating button (bottom-right)
- **Chat Window** - Glassmorphism design with backdrop blur
- **Header** - Avatar, title, online status
- **Suggestions** - Quick-access chips for common queries
- **Messages** - User and bot message bubbles
- **Autocomplete** - Dropdown above input field
- **Input Area** - Text input with send button

## 🎯 Key Methods

### `JasonAssistant` Class

- `t(key)` - Get translation for current language
- `generateResponse(message)` - Process user input and return response
- `handleAutocomplete(e)` - Show/hide autocomplete suggestions
- `getAutocompleteSuggestions(input)` - Filter matching queries
- `addMessage(text, sender, actions, suggestions)` - Display message
- `getRandomFunFact()` - Return random fun fact in current language

## 🌐 Language Detection

The assistant automatically:
1. Reads `preferredLanguage` from localStorage
2. Listens for language changes via storage events
3. Updates all UI text and responses
4. Refreshes welcome message when language changes

## 📊 Analytics

Track conversation metrics:
- Conversation start time
- Total messages sent
- Time spent chatting

Access via "Chat stats" or "How long have we been talking?"

## 🎨 Theming

Supports light and dark themes via `[data-theme="dark"]` CSS selectors.

## 🔧 Technical Details

- **Pure JavaScript** - No framework dependencies
- **Event-driven** - Efficient DOM manipulation
- **Responsive** - Mobile-optimized layout
- **Accessible** - Keyboard navigation support
- **Performance** - Lazy loading and efficient rendering

## 📝 License

Part of Jason Au-Yeung's portfolio website.
© 2026 Jason Au-Yeung. All rights reserved.

---

**Built with ❤️ | IEEM × Data × Tech**
