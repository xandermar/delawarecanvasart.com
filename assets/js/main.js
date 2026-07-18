(function () {
  "use strict";

  function pathDepth() {
    var path = window.location.pathname.replace(/\/$/, "");
    if (path.endsWith(".html")) {
      path = path.slice(0, path.lastIndexOf("/"));
    }
    var parts = path.split("/").filter(Boolean);
    // Detect gallery subdirectory
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
      // Home only when not under gallery/
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
    return "$" + Number(n).toFixed(0);
  }

  function getProductById(id) {
    var list = window.DCA_PRODUCTS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function renderGalleryGrid(targetId, limit) {
    var el = document.getElementById(targetId);
    if (!el || !window.DCA_PRODUCTS) return;

    var products = window.DCA_PRODUCTS.slice(0, limit || window.DCA_PRODUCTS.length);
    var imgBase = base + "assets/images/art/";
    var linkBase = base + "gallery/";

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
          p.title +
          '" loading="lazy" width="800" height="600">' +
          "</div>" +
          "<h3>" +
          p.title +
          "</h3>" +
          '<p class="meta">' +
          p.category +
          " · " +
          p.size +
          "</p>" +
          '<p class="price">' +
          formatPrice(p.price) +
          "</p>" +
          "</a>"
        );
      })
      .join("");
  }

  function initStripeBuy(product) {
    var mount = document.getElementById("stripe-buy");
    if (!mount || !product) return;

    if (product.stripePaymentLink) {
      mount.innerHTML =
        '<a class="btn btn-gold stripe-placeholder" href="' +
        product.stripePaymentLink +
        '" rel="noopener">' +
        "Buy with Stripe — " +
        formatPrice(product.price) +
        "</a>" +
        '<p class="stripe-note">Secure payment via Stripe. You will be redirected to complete your order.</p>';
      return;
    }

    mount.innerHTML =
      '<button type="button" class="btn btn-gold" id="stripe-setup-btn" data-bs-toggle="modal" data-bs-target="#stripeSetupModal">' +
      "Purchase — " +
      formatPrice(product.price) +
      "</button>" +
      '<p class="stripe-note">Checkout is ready to connect. Add your Stripe Payment Link in <code>assets/js/products.js</code> to enable live sales.</p>';
  }

  function renderProductPage(productId) {
    var product = getProductById(productId);
    if (!product) return;

    var titleEl = document.getElementById("product-title");
    var priceEl = document.getElementById("product-price");
    var descEl = document.getElementById("product-description");
    var imgEl = document.getElementById("product-image");
    var metaEl = document.getElementById("product-meta");

    if (titleEl) titleEl.textContent = product.title;
    if (priceEl) priceEl.textContent = formatPrice(product.price);
    if (descEl) descEl.textContent = product.description;
    if (imgEl) {
      imgEl.src = base + "assets/images/art/" + product.image;
      imgEl.alt = product.title;
    }
    if (metaEl) {
      metaEl.innerHTML =
        "<li><span>Size</span><span>" +
        product.size +
        "</span></li>" +
        "<li><span>Medium</span><span>" +
        product.medium +
        "</span></li>" +
        "<li><span>Category</span><span>" +
        product.category +
        "</span></li>" +
        "<li><span>Inspired by</span><span>" +
        product.location +
        "</span></li>";
    }

    document.title = product.title + " · Delaware Canvas Art";
    initStripeBuy(product);
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
    renderGalleryGrid: renderGalleryGrid
  };
})();
