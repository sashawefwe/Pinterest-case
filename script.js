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
  pinSaveVideoTest.dataset.userPaused = String(!pinSaveVideoTest.paused);
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
  pinSaveVideoTest.dataset.userPaused = 'false';
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

function syncSummarySlotHeight() {
  if (!mobileLayout.matches) {
    summarySlot.style.minHeight = '';
    return;
  }
  if (summary.dataset.state === 'expanded') {
    // offsetHeight measures layout height, unaffected by the morph animation.
    summarySlot.style.minHeight = `${summary.offsetHeight}px`;
  }
}

const summaryResizeObserver = new ResizeObserver(syncSummarySlotHeight);
summaryResizeObserver.observe(summary);

function applyState(state) {
  // Preserve the placeholder before the card leaves the document flow.
  syncSummarySlotHeight();
  summary.dataset.state = state;
  const overlay = state === 'overlay';
  const compact = state === 'compact';
  document.body.classList.toggle('summary-overlay-open', overlay);
  collapseButton.tabIndex = overlay ? 0 : -1;
  collapseButton.setAttribute('aria-hidden', String(!overlay));
  widgetButton.tabIndex = compact ? 0 : -1;
  widgetButton.setAttribute('aria-hidden', String(!compact));
  if (state === 'expanded') {
    syncSummarySlotHeight();
    requestAnimationFrame(syncSummarySlotHeight);
  }
}

function setState(state, morph = false) {
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

const videoSlider = document.querySelector('.pin-save-videos');
const videoSlides = [...videoSlider.querySelectorAll('.pin-save-video-test')];
const videoSegmentButtons = [...document.querySelectorAll('.video-segment button')];
const videoSegment = document.querySelector('.video-segment');
const videoDescriptions = videoSlides.map((slide) => slide.querySelector('.pin-save-video-test__text'));
const videoDescriptionArea = document.createElement('div');
videoDescriptionArea.className = 'video-description-area';
videoSegment.after(videoDescriptionArea);
const mobileVideoCard = document.createElement('div');
mobileVideoCard.className = 'mobile-video-card';
videoSlider.before(mobileVideoCard);
const sharedVideoControls = document.createElement('div');
sharedVideoControls.className = 'shared-video-controls';
const slideControls = videoSlides.map((slide) => slide.querySelector('.video-controls'));
const slideVideos = videoSlides.map((slide) => slide.querySelector('video'));
let activeVideoSlide = 0;
let previousMobileVideo = null;

function syncVideoCardLayout() {
  if (mobileLayout.matches) {
    mobileVideoCard.append(videoSlider, sharedVideoControls, videoDescriptionArea, videoSegment);
  } else {
    mobileVideoCard.before(videoSlider, videoSegment, videoDescriptionArea);
    slideControls.forEach((controls, index) => videoSlides[index].append(controls));
    previousMobileVideo = null;
    slideVideos.forEach((video) => {
      if (video.dataset.userPaused !== 'true') video.play().catch(() => {});
    });
  }
  updateVideoSegment();
}

function updateVideoSegment() {
  videoDescriptions.forEach((description, index) => {
    if (mobileLayout.matches) {
      if (description.parentElement !== videoDescriptionArea) videoDescriptionArea.append(description);
    } else if (description.parentElement !== videoSlides[index]) {
      videoSlides[index].prepend(description);
    }
  });
  if (mobileLayout.matches && videoSlider.clientWidth > 0) {
    activeVideoSlide = Math.max(0, Math.min(videoSlides.length - 1,
      Math.round(videoSlider.scrollLeft / videoSlider.clientWidth)));
  }
  videoSegmentButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === activeVideoSlide));
  });
  videoSlides.forEach((slide, index) => {
    slide.inert = mobileLayout.matches && index !== activeVideoSlide;
    videoDescriptions[index].dataset.active = String(index === activeVideoSlide);
    videoDescriptions[index].inert = mobileLayout.matches && index !== activeVideoSlide;
    if (mobileLayout.matches) videoDescriptions[index].setAttribute('aria-hidden', String(index !== activeVideoSlide));
    else videoDescriptions[index].removeAttribute('aria-hidden');
  });
  if (mobileLayout.matches) {
    slideControls.forEach((controls, index) => {
      const target = index === activeVideoSlide ? sharedVideoControls : videoSlides[index];
      if (controls.parentElement !== target) target.append(controls);
    });
    if (previousMobileVideo !== activeVideoSlide) {
      slideVideos.forEach((video, index) => {
        if (index !== activeVideoSlide) video.pause();
        else if (video.dataset.userPaused !== 'true') video.play().catch(() => {});
      });
      previousMobileVideo = activeVideoSlide;
    }
  }
}

function selectVideoSlide(index) {
  if (!mobileLayout.matches) return;
  videoSlider.scrollTo({
    left:index * videoSlider.clientWidth,
    behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
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
videoSlider.addEventListener('scroll', updateVideoSegment, { passive:true });
let descriptionSwipeStart = null;
videoDescriptionArea.addEventListener('touchstart', (event) => {
  if (!mobileLayout.matches || event.touches.length !== 1) {
    descriptionSwipeStart = null;
    return;
  }
  const touch = event.touches[0];
  descriptionSwipeStart = { x:touch.clientX, y:touch.clientY };
}, { passive:true });
videoDescriptionArea.addEventListener('touchmove', (event) => {
  if (!descriptionSwipeStart) return;
  const touch = event.touches[0];
  if (event.touches.length !== 1 || Math.abs(touch.clientY - descriptionSwipeStart.y) > 24) {
    descriptionSwipeStart = null;
  }
}, { passive:true });
videoDescriptionArea.addEventListener('touchend', (event) => {
  const start = descriptionSwipeStart;
  descriptionSwipeStart = null;
  if (!start || !mobileLayout.matches) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  selectVideoSlide(Math.max(0, Math.min(videoSlides.length - 1,
    activeVideoSlide + (dx < 0 ? 1 : -1))));
}, { passive:true });
videoDescriptionArea.addEventListener('touchcancel', () => {
  descriptionSwipeStart = null;
}, { passive:true });
new ResizeObserver(() => {
  videoSlider.scrollTo({ left:mobileLayout.matches ? activeVideoSlide * videoSlider.clientWidth : 0, behavior:'instant' });
  updateVideoSegment();
}).observe(videoSlider);
mobileLayout.addEventListener('change', syncVideoCardLayout);
syncVideoCardLayout();

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
window.addEventListener('resize', () => {
  syncSummarySlotHeight();
  onScroll();
});
mobileLayout.addEventListener('change', () => {
  syncSummarySlotHeight();
  onScroll();
});
applyState('expanded');
onScroll();
