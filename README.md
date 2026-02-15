# Jason Au-Yeung - Professional Portfolio

A modern, multilingual portfolio website showcasing professional experience, projects, and achievements in AI, Data Science, and Operations Innovation.

## 🌟 Career Highlights

- **AWS AI Hackathon Hong Kong 2025** - Grand Prize Winner (130+ shortlisted teams)
- **HAECO Co-op Intern** - 5-month intensive internship in Technology Innovation
- **HAECO Techathon 2026** - Lead Planner & Organizer
- **HAECO Lean Day 2025** - Master of Ceremony
- **AWS re:Invent** - Represented HAECO in Las Vegas
- **4 Media Interviews** - SCMP, unwire.hk, AWS Hong Kong, HAECO
- **Academic** - HKUST IEEM + HKU SPACE Data Science

## 🎨 Design Features

### Premium Design
- Glassmorphism effects with backdrop blur
- Smooth animations and scroll effects
- Dark/Light theme toggle with persistence
- Fully responsive layout (desktop, tablet, mobile)
- Company logos integrated throughout
- Dynamic photo galleries with lightbox viewer
- Multilingual support (English, 繁體中文, 简体中文, Español)

### Main Pages
1. **index.html** - Main portfolio with all sections
2. **hackathon.html** - Detailed AWS AI Hackathon showcase
3. **coop.html** - Complete 5-month HAECO Co-op journey

### Portfolio Sections (index.html)
1. **Hero** - Introduction with avatar and quick links
2. **Awards & Achievements** - 4 major accomplishments
3. **Professional Experience** - Timeline with 3 positions
4. **Featured Projects** - 4 projects with detailed descriptions
5. **Education** - HKUST and HKU SPACE with courses
6. **Skills & Expertise** - 6 categories including certifications
7. **Contact** - Email, Resume, GitHub

## 📋 Content Overview

### Experience
- **HAECO Co-op Intern** (Sep 2025 - Jan 2026)
  - Technology Innovation | Transformation & Technology Department
  - AI-driven solutions, Bay Management System, Techathon planning
  - Lean Day MC, AWS re:Invent representative
  - Detailed 5-month timeline available in coop.html
  
- **HKUST ITSO Internship** (Feb 2026 - Jun 2026)
  - IT support, asset management, Computer Barns
  
- **Speedy Group IT Support** (Jul 2021 - Present)
  - IT operations, MDM, digital media production

### Featured Projects
- **HAECO Bay Management System** - AWS AI Hackathon Grand Prize
- **Inventory Control Research** - HKUST Final Year Project
- **Christmas Effects Study** - HKU SPACE Data Science
- **YouTube Database System** - SQLite project

### Education
- **HKUST** - BEng Industrial Engineering and Engineering Management
  - Minor: Big Data Technology
  - FYP: Efficient Data-Driven Methods for Inventory Control
  - Courses: Queueing Models, Stochastic Modeling, Data-Driven Optimization
  
- **HKU SPACE** - Higher Diploma in Data Science
  - Awards: Academic Excellence, Principal's Honours List
  - Leadership: Class Representative (80+ students)
  - Courses: Machine Learning, Data Mining, Big Data Analytics, InfoSec

### Skills
- **Programming**: Python, R, Octave, SQLite, SQL
- **AI Tools**: AWS Q Developer, Krio, OpenAI Codex, AutoML
- **Creative**: MS Office, Canva, Adobe Creative, Photo/Video Editing
- **Soft Skills**: Critical Thinking, Decision Making, Leadership, Teamwork, Negotiation
- **Languages**: English, Cantonese, Mandarin

### Certifications
- Certificate of Outstanding Achievement and Innovation - HAECO, 2025
- SEN, Disability & Equality in Higher Education (Module 1-3) - HKUST, 2025

## 🚀 Quick Start

1. Open `index.html` in your browser
2. Navigate using the top menu or scroll through sections
3. Toggle theme (🌙/☀️) in the top-right corner
4. Switch language (🌐) to view in different languages
5. Click "🏆 AWS Hackathon" or "🌟 Co-op Experience" for detailed pages

## 🎯 Key Features

### Interactive Elements
- **Smooth Scrolling** - Seamless navigation between sections
- **Scroll Animations** - Cards fade in as you scroll
- **Hover Effects** - Interactive 3D transforms on cards
- **Theme Toggle** - Dark/Light mode with localStorage persistence
- **Language Switcher** - 4 languages with i18n support
- **Dynamic Galleries** - Auto-loading photo albums with lightbox
- **AI Assistant** - Built-in chatbot for navigation help

### Responsive Design
- **Desktop**: Full layout with all features
- **Tablet**: Adjusted grid layouts and navigation
- **Mobile**: Single column, optimized touch interactions

## 🛠️ Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Grid, Flexbox, Backdrop Filter, Animations
- **JavaScript** - Vanilla JS for all interactions
- **i18n** - Custom translation system (translations.js)
- **No Dependencies** - Pure web technologies, no frameworks

## 📁 Project Structure

```
.
├── index.html              # Main portfolio page
├── hackathon.html          # AWS AI Hackathon detailed page
├── coop.html               # HAECO Co-op experience page
├── README.md               # This file
├── assets/
│   ├── css/
│   │   ├── styles.css      # Main styles
│   │   ├── hackathon.css   # Hackathon page styles
│   │   ├── coop.css        # Co-op page styles
│   │   └── chat.css        # AI assistant styles
│   ├── js/
│   │   ├── main.js         # Core functionality
│   │   ├── hackathon.js    # Hackathon page logic
│   │   ├── coop.js         # Co-op page logic
│   │   ├── translations.js # i18n translations
│   │   └── assistant.js    # AI chatbot
│   ├── images/
│   │   ├── logos/          # Company logos
│   │   ├── hackathon/      # Hackathon photos
│   │   ├── coop/           # Co-op photos
│   │   └── CV/             # Resume and profile photo
│   ├── videos/
│   │   └── demo.mp4        # Demo video
│   └── bot/
│       └── knowledge.json  # AI assistant knowledge base
```

## 🌍 Multilingual Support

The website supports 4 languages:
- **English** (en)
- **繁體中文** (zh-TW)
- **简体中文** (zh-CN)
- **Español** (es)

All content is translated using the i18n system in `translations.js`.

## 📝 Customization

### Update Content
1. Open the HTML file you want to edit
2. Find elements with `data-i18n` attributes
3. Update translations in `assets/js/translations.js`
4. Save and refresh your browser

### Add Photos
1. Place images in `assets/images/coop/` or `assets/images/hackathon/`
2. Photos are automatically loaded by the gallery scripts
3. Supported formats: JPG, PNG, GIF

### Modify Styles
1. Edit `assets/css/styles.css` for global styles
2. Edit page-specific CSS files for individual pages
3. CSS variables are defined in `:root` for easy theming

## 🎨 Color Scheme

**Light Mode:**
- Background: Soft gray gradient (#f5f7fa → #c3cfe2)
- Glass: White with 25% opacity + backdrop blur
- Text: Dark gray (#333)
- Accent: Black gradient

**Dark Mode:**
- Background: Black gradient (#000000 → #1d1d1f)
- Glass: White with 8% opacity + backdrop blur
- Text: Light gray (#e0e0e0)
- Accent: White/Light gray

## 📄 License

All content reflects personal experience and learning during my internship and does not represent official statements of any organization.
© 2026 Jason Au-Yeung. All rights reserved.

---

**Built with ❤️ | IEEM × Data × Tech**
