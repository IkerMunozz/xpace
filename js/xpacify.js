(function () {
  'use strict';

  /* ====================== CONFIG ====================== */

  var CFG = {
    cartKey: 'xpacify_cart',
    orderTypeKey: 'xpacify_order_type',
    addressKey: 'xpacify_address',
    orderTypeSetKey: 'xpacify_order_type_set',
    toastDuration: 1800,
  };

  /* ====================== STATE ====================== */

  var state = {
    cart: [],
    orderType: null,
    address: '',
    orderTypeSet: false,
    pendingProduct: null,
  };

  var els = {};

  /* ====================== UTILS ====================== */

  function parsePrice(str) {
    return parseFloat(str.replace(',', '.').replace('€', '').trim());
  }

  function formatPrice(num) {
    return num.toFixed(2).replace('.', ',') + '\u20ac';
  }

  function slugify(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function getPageCategory() {
    var path = window.location.pathname.split('/').pop() || '';
    return path.replace('.html', '');
  }

  /* ====================== STORAGE ====================== */

  function loadState() {
    try {
      var cart = localStorage.getItem(CFG.cartKey);
      if (cart) state.cart = JSON.parse(cart);
      state.orderType = localStorage.getItem(CFG.orderTypeKey);
      state.address = localStorage.getItem(CFG.addressKey) || '';
      state.orderTypeSet = localStorage.getItem(CFG.orderTypeSetKey) === 'true';
    } catch (e) {
      state.cart = [];
    }
    if (!Array.isArray(state.cart)) state.cart = [];
  }

  function saveCart() {
    localStorage.setItem(CFG.cartKey, JSON.stringify(state.cart));
  }

  function saveOrderType() {
    localStorage.setItem(CFG.orderTypeKey, state.orderType);
    localStorage.setItem(CFG.addressKey, state.address);
    localStorage.setItem(CFG.orderTypeSetKey, 'true');
    state.orderTypeSet = true;
  }

  /* ====================== CART ====================== */

  function findCartItem(id) {
    for (var i = 0; i < state.cart.length; i++) {
      if (state.cart[i].id === id) return state.cart[i];
    }
    return null;
  }

  function addToCart(name, price) {
    var id = slugify(name);
    var existing = findCartItem(id);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({ id: id, name: name, price: price, qty: 1 });
    }
    saveCart();
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter(function (item) {
      return item.id !== id;
    });
    saveCart();
  }

  function updateQuantity(id, delta) {
    var item = findCartItem(id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id);
    } else {
      saveCart();
    }
  }

  function getCartCount() {
    var total = 0;
    for (var i = 0; i < state.cart.length; i++) {
      total += state.cart[i].qty;
    }
    return total;
  }

  function getCartTotal() {
    var total = 0;
    for (var i = 0; i < state.cart.length; i++) {
      total += state.cart[i].price * state.cart[i].qty;
    }
    return total;
  }

  /* ====================== PRODUCT DETECTION ====================== */

  function getProductInfo(btn) {
    var card = btn.closest('.product-card');
    if (!card) return null;
    var nameEl = card.querySelector('.product-name');
    var priceEl = card.querySelector('.product-price');
    if (!nameEl || !priceEl) return null;
    var name = nameEl.textContent.trim();
    var price = parsePrice(priceEl.textContent);
    if (isNaN(price) || !name) return null;
    return { name: name, price: price };
  }

  /* ====================== UI BUILDERS ====================== */

  function buildBottomBar() {
    var bar = document.createElement('div');
    bar.className = 'xp-bottom-bar';
    bar.innerHTML =
      '<div class="xp-bottom-inner">' +
        '<div class="xp-bottom-info">' +
          '<span class="xp-bottom-count">0 productos</span>' +
          '<span class="xp-bottom-divider"></span>' +
          '<span class="xp-bottom-total">0,00<span class="xp-total-currency">\u20ac</span></span>' +
        '</div>' +
        '<button class="xp-bottom-btn">Ver pedido</button>' +
      '</div>';
    document.body.appendChild(bar);
    els.bottomBar = bar;
    els.bottomCount = bar.querySelector('.xp-bottom-count');
    els.bottomTotal = bar.querySelector('.xp-bottom-total');
    els.bottomBtn = bar.querySelector('.xp-bottom-btn');

    els.bottomBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showCartModal();
    });
  }

  function buildOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'xp-overlay';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        if (overlay.classList.contains('xp-order-active')) return;
        hideAllModals();
      }
    });
    document.body.appendChild(overlay);
    els.overlay = overlay;
  }

  function buildOrderTypeModal() {
    var modal = document.createElement('div');
    modal.className = 'xp-modal xp-modal-order';

    modal.innerHTML =
      '<div class="xp-cart-drag-handle"></div>' +
      '<div class="xp-cart-header">' +
        '<div class="xp-cart-header-left">' +
          '<div class="xp-cart-header-icon">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>' +
            '</svg>' +
          '</div>' +
          '<div>' +
            '<div class="xp-cart-header-title">\u00bfC\u00f3mo quieres tu pedido?</div>' +
          '</div>' +
        '</div>' +
        '<button class="xp-cart-header-close" aria-label="Cerrar">&times;</button>' +
      '</div>' +
      '<div class="xp-cart-header-divider"></div>' +
      '<div class="xp-order-options">' +
        '<button class="xp-order-option" data-type="domicilio">' +
          '<span class="xp-order-icon">' +
            '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="5.5" cy="17.5" r="2.5"/><circle cx="15.5" cy="17.5" r="2.5"/>' +
              '<path d="M8 17.5h5.5"/><path d="M14.5 10h3.5l2.5 4v3.5h-2"/>' +
              '<path d="M3 12.5h5l2-3h2"/><path d="M8.5 16v-3.5"/>' +
            '</svg>' +
          '</span>' +
          '<span class="xp-order-label">A domicilio</span>' +
          '<span class="xp-order-desc">Te lo llevamos a casa</span>' +
        '</button>' +
        '<button class="xp-order-option" data-type="recoger">' +
          '<span class="xp-order-icon">' +
            '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' +
              '<polyline points="9 22 9 12 15 12 15 22"/>' +
            '</svg>' +
          '</span>' +
          '<span class="xp-order-label">Recoger en local</span>' +
          '<span class="xp-order-desc">P\u00e1sate a recogerlo</span>' +
        '</button>' +
      '</div>' +
      '<div class="xp-address-section">' +
        '<div class="xp-address-icon-wrap">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2C20 17.5 12 22 12 22z"/>' +
            '<circle cx="12" cy="10" r="3"/>' +
          '</svg>' +
          '<span>Direcci\u00f3n de entrega</span>' +
        '</div>' +
        '<div class="xp-address-input-wrap">' +
          '<input class="xp-address-input" type="text" placeholder="Calle, n\u00famero, ciudad..." />' +
        '</div>' +
        '<button class="xp-cart-continue xp-confirm-address">' +
          'Confirmar direcci\u00f3n' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>' +
          '</svg>' +
        '</button>' +
      '</div>';

    els.overlay.appendChild(modal);
    els.orderTypeModal = modal;

    /* ---- Close button ---- */
    modal.querySelector('.xp-cart-header-close').addEventListener('click', function () {
      state.pendingProduct = null;
      hideAllModals();
    });

    /* ---- Drag to dismiss (mobile) ---- */
    var dragHandle = modal.querySelector('.xp-cart-drag-handle');
    var dragStartY = 0;
    var dragOffset = 0;
    var isDragging = false;

    dragHandle.addEventListener('touchstart', function (e) {
      dragStartY = e.touches[0].clientY;
      isDragging = true;
      modal.style.transition = 'none';
    }, { passive: true });

    dragHandle.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      dragOffset = e.touches[0].clientY - dragStartY;
      if (dragOffset < 0) dragOffset = 0;
      modal.style.transform = 'translateY(' + dragOffset + 'px)';
    }, { passive: true });

    dragHandle.addEventListener('touchend', function () {
      if (!isDragging) return;
      isDragging = false;
      modal.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
      if (dragOffset > 100) {
        state.pendingProduct = null;
        modal.style.transform = 'translateY(100%)';
        setTimeout(function () {
          hideAllModals();
          modal.style.transform = '';
          modal.style.transition = '';
        }, 350);
      } else {
        modal.style.transform = '';
      }
      dragOffset = 0;
    }, { passive: true });

    var options = modal.querySelectorAll('.xp-order-option');
    var addressSection = modal.querySelector('.xp-address-section');
    var addressInput = modal.querySelector('.xp-address-input');
    var confirmAddr = modal.querySelector('.xp-confirm-address');

    function selectDelivery() {
      addressSection.classList.add('active');
      options.forEach(function (o) { o.classList.remove('selected'); });
      modal.querySelector('[data-type="domicilio"]').classList.add('selected');
      setTimeout(function () { addressInput.focus(); }, 400);
    }

    function selectPickup() {
      state.orderType = 'recoger';
      state.address = '';
      saveOrderType();
      els.overlay.classList.remove('xp-order-active');
      hideAllModals();
      if (state.pendingProduct) {
        addToCart(state.pendingProduct.name, state.pendingProduct.price);
        saveCart();
        showAddToast(state.pendingProduct.name);
        updateBottomBar();
        state.pendingProduct = null;
      }
    }

    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        var type = this.getAttribute('data-type');
        if (type === 'domicilio') {
          selectDelivery();
        } else {
          selectPickup();
        }
      });
    });

    confirmAddr.addEventListener('click', function () {
      var addr = addressInput.value.trim();
      if (!addr) {
        addressInput.style.borderColor = '#ff2d55';
        addressInput.focus();
        return;
      }
      addressInput.style.borderColor = '';
      state.orderType = 'domicilio';
      state.address = addr;
      saveOrderType();
      els.overlay.classList.remove('xp-order-active');
      hideAllModals();
      if (state.pendingProduct) {
        addToCart(state.pendingProduct.name, state.pendingProduct.price);
        saveCart();
        showAddToast(state.pendingProduct.name);
        updateBottomBar();
        state.pendingProduct = null;
      }
    });

    addressInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmAddr.click();
      }
    });
  }

  function buildCartModal() {
    var modal = document.createElement('div');
    modal.className = 'xp-modal xp-modal-cart';
    modal.innerHTML =
      '<div class="xp-cart-drag-handle"></div>' +
      '<div class="xp-cart-header">' +
        '<div class="xp-cart-header-left">' +
          '<div class="xp-cart-header-icon">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>' +
              '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>' +
            '</svg>' +
          '</div>' +
          '<div>' +
            '<div class="xp-cart-header-title">Tu pedido</div>' +
            '<div class="xp-cart-header-meta">' +
              '<span class="xp-cart-header-type"></span>' +
              '<span class="xp-cart-header-count"></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="xp-cart-header-close" aria-label="Cerrar">&times;</button>' +
      '</div>' +
      '<div class="xp-cart-header-divider"></div>' +
      '<div class="xp-cart-address-display" style="display:none">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2C20 17.5 12 22 12 22z"/>' +
          '<circle cx="12" cy="10" r="3"/>' +
        '</svg>' +
        '<span></span>' +
      '</div>' +
      '<div class="xp-cart-products"></div>' +
      '<div class="xp-cart-footer">' +
        '<div class="xp-cart-total-row">' +
          '<span class="xp-cart-total-label">Subtotal</span>' +
          '<span class="xp-cart-total-value xp-cart-subtotal"></span>' +
        '</div>' +
        '<div class="xp-cart-footer-divider"></div>' +
        '<div class="xp-cart-total-row">' +
          '<span class="xp-cart-total-label total">Total</span>' +
          '<span class="xp-cart-total-value total xp-cart-grandtotal"></span>' +
        '</div>' +
        '<button class="xp-cart-continue">Continuar pedido</button>' +
      '</div>';

    els.overlay.appendChild(modal);
    els.cartModal = modal;
    els.cartProducts = modal.querySelector('.xp-cart-products');
    els.cartSubtotal = modal.querySelector('.xp-cart-subtotal');
    els.cartGrandtotal = modal.querySelector('.xp-cart-grandtotal');
    els.cartHeaderType = modal.querySelector('.xp-cart-header-type');
    els.cartHeaderCount = modal.querySelector('.xp-cart-header-count');
    els.cartAddressDisplay = modal.querySelector('.xp-cart-address-display');
    els.cartAddressDisplayText = els.cartAddressDisplay.querySelector('span');

    modal.querySelector('.xp-cart-header-close').addEventListener('click', function () {
      hideAllModals();
    });

    modal.querySelector('.xp-cart-continue').addEventListener('click', function () {
      hideAllModals();
    });

    /* ---- Drag to dismiss (mobile) ---- */
    var dragHandle = modal.querySelector('.xp-cart-drag-handle');
    var dragStartY = 0;
    var dragOffset = 0;
    var isDragging = false;

    dragHandle.addEventListener('touchstart', function (e) {
      dragStartY = e.touches[0].clientY;
      isDragging = true;
      modal.style.transition = 'none';
    }, { passive: true });

    dragHandle.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      dragOffset = e.touches[0].clientY - dragStartY;
      if (dragOffset < 0) dragOffset = 0;
      modal.style.transform = 'translateY(' + dragOffset + 'px)';
    }, { passive: true });

    dragHandle.addEventListener('touchend', function () {
      if (!isDragging) return;
      isDragging = false;
      modal.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
      if (dragOffset > 100) {
        modal.style.transform = 'translateY(100%)';
        setTimeout(function () {
          hideAllModals();
          modal.style.transform = '';
          modal.style.transition = '';
        }, 350);
      } else {
        modal.style.transform = '';
      }
      dragOffset = 0;
    }, { passive: true });
  }

  /* ====================== UI UPDATES ====================== */

  function updateBottomBar() {
    var count = getCartCount();
    var total = getCartTotal();

    if (count === 0) {
      els.bottomBar.classList.remove('visible');
      return;
    }

    els.bottomBar.classList.add('visible');

    var prevCount = els.bottomCount.textContent;
    var prevTotal = els.bottomTotal.textContent;

    els.bottomCount.textContent = count + ' producto' + (count !== 1 ? 's' : '');

    var totalParts = formatPrice(total);
    var lastComma = totalParts.lastIndexOf(',');
    var intPart = totalParts.substring(0, lastComma);
    var decPart = totalParts.substring(lastComma);
    els.bottomTotal.innerHTML = intPart + '<span class="xp-total-currency">' + decPart + '</span>';

    if (prevCount !== els.bottomCount.textContent) {
      els.bottomCount.classList.remove('bump');
      void els.bottomCount.offsetWidth;
      els.bottomCount.classList.add('bump');
    }
    if (prevTotal !== els.bottomTotal.textContent) {
      els.bottomTotal.classList.remove('bump');
      void els.bottomTotal.offsetWidth;
      els.bottomTotal.classList.add('bump');
    }
  }

  function renderCartModal() {
    var count = getCartCount();

    if (count === 0) {
      els.cartProducts.innerHTML = '<div class="xp-cart-empty">' +
        '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>' +
          '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>' +
        '</svg>' +
        'Tu pedido est\u00e1 vac\u00edo</div>';
      els.cartSubtotal.textContent = '0,00\u20ac';
      els.cartGrandtotal.textContent = '0,00\u20ac';
      els.cartHeaderType.innerHTML = '';
      els.cartHeaderCount.textContent = '';
      els.cartAddressDisplay.style.display = 'none';
      return;
    }

    var countText = count + ' ' + (count === 1 ? 'producto' : 'productos');
    els.cartHeaderCount.textContent = countText;

    var orderLabel = state.orderType === 'domicilio' ? 'A domicilio' : 'Recoger en local';
    var orderIcon = state.orderType === 'domicilio' ?
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="15.5" cy="17.5" r="2.5"/><path d="M8 17.5h5.5"/><path d="M14.5 10h3.5l2.5 4v3.5h-2"/><path d="M3 12.5h5l2-3h2"/><path d="M8.5 16v-3.5"/></svg>' :
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
    els.cartHeaderType.innerHTML = orderIcon + ' ' + orderLabel;

    if (state.orderType === 'domicilio' && state.address) {
      els.cartAddressDisplay.style.display = 'flex';
      els.cartAddressDisplayText.textContent = state.address;
    } else {
      els.cartAddressDisplay.style.display = 'none';
    }

    var html = '';
    for (var i = 0; i < state.cart.length; i++) {
      var item = state.cart[i];
      var subtotal = item.price * item.qty;
      html +=
        '<div class="xp-cart-item" data-id="' + item.id + '">' +
          '<div class="xp-item-info">' +
            '<div class="xp-item-name">' + escapeHtml(item.name) + '</div>' +
            '<div class="xp-item-price">' + formatPrice(item.price) + ' c/u</div>' +
          '</div>' +
          '<div class="xp-item-qty">' +
            '<button class="xp-qty-btn xp-qty-minus" data-id="' + item.id + '">\u2212</button>' +
            '<span class="xp-qty-value">' + item.qty + '</span>' +
            '<button class="xp-qty-btn xp-qty-plus" data-id="' + item.id + '">+</button>' +
            '<button class="xp-qty-btn delete" data-id="' + item.id + '">\u2715</button>' +
          '</div>' +
          '<div class="xp-item-subtotal">' + formatPrice(subtotal) + '</div>' +
        '</div>';
    }
    els.cartProducts.innerHTML = html;

    var subtotal = getCartTotal();
    els.cartSubtotal.textContent = formatPrice(subtotal);
    els.cartGrandtotal.textContent = formatPrice(subtotal);

    els.cartProducts.querySelectorAll('.xp-qty-minus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        updateQuantity(id, -1);
        renderCartModal();
        updateBottomBar();
      });
    });

    els.cartProducts.querySelectorAll('.xp-qty-plus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        updateQuantity(id, 1);
        renderCartModal();
        updateBottomBar();
      });
    });

    els.cartProducts.querySelectorAll('.xp-qty-btn.delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        removeFromCart(id);
        renderCartModal();
        updateBottomBar();
        if (getCartCount() === 0) hideAllModals();
      });
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ====================== MODAL CONTROLS ====================== */

  function showOverlay() {
    els.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.__lenis) window.__lenis.stop();
    var products = document.querySelector('.xp-cart-products');
    if (products) {
      products.addEventListener('touchmove', allowScroll, { passive: false });
    }
  }

  function hideOverlay() {
    els.overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (window.__lenis) window.__lenis.start();
    var products = document.querySelector('.xp-cart-products');
    if (products) {
      products.removeEventListener('touchmove', allowScroll);
    }
  }

  function allowScroll(e) {
    e.stopPropagation();
  }

  function showOrderTypeModal() {
    var addrSection = els.orderTypeModal.querySelector('.xp-address-section');
    addrSection.classList.remove('active');
    els.orderTypeModal.querySelectorAll('.xp-order-option').forEach(function (o) {
      o.classList.remove('selected');
    });
    els.orderTypeModal.querySelector('.xp-address-input').value = '';
    els.orderTypeModal.querySelector('.xp-address-input').style.borderColor = '';
    els.overlay.classList.add('xp-order-active');
    showOverlay();
  }

  function showCartModal() {
    els.overlay.classList.remove('xp-order-active');
    renderCartModal();
    showOverlay();
  }

  function hideAllModals() {
    hideOverlay();
  }

  /* ====================== TOAST FEEDBACK ====================== */

  var toastTimer = null;

  function showAddToast(productName) {
    var toast = document.querySelector('.xp-add-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'xp-add-toast';
      toast.innerHTML =
        '<span class="xp-check">\u2713</span>' +
        '<span><span class="xp-toast-name"></span> a\u00f1adido</span>';
      document.body.appendChild(toast);
    }

    toast.querySelector('.xp-toast-name').textContent = productName;
    toast.classList.add('visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('visible');
    }, CFG.toastDuration);
  }

  /* ====================== MAIN EVENT HANDLER ====================== */

  function handleAddClick(e) {
    e.preventDefault();
    var btn = e.currentTarget;
    var info = getProductInfo(btn);
    if (!info) return;

    if (getCartCount() === 0) {
      state.pendingProduct = info;
      showOrderTypeModal();
    } else {
      addToCart(info.name, info.price);
      saveCart();
      showAddToast(info.name);
      updateBottomBar();
    }
  }

  /* ====================== KEYBOARD ====================== */

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      if (els.overlay.classList.contains('xp-order-active')) return;
      hideAllModals();
    }
  }

  /* ====================== INIT ====================== */

  function init() {
    loadState();

    buildBottomBar();
    buildOverlay();
    buildOrderTypeModal();
    buildCartModal();

    if (getCartCount() > 0) {
      updateBottomBar();
    }

    var btns = document.querySelectorAll('.btn-add');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', handleAddClick);
    }

    document.addEventListener('keydown', handleKeydown);
  }

  window.addEventListener('xpacify:refresh', function () {
    loadState();
    if (els.bottomBar) updateBottomBar();
    if (els.overlay && els.overlay.classList.contains('active') && els.cartModal) {
      renderCartModal();
    }
  });

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      loadState();
      if (els.bottomBar) {
        if (getCartCount() > 0) {
          updateBottomBar();
        } else {
          els.bottomBar.classList.remove('visible');
        }
      }
    }
  });

  window.xpacifyAddProduct = function (name, price) {
    if (getCartCount() === 0) {
      state.pendingProduct = { name: name, price: price };
      showOrderTypeModal();
    } else {
      addToCart(name, price);
      saveCart();
      showAddToast(name);
      updateBottomBar();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

