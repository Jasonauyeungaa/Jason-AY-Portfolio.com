(() => {
  const site = window.JasonSite || {};
  const mediaGallery = document.getElementById('mediaGallery');
  const categoryButtons = Array.from(document.querySelectorAll('.category-btn'));
  const monthSections = Array.from(document.querySelectorAll('.month-section'));
  const languageLinks = Array.from(document.querySelectorAll('[data-lang-link]'));
  const heroSection = document.querySelector('.coop-hero');
  const heroStageImage = document.querySelector('.coop-browser-stage .browser-stage-image');
  const mediaFiles = window.JasonMedia?.coop || [];
  let activeCategory = 'all';

  const fallbackCaption = (src) => site.fallbackCaptionFromSrc?.(src) || '';
  const getLocalizedText = (value, fallback = '') => site.resolveLocalizedValue?.(value, fallback) || fallback;

  const updateLanguageAwareLinks = () => {
    if (!languageLinks.length) return;

    const lang = window.JasonRuntimePrefs?.language || document.documentElement.lang || 'en';

    languageLinks.forEach((link) => {
      if (link.dataset.langLink !== 'haeco') return;

      const hrefMap = {
        en: link.dataset.hrefEn,
        'zh-TW': link.dataset.hrefZhTw,
        'zh-CN': link.dataset.hrefZhCn,
        es: link.dataset.hrefEs || link.dataset.hrefEn
      };

      link.href = hrefMap[lang] || hrefMap.en || link.href;
    });
  };

  const renderMediaGallery = (category = activeCategory) => {
    if (!mediaGallery) return;

    activeCategory = category;
    const filteredMedia = category === 'all'
      ? mediaFiles
      : mediaFiles.filter((item) => item.category === category);

    mediaGallery.innerHTML = filteredMedia.map((item, index) => `
      <article class="media-item glass-card is-visible" data-media-index="${index}" role="button" tabindex="0" aria-label="${getLocalizedText(item.caption, fallbackCaption(item.src))}">
        <div class="media-frame">
          ${item.type === 'video'
            ? `<video src="${item.src}" muted loop playsinline></video>`
            : `<img src="${item.src}" alt="${getLocalizedText(item.caption, fallbackCaption(item.src))}" loading="lazy">`
          }
        </div>
        <div class="media-meta">
          <span class="media-chip">${getLocalizedText(item.label, item.category)}</span>
          <p class="media-caption">${getLocalizedText(item.caption, fallbackCaption(item.src))}</p>
        </div>
      </article>
    `).join('');
    site.bindMediaGallery?.(mediaGallery, filteredMedia);
    site.applyNoBreakPhrases?.(mediaGallery);
  };

  const bindHeroImagePan = () => {
    if (!heroSection || !heroStageImage) return;

    const updatePosition = () => {
      const rect = heroSection.getBoundingClientRect();
      const stageRect = heroStageImage.parentElement?.getBoundingClientRect();
      const stage = heroStageImage.parentElement;
      const naturalWidth = heroStageImage.naturalWidth || 0;
      const naturalHeight = heroStageImage.naturalHeight || 0;

      if (!stage || !stageRect || !naturalWidth || !naturalHeight) return;

      const scrollSpan = rect.height + window.innerHeight;
      const progress = Math.min(Math.max((window.innerHeight - rect.top) / scrollSpan, 0), 1);
      const imageRatio = naturalWidth / naturalHeight;
      const stageRatio = stageRect.width / Math.max(stageRect.height, 1);
      const panX = Number(heroStageImage.dataset.panX || 50);
      const rangeStart = Number(heroStageImage.dataset.panStart || 8);
      const rangeEnd = Number(heroStageImage.dataset.panEnd || 92);
      const horizontalStart = Number(heroStageImage.dataset.panXStart || 8);
      const horizontalEnd = Number(heroStageImage.dataset.panXEnd || 92);
      const isNarrowViewport = window.innerWidth <= 768;
      const scale = 1.045 + (progress * 0.03);
      const overlayOpacity = 0.72 - (progress * 0.14);
      const brightness = 0.95 + (progress * 0.05);
      const saturate = 1.02 + (progress * 0.08);
      const shiftY = isNarrowViewport ? (progress * -72) : 0;

      if (site.prefersReducedMotion) {
        stage.style.setProperty('--coop-image-scale', '1.045');
        stage.style.setProperty('--coop-overlay-opacity', '0.68');
        stage.style.setProperty('--coop-image-brightness', '0.95');
        stage.style.setProperty('--coop-image-saturate', '1.02');
        stage.style.setProperty('--coop-image-shift-y', '0px');
        heroStageImage.style.objectPosition = imageRatio > stageRatio ? `${panX}% 50%` : `${panX}% ${rangeStart}%`;
        return;
      }

      stage.style.setProperty('--coop-image-scale', (scale + (isNarrowViewport ? 0.05 : 0)).toFixed(3));
      stage.style.setProperty('--coop-overlay-opacity', overlayOpacity.toFixed(3));
      stage.style.setProperty('--coop-image-brightness', brightness.toFixed(3));
      stage.style.setProperty('--coop-image-saturate', saturate.toFixed(3));
      stage.style.setProperty('--coop-image-shift-y', `${shiftY.toFixed(1)}px`);

      if (imageRatio > stageRatio && !isNarrowViewport) {
        const x = horizontalStart + ((horizontalEnd - horizontalStart) * progress);
        heroStageImage.style.objectPosition = `${x}% 50%`;
        return;
      }

      const y = rangeStart + ((rangeEnd - rangeStart) * progress);
      heroStageImage.style.objectPosition = `${panX}% ${y}%`;
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

    if (heroStageImage.complete) {
      updatePosition();
    } else {
      heroStageImage.addEventListener('load', updatePosition, { once: true });
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
  };

  const updateMonthHeaderState = (section) => {
    const trigger = section.querySelector('.month-trigger');
    const details = section.querySelector('.month-details');
    const isExpanded = section.classList.contains('expanded');

    if (trigger) {
      trigger.setAttribute('aria-expanded', String(isExpanded));
    }

    if (details) {
      details.setAttribute('aria-hidden', String(!isExpanded));
      details.inert = !isExpanded;
    }
  };

  const toggleMonth = (element) => {
    monthSections.forEach((section) => {
      const isTarget = section === element;
      const shouldExpand = isTarget ? section.classList.contains('collapsed') : false;

      section.classList.toggle('expanded', shouldExpand);
      section.classList.toggle('collapsed', !shouldExpand);
      updateMonthHeaderState(section);
    });
  };

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      categoryButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      renderMediaGallery(button.dataset.category || 'all');
    });
  });

  monthSections.forEach((section) => {
    const trigger = section.querySelector('.month-trigger');
    const details = section.querySelector('.month-details');

    if (trigger) {
      if (details) {
        const detailsId = details.id || `coop-month-details-${monthSections.indexOf(section) + 1}`;
        details.id = detailsId;
        trigger.setAttribute('aria-controls', detailsId);
        trigger.id = `${detailsId}-trigger`;
        details.setAttribute('role', 'region');
        details.setAttribute('aria-labelledby', trigger.id);
      }

      updateMonthHeaderState(section);
      trigger.addEventListener('click', () => toggleMonth(section));
    }
  });

  site.bindTitleReveal?.({
    titleSelector: '.site-header-title',
    heroSelector: '.coop-hero',
    scrollThreshold: 48
  });

  bindHeroImagePan();
  updateLanguageAwareLinks();

  if (mediaFiles.length) {
    renderMediaGallery(activeCategory);
  }

  window.addEventListener('site:languagechange', () => {
    renderMediaGallery(activeCategory);
    updateLanguageAwareLinks();
  });

  const taskItems = document.querySelectorAll('.task-item');
  if (site.prefersReducedMotion || !('IntersectionObserver' in window)) {
    taskItems.forEach((item) => {
      item.style.opacity = '1';
      item.style.transform = 'translateX(0)';
    });
  } else {
    const taskObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateX(0)';
      });
    }, { threshold: 0.1 });

    taskItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
      item.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
      taskObserver.observe(item);
    });
  }
})();
