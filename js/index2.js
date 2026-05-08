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
 
  // Animated counter
  const counter = document.getElementById('preloaderCounter');
  let count = 0;
  const counterInterval = setInterval(() => {
    count += Math.floor(Math.random() * 5) + 1;
    if (count >= 100) { count = 100; clearInterval(counterInterval); }
    counter.textContent = count + '%';
  }, 40);
})();
 
// ============================================================
// 2. THREE.JS GALAXY BACKGROUND
// ============================================================
(function() {
  const canvas = document.getElementById('galaxy-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.position.z = 3;
 
  const particleCount = 2500;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
 
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = Math.random() * 5;
    const spinAngle = radius * 2;
    const branchAngle = ((i % 4) / 4) * Math.PI * 2;
    const randomX = (Math.random() - 0.5) * Math.pow(Math.random(), 3) * 2;
    const randomY = (Math.random() - 0.5) * Math.pow(Math.random(), 3) * 0.8;
    const randomZ = (Math.random() - 0.5) * Math.pow(Math.random(), 3) * 2;
    positions[i3]     = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;
    const insideColor = new THREE.Color('#331122');
    const midColor = new THREE.Color('#1a0a2e');
    const outsideColor = new THREE.Color('#0a1628');
    const mixedColor = new THREE.Color();
    if (radius < 2) { mixedColor.lerpColors(insideColor, midColor, radius / 2); }
    else { mixedColor.lerpColors(midColor, outsideColor, (radius - 2) / 3); }
    colors[i3]     = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
    sizes[i] = Math.random() * 1.5;
  }
 
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
 
  const vertexShader = `
    attribute float aSize;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (220.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  const fragmentShader = `
    varying vec3 vColor;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float alpha = 1.0 - smoothstep(0.15, 0.5, d);
      gl_FragColor = vec4(vColor, alpha * 0.35);
    }
  `;
 
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    transparent: true, vertexColors: true,
    depthWrite: false, blending: THREE.AdditiveBlending
  });
 
  const galaxy = new THREE.Points(geometry, material);
  scene.add(galaxy);
 
  const glowGeo = new THREE.SphereGeometry(0.12, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff2d55, transparent: true, opacity: 0.12 });
  const glowSphere = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glowSphere);
 
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
  });
 
  function animate() {
    requestAnimationFrame(animate);
    galaxy.rotation.y += 0.0002;
    galaxy.rotation.x += 0.00005;
    glowSphere.scale.setScalar(1 + Math.sin(Date.now() * 0.001) * 0.15);
    camera.position.x += (mouseX - camera.position.x) * 0.008;
    camera.position.y += (-mouseY - camera.position.y) * 0.008;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();
 
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
 
// ============================================================
// 3. THREE.JS 3D BURGER (Burger del Mes)
// ============================================================
(function() {
  const canvas = document.getElementById('burger-del-mes-3d');
  if (!canvas) return;
 
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(500, 500);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  camera.position.set(0, 2, 6);
  camera.lookAt(0, 0, 0);
 
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);
  const redLight = new THREE.PointLight(0xff2d55, 0.6, 20);
  redLight.position.set(-3, 3, 2);
  scene.add(redLight);
  const blueLight = new THREE.PointLight(0x00b4ff, 0.4, 20);
  blueLight.position.set(3, -2, 3);
  scene.add(blueLight);
 
  const burgerGroup = new THREE.Group();
  const bunMat = new THREE.MeshStandardMaterial({ color: 0xd4920a, roughness: 0.6, metalness: 0.1 });
  const bunBottomMat = new THREE.MeshStandardMaterial({ color: 0xc48109, roughness: 0.65, metalness: 0.1 });
  const pattyMat = new THREE.MeshStandardMaterial({ color: 0x6b3a2a, roughness: 0.8, metalness: 0.2 });
  const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffa500, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.9 });
  const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x3a7d1a, roughness: 0.7, metalness: 0.05 });
  const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.4, metalness: 0.1 });
 
  const bunBottom = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.6, 0.6, 32), bunBottomMat);
  bunBottom.position.y = -1.2; bunBottom.receiveShadow = true;
  burgerGroup.add(bunBottom);
 
  const patty = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.35, 32), pattyMat);
  patty.position.y = -0.75;
  burgerGroup.add(patty);
 
  const cheese = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.08, 32), cheeseMat);
  cheese.position.y = -0.5;
  burgerGroup.add(cheese);
 
  const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.15, 32), lettuceMat);
  lettuce.position.y = -0.35;
  burgerGroup.add(lettuce);
 
  const tomato = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.18, 32), tomatoMat);
  tomato.position.y = -0.2;
  burgerGroup.add(tomato);
 
  const patty2 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.35, 32), pattyMat);
  patty2.position.y = 0;
  burgerGroup.add(patty2);
 
  const cheese2 = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.08, 32), cheeseMat);
  cheese2.position.y = 0.25;
  burgerGroup.add(cheese2);
 
  const bunTop = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55), bunMat
  );
  bunTop.position.y = 0.6; bunTop.scale.y = 1.3;
  burgerGroup.add(bunTop);
 
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = Math.random() * 0.8;
    const seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xfff8e1, roughness: 0.5 })
    );
    seed.position.set(Math.cos(angle) * r, 1.1 + Math.random() * 0.1, Math.sin(angle) * r);
    seed.scale.y = 1.5;
    burgerGroup.add(seed);
  }
  scene.add(burgerGroup);
 
  const particleCount = 200;
  const pPositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = 2.5 + Math.random() * 2;
    pPositions[i3]     = r * Math.sin(phi) * Math.cos(theta);
    pPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pPositions[i3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xff2d55, size: 0.03, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);
 
  let targetRotY = 0, targetRotX = 0;
  document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.5;
      targetRotX = -y * 0.3;
    }
  });
 
  function animateBurger() {
    requestAnimationFrame(animateBurger);
    burgerGroup.rotation.y += 0.008;
    burgerGroup.rotation.y += (targetRotY - burgerGroup.rotation.y) * 0.05;
    burgerGroup.rotation.x += (targetRotX - burgerGroup.rotation.x) * 0.05;
    burgerGroup.position.y = Math.sin(Date.now() * 0.001) * 0.15;
    particles.rotation.y += 0.003;
    particles.rotation.x += 0.001;
    redLight.intensity = 0.6 + Math.sin(Date.now() * 0.003) * 0.2;
    blueLight.intensity = 0.4 + Math.cos(Date.now() * 0.004) * 0.15;
    renderer.render(scene, camera);
  }
  animateBurger();
})();
 
// ============================================================
// 4. LENIS SMOOTH SCROLL
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
// 5. PRELOADER EXIT + HERO ENTRANCE
// ============================================================
window.addEventListener('load', () => {
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
 
    // Clip-path wipe reveal (Goiko-style)
    preloader.style.transition = 'clip-path 1.2s cubic-bezier(0.77, 0, 0.175, 1)';
    preloader.style.clipPath = 'inset(0 0 100% 0)';
 
    setTimeout(() => {
      preloader.style.display = 'none';
 
      // Hero entrance sequence with GSAP timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
 
      // Split hero title into chars for stagger animation
      document.querySelectorAll('.hero-title .line').forEach(line => {
        const text = line.textContent;
        line.innerHTML = '';
        text.split('').forEach(ch => {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch === ' ' ? '\u00A0' : ch;
          line.appendChild(span);
        });
      });
 
      tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8 }, 0.2)
        .to('.hero-title .line-1 .char', {
          opacity: 1, y: '0%', rotateX: 0,
          stagger: 0.04, duration: 0.8
        }, 0.4)
        .to('.hero-title .line-2 .char', {
          opacity: 1, y: '0%', rotateX: 0,
          stagger: 0.04, duration: 0.8
        }, 0.7)
        .to('.hero-subtitle', { opacity: 1, y: 0, duration: 0.8 }, 1.0)
        .to('.hero-buttons', { opacity: 1, y: 0, duration: 0.8 }, 1.2)
        .to('.scroll-indicator', { opacity: 1, duration: 0.8 }, 1.4);
    }, 1200);
  }, 2400);
});
 
// ============================================================
// 6. HERO 3D TILT + PARALLAX
// ============================================================
const heroContent = document.getElementById('heroContent');
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 15;
  const y = (e.clientY / window.innerHeight - 0.5) * 10;
  gsap.to(heroContent, {
    rotationY: x, rotationX: -y, duration: 0.8, ease: 'power2.out'
  });
});
 
gsap.to('.hero-content', {
  y: 250, opacity: 0,
  scrollTrigger: {
    trigger: '.hero', start: 'top top', end: 'bottom top',
    scrub: 1
  }
});
 
// ============================================================
// 7. GSAP SCROLL-TRIGGERED ANIMATIONS
// ============================================================
gsap.registerPlugin(ScrollTrigger);
 
// Scroll progress bar
gsap.to('.scroll-progress', {
  width: '100%',
  ease: 'none',
  scrollTrigger: {
    trigger: 'body', start: 'top top', end: 'bottom bottom',
    scrub: 0.3
  }
});
 
// Marquee speed change on scroll
gsap.to('.marquee-band:first-child .marquee-track', {
  x: '-=200',
  scrollTrigger: {
    trigger: '.marquee-section', start: 'top bottom', end: 'bottom top',
    scrub: 2
  }
});
gsap.to('.marquee-band:nth-child(2) .marquee-track', {
  x: '+=200',
  scrollTrigger: {
    trigger: '.marquee-section', start: 'top bottom', end: 'bottom top',
    scrub: 2
  }
});
 
// Burger del Mes
gsap.from('#burger-del-mes-3d', {
  x: -120, opacity: 0, duration: 1.4, ease: 'power3.out',
  scrollTrigger: { trigger: '.bdm-container', start: 'top 75%' }
});
gsap.from('.bdm-info > *', {
  x: 80, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
  scrollTrigger: { trigger: '.bdm-info', start: 'top 75%' }
});
 
// Parallax divider - fill text on scroll
ScrollTrigger.create({
  trigger: '#parallaxDivider',
  start: 'top 80%',
  end: 'bottom 20%',
  onUpdate: (self) => {
    const fill = document.getElementById('parallaxFill');
    if (fill) {
      const progress = Math.min(self.progress * 1.5, 1);
      fill.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
    }
  }
});
 
// Parallax bg movement
gsap.to('.parallax-divider-bg', {
  y: -100,
  scrollTrigger: {
    trigger: '#parallaxDivider', start: 'top bottom', end: 'bottom top',
    scrub: 1
  }
});
 
// Section headers
gsap.utils.toArray('.section-header').forEach(header => {
  gsap.from(header.children, {
    y: 60, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: header, start: 'top 80%' }
  });
});
 
// Menu tabs
gsap.from('.menu-tabs', {
  y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
  scrollTrigger: { trigger: '.menu-tabs', start: 'top 85%' }
});
 
// Menu cards stagger from below
gsap.utils.toArray('.menu-category.active .menu-card').forEach((card, i) => {
  gsap.from(card, {
    y: 60, opacity: 0, scale: 0.95, duration: 0.7,
    delay: i * 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.menu-scroll-wrapper', start: 'top 85%' }
  });
});
 
// Text reveal section - word by word on scroll
(function() {
  const quoteEl = document.getElementById('textRevealQuote');
  if (!quoteEl) return;
  const text = quoteEl.textContent.trim();
  const words = text.split(/\s+/);
  const highlightWords = ['experiencia', 'frescos', 'amor', 'alma'];
  quoteEl.innerHTML = words.map(w => {
    const isHighlight = highlightWords.some(hw => w.toLowerCase().includes(hw));
    return `<span class="word${isHighlight ? ' highlight' : ''}">${w}</span>`;
  }).join(' ');
 
  const wordEls = quoteEl.querySelectorAll('.word');
  ScrollTrigger.create({
    trigger: '#textReveal',
    start: 'top 70%',
    end: 'bottom 30%',
    onUpdate: (self) => {
      const progress = self.progress;
      const activeCount = Math.floor(progress * wordEls.length);
      wordEls.forEach((w, i) => {
        w.classList.toggle('active', i < activeCount);
      });
    }
  });
})();
 
// Stats counters
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
 
// Stats items
gsap.from('.stat-item', {
  y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
  scrollTrigger: { trigger: '.stats-grid', start: 'top 80%' }
});
 
// About section
gsap.from('.about-logo-wrap', {
  scale: 0.4, opacity: 0, duration: 1.2, ease: 'power3.out',
  scrollTrigger: { trigger: '.about-logo-wrap', start: 'top 75%' }
});
gsap.from('.about-text', {
  y: 60, opacity: 0, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.about-text', start: 'top 80%' }
});
 
// CTA band
gsap.from('.cta-band-content > *', {
  y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
  scrollTrigger: { trigger: '.cta-band', start: 'top 80%' }
});
 
// Instagram grid
gsap.from('.instagram-item', {
  scale: 0.7, opacity: 0, rotationY: 30,
  duration: 0.7, stagger: 0.08, ease: 'back.out(1.4)',
  scrollTrigger: { trigger: '.instagram-grid', start: 'top 80%' }
});
 
// ============================================================
// 8. CUSTOM CURSOR
// ============================================================
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
const cursorGlow = document.getElementById('cursorGlow');
let cursorX = 0, cursorY = 0, ringX = 0, ringY = 0;
 
document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX; cursorY = e.clientY;
  cursorDot.style.left = cursorX + 'px';
  cursorDot.style.top = cursorY + 'px';
  cursorGlow.style.left = cursorX + 'px';
  cursorGlow.style.top = cursorY + 'px';
});
function updateRing() {
  ringX += (cursorX - ringX) * 0.15;
  ringY += (cursorY - ringY) * 0.15;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(updateRing);
}
updateRing();
 
document.querySelectorAll('a, button, .menu-card, .instagram-item, .menu-tab, .scroll-hint-btn').forEach(el => {
  el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
});
document.addEventListener('mousedown', () => cursorRing.classList.add('click'));
document.addEventListener('mouseup', () => cursorRing.classList.remove('click'));
 
// ============================================================
// 9. MAGNETIC ELEMENTS
// ============================================================
document.querySelectorAll('.magnetic').forEach(el => {
  const strength = parseInt(el.dataset.strength) || 20;
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x / strength * 3}px, ${y / strength * 3}px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});
 
// ============================================================
// 10. MENU CARD GLOW ON HOVER
// ============================================================
document.querySelectorAll('.menu-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
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
      const isActive = cat.id === 'tab-' + target;
      cat.classList.toggle('active', isActive);
      // Animate cards on tab switch
      if (isActive) {
        gsap.from(cat.querySelectorAll('.menu-card'), {
          y: 40, opacity: 0, scale: 0.95,
          duration: 0.5, stagger: 0.08, ease: 'power2.out'
        });
      }
    });
  });
});
 
// ============================================================
// 12. HORIZONTAL SCROLL BUTTONS
// ============================================================
document.getElementById('scrollLeft').addEventListener('click', () => {
  const active = document.querySelector('.menu-category.active .menu-scroll');
  if (active) active.scrollBy({ left: -360, behavior: 'smooth' });
});
document.getElementById('scrollRight').addEventListener('click', () => {
  const active = document.querySelector('.menu-category.active .menu-scroll');
  if (active) active.scrollBy({ left: 360, behavior: 'smooth' });
});
 
// Drag scroll for menu
document.querySelectorAll('.menu-scroll').forEach(scroll => {
  let isDown = false, startX, scrollLeft;
  scroll.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - scroll.offsetLeft;
    scrollLeft = scroll.scrollLeft;
  });
  scroll.addEventListener('mouseleave', () => { isDown = false; });
  scroll.addEventListener('mouseup', () => { isDown = false; });
  scroll.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scroll.offsetLeft;
    const walk = (x - startX) * 1.5;
    scroll.scrollLeft = scrollLeft - walk;
  });
});
 
// ============================================================
// 13. NAVBAR
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