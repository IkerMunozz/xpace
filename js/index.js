// ============================================================
// 1. PRELOADER
// ============================================================
(function() {
  const text = 'XPACE BURGER';
  const container = document.getElementById('preloaderText');
  text.split('').forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    span.style.animationDelay = (0.4 + i * 0.07) + 's';
    container.appendChild(span);
  });
})();

// ============================================================
// 2. LENIS SMOOTH SCROLL
// ============================================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true
});
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ============================================================
// 3. PRELOADER EXIT
// ============================================================
window.addEventListener('load', () => {
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    preloader.style.transition = 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)';
    preloader.style.transform = 'translateY(-100%)';
    setTimeout(() => {
      preloader.style.display = 'none';
      // Show hero elements directly
      const heroElements = [
        '.hero-badge', '.hero-subtitle', '.hero-buttons', '.scroll-indicator'
      ];
      heroElements.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
      });
      document.querySelectorAll('.hero-title .line').forEach(el => {
        el.style.opacity = '1'; el.style.transform = 'translateY(0)';
      });
    }, 1000);
  }, 2400);
});

// ============================================================
// 4. SCROLL-TRIGGERED ANIMATIONS
// ============================================================
gsap.registerPlugin(ScrollTrigger);

    // Burger del Mes — cinematic
    const bdmOrbit = document.getElementById('bdmOrbit');
    const bdmParallax = document.getElementById('bdmParallax');
    const bdmShadowEl = document.querySelector('.bdm-shadow');

    // Set initial hidden state
    gsap.set(bdmOrbit, { scale: 0.6, opacity: 0 });
    gsap.set(bdmShadowEl, { scale: 0.4, opacity: 0 });
    gsap.set('.bdm-info > *', { y: 40, opacity: 0 });

    // Entrance + cinematic start
    ScrollTrigger.create({
      trigger: '.bdm-container', start: 'top 75%',
      onEnter: () => {
        const entranceTL = gsap.timeline();
        entranceTL.to(bdmOrbit, { scale: 1, opacity: 1, duration: 1.4, ease: 'power3.out' })
          .to(bdmShadowEl, { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out' }, '-=0.8')
          .to('.bdm-info > *', { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, '-=0.6')
          .call(startCinematicBDM);
      }, once: true
    });

    function startCinematicBDM() {
      if (!bdmOrbit) return;

      gsap.set(bdmOrbit, { scale: 1, opacity: 1 });

      // Floating motion
      const floatTL = gsap.timeline({ repeat: -1, yoyo: true });
      floatTL.to(bdmOrbit, { y: 22, duration: 5.5, ease: 'sine.inOut' })
        .to(bdmOrbit, { y: -22, duration: 5.5, ease: 'sine.inOut' }, 2.75);

      // Slow orbit — micro camera movement
      const orbitTL = gsap.timeline({ repeat: -1, yoyo: true });
      orbitTL.to(bdmOrbit, { rotateX: 4, rotateY: 6, rotateZ: 1.5, duration: 10, ease: 'sine.inOut' })
        .to(bdmOrbit, { rotateX: -3, rotateY: -4, rotateZ: -1, duration: 10, ease: 'sine.inOut' }, 5);

      // Shadow follows floating
      if (bdmShadowEl) {
        gsap.set(bdmShadowEl, { scale: 1, opacity: 1 });
        const shadowTL = gsap.timeline({ repeat: -1, yoyo: true });
        shadowTL.to(bdmShadowEl, { scale: 0.82, opacity: 0.3, duration: 5.5, ease: 'sine.inOut' })
          .to(bdmShadowEl, { scale: 1, opacity: 0.6, duration: 5.5, ease: 'sine.inOut' }, 2.75);
      }

      // Mouse parallax
      if (bdmParallax) {
        document.addEventListener('mousemove', (e) => {
          const x = (e.clientX / window.innerWidth - 0.5) * 2;
          const y = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(bdmParallax, {
            x: x * 14, y: y * -10,
            duration: 1.8, ease: 'power2.out',
            overwrite: 'auto'
          });
        });
      }
    }

// Section headers
gsap.utils.toArray('.section-header').forEach(header => {
  gsap.set(header.children, { y: 60, opacity: 0 });
  ScrollTrigger.create({
    trigger: header, start: 'top 80%', once: true,
    onEnter: () => {
      gsap.to(header.children, { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power3.out' });
    }
  });
});

// Category blocks reveal — fixed from() to prevent stuck animations
gsap.utils.toArray('.category-block').forEach(block => {
  const content = block.querySelector('.category-content');
  const bg = block.querySelector('.category-bg');
  if (content) gsap.set(content, { y: 100, opacity: 0 });
  if (bg) gsap.set(bg, { scale: 1.2 });
  ScrollTrigger.create({
    trigger: block, start: 'top 80%', once: true,
    onEnter: () => {
      if (content) gsap.to(content, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' });
      if (bg) gsap.to(bg, { scale: 1, duration: 2, ease: 'power2.out' });
    }
  });
});

// About section
gsap.set('.about-logo-wrap', { scale: 0.4, opacity: 0 });
gsap.set('.about-text', { y: 60, opacity: 0 });
gsap.set('.about-stat', { y: 50, opacity: 0 });

ScrollTrigger.create({
  trigger: '.about-logo-wrap', start: 'top 75%', once: true,
  onEnter: () => { gsap.to('.about-logo-wrap', { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out' }); }
});
ScrollTrigger.create({
  trigger: '.about-text', start: 'top 80%', once: true,
  onEnter: () => { gsap.to('.about-text', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }); }
});
ScrollTrigger.create({
  trigger: '.about-stats', start: 'top 80%', once: true,
  onEnter: () => { gsap.to('.about-stat', { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power3.out' }); }
});

// Counter animation
document.querySelectorAll('[data-count]').forEach(el => {
  const target = parseInt(el.dataset.count);
  ScrollTrigger.create({
    trigger: el, start: 'top 80%',
    onEnter: () => {
      gsap.to(el, {
        innerText: target, duration: 2.5, snap: { innerText: 1 },
        ease: 'power2.out',
        modifiers: { innerText: (v) => Math.floor(v) }
      });
    }, once: true
  });
});

// Location reveal — editorial
gsap.set([
  '.location-suptitle',
  '.location-headline',
  '.location-headline-sub',
  '.location-address',
  '.location-btn',
  '.location-map-wrap'
], { y: 40, opacity: 0 });

ScrollTrigger.create({
  trigger: '.location-container',
  start: 'top 75%',
  once: true,
  onEnter: () => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.location-suptitle', { y: 0, opacity: 1, duration: 0.8 })
      .to('.location-headline', { y: 0, opacity: 1, duration: 1 }, '-=0.4')
      .to('.location-headline-sub', { y: 0, opacity: 1, duration: 1 }, '-=0.6')
      .to('.location-address, .location-btn', { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 })
      .to('.location-map-wrap', { y: 0, opacity: 1, duration: 1.2 });
  }
});

// Contact reveal — editorial
gsap.set([
  '.contact-suptitle',
  '.social-item',
  '.contact-meta'
], { y: 40, opacity: 0 });

ScrollTrigger.create({
  trigger: '.contact-container',
  start: 'top 75%',
  once: true,
  onEnter: () => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.contact-suptitle', { y: 0, opacity: 1, duration: 0.8 })
      .to('.social-item', { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 })
      .to('.contact-meta', { y: 0, opacity: 1, duration: 0.7 });
  }
});


// ============================================================
// 9. MENU CARD GLOW ON HOVER
// ============================================================
document.querySelectorAll('.menu-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', x + 'px');
    card.style.setProperty('--mouse-y', y + 'px');
  });
});

// ============================================================
// 11. MENU TABS
// ============================================================
document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.querySelectorAll('.menu-category').forEach(cat => {
      cat.classList.toggle('active', cat.id === 'tab-' + target);
    });
  });
});

// ============================================================
// 12. NAVBAR
// ============================================================
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => {
  menuToggle.classList.toggle('active');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menuToggle.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) lenis.scrollTo(target, { offset: -80 });
  });
});