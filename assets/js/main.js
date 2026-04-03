(() => {
  const site = window.JasonSite || {};
  const runtimePrefs = window.JasonRuntimePrefs || (window.JasonRuntimePrefs = {});
  const root = document.documentElement;
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.glass-nav');
  const langSwitcher = document.querySelector('.lang-switcher');
  const savedTheme = runtimePrefs.theme || root.getAttribute('data-theme') || 'dark';
  const prefsStorageKey = 'jason-portfolio-prefs';
  const prefersReducedMotion = Boolean(site.prefersReducedMotion);
  const currentPage = body?.dataset.page || 'home';
  const hasExpandableHeader = ['coop', 'hackathon'].includes(currentPage);
  const sideMenuState = {
    toggle: null,
    shell: null,
    panel: null,
    closeButton: null,
    lastActiveElement: null,
    isOpen: false
  };

  const basePageLinks = [
    {
      id: 'home',
      href: 'index.html',
      localHref: '#home',
      labelKey: 'menu.page.home',
      labelFallback: 'Home',
      metaKey: 'menu.page.home.meta',
      metaFallback: 'Portfolio overview'
    },
    {
      id: 'coop',
      href: 'coop.html',
      localHref: '#overview',
      labelKey: 'menu.page.coop',
      labelFallback: 'Co-op',
      metaKey: 'menu.page.coop.meta',
      metaFallback: 'HAECO experience'
    },
    {
      id: 'hackathon',
      href: 'hackathon.html',
      localHref: '#award',
      labelKey: 'menu.page.hackathon',
      labelFallback: 'Hackathon',
      metaKey: 'menu.page.hackathon.meta',
      metaFallback: 'AWS AI project'
    },
    {
      id: 'policy',
      href: 'policy.html',
      localHref: '__top__',
      labelKey: 'footer.policy',
      labelFallback: 'Policy',
      metaKey: 'menu.page.policy.meta',
      metaFallback: 'Statement and notice'
    }
  ];

  const isCurrentPageLink = (pageId) => currentPage === pageId || (pageId === 'home' && currentPage === 'index');

  const getCurrentPageTitle = () => {
    const headerTitle = document.querySelector('.site-header-title h1')?.textContent?.trim();
    const brandTitle = document.querySelector('.nav-brand')?.textContent?.trim();

    if (headerTitle) return headerTitle;
    if (currentPage === 'home' && brandTitle) return brandTitle;
    return document.title.split('|')[0]?.trim() || 'Navigation';
  };

  const getMenuPageLinks = () => {
    return basePageLinks.map((item) => ({
      ...item,
      label: window.JasonI18n?.translate?.(item.labelKey) || item.labelFallback,
      meta: window.JasonI18n?.translate?.(item.metaKey) || item.metaFallback
    }));
  };

  const getMenuSectionLinks = () => {
    const sectionLinks = [];
    const seen = new Set();

    const addLink = (href, label) => {
      const normalizedHref = typeof href === 'string' ? href.trim() : '';
      const normalizedLabel = typeof label === 'string' ? label.trim() : '';

      if (!normalizedHref.startsWith('#') || !normalizedLabel || seen.has(normalizedHref)) return;
      sectionLinks.push({ href: normalizedHref, label: normalizedLabel });
      seen.add(normalizedHref);
    };

    const sourceAnchors = currentPage === 'home'
      ? document.querySelectorAll('.site-header-links a[href^="#"]')
      : document.querySelectorAll('.site-header-shortcut-list a[href^="#"]');

    sourceAnchors.forEach((anchor) => addLink(anchor.getAttribute('href'), anchor.textContent));

    if (!sectionLinks.length && currentPage === 'policy') {
      document.querySelectorAll('main article[id]').forEach((article) => {
        addLink(`#${article.id}`, article.querySelector('h2')?.textContent || '');
      });
    }

    return sectionLinks;
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  };

  const updateThemeButton = (theme) => {
    if (!themeToggle) return;
    const isDark = theme === 'dark';
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  };

  const persistPrefs = (nextPrefs = {}) => {
    try {
      const storedPrefs = JSON.parse(window.localStorage.getItem(prefsStorageKey) || '{}') || {};
      window.localStorage.setItem(prefsStorageKey, JSON.stringify({
        ...storedPrefs,
        ...nextPrefs
      }));
    } catch (error) {
      // Ignore storage failures so the UI still works in restricted browsers.
    }
  };

  root.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = root.getAttribute('data-theme');
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', nextTheme);
      runtimePrefs.theme = nextTheme;
      persistPrefs({ theme: nextTheme });
      updateThemeButton(nextTheme);
    });
  }

  const resolveScrollTarget = (target) => {
    if (!target) return target;
    if (target.id === 'home') return target;

    const headingTarget = target.matches('.section-title, h1, h2, h3, h4, h5, h6')
      ? target
      : target.querySelector('.section-title, h1, h2, h3, h4, h5, h6');

    return headingTarget || target;
  };

  const navigateToTarget = (target, options = {}) => {
    if (!target) return;

    const anchor = options.anchor || null;
    const isHeaderLink = Boolean(anchor?.closest('.site-header'));
    const usesExpandableHeader = typeof options.usesExpandableHeader === 'boolean'
      ? options.usesExpandableHeader
      : (isHeaderLink && hasExpandableHeader);
    const shouldLockHeader = options.lockHeader ?? isHeaderLink;
    const extraOffset = Number(options.extraOffset ?? (usesExpandableHeader ? 14 : (isHeaderLink ? 14 : 16)));

    if (shouldLockHeader && typeof site.lockHeaderVisibility === 'function') {
      site.lockHeaderVisibility('.site-header');
    }

    if (typeof site.scrollToElement === 'function') {
      site.scrollToElement(resolveScrollTarget(target), {
        extraOffset,
        stateClass: usesExpandableHeader ? 'header-title-visible' : undefined
      });
      return;
    }

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;

      event.preventDefault();
      navigateToTarget(target, { anchor });
    });
  });

  const revealTargets = document.querySelectorAll(
    '.glass-card, .rail-card, .timeline-item, .project-card, .award-card, .education-card, .skill-category, .contact-card'
  );

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        entry.target.style.transitionDelay = `${Math.min(Number(entry.target.dataset.revealIndex || 0) * 60, 240)}ms`;
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((target, index) => {
      target.dataset.revealIndex = String(index % 5);
      if (prefersReducedMotion) {
        target.classList.add('is-visible');
        return;
      }
      revealObserver.observe(target);
    });
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const homeHero = document.querySelector('.section-about');
  const homeHeroStageImage = document.querySelector('.home-browser-stage .browser-stage-image');
  const resumeModal = document.getElementById('resumeExperience');
  const resumeTrigger = document.getElementById('resumeCardTrigger');

  const getSideMenuFocusable = () => {
    if (!sideMenuState.shell) return [];

    return Array.from(
      sideMenuState.shell.querySelectorAll(
        'button:not([disabled]):not([tabindex="-1"]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('hidden'));
  };

  const syncSideMenuToggleState = () => {
    if (!sideMenuState.toggle) return;

    sideMenuState.toggle.classList.toggle('is-open', sideMenuState.isOpen);
    sideMenuState.toggle.setAttribute('aria-expanded', String(sideMenuState.isOpen));

    const label = sideMenuState.isOpen ? 'Close navigation menu' : 'Open navigation menu';
    sideMenuState.toggle.setAttribute('aria-label', label);
  };

  const closeLanguageDropdown = () => {
    const dropdown = document.querySelector('.lang-dropdown.show');
    dropdown?.classList.remove('show');
    langSwitcher?.classList.remove('is-open');
  };

  const syncResponsiveHeaderLabels = () => {
    const useCompactLabels = window.matchMedia('(max-width: 768px)').matches;

    document.querySelectorAll('[data-mobile-label]').forEach((element) => {
      const compactLabel = element.dataset.mobileLabel?.trim();
      const currentText = element.textContent?.trim();

      if (!compactLabel || !currentText) return;

      if (currentText !== compactLabel) {
        element.dataset.fullLabel = currentText;
      }

      const fullLabel = element.dataset.fullLabel || currentText;
      const nextLabel = useCompactLabels ? compactLabel : fullLabel;

      if (currentText !== nextLabel) {
        element.textContent = nextLabel;
      }
    });
  };

  const closeSideMenu = ({ restoreFocus = true } = {}) => {
    if (!sideMenuState.shell || !sideMenuState.isOpen) return;

    sideMenuState.isOpen = false;
    body.classList.remove('side-menu-open');
    sideMenuState.shell.classList.remove('is-open');
    sideMenuState.shell.setAttribute('aria-hidden', 'true');
    syncSideMenuToggleState();

    if (restoreFocus && sideMenuState.lastActiveElement instanceof HTMLElement) {
      sideMenuState.lastActiveElement.focus();
    }
  };

  const openSideMenu = () => {
    if (!sideMenuState.shell || sideMenuState.isOpen) return;

    sideMenuState.lastActiveElement = document.activeElement;
    sideMenuState.isOpen = true;
    closeLanguageDropdown();
    body.classList.add('side-menu-open');
    sideMenuState.shell.classList.add('is-open');
    sideMenuState.shell.setAttribute('aria-hidden', 'false');
    syncSideMenuToggleState();

    window.requestAnimationFrame(() => {
      const focusTarget = sideMenuState.closeButton || getSideMenuFocusable()[0];
      focusTarget?.focus();
    });
  };

  const handleSideMenuKeydown = (event) => {
    if (!sideMenuState.isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeSideMenu();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getSideMenuFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const renderSideMenu = () => {
    if (!body) return;

    body.classList.add('has-side-menu');

    const headerBar = document.querySelector('.site-header-bar');
    let leading = headerBar?.querySelector('.site-header-leading');

    if (headerBar && !leading) {
      leading = document.createElement('div');
      leading.className = 'site-header-leading';
      headerBar.insertBefore(leading, headerBar.firstChild);
    }

    const backButton = headerBar?.querySelector('.site-header-back');
    if (leading && backButton && backButton.parentElement !== leading) {
      leading.appendChild(backButton);
    }

    if (leading && !sideMenuState.toggle) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'control-btn side-menu-toggle';
      toggle.setAttribute('aria-controls', 'siteSideMenu');
      toggle.innerHTML = `
        <span class="side-menu-toggle-icon" aria-hidden="true">
          <span class="side-menu-toggle-line"></span>
          <span class="side-menu-toggle-line"></span>
          <span class="side-menu-toggle-line"></span>
        </span>
      `;
      toggle.addEventListener('click', () => {
        if (sideMenuState.isOpen) {
          closeSideMenu({ restoreFocus: false });
        } else {
          openSideMenu();
        }
      });
      leading.insertBefore(toggle, leading.firstChild);
      sideMenuState.toggle = toggle;
      syncSideMenuToggleState();
    }

    if (!sideMenuState.shell) {
      const shell = document.createElement('div');
      shell.className = 'side-menu-shell';
      shell.id = 'siteSideMenu';
      shell.setAttribute('aria-hidden', 'true');
      shell.innerHTML = `
        <button class="side-menu-backdrop" type="button" tabindex="-1" aria-label="Close navigation menu"></button>
        <aside class="side-menu-panel" role="dialog" aria-modal="true" aria-labelledby="sideMenuTitle">
          <div class="side-menu-panel-inner"></div>
        </aside>
      `;
      document.body.appendChild(shell);
      sideMenuState.shell = shell;
      sideMenuState.panel = shell.querySelector('.side-menu-panel');
      shell.querySelector('.side-menu-backdrop')?.addEventListener('click', () => closeSideMenu());
      document.addEventListener('keydown', handleSideMenuKeydown);
    }

    const pageLinks = getMenuPageLinks();
    const sectionLinks = getMenuSectionLinks();
    const homeLink = pageLinks.find((item) => item.id === 'home') || basePageLinks[0];
    const homeBrandHref = isCurrentPageLink('home')
      ? (homeLink.localHref === '__top__' ? '#' : homeLink.localHref)
      : homeLink.href;
    const panelInner = sideMenuState.shell.querySelector('.side-menu-panel-inner');

    panelInner.innerHTML = `
      <div class="side-menu-layout">
        <div class="side-menu-rail side-menu-rail-dark">
          <p class="side-menu-kicker">${window.JasonI18n?.translate?.('menu.kicker') || 'Browse'}</p>
          <h2 class="side-menu-current-title" id="sideMenuTitle">${getCurrentPageTitle()}</h2>
        </div>
        <div class="side-menu-rail side-menu-rail-accent" aria-hidden="true"></div>
        <div class="side-menu-content">
          <div class="side-menu-panel-head">
            <a
              class="side-menu-brand"
              href="${homeBrandHref}"
              ${isCurrentPageLink('home') ? 'data-side-menu-local="true"' : ''}
              ${homeLink.localHref === '__top__' ? 'data-side-menu-top="true"' : ''}
              aria-label="Jason AY home"
            >
              <img class="side-menu-brand-mark" src="assets/images/logos/web-logo/icon-transparent.png" alt="Jason AY logo">
              <span class="side-menu-brand-copy">
                <span class="side-menu-brand-title">Jason AY</span>
                <span class="side-menu-brand-subtitle">Portfolio</span>
              </span>
            </a>
            <button class="side-menu-close" type="button" aria-label="${window.JasonI18n?.translate?.('menu.closeAria') || 'Close navigation menu'}">${window.JasonI18n?.translate?.('menu.close') || 'Close'}</button>
          </div>
          <div class="side-menu-scroll">
            <div class="side-menu-group">
              <p class="side-menu-group-label">${window.JasonI18n?.translate?.('menu.pages') || 'Pages'}</p>
              <ul class="side-menu-primary-list">
                ${pageLinks.map((item, index) => {
                  const isCurrent = isCurrentPageLink(item.id);
                  const href = isCurrent
                    ? (item.localHref === '__top__' ? '#' : item.localHref)
                    : item.href;

                  return `
                    <li class="side-menu-primary-item" style="--menu-index:${index}">
                      <a
                        class="side-menu-primary-link${isCurrent ? ' is-current' : ''}"
                        href="${href}"
                        ${isCurrent ? 'data-side-menu-local="true"' : ''}
                        ${item.localHref === '__top__' ? 'data-side-menu-top="true"' : ''}
                        ${isCurrent ? 'aria-current="page"' : ''}
                      >
                        <span class="side-menu-primary-copy">
                          <span class="side-menu-primary-label">${item.label}</span>
                          <span class="side-menu-primary-meta">${item.meta}</span>
                        </span>
                        <span class="side-menu-primary-number">${String(index + 1).padStart(2, '0')}</span>
                      </a>
                    </li>
                  `;
                }).join('')}
              </ul>
            </div>
            ${sectionLinks.length ? `
              <div class="side-menu-group">
                <p class="side-menu-group-label">${window.JasonI18n?.translate?.('menu.onThisPage') || 'On this page'}</p>
                <div class="side-menu-sections">
                  ${sectionLinks.map((item, index) => `
                    <a class="side-menu-section-link" href="${item.href}" data-side-menu-section="true" style="--menu-index:${index}">
                      ${item.label}
                    </a>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    sideMenuState.closeButton = sideMenuState.shell.querySelector('.side-menu-close');
    sideMenuState.closeButton?.addEventListener('click', () => closeSideMenu());

    sideMenuState.shell.querySelector('.side-menu-brand')?.addEventListener('click', (event) => {
      const link = event.currentTarget;
      if (!(link instanceof HTMLAnchorElement)) return;

      if (link.dataset.sideMenuLocal !== 'true') {
        closeSideMenu({ restoreFocus: false });
        return;
      }

      event.preventDefault();
      closeSideMenu({ restoreFocus: false });

      if (link.dataset.sideMenuTop === 'true') {
        window.requestAnimationFrame(scrollToTop);
        return;
      }

      const target = document.querySelector(link.getAttribute('href'));
      if (!target) {
        window.requestAnimationFrame(scrollToTop);
        return;
      }

      window.requestAnimationFrame(() => {
        navigateToTarget(target, {
          anchor: link,
          lockHeader: true,
          usesExpandableHeader: hasExpandableHeader,
          extraOffset: hasExpandableHeader ? 14 : 16
        });
      });
    });

    sideMenuState.shell.querySelectorAll('.side-menu-primary-link').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (link.dataset.sideMenuLocal !== 'true') {
          closeSideMenu({ restoreFocus: false });
          return;
        }

        event.preventDefault();
        closeSideMenu({ restoreFocus: false });

        if (link.dataset.sideMenuTop === 'true') {
          window.requestAnimationFrame(scrollToTop);
          return;
        }

        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        window.requestAnimationFrame(() => {
          navigateToTarget(target, {
            anchor: link,
            lockHeader: true,
            usesExpandableHeader: hasExpandableHeader,
            extraOffset: hasExpandableHeader ? 14 : 16
          });
        });
      });
    });

    sideMenuState.shell.querySelectorAll('.side-menu-section-link').forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        event.preventDefault();
        closeSideMenu({ restoreFocus: false });
        window.requestAnimationFrame(() => {
          navigateToTarget(target, {
            anchor: link,
            lockHeader: true,
            usesExpandableHeader: hasExpandableHeader,
            extraOffset: hasExpandableHeader ? 14 : 16
          });
        });
      });
    });

    site.applyNoBreakPhrases?.(sideMenuState.shell);
  };

  const updateScrollProgress = () => {
    const scrollable = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const scrollProgress = window.scrollY / scrollable;
    root.style.setProperty('--scroll-progress', scrollProgress.toFixed(3));
  };

  const bindHomeHeroImagePan = () => {
    if (!homeHero || !homeHeroStageImage) return;

    const updatePosition = () => {
      const stage = homeHeroStageImage.parentElement;
      const stageRect = stage?.getBoundingClientRect();
      const naturalWidth = homeHeroStageImage.naturalWidth || 0;
      const naturalHeight = homeHeroStageImage.naturalHeight || 0;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      const sectionTop = homeHero.offsetTop || 0;
      const sectionScrollRange = Math.max(homeHero.offsetHeight * 0.8, 1);

      if (!stage || !stageRect || !naturalWidth || !naturalHeight) return;

      const progress = Math.min(Math.max((window.scrollY - sectionTop) / sectionScrollRange, 0), 1);
      const imageRatio = naturalWidth / naturalHeight;
      const stageRatio = stageRect.width / Math.max(stageRect.height, 1);
      const desktopViewport = Math.min(Math.max((viewportWidth - 980) / 620, 0), 1);
      const tabletViewport = Math.min(Math.max((viewportWidth - 768) / 212, 0), 1);
      const focusWidth =
        viewportWidth > 980
          ? Math.min(Math.max(stageRect.width * (0.45 + ((1 - desktopViewport) * 0.04)), 560), 790)
          : viewportWidth > 768
            ? Math.min(Math.max(stageRect.width * (0.63 - (tabletViewport * 0.05)), 430), 650)
            : Math.min(Math.max(stageRect.width * 0.9, 340), 520);
      const portraitZoom =
        viewportWidth > 980
          ? 1.035 + ((1 - desktopViewport) * 0.03)
          : viewportWidth > 768
            ? 1.08 + ((1 - tabletViewport) * 0.03)
            : 1.115;
      const focusLeft = viewportWidth > 980 ? 49.2 : viewportWidth > 768 ? 51 : 52;
      const portraitPositionX = viewportWidth > 980 ? 48.6 : viewportWidth > 768 ? 46.5 : 45.4;
      const baseImageScale = viewportWidth > 980 ? 1.04 + ((1 - desktopViewport) * 0.03) : viewportWidth > 768 ? 1.06 : 1.085;
      const baseImageShiftX = viewportWidth > 980 ? 20 + ((1 - desktopViewport) * 8) : viewportWidth > 768 ? 15 : 10;
      const baseBlur = viewportWidth > 980 ? 8.2 + ((1 - desktopViewport) * 1.4) : viewportWidth > 768 ? 9.1 : 9.9;
      const panX = Number(homeHeroStageImage.dataset.panX || 50);
      const rangeStart = Number(homeHeroStageImage.dataset.panStart || 14);
      const rangeEnd = Number(homeHeroStageImage.dataset.panEnd || 62);
      const horizontalStart = Number(homeHeroStageImage.dataset.panXStart || 42);
      const horizontalEnd = Number(homeHeroStageImage.dataset.panXEnd || 54);

      stage.style.setProperty('--home-focus-width', `${focusWidth.toFixed(1)}px`);
      stage.style.setProperty('--home-focus-left', `${focusLeft.toFixed(1)}%`);
      stage.style.setProperty('--home-portrait-zoom', portraitZoom.toFixed(3));
      stage.style.setProperty('--home-portrait-position-x', `${portraitPositionX.toFixed(1)}%`);

      if (prefersReducedMotion) {
        stage.style.setProperty('--home-image-scale', baseImageScale.toFixed(3));
        stage.style.setProperty('--home-image-shift-x', `${baseImageShiftX.toFixed(1)}px`);
        stage.style.setProperty('--home-image-shift', '0px');
        stage.style.setProperty('--home-overlay-opacity', '0.72');
        stage.style.setProperty('--home-image-brightness', '0.86');
        stage.style.setProperty('--home-image-saturate', '1.02');
        stage.style.setProperty('--home-image-blur', `${baseBlur.toFixed(2)}px`);
        stage.style.setProperty('--home-focus-shift', '0px');
        stage.style.setProperty('--home-focus-scale', '1');
        stage.style.setProperty('--home-portrait-image-shift', '0px');
        homeHeroStageImage.style.objectPosition = imageRatio > stageRatio ? `${panX}% 50%` : `${panX}% ${rangeStart}%`;
        return;
      }

      const imageScale = baseImageScale + (progress * 0.04);
      const imageShiftX = baseImageShiftX + (progress * 8);
      const imageShift = progress * -28;
      const overlayOpacity = 0.72 - (progress * 0.05);
      const brightness = 0.86 + (progress * 0.06);
      const saturate = 1.02 + (progress * 0.05);
      const blur = Math.max(baseBlur - (progress * 1.1), 5.1);
      const focusShift = progress * -44;
      const focusScale = 1 + (progress * 0.022);
      const portraitImageShift = progress * -28;

      stage.style.setProperty('--home-image-scale', imageScale.toFixed(3));
      stage.style.setProperty('--home-image-shift-x', `${imageShiftX.toFixed(1)}px`);
      stage.style.setProperty('--home-image-shift', `${imageShift.toFixed(1)}px`);
      stage.style.setProperty('--home-overlay-opacity', overlayOpacity.toFixed(3));
      stage.style.setProperty('--home-image-brightness', brightness.toFixed(3));
      stage.style.setProperty('--home-image-saturate', saturate.toFixed(3));
      stage.style.setProperty('--home-image-blur', `${blur.toFixed(2)}px`);
      stage.style.setProperty('--home-focus-shift', `${focusShift.toFixed(1)}px`);
      stage.style.setProperty('--home-focus-scale', focusScale.toFixed(3));
      stage.style.setProperty('--home-portrait-image-shift', `${portraitImageShift.toFixed(1)}px`);

      if (imageRatio > stageRatio) {
        const x = horizontalStart + ((horizontalEnd - horizontalStart) * progress);
        homeHeroStageImage.style.objectPosition = `${x}% 50%`;
        return;
      }

      const y = rangeStart + ((rangeEnd - rangeStart) * progress);
      homeHeroStageImage.style.objectPosition = `${panX}% ${y}%`;
    };

    let ticking = false;
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        updatePosition();
      });
    };

    if (homeHeroStageImage.complete) {
      updatePosition();
    } else {
      homeHeroStageImage.addEventListener('load', updatePosition, { once: true });
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
  };

  const bindResumeModal = () => {
    if (!resumeModal || !resumeTrigger) return;

    const closeButton = resumeModal.querySelector('[data-resume-close]');
    let hideTimer = null;
    let lastActiveElement = null;
    const primaryAction = resumeModal.querySelector('[data-resume-primary]');
    const versionChoices = resumeModal.querySelectorAll('[data-resume-choice]');

    const clearResumeTimers = () => {
      window.clearTimeout(hideTimer);
    };

    const openResumeModal = () => {
      clearResumeTimers();
      lastActiveElement = document.activeElement;
      resumeModal.hidden = false;
      resumeModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');

      window.requestAnimationFrame(() => {
        resumeModal.classList.add('is-open');
      });

      primaryAction?.focus();
    };

    const closeResumeModal = ({ restoreFocus = true } = {}) => {
      clearResumeTimers();
      resumeModal.classList.remove('is-open');
      resumeModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');

      hideTimer = window.setTimeout(() => {
        resumeModal.hidden = true;
      }, prefersReducedMotion ? 0 : 420);

      if (restoreFocus && lastActiveElement instanceof HTMLElement) {
        lastActiveElement.focus();
      }
    };

    resumeTrigger.addEventListener('click', openResumeModal);
    closeButton?.addEventListener('click', closeResumeModal);
    versionChoices.forEach((choice) => {
      choice.addEventListener('click', () => {
        closeResumeModal({ restoreFocus: false });
      });
    });

    resumeModal.addEventListener('click', (event) => {
      if (event.target === resumeModal) {
        closeResumeModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && resumeModal.classList.contains('is-open')) {
        closeResumeModal();
      }
    });
  };

  const bindAssetProtection = () => {
    document.querySelectorAll('img').forEach((image) => {
      image.setAttribute('draggable', 'false');
      image.setAttribute('data-protected-media', 'true');
    });

    document.addEventListener('dragstart', (event) => {
      const media = event.target instanceof Element ? event.target.closest('img') : null;
      if (!media) return;
      event.preventDefault();
    });

    document.addEventListener('contextmenu', (event) => {
      const media = event.target instanceof Element ? event.target.closest('img') : null;
      if (!media) return;
      event.preventDefault();
    });
  };

  const setActiveLink = (id) => {
    document.querySelectorAll('.nav-links a[href^="#"], .side-menu-section-link[href^="#"]').forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isActive);
    });
  };

  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const activeId = visible.target.id;
      setActiveLink(activeId);
      root.style.setProperty('--active-section-progress', String(visible.intersectionRatio.toFixed(2)));
    }, { threshold: [0.2, 0.45, 0.7], rootMargin: '-20% 0px -35% 0px' });

    sections.forEach((section) => sectionObserver.observe(section));
  } else if (sections[0]) {
    setActiveLink(sections[0].id);
  }

  renderSideMenu();
  updateScrollProgress();
  bindHomeHeroImagePan();
  bindResumeModal();
  bindAssetProtection();
  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  if ((header || nav) && typeof site.bindHeaderVisibility === 'function') {
    site.bindHeaderVisibility(header || nav, {
      hideDistance: 22,
      showDistance: 4,
      freezeWhen: () => body.classList.contains('side-menu-open') || Boolean(document.querySelector('.lang-switcher.is-open, .lang-dropdown.show, .lightbox.active, .resume-modal.is-open, .chat-window.active, .chat-backdrop.active, .site-search-modal.is-open, .site-search-backdrop.active'))
    });
  }

  const contactForm = document.getElementById('contactForm');
  const contactFormStatus = document.getElementById('contactFormStatus');

  if (contactForm && contactFormStatus) {
    const contactFormReadyText = 'Form UI ready. Delivery goes live after the Google Sheets step.';

    const resetContactFormStatus = () => {
      contactFormStatus.textContent = contactFormReadyText;
      delete contactFormStatus.dataset.state;
    };

    contactForm.addEventListener('input', () => {
      if (contactFormStatus.dataset.state) {
        resetContactFormStatus();
      }
    });

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!contactForm.reportValidity()) {
        contactFormStatus.textContent = 'Please complete your name, email, and message before sending.';
        contactFormStatus.dataset.state = 'error';
        return;
      }

      contactFormStatus.textContent = 'Form looks ready. The next step is connecting it to Google Sheets so messages can be delivered.';
      contactFormStatus.dataset.state = 'info';
    });
  }

  if (langSwitcher) {
    const dropdown = langSwitcher.querySelector('.lang-dropdown');
    const toggle = langSwitcher.querySelector('.lang-toggle');
    const buttons = langSwitcher.querySelectorAll('.lang-btn');

    if (dropdown) {
      const observer = new MutationObserver(() => {
        langSwitcher.classList.toggle('is-open', dropdown.classList.contains('show'));
      });
      observer.observe(dropdown, { attributes: true, attributeFilter: ['class'] });
    }

    if (toggle) {
      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof window.toggleLangDropdown === 'function') {
          window.toggleLangDropdown();
        }
      });
    }

    buttons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof window.setLanguage === 'function') {
          window.setLanguage(button.dataset.lang);
        }
      });
    });
  }

  if (document.body.dataset.page === 'policy') {
    const policyTitle = document.querySelector('.site-header-title');
    if (policyTitle) {
      policyTitle.setAttribute('tabindex', '0');
      policyTitle.setAttribute('role', 'button');
      policyTitle.setAttribute('aria-hidden', 'false');

      const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      };

      policyTitle.addEventListener('click', scrollToTop);
      policyTitle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          scrollToTop();
        }
      });
    }
  }

  window.addEventListener('site:languagechange', () => {
    syncResponsiveHeaderLabels();
    renderSideMenu();

    const activeHash = document.querySelector('.nav-links a.is-active[href^="#"]')?.getAttribute('href')?.slice(1);
    if (activeHash) {
      setActiveLink(activeHash);
    }

    if (sideMenuState.isOpen) {
      window.requestAnimationFrame(() => sideMenuState.closeButton?.focus());
    }
  });

  if (!prefersReducedMotion) {
    const magneticButtons = document.querySelectorAll('.magnetic-btn');
    const spotlightTargets = document.querySelectorAll('.hero-content, .rail-card, .project-card');

    window.addEventListener('pointermove', (event) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      root.style.setProperty('--pointer-x', x.toFixed(3));
      root.style.setProperty('--pointer-y', y.toFixed(3));
    }, { passive: true });

    magneticButtons.forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
      });

      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });

    let lastSpotlight = null;
    spotlightTargets.forEach((target) => {
      target.addEventListener('mouseenter', () => {
        if (lastSpotlight && lastSpotlight !== target) {
          lastSpotlight.classList.remove('scroll-spotlight');
        }
        target.classList.add('scroll-spotlight');
        lastSpotlight = target;
      });

      target.addEventListener('mouseleave', () => {
        target.classList.remove('scroll-spotlight');
      });
    });
  }

  syncResponsiveHeaderLabels();
  window.addEventListener('resize', syncResponsiveHeaderLabels, { passive: true });
})();
