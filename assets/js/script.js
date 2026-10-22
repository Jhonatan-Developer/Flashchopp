const menuButton = document.querySelector('.menuToggle');
const mainNav = document.querySelector('.mainNav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
  mainNav?.classList.toggle('isOpen', !isOpen);
});

mainNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('isOpen');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Abrir menu');
  });
});

const feedbackTrack = document.querySelector('.feedbackTrack');
const feedbackCards = [...document.querySelectorAll('.feedbackCard')];
const feedbackPagination = document.querySelector('.feedbackPagination');
let firstVisibleFeedback = 0;
let feedbackDragStart = null;

function getVisibleFeedbackCount() {
  return window.matchMedia('(max-width: 800px)').matches ? 1 : 2;
}

function getFeedbackPageStarts() {
  const visibleCount = getVisibleFeedbackCount();
  const lastVisibleIndex = Math.max(0, feedbackCards.length - visibleCount);
  return Array.from({ length: Math.ceil(feedbackCards.length / visibleCount) }, (_, pageIndex) =>
    Math.min(pageIndex * visibleCount, lastVisibleIndex));
}

function stepFeedbackPage(direction) {
  const pageStarts = getFeedbackPageStarts();
  const currentPage = pageStarts.findIndex((start) => start >= firstVisibleFeedback);
  const targetPage = Math.min(pageStarts.length - 1, Math.max(0, currentPage + direction));
  firstVisibleFeedback = pageStarts[targetPage];
  moveFeedback();
}

function updateFeedbackPagination() {
  if (!feedbackPagination || !feedbackTrack || feedbackCards.length === 0) return;
  feedbackPagination.replaceChildren();

  const previousButton = document.createElement('button');
  previousButton.className = 'feedbackArrow';
  previousButton.type = 'button';
  previousButton.setAttribute('aria-label', 'Ver feedback anterior');
  previousButton.textContent = '←';
  previousButton.addEventListener('click', () => {
    stepFeedbackPage(-1);
  });
  feedbackPagination.append(previousButton);

  const pageCount = getFeedbackPageStarts().length;
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const dot = document.createElement('span');
    dot.className = 'feedbackDot';
    dot.setAttribute('aria-hidden', 'true');
    feedbackPagination.append(dot);
  }

  const nextButton = document.createElement('button');
  nextButton.className = 'feedbackArrow';
  nextButton.type = 'button';
  nextButton.setAttribute('aria-label', 'Ver próximo feedback');
  nextButton.textContent = '→';
  nextButton.addEventListener('click', () => {
    stepFeedbackPage(1);
  });
  feedbackPagination.append(nextButton);

  if (getVisibleFeedbackCount() === 1) {
    previousButton.hidden = true;
    nextButton.hidden = true;
  }

  moveFeedback();
}

