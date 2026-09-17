const summary = document.querySelector('.summary');
const cover = document.querySelector('.case-cover');
const summarySlot = document.querySelector('.summary-slot');
const mobileLayout = window.matchMedia('(max-width:900px)');
const collapseButton = document.querySelector('.summary__collapse');
const widgetButton = document.querySelector('.summary__widget');
const resultTooltip = document.querySelector('.summary__tooltip');
const resultTooltipButton = document.querySelector('.summary__tooltip-button');
const summaryBackdrop = document.querySelector('.summary-backdrop');
const caseSection = document.querySelector('.case-section');
const caseSectionTitleReveal = caseSection.querySelector('.case-section__title-reveal');
const iphoneDemos = document.querySelectorAll('.iphone-demo');
let manualExpanded = false;

function syncSummarySlotHeight() {
  if (!mobileLayout.matches) {
    summarySlot.style.removeProperty('min-height');
    return;
  }

  if (summary.dataset.state === 'expanded') {
    // offsetHeight is not affected by the FLIP transform used during morphing.
    summarySlot.style.minHeight = `${summary.offsetHeight}px`;
  }
}

const summaryResizeObserver = new ResizeObserver(syncSummarySlotHeight);
summaryResizeObserver.observe(summary);

function updateIphoneScale(iphoneDemo) {
  iphoneDemo.style.setProperty('--iphone-scale', String(iphoneDemo.clientWidth / 449));
}

const iphoneResizeObserver = new ResizeObserver((entries) => {
  entries.forEach(({ target }) => updateIphoneScale(target));
});

iphoneDemos.forEach((iphoneDemo) => {
  updateIphoneScale(iphoneDemo);
  iphoneResizeObserver.observe(iphoneDemo);
});

document.querySelectorAll('.pin-save-video-test').forEach((block) => {
const pinSaveVideoTest = block.querySelector('video');
const pinSaveVideoProgress = block.querySelector('.video-progress');
const pinSaveVideoProgressArc = pinSaveVideoProgress.querySelector('.video-progress__arc');
const pinSaveVideoProgressIcon = pinSaveVideoProgress.querySelector('.video-progress__icon');
let pinSaveProgressFrame;

function togglePinSaveVideo() {
  if (pinSaveVideoTest.paused) {
    pinSaveVideoTest.play().catch(() => {});
  } else {
    pinSaveVideoTest.pause();
  }
}

function updatePinSaveVideoControl() {
  const paused = pinSaveVideoTest.paused;
  pinSaveVideoProgress.dataset.state = paused ? 'paused' : 'playing';
  pinSaveVideoProgressIcon.src = paused ? 'assets/icons/video/play.svg' : 'assets/icons/video/pause.svg';
  pinSaveVideoProgress.setAttribute('aria-label', paused ? 'Продолжить видео' : 'Поставить видео на паузу');
}

function updatePinSaveVideoProgress() {
  const duration = pinSaveVideoTest.duration;
  const progress = Number.isFinite(duration) && duration > 0 ? pinSaveVideoTest.currentTime / duration : 0;
  pinSaveVideoProgressArc.setAttribute('stroke-dashoffset', String(1 - Math.min(1, Math.max(0, progress))));
  if (!pinSaveVideoTest.paused) pinSaveProgressFrame = requestAnimationFrame(updatePinSaveVideoProgress);
}

pinSaveVideoTest.addEventListener('click', () => {
  if (mobileLayout.matches) return;
  togglePinSaveVideo();
});

pinSaveVideoProgress.addEventListener('click', togglePinSaveVideo);
block.querySelector('.video-replay').addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.getAnimations().forEach((animation) => animation.cancel());
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const originalColor = getComputedStyle(button).color;
  button.animate([
    { transform:reducedMotion ? 'none' : 'scale(.94)', color:'#1C1C1E' },
    { transform:'none', color:originalColor }
  ], { duration:320, easing:'ease-out' });
  pinSaveVideoTest.currentTime = 0;
  pinSaveVideoTest.play().catch(() => {});
  updatePinSaveVideoProgress();
});

pinSaveVideoTest.addEventListener('play', () => {
  updatePinSaveVideoControl();
  cancelAnimationFrame(pinSaveProgressFrame);
  updatePinSaveVideoProgress();
});

pinSaveVideoTest.addEventListener('pause', () => {
  cancelAnimationFrame(pinSaveProgressFrame);
  updatePinSaveVideoControl();
  updatePinSaveVideoProgress();
});

pinSaveVideoTest.addEventListener('loadedmetadata', updatePinSaveVideoProgress);
updatePinSaveVideoControl();
if (!pinSaveVideoTest.paused) updatePinSaveVideoProgress();
});

function applyState(state) {
  summary.dataset.state = state;
  const overlay = state === 'overlay';
  const compact = state === 'compact';
  document.body.classList.toggle('summary-overlay-open', overlay);
  collapseButton.tabIndex = overlay ? 0 : -1;
  collapseButton.setAttribute('aria-hidden', String(!overlay));
  widgetButton.tabIndex = compact ? 0 : -1;
  widgetButton.setAttribute('aria-hidden', String(!compact));
  if (state === 'expanded') requestAnimationFrame(syncSummarySlotHeight);
}

function setState(state, morph = false) {
  if (summary.dataset.state === 'expanded' && state !== 'expanded') {
    syncSummarySlotHeight();
  }

  if (!morph || summary.dataset.state === state || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyState(state);
    return;
  }

  const first = summary.getBoundingClientRect();
  summary.getAnimations().forEach((animation) => animation.cancel());
  applyState(state);
  const last = summary.getBoundingClientRect();

  const deltaX = first.left - last.left;
  const deltaY = first.top - last.top;
  const scaleX = first.width / last.width;
  const scaleY = first.height / last.height;

  summary.animate([
    {
      transformOrigin:'top left',
      transform:`translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`
    },
    { transformOrigin:'top left', transform:'none' }
  ], {
    duration:720,
    easing:'cubic-bezier(.16,1,.3,1)'
  });
}

function onScroll() {
  // The slot keeps the original card bounds even while the card is fixed.
  const trigger = mobileLayout.matches ? summarySlot : cover;
  const coverVisible = trigger.getBoundingClientRect().bottom > 0;

  if (coverVisible) {
    manualExpanded = false;
    if (summary.dataset.state !== 'expanded') setState('expanded', true);
    return;
  }

  if (!manualExpanded && summary.dataset.state === 'expanded') {
    setState('compact', true);
  }
}

collapseButton.addEventListener('click', () => {
  manualExpanded = false;
  setState('compact', true);
});

summaryBackdrop.addEventListener('click', () => {
  manualExpanded = false;
  setState('compact', true);
});

widgetButton.addEventListener('click', () => {
  manualExpanded = true;
  setState('overlay', true);
});

resultTooltipButton.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = resultTooltip.dataset.open !== 'true';
  resultTooltip.dataset.open = String(open);
  resultTooltipButton.setAttribute('aria-expanded', String(open));
  if (!open) resultTooltipButton.blur();
});

document.addEventListener('click', () => {
  resultTooltip.dataset.open = 'false';
  resultTooltipButton.setAttribute('aria-expanded', 'false');
  resultTooltipButton.blur();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  resultTooltip.dataset.open = 'false';
  resultTooltipButton.setAttribute('aria-expanded', 'false');
  resultTooltipButton.blur();
});

const desktopComparisonVideos = [...document.querySelectorAll('.pin-save-video-test video')];
const mobileVideoTrack = document.querySelector('.pin-save-mobile__track');
const mobileVideoSlides = [...document.querySelectorAll('.pin-save-mobile__slide')];
const mobileVideos = mobileVideoSlides.map((slide) => slide.querySelector('video'));
const mobileDescriptions = [...document.querySelectorAll('.pin-save-mobile__descriptions p')];
const mobileVideoProgress = document.querySelector('.pin-save-mobile__controls .video-progress');
const mobileVideoProgressArc = mobileVideoProgress.querySelector('.video-progress__arc');
const mobileVideoProgressIcon = mobileVideoProgress.querySelector('.video-progress__icon');
const mobileVideoReplay = document.querySelector('.pin-save-mobile__controls .video-replay');
const videoSegmentButtons = [...document.querySelectorAll('.video-segment button')];
let activeVideoSlide = 0;
let mobileProgressFrame;
let descriptionTimer;
let mobileScrollFrame;
let requestedVideoSlide = null;

function updateMobileVideoControl() {
  const video = mobileVideos[activeVideoSlide];
  const paused = video.paused;
  mobileVideoProgress.dataset.state = paused ? 'paused' : 'playing';
  mobileVideoProgressIcon.src = paused ? 'assets/icons/video/play.svg' : 'assets/icons/video/pause.svg';
  mobileVideoProgress.setAttribute('aria-label', paused ? 'Продолжить видео' : 'Поставить видео на паузу');
}

function updateMobileVideoProgress() {
  const video = mobileVideos[activeVideoSlide];
  const progress = Number.isFinite(video.duration) && video.duration > 0 ? video.currentTime / video.duration : 0;
  mobileVideoProgressArc.setAttribute('stroke-dashoffset', String(1 - Math.min(1, Math.max(0, progress))));
  if (!video.paused && mobileLayout.matches) mobileProgressFrame = requestAnimationFrame(updateMobileVideoProgress);
}

function showMobileDescription(index) {
  clearTimeout(descriptionTimer);
  mobileDescriptions.forEach((description) => {
    description.classList.remove('is-active');
    description.setAttribute('aria-hidden', 'true');
  });

  const reveal = () => {
    mobileDescriptions[index].classList.add('is-active');
    mobileDescriptions[index].setAttribute('aria-hidden', 'false');
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) reveal();
  else descriptionTimer = setTimeout(reveal, 180);
}

function setActiveMobileVideo(index, playVideo = true, forcePlay = false) {
  const nextIndex = Math.max(0, Math.min(mobileVideos.length - 1, index));
  const changed = nextIndex !== activeVideoSlide;
  activeVideoSlide = nextIndex;

  mobileVideos.forEach((video, videoIndex) => {
    if (videoIndex !== activeVideoSlide) video.pause();
  });
  videoSegmentButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === activeVideoSlide));
  });
  if (changed) showMobileDescription(activeVideoSlide);
  if (playVideo && mobileLayout.matches && (changed || forcePlay)) {
    mobileVideos[activeVideoSlide].play().catch(() => {});
  }
  cancelAnimationFrame(mobileProgressFrame);
  updateMobileVideoControl();
  updateMobileVideoProgress();
}

function selectVideoSlide(index) {
  if (!mobileLayout.matches) return;
  setActiveMobileVideo(index);
  requestedVideoSlide = index;
  mobileVideoTrack.scrollTo({
    left:index * mobileVideoTrack.clientWidth,
    behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  });
}

videoSegmentButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectVideoSlide(index));
  button.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = event.key === 'ArrowRight' ? 1 : 0;
    videoSegmentButtons[next].focus();
    selectVideoSlide(next);
  });
});

mobileVideoProgress.addEventListener('click', () => {
  const video = mobileVideos[activeVideoSlide];
  if (video.paused) video.play().catch(() => {});
  else video.pause();
});
mobileVideoReplay.addEventListener('click', () => {
  const video = mobileVideos[activeVideoSlide];
  video.currentTime = 0;
  video.play().catch(() => {});
});
mobileVideos.forEach((video, index) => {
  video.addEventListener('play', () => {
    if (index !== activeVideoSlide || !mobileLayout.matches) {
      video.pause();
      return;
    }
    cancelAnimationFrame(mobileProgressFrame);
    updateMobileVideoControl();
    updateMobileVideoProgress();
  });
  video.addEventListener('pause', () => {
    if (index !== activeVideoSlide) return;
    cancelAnimationFrame(mobileProgressFrame);
    updateMobileVideoControl();
    updateMobileVideoProgress();
  });
  video.addEventListener('loadedmetadata', () => {
    if (index === activeVideoSlide) updateMobileVideoProgress();
  });
});
mobileVideoTrack.addEventListener('scroll', () => {
  cancelAnimationFrame(mobileScrollFrame);
  mobileScrollFrame = requestAnimationFrame(() => {
    if (!mobileLayout.matches || mobileVideoTrack.clientWidth === 0) return;
    if (requestedVideoSlide !== null) {
      const requestedLeft = requestedVideoSlide * mobileVideoTrack.clientWidth;
      if (Math.abs(mobileVideoTrack.scrollLeft - requestedLeft) < 1) requestedVideoSlide = null;
      return;
    }
    setActiveMobileVideo(Math.round(mobileVideoTrack.scrollLeft / mobileVideoTrack.clientWidth));
  });
}, { passive:true });
mobileVideoTrack.addEventListener('pointerdown', () => {
  requestedVideoSlide = null;
}, { passive:true });

function updateComparisonLayout() {
  if (mobileLayout.matches) {
    desktopComparisonVideos.forEach((video) => video.pause());
    mobileVideoTrack.scrollTo({ left:activeVideoSlide * mobileVideoTrack.clientWidth, behavior:'auto' });
    setActiveMobileVideo(activeVideoSlide, true, true);
    return;
  }
  cancelAnimationFrame(mobileProgressFrame);
  mobileVideos.forEach((video) => video.pause());
  desktopComparisonVideos.forEach((video) => video.play().catch(() => {}));
}

new ResizeObserver(() => {
  if (mobileLayout.matches) mobileVideoTrack.scrollTo({ left:activeVideoSlide * mobileVideoTrack.clientWidth, behavior:'auto' });
}).observe(mobileVideoTrack);
mobileLayout.addEventListener('change', updateComparisonLayout);
mobileLayout.addEventListener('change', syncSummarySlotHeight);
updateComparisonLayout();

const caseSectionObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    caseSection.classList.add('is-visible');
    return;
  }

  // Reset only after returning above the section. When the title leaves
  // through the top while scrolling down, it remains revealed.
  if (entry.rootBounds && entry.boundingClientRect.top >= entry.rootBounds.bottom) {
    caseSection.classList.remove('is-visible');
  }
}, { threshold:0.15 });

caseSectionObserver.observe(caseSectionTitleReveal);

window.addEventListener('scroll', onScroll, { passive:true });
window.addEventListener('resize', onScroll);
applyState('expanded');
syncSummarySlotHeight();
onScroll();
