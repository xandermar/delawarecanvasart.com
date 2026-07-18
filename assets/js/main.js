(function () {
  "use strict";

  function pathDepth() {
    var path = window.location.pathname.replace(/\/$/, "");
    if (path.endsWith(".html")) {
      path = path.slice(0, path.lastIndexOf("/"));
    }
    var parts = path.split("/").filter(Boolean);
    if (parts[parts.length - 1] === "gallery" || parts.indexOf("gallery") !== -1) {
      return "../";
    }
    return "";
  }

  var base = pathDepth();

  function currentPage() {
    var file = window.location.pathname.split("/").pop() || "index.html";
    if (!file || file.indexOf(".") === -1) return "index.html";
    return file;
  }

  function navActive(hrefFile) {
    var page = currentPage();
    var path = window.location.pathname;
    if (hrefFile === "index.html" && (page === "index.html" || path.endsWith("/"))) {
      if (path.indexOf("/gallery") === -1) return " active";
      return "";
    }
    if (hrefFile === "gallery/index.html" && path.indexOf("/gallery") !== -1) return " active";
    if (hrefFile === "about.html" && page === "about.html") return " active";
    return "";
  }

  function renderNav() {
    var el = document.getElementById("site-nav");
    if (!el) return;

    el.innerHTML =
      '<nav class="navbar navbar-expand-lg site-nav">' +
      '<div class="container">' +
      '<a class="navbar-brand" href="' +
      base +
      'index.html">' +
      '<img src="' +
      base +
      'assets/images/logo.png" width="52" height="52" alt="Delaware Canvas Art logo">' +
      '<span class="nav-brand-text">' +
      '<span class="brand-wordmark">Delaware</span>' +
      '<span class="brand-script">Canvas Art</span>' +
      "</span></a>" +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">' +
      '<span class="navbar-toggler-icon"></span></button>' +
      '<div class="collapse navbar-collapse" id="mainNav">' +
      '<ul class="navbar-nav ms-auto align-items-lg-center">' +
      '<li class="nav-item"><a class="nav-link' +
      navActive("index.html") +
      '" href="' +
      base +
      'index.html">Home</a></li>' +
      '<li class="nav-item"><a class="nav-link' +
      navActive("gallery/index.html") +
      '" href="' +
      base +
      'gallery/index.html">Gallery</a></li>' +
      '<li class="nav-item"><a class="nav-link' +
      navActive("about.html") +
      '" href="' +
      base +
      'about.html">About</a></li>' +
      "</ul></div></div></nav>";
  }

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;

    var year = new Date().getFullYear();
    el.innerHTML =
      '<footer class="site-footer">' +
      '<div class="container">' +
      '<div class="row gy-4">' +
      '<div class="col-md-6">' +
      '<div class="footer-brand">' +
      '<img src="' +
      base +
      'assets/images/logo.png" width="64" height="64" alt="Delaware Canvas Art logo">' +
      "<div>" +
      '<div class="brand-wordmark">Delaware</div>' +
      '<div class="brand-script" style="font-size:1.4rem">Canvas Art</div>' +
      "</div></div>" +
      "<p>Sussex County landscapes, wildlife, and beaches—handcrafted canvas art that brings the First State home.</p>" +
      "</div>" +
      '<div class="col-md-6">' +
      '<p class="section-kicker" style="color:var(--gold-light)">Explore</p>' +
      '<ul class="footer-links">' +
      '<li><a href="' +
      base +
      'index.html">Home</a></li>' +
      '<li><a href="' +
      base +
      'gallery/index.html">Gallery</a></li>' +
      '<li><a href="' +
      base +
      'about.html">About</a></li>' +
      "</ul></div></div>" +
      '<div class="footer-bottom d-flex flex-wrap justify-content-between gap-2">' +
      "<span>&copy; " +
      year +
      " Delaware Canvas Art. All rights reserved.</span>" +
      "<span>Secure checkout powered by Stripe</span>" +
      "</div></div></footer>";
  }

  function formatPrice(n) {
    var value = Number(n);
    var fixed = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
    return "$" + fixed;
  }

  function getCanvasSizes() {
    return window.DCA_CANVAS_SIZES || [];
  }

  function getSizeById(sizeId) {
    var sizes = getCanvasSizes();
    for (var i = 0; i < sizes.length; i++) {
      if (sizes[i].id === sizeId) return sizes[i];
    }
    return sizes[0] || null;
  }

  function getStartingPrice() {
    var sizes = getCanvasSizes();
    if (!sizes.length) return 0;
    var min = sizes[0].price;
    for (var i = 1; i < sizes.length; i++) {
      if (sizes[i].price < min) min = sizes[i].price;
    }
    return min;
  }

  function getProductById(id) {
    var list = window.DCA_PRODUCTS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function getStripeForSize(product, sizeId) {
    if (!product || !product.stripe) return { stripePaymentLink: "", stripePriceId: "" };
    return product.stripe[sizeId] || { stripePaymentLink: "", stripePriceId: "" };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderGalleryGrid(targetId, limit) {
    var el = document.getElementById(targetId);
    if (!el || !window.DCA_PRODUCTS) return;

    var products = window.DCA_PRODUCTS.slice(0, limit || window.DCA_PRODUCTS.length);
    var imgBase = base + "assets/images/art/";
    var linkBase = base + "gallery/";
    var fromPrice = formatPrice(getStartingPrice());
    var sizeCount = getCanvasSizes().length;

    el.innerHTML = products
      .map(function (p) {
        return (
          '<a class="art-tile reveal" href="' +
          linkBase +
          p.slug +
          '">' +
          '<div class="art-tile-media">' +
          '<img src="' +
          imgBase +
          p.image +
          '" alt="' +
          escapeHtml(p.title) +
          '" loading="lazy" width="800" height="600">' +
          "</div>" +
          "<h3>" +
          escapeHtml(p.title) +
          "</h3>" +
          '<p class="meta">' +
          escapeHtml(p.category) +
          " · " +
          sizeCount +
          " sizes</p>" +
          '<p class="price">From ' +
          fromPrice +
          "</p>" +
          "</a>"
        );
      })
      .join("");
  }

  function initStripeBuy(product, size) {
    var mount = document.getElementById("stripe-buy");
    if (!mount || !product || !size) return;

    var stripe = getStripeForSize(product, size.id);
    var priceLabel = formatPrice(size.price);

    if (stripe.stripePaymentLink) {
      mount.innerHTML =
        '<a class="btn btn-gold stripe-placeholder" href="' +
        escapeHtml(stripe.stripePaymentLink) +
        '" rel="noopener">' +
        "Buy with Stripe — " +
        priceLabel +
        "</a>" +
        '<p class="stripe-note">Secure payment via Stripe for the ' +
        escapeHtml(size.label) +
        " canvas. You will be redirected to complete your order.</p>";
      return;
    }

    mount.innerHTML =
      '<button type="button" class="btn btn-gold" id="stripe-setup-btn" data-bs-toggle="modal" data-bs-target="#stripeSetupModal">' +
      "Purchase — " +
      priceLabel +
      "</button>" +
      '<p class="stripe-note">Checkout is ready to connect. Add a Stripe Payment Link for this size in <code>assets/js/products.js</code> to enable live sales.</p>';
  }

  function updateProductSelection(product, sizeId) {
    var size = getSizeById(sizeId);
    if (!product || !size) return;

    var priceEl = document.getElementById("product-price");
    var sizeDescEl = document.getElementById("size-description");
    var metaEl = document.getElementById("product-meta");
    var sizeLabelEl = document.getElementById("selected-size-label");

    if (priceEl) priceEl.textContent = formatPrice(size.price);
    if (sizeDescEl) sizeDescEl.textContent = size.description;
    if (sizeLabelEl) sizeLabelEl.textContent = size.label;

    if (metaEl) {
      metaEl.innerHTML =
        "<li><span>Size</span><span>" +
        escapeHtml(size.label) +
        "</span></li>" +
        "<li><span>Medium</span><span>" +
        escapeHtml(product.medium) +
        "</span></li>" +
        "<li><span>Category</span><span>" +
        escapeHtml(product.category) +
        "</span></li>" +
        "<li><span>Inspired by</span><span>" +
        escapeHtml(product.location) +
        "</span></li>";
    }

    initStripeBuy(product, size);
  }

  function renderSizePicker(product) {
    var mount = document.getElementById("product-sizes");
    if (!mount || !product) return;

    var sizes = getCanvasSizes();
    var config = window.DCA_CONFIG || {};
    var defaultId = config.defaultSizeId || (sizes[0] && sizes[0].id);
    if (!getSizeById(defaultId) && sizes[0]) defaultId = sizes[0].id;

    mount.innerHTML =
      '<fieldset class="size-picker">' +
      "<legend>Choose canvas size</legend>" +
      '<div class="size-options" role="radiogroup" aria-label="Canvas size">' +
      sizes
        .map(function (size) {
          var checked = size.id === defaultId ? " checked" : "";
          return (
            '<label class="size-option">' +
            '<input type="radio" name="canvas-size" value="' +
            escapeHtml(size.id) +
            '"' +
            checked +
            ">" +
            '<span class="size-option-body">' +
            '<span class="size-option-label">' +
            escapeHtml(size.label) +
            "</span>" +
            '<span class="size-option-price">' +
            formatPrice(size.price) +
            "</span>" +
            "</span></label>"
          );
        })
        .join("") +
      "</div></fieldset>";

    var inputs = mount.querySelectorAll('input[name="canvas-size"]');
    inputs.forEach(function (input) {
      input.addEventListener("change", function () {
        updateProductSelection(product, input.value);
      });
    });

    updateProductSelection(product, defaultId);
  }

  function renderProductPage(productId) {
    var product = getProductById(productId);
    if (!product) return;

    var titleEl = document.getElementById("product-title");
    var descEl = document.getElementById("product-description");
    var imgEl = document.getElementById("product-image");

    if (titleEl) titleEl.textContent = product.title;
    if (descEl) descEl.textContent = product.description;
    if (imgEl) {
      imgEl.src = base + "assets/images/art/" + product.image;
      imgEl.alt = product.title;
    }

    document.title = product.title + " · Delaware Canvas Art";
    renderSizePicker(product);
  }

  function initReveals() {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) {
        n.classList.add("is-visible");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderNav();
    renderFooter();

    var galleryHome = document.getElementById("home-gallery");
    if (galleryHome) renderGalleryGrid("home-gallery", 3);

    var galleryAll = document.getElementById("gallery-all");
    if (galleryAll) renderGalleryGrid("gallery-all");

    var productPage = document.body.getAttribute("data-product");
    if (productPage) renderProductPage(productPage);

    initReveals();
  });

  window.DCA = {
    formatPrice: formatPrice,
    getProductById: getProductById,
    getSizeById: getSizeById,
    getStartingPrice: getStartingPrice,
    renderGalleryGrid: renderGalleryGrid
  };
})();