function moveFeedback() {
  if (!feedbackTrack || feedbackCards.length === 0) return;

  const visibleCount = getVisibleFeedbackCount();
  const lastVisibleIndex = Math.max(0, feedbackCards.length - visibleCount);
  firstVisibleFeedback = Math.max(0, Math.min(firstVisibleFeedback, lastVisibleIndex));

  const cardWidth = feedbackCards[0].getBoundingClientRect().width;
  const cardGap = parseFloat(getComputedStyle(feedbackTrack).columnGap) || 0;
  feedbackTrack.style.transform = `translateX(-${firstVisibleFeedback * (cardWidth + cardGap)}px)`;

  const activePage = getFeedbackPageStarts().findIndex((start) => start >= firstVisibleFeedback);
  feedbackPagination?.querySelectorAll('.feedbackDot').forEach((dot, pageIndex) => {
    if (pageIndex === activePage) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
  const previousButton = feedbackPagination?.querySelector('.feedbackArrow[aria-label="Ver feedback anterior"]');
  const nextButton = feedbackPagination?.querySelector('.feedbackArrow[aria-label="Ver próximo feedback"]');
  if (previousButton) previousButton.disabled = firstVisibleFeedback === 0;
  if (nextButton) nextButton.disabled = firstVisibleFeedback === lastVisibleIndex;
}

updateFeedbackPagination();

feedbackTrack?.addEventListener('touchstart', (event) => {
  if (getVisibleFeedbackCount() !== 1) return;
  const touch = event.changedTouches[0];
  feedbackDragStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

feedbackTrack?.addEventListener('touchend', (event) => {
  if (feedbackDragStart === null || getVisibleFeedbackCount() !== 1) return;
  const touch = event.changedTouches[0];
  const dragDistance = touch.clientX - feedbackDragStart.x;
  const verticalDistance = touch.clientY - feedbackDragStart.y;
  feedbackDragStart = null;
  if (Math.abs(dragDistance) < 40 || Math.abs(dragDistance) <= Math.abs(verticalDistance)) return;
  firstVisibleFeedback += dragDistance < 0 ? 1 : -1;
  moveFeedback();
}, { passive: true });

feedbackTrack?.addEventListener('touchcancel', () => {
  feedbackDragStart = null;
}, { passive: true });

window.addEventListener('resize', () => {
  firstVisibleFeedback = 0;
  updateFeedbackPagination();
});

const yearElement = document.querySelector('#year');
if (yearElement) yearElement.textContent = new Date().getFullYear();

const solutionGrid = document.querySelector('.solutionGrid');
const solutionCards = [...document.querySelectorAll('.solutionCard')];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (solutionGrid && solutionCards.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
  solutionGrid.classList.add('hasReveal');

  const solutionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('isVisible', entry.isIntersecting);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -48px 0px' });

  solutionCards.forEach((card, index) => {
    card.style.setProperty('--revealDelay', `${index * 140}ms`);
    solutionObserver.observe(card);
  });
}

const productGrid = document.querySelector('#productGrid');
const productExpandButton = document.querySelector('#productExpandButton');
const additionalProducts = [...document.querySelectorAll('.additionalProduct')];
const visibleProducts = productGrid
  ? [...productGrid.querySelectorAll('.productCard:not([hidden])')]
  : [];
let productObserver;
const productHideTimers = new Map();

if (productGrid && visibleProducts.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
  productGrid.classList.add('hasReveal');

  productObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('isVisible', entry.isIntersecting);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  visibleProducts.forEach((product, index) => {
    product.style.setProperty('--productDelay', `${index * 100}ms`);
    productObserver.observe(product);
  });
}

productExpandButton?.addEventListener('click', () => {
  if (!productGrid) return;

  const isExpanded = productExpandButton.getAttribute('aria-expanded') === 'true';
  productExpandButton.setAttribute('aria-expanded', String(!isExpanded));

  additionalProducts.forEach((product, index) => {
    if (isExpanded) {
      window.clearTimeout(productHideTimers.get(product));
      productObserver?.unobserve(product);
      product.style.setProperty('--productDelay', '0ms');

      if (prefersReducedMotion || !productGrid.classList.contains('hasReveal') || product.hidden) {
        product.hidden = true;
        product.classList.remove('isVisible', 'isHiding');
        return;
      }

      product.classList.add('isVisible');
      product.getBoundingClientRect();
      product.classList.remove('isVisible');
      product.classList.add('isHiding');
      const hideTimer = window.setTimeout(() => {
        product.hidden = true;
        product.classList.remove('isHiding');
        productHideTimers.delete(product);
      }, 600);
      productHideTimers.set(product, hideTimer);
      return;
    }

    product.hidden = false;
    window.clearTimeout(productHideTimers.get(product));
    productHideTimers.delete(product);
    product.classList.remove('isHiding');
    product.style.setProperty('--productDelay', `${index * 100}ms`);

    if (productObserver) productObserver.observe(product);
    else product.classList.add('isVisible');
  });

  productExpandButton.innerHTML = isExpanded
    ? 'Ver todos os chopps <span aria-hidden="true">↓</span>'
    : 'Ver menos <span aria-hidden="true">↑</span>';
});
