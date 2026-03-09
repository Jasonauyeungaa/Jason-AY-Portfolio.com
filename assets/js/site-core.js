(() => {
  const runtimePrefs = window.JasonRuntimePrefs || (window.JasonRuntimePrefs = {});
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const resolveLocalizedValue = (value, fallback = '') => {
    if (value == null) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value !== 'object') return String(value);

    const currentLang = runtimePrefs.language || document.documentElement.lang || 'en';
    return value[currentLang] || value.en || Object.values(value)[0] || fallback;
  };

  const normalizeNoBreakText = (value) => {
    if (value == null) return value;

    return String(value)
      .replace(/\bAu-Yeung\b/g, 'Au\u2011Yeung')
      .replace(/\bCo-op\b/g, 'Co\u2011op')
      .replace(/\bHong Kong\b/g, 'Hong\u00A0Kong');
  };

  const applyNoBreakPhrases = (root = document.body) => {
    if (!root || typeof document.createTreeWalker !== 'function') return;

    const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parentTag = node.parentElement?.tagName;
        return ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parentTag)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });

    let textNode = textWalker.nextNode();
    while (textNode) {
      const normalized = normalizeNoBreakText(textNode.nodeValue);
      if (normalized !== textNode.nodeValue) {
        textNode.nodeValue = normalized;
      }
      textNode = textWalker.nextNode();
    }

    const scope = root.querySelectorAll
      ? [root, ...root.querySelectorAll('[title], [aria-label], [placeholder], img[alt]')]
      : [root];

    scope.forEach((element) => {
      if (!(element instanceof Element)) return;

      ['title', 'aria-label', 'placeholder', 'alt'].forEach((attribute) => {
        const currentValue = element.getAttribute(attribute);
        if (!currentValue) return;

        const normalized = normalizeNoBreakText(currentValue);
        if (normalized !== currentValue) {
          element.setAttribute(attribute, normalized);
        }
      });
    });

    document.title = normalizeNoBreakText(document.title);
  };

  const getNavHeight = ({
    stateTargetSelector = '.site-header',
    stateClass
  } = {}) => {
    const nav = document.querySelector('.glass-nav');
    if (!nav) return 0;

    if (!stateClass) {
      return nav.offsetHeight || 0;
    }

    const stateTarget = document.querySelector(stateTargetSelector);
    if (!stateTarget || stateTarget.classList.contains(stateClass)) {
      return nav.offsetHeight || 0;
    }

    stateTarget.classList.add(stateClass);
    const measuredHeight = nav.offsetHeight || 0;
    stateTarget.classList.remove(stateClass);

    return measuredHeight;
  };

  const scrollToElement = (target, options = {}) => {
    if (!target) return;

    const requestedNavHeight = Number(options.navHeight);
    const navHeight = Number.isFinite(requestedNavHeight)
      ? requestedNavHeight
      : Math.max(
        getNavHeight(),
        getNavHeight({
          stateTargetSelector: options.stateTargetSelector,
          stateClass: options.stateClass
        })
      );
    const extraOffset = Number(options.extraOffset ?? 0);
    const top = window.scrollY + target.getBoundingClientRect().top - navHeight - extraOffset;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: options.behavior || (prefersReducedMotion ? 'auto' : 'smooth')
    });
  };

  const bindHeaderVisibility = (nav, options = {}) => {
    if (!nav) return () => {};

    const topLimit = Number(options.topLimit ?? 24);
    const hideDistance = Number(options.hideDistance ?? Math.max(nav.offsetHeight * 0.4, 20));
    const showDistance = Number(options.showDistance ?? Math.max(nav.offsetHeight * 0.24, 12));
    const freezeWhen = typeof options.freezeWhen === 'function' ? options.freezeWhen : () => false;

    let lastScrollY = window.scrollY;
    let direction = 'up';
    let travel = 0;
    let hidden = false;
    let ticking = false;

    const unlockVisibility = () => {
      if (!nav.classList.contains('header-visibility-locked')) return;
      nav.classList.remove('header-visibility-locked');
      travel = 0;
      lastScrollY = window.scrollY;
      apply(false);
    };

    const isVisibilityLocked = () => nav.classList.contains('header-visibility-locked');

    const apply = (shouldHide) => {
      if (hidden === shouldHide) return;
      hidden = shouldHide;
      nav.classList.toggle('nav-hidden', shouldHide);
    };

    const update = () => {
      ticking = false;

      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (Math.abs(delta) < 1) return;

      const nextDirection = delta > 0 ? 'down' : 'up';
      if (nextDirection !== direction) {
        direction = nextDirection;
        travel = delta;
      } else {
        travel += delta;
      }

      lastScrollY = currentScrollY;

      if (isVisibilityLocked() || freezeWhen()) {
        travel = 0;
        apply(false);
        return;
      }

      if (currentScrollY <= topLimit) {
        travel = 0;
        apply(false);
        return;
      }

      if (direction === 'down' && travel >= hideDistance) {
        apply(true);
      } else if (direction === 'up' && travel <= -showDistance) {
        apply(false);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    const onKeyDown = (event) => {
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) return;
      unlockVisibility();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('wheel', unlockVisibility, { passive: true });
    window.addEventListener('touchmove', unlockVisibility, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('wheel', unlockVisibility);
      window.removeEventListener('touchmove', unlockVisibility);
      window.removeEventListener('keydown', onKeyDown);
    };
  };

  const bindTitleReveal = ({
    titleSelector,
    heroSelector,
    offset = 100,
    scrollThreshold = 0,
    stateTargetSelector = '.site-header',
    stateClass = 'header-title-visible'
  }) => {
    const title = document.querySelector(titleSelector);
    const hero = document.querySelector(heroSelector);
    if (!title || !hero) return () => {};
    const stateTarget = document.querySelector(stateTargetSelector);

    let ticking = false;
    title.setAttribute('tabindex', '-1');
    title.setAttribute('role', 'button');

    const update = () => {
      ticking = false;
      const heroBottom = hero.getBoundingClientRect().bottom;
      const triggerPoint = getNavHeight() + Number(offset);
      const threshold = Number(scrollThreshold);
      const visible = threshold > 0
        ? window.scrollY >= threshold
        : heroBottom <= triggerPoint;

      title.classList.toggle('visible', visible);
      title.setAttribute('tabindex', visible ? '0' : '-1');
      title.setAttribute('aria-hidden', String(!visible));
      stateTarget?.classList.toggle(stateClass, visible);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    title.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    title.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      stateTarget?.classList.remove(stateClass);
    };
  };

  const openLightbox = (media) => {
    if (!media?.src) return null;

    const existing = document.querySelector('.lightbox.active');
    if (existing) {
      existing.remove();
    }

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox active';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    const captionText = resolveLocalizedValue(media.caption, '');
    const mediaLabel = resolveLocalizedValue(media.label, '');
    const accessibleLabel = captionText || mediaLabel || 'Media preview';

    lightbox.setAttribute('aria-label', accessibleLabel);

    const preview = media.type === 'video'
      ? `<video src="${escapeHtml(media.src)}" controls autoplay playsinline></video>`
      : `<img src="${escapeHtml(media.src)}" alt="${escapeHtml(accessibleLabel)}">`;
    const caption = captionText
      ? `<p class="lightbox-caption">${escapeHtml(captionText)}</p>`
      : '';

    lightbox.innerHTML = `
      <div class="lightbox-shell">
        <button class="lightbox-close" type="button" aria-label="Close preview">×</button>
        <div class="lightbox-content">
          ${preview}
        </div>
        ${caption}
      </div>
    `;

    const close = () => {
      document.body.classList.remove('lightbox-open');
      lightbox.remove();
      document.removeEventListener('keydown', onKeyDown);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    lightbox.querySelector('.lightbox-close')?.addEventListener('click', close);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        close();
      }
    });

    document.body.classList.add('lightbox-open');
    document.body.appendChild(lightbox);
    document.addEventListener('keydown', onKeyDown);

    return lightbox;
  };

  const bindMediaGallery = (container, mediaItems = []) => {
    if (!container || !Array.isArray(mediaItems) || !mediaItems.length) return;

    container.querySelectorAll('.media-item').forEach((item) => {
      const openFromIndex = () => {
        const media = mediaItems[Number(item.dataset.mediaIndex)];
        if (!media) return;
        openLightbox(media);
      };

      item.addEventListener('click', openFromIndex);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openFromIndex();
        }
      });

      const video = item.querySelector('video');
      if (!video) return;

      item.addEventListener('mouseenter', () => video.play());
      item.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    });
  };

  window.JasonSite = {
    prefersReducedMotion,
    applyNoBreakPhrases,
    scrollToElement,
    bindHeaderVisibility,
    bindTitleReveal,
    openLightbox,
    bindMediaGallery,
    lockHeaderVisibility: (selector = '.site-header') => {
      document.querySelector(selector)?.classList.add('header-visibility-locked');
    }
  };
})();
