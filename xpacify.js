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
      '<div class="xp-modal-title">\u00bfC\u00f3mo quieres tu pedido?</div>' +
      '<div class="xp-modal-subtitle">Elige tu opci\u00f3n de recogida preferida</div>' +
      '<div class="xp-order-options">' +
        '<button class="xp-order-option" data-type="domicilio">' +
          '<span class="xp-order-icon">\ud83d\udef5</span>' +
          '<span class="xp-order-label">A domicilio</span>' +
          '<span class="xp-order-desc">Te lo llevamos a casa</span>' +
        '</button>' +
        '<button class="xp-order-option" data-type="recoger">' +
          '<span class="xp-order-icon">\ud83c\udfea</span>' +
          '<span class="xp-order-label">Recoger en local</span>' +
          '<span class="xp-order-desc">P\u00e1sate a recogerlo</span>' +
        '</button>' +
      '</div>' +
      '<div class="xp-address-section">' +
        '<label class="xp-address-label">\u00bfA qu\u00e9 direcci\u00f3n lo enviamos?</label>' +
        '<input class="xp-address-input" type="text" placeholder="Calle, n\u00famero, ciudad..." />' +
        '<button class="xp-confirm-address">Confirmar direcci\u00f3n</button>' +
      '</div>';

    els.overlay.appendChild(modal);
    els.orderTypeModal = modal;

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
      '<div class="xp-cart-header">' +
        '<div>' +
          '<div class="xp-cart-header-title">Tu pedido</div>' +
          '<div class="xp-cart-header-type"></div>' +
        '</div>' +
        '<button class="xp-cart-header-close" aria-label="Cerrar">&times;</button>' +
      '</div>' +
      '<div class="xp-cart-address-display" style="display:none"></div>' +
      '<div class="xp-cart-products"></div>' +
      '<div class="xp-cart-footer">' +
        '<div class="xp-cart-total-row">' +
          '<span class="xp-cart-total-label">Subtotal</span>' +
          '<span class="xp-cart-total-value xp-cart-subtotal"></span>' +
        '</div>' +
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
    els.cartAddressDisplay = modal.querySelector('.xp-cart-address-display');

    modal.querySelector('.xp-cart-header-close').addEventListener('click', function () {
      hideAllModals();
    });

    modal.querySelector('.xp-cart-continue').addEventListener('click', function () {
      hideAllModals();
    });
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
      els.cartProducts.innerHTML = '<div class="xp-cart-empty">Tu pedido est\u00e1 vac\u00edo</div>';
      els.cartSubtotal.textContent = '0,00\u20ac';
      els.cartGrandtotal.textContent = '0,00\u20ac';
      els.cartHeaderType.textContent = '';
      els.cartAddressDisplay.style.display = 'none';
      return;
    }

    var orderLabel = state.orderType === 'domicilio' ? '\ud83d\udef5 A domicilio' : '\ud83c\udfea Recoger en local';
    els.cartHeaderType.textContent = orderLabel;

    if (state.orderType === 'domicilio' && state.address) {
      els.cartAddressDisplay.style.display = 'block';
      els.cartAddressDisplay.textContent = '\ud83d\udccd ' + state.address;
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
  }

  function hideOverlay() {
    els.overlay.classList.remove('active');
    document.body.style.overflow = '';
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

    if (!state.orderTypeSet) {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
