(function () {
  'use strict';

  var canvas, ctx, stars, w, h, scrollY = 0;

  var STAR_COUNT = 280;
  var TWINKLE_SPEED = 0.008;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: rand(0, 1),
        y: rand(0, 1),
        size: rand(0.3, 2.5),
        opacity: rand(0.3, 1),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.003, 0.015),
        hue: rand(0, 360),
        saturation: Math.random() < 0.15 ? rand(20, 60) : 0,
        lightness: rand(70, 100)
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    var parallax = scrollY * 0.02;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var x = s.x * w;
      var y = s.y * h + parallax * (s.y - 0.5) * 2;

      if (y < -10) y = h + 10;
      if (y > h + 10) y = -10;

      var twinkle = Math.sin(Date.now() * s.speed + s.phase) * 0.4 + 0.6;
      var alpha = s.opacity * twinkle;

      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + s.hue + ', ' + s.saturation + '%, ' + s.lightness + '%, ' + alpha + ')';
      ctx.fill();
    }
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
    draw();
  }

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  function onScroll() {
    scrollY = window.scrollY || window.pageYOffset;
  }

  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'celestial-starfield';
    ctx = canvas.getContext('2d');

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    canvas.style.display = 'block';

    document.body.insertBefore(canvas, document.body.firstChild);

    initStars();
    resize();
    loop();

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

