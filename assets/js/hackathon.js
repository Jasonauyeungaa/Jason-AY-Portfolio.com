(() => {
  const site = window.JasonSite || {};
  const videoContainer = document.querySelector('.video-container');
  const gallery = document.getElementById('hackathonGallery');
  const heroSection = document.querySelector('.hackathon-hero');
  const heroStageImage = document.querySelector('.hackathon-browser-stage .browser-stage-image');
  const teamStage = document.querySelector('.team-stage');
  const teamSteps = Array.from(document.querySelectorAll('[data-team-step]'));
  const teamProgressItems = Array.from(document.querySelectorAll('[data-team-progress]'));
  const teamFigures = Array.from(document.querySelectorAll('.team-figure[data-team-member]'));
  const teamFocusCopies = Array.from(document.querySelectorAll('.team-focus-copy[data-team-member]'));
  const teamSummaries = Array.from(document.querySelectorAll('.team-focus-summary'));
  const videoPath = window.JasonMedia?.hackathonVideo?.src || 'assets/videos/demo.mp4';
  const mediaFiles = window.JasonMedia?.hackathonGallery || [];
  const fallbackCaption = (src) => site.fallbackCaptionFromSrc?.(src) || '';
  const getLocalizedText = (value, fallback = '') => site.resolveLocalizedValue?.(value, fallback) || fallback;

  const loadDemoVideo = () => {
    if (!videoContainer) return;

    const video = document.createElement('video');
    video.src = videoPath;
    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;

    video.addEventListener('error', () => {
      videoContainer.innerHTML = '<p class="video-fallback">Demo video unavailable.</p>';
    });

    videoContainer.innerHTML = '';
    videoContainer.appendChild(video);
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
      const scale = 1.05 + (progress * 0.035);
      const overlayOpacity = 0.78 - (progress * 0.14);
      const brightness = 0.94 + (progress * 0.06);
      const saturate = 1.02 + (progress * 0.1);

      if (site.prefersReducedMotion) {
        stage.style.setProperty('--hackathon-image-scale', '1.05');
        stage.style.setProperty('--hackathon-overlay-opacity', '0.72');
        stage.style.setProperty('--hackathon-image-brightness', '0.94');
        stage.style.setProperty('--hackathon-image-saturate', '1.02');
        heroStageImage.style.objectPosition = imageRatio > stageRatio ? `${panX}% 50%` : `${panX}% ${rangeStart}%`;
        return;
      }

      stage.style.setProperty('--hackathon-image-scale', scale.toFixed(3));
      stage.style.setProperty('--hackathon-overlay-opacity', overlayOpacity.toFixed(3));
      stage.style.setProperty('--hackathon-image-brightness', brightness.toFixed(3));
      stage.style.setProperty('--hackathon-image-saturate', saturate.toFixed(3));

      if (imageRatio > stageRatio) {
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

  const renderGallery = () => {
    if (!gallery || !mediaFiles.length) return;

    gallery.innerHTML = mediaFiles.map((item, index) => `
      <article class="media-item glass-card is-visible" data-media-index="${index}" role="button" tabindex="0" aria-label="${getLocalizedText(item.caption, fallbackCaption(item.src))}">
        <div class="media-frame">
          <img src="${item.src}" alt="${getLocalizedText(item.caption, fallbackCaption(item.src))}" loading="lazy">
        </div>
        <div class="media-meta">
          <span class="media-chip">${getLocalizedText(item.label, 'Highlight')}</span>
          <p class="media-caption">${getLocalizedText(item.caption, fallbackCaption(item.src))}</p>
        </div>
      </article>
    `).join('');
    site.bindMediaGallery?.(gallery, mediaFiles);
    site.applyNoBreakPhrases?.(gallery);
  };

  const updateResponsiveTeamSummaries = () => {
    if (!teamSummaries.length) return;

    const isMobile = window.innerWidth <= 768;

    teamSummaries.forEach((summary) => {
      const memberId = summary.closest('.team-focus-copy')?.dataset.teamMember;
      if (!memberId) return;

      const key = isMobile
        ? `hack.team.${memberId}.summaryShort`
        : `hack.team.${memberId}.summary`;
      const fallbackKey = `hack.team.${memberId}.summary`;
      const translated = window.JasonI18n?.translate(key) || window.JasonI18n?.translate(fallbackKey);

      if (translated) {
        summary.textContent = translated;
      }
    });

    site.applyNoBreakPhrases?.(teamStage || document.body);
  };

  const bindTeamScrollShowcase = () => {
    if (!teamSteps.length || !teamStage) return;

    let activeMemberId = null;

    const scrollToTeamMember = (memberId) => {
      const targetStep = teamSteps.find((step) => step.dataset.teamStep === memberId);
      if (!targetStep) return;

      targetStep.scrollIntoView({
        behavior: site.prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    };

    const setActiveMember = (memberId) => {
      if (!memberId || memberId === activeMemberId) return;
      activeMemberId = memberId;
      const activeIndex = teamSteps.findIndex((step) => step.dataset.teamStep === memberId);

      teamSteps.forEach((step) => {
        step.classList.toggle('is-active', step.dataset.teamStep === memberId);
      });

      teamProgressItems.forEach((item, index) => {
        const isCurrent = item.dataset.teamProgress === memberId;
        item.classList.toggle('is-active', isCurrent);
        item.classList.toggle('is-reached', activeIndex >= 0 && index <= activeIndex);
        item.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      });

      teamFigures.forEach((figure) => {
        figure.classList.toggle('is-active', figure.dataset.teamMember === memberId);
      });

      teamFocusCopies.forEach((copy) => {
        copy.classList.toggle('is-active', copy.dataset.teamMember === memberId);
      });
    };

    teamProgressItems.forEach((item) => {
      const memberId = item.dataset.teamProgress;
      if (!memberId) return;

      const activateFromRail = () => {
        setActiveMember(memberId);
        scrollToTeamMember(memberId);
      };

      item.addEventListener('click', activateFromRail);
      item.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        activateFromRail();
      });
    });

    const firstMember = teamSteps[0].dataset.teamStep;
    if (firstMember) {
      setActiveMember(firstMember);
    }

    if (site.prefersReducedMotion) {
      return;
    }

    const updateFromScroll = () => {
      const focusLine = window.innerWidth <= 768
        ? window.innerHeight * 0.72
        : window.innerWidth <= 980
          ? Math.min(window.innerHeight * 0.42, 260)
          : Math.min(window.innerHeight * 0.42, 240);

      let closestStep = null;
      let smallestDistance = Number.POSITIVE_INFINITY;

      teamSteps.forEach((step) => {
        const rect = step.getBoundingClientRect();
        const stepAnchor = window.innerWidth <= 768
          ? rect.top + (rect.height * 0.5)
          : rect.top + Math.min(rect.height * 0.24, 180);
        const distance = Math.abs(stepAnchor - focusLine);

        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestStep = step;
        }
      });

      if (closestStep) {
        setActiveMember(closestStep.dataset.teamStep);
      }
    };

    let ticking = false;
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        updateFromScroll();
      });
    };

    updateFromScroll();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
  };

  loadDemoVideo();
  bindHeroImagePan();
  renderGallery();
  updateResponsiveTeamSummaries();
  bindTeamScrollShowcase();

  window.addEventListener('site:languagechange', () => {
    renderGallery();
    updateResponsiveTeamSummaries();
  });

  let summaryResizeTicking = false;
  window.addEventListener('resize', () => {
    if (summaryResizeTicking) return;
    summaryResizeTicking = true;
    window.requestAnimationFrame(() => {
      summaryResizeTicking = false;
      updateResponsiveTeamSummaries();
    });
  }, { passive: true });

  site.bindTitleReveal?.({
    titleSelector: '.site-header-title',
    heroSelector: '.hackathon-hero',
    scrollThreshold: 48
  });
})();
