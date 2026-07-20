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
    if (window.DCA_CANVAS_SIZES && window.DCA_CANVAS_SIZES.length) {
      return window.DCA_CANVAS_SIZES;
    }
    // Fallback if products.js is cached without the size catalog
    return [
      {
        id: "8x10",
        label: '8" × 10"',
        price: 159.99,
        description:
          "Our 8×10 canvas is the perfect choice for adding a touch of Delaware’s coastal beauty to smaller spaces such as bookshelves, desks, entryways, bathrooms, or gallery walls. Its compact size makes it an affordable gift while still showcasing every vibrant detail of the artwork."
      },
      {
        id: "11x14",
        label: '11" × 14"',
        price: 199.99,
        description:
          "The 11×14 canvas offers a versatile display size that works beautifully in bedrooms, home offices, kitchens, and hallways. It provides greater visual impact while fitting comfortably into most spaces, making it one of the most popular choices for everyday décor."
      },
      {
        id: "12x12",
        label: '12" × 12"',
        price: 199.99,
        description:
          "The 12×12 canvas features a contemporary square format that complements modern interiors and is ideal for balanced landscape and wildlife compositions. Its unique proportions make it an excellent accent piece for living rooms, offices, beach homes, or as part of a coordinated gallery wall."
      },
      {
        id: "16x20",
        label: '16" × 20"',
        price: 359.99,
        description:
          "The 16×20 canvas creates a bold statement and allows the rich colors and intricate details of the artwork to truly shine. Perfect for living rooms, dining rooms, offices, beach houses, and entryways, this larger size becomes an eye-catching centerpiece that brings the beauty of Delaware’s landscapes into any room."
      }
    ];
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

  function productImageSrc(product) {
    if (!product || !product.image) return "";
    var image = String(product.image);
    if (/^https?:\/\//i.test(image)) return image;
    return base + "assets/images/art/" + image;
  }

  function getStripeForSize(product, sizeId) {
    var generated =
      window.DCA_STRIPE_LINKS &&
      product &&
      window.DCA_STRIPE_LINKS[product.id] &&
      window.DCA_STRIPE_LINKS[product.id][sizeId];

    if (generated && generated.url) {
      return {
        stripePaymentLink: generated.url,
        stripePriceId: generated.priceId || ""
      };
    }

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
          escapeHtml(productImageSrc(p)) +
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
        "Purchase — " +
        priceLabel +
        "</a>" +
        '<p class="stripe-note">Secure Stripe checkout for the ' +
        escapeHtml(size.label) +
        " canvas. You will be redirected to complete your order.</p>";
      return;
    }

    mount.innerHTML =
      '<button type="button" class="btn btn-gold" id="stripe-setup-btn" data-bs-toggle="modal" data-bs-target="#stripeSetupModal">' +
      "Purchase — " +
      priceLabel +
      "</button>" +
      '<p class="stripe-note">Add GitHub secret <code>STRIPE_SECRET_KEY</code> and run Action <strong>Sync Stripe payment links</strong>.</p>';
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

  function setSelectedSizeButton(mount, sizeId) {
    var buttons = mount.querySelectorAll(".size-option");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var selected = btn.getAttribute("data-size") === sizeId;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
    }
  }

  function renderSizePicker(product) {
    var mount = document.getElementById("product-sizes");
    if (!mount || !product) return;

    var sizes = getCanvasSizes();
    if (!sizes.length) return;

    var config = window.DCA_CONFIG || {};
    var defaultId = config.defaultSizeId || sizes[0].id;
    if (!getSizeById(defaultId)) defaultId = sizes[0].id;

    // Button grid avoids Bootstrap fieldset/legend collapse bugs on iOS Safari
    mount.innerHTML =
      '<div class="size-picker">' +
      '<p class="size-picker-title" id="size-picker-label">Choose canvas size</p>' +
      '<div class="size-options" role="group" aria-labelledby="size-picker-label">' +
      sizes
        .map(function (size) {
          var selected = size.id === defaultId;
          return (
            '<button type="button" class="size-option' +
            (selected ? " is-selected" : "") +
            '" data-size="' +
            escapeHtml(size.id) +
            '" aria-pressed="' +
            (selected ? "true" : "false") +
            '">' +
            '<span class="size-option-label">' +
            escapeHtml(size.label) +
            "</span>" +
            '<span class="size-option-price">' +
            formatPrice(size.price) +
            "</span>" +
            "</button>"
          );
        })
        .join("") +
      "</div></div>";

    mount.addEventListener("click", function (event) {
      var btn = event.target.closest(".size-option");
      if (!btn || !mount.contains(btn)) return;
      var sizeId = btn.getAttribute("data-size");
      setSelectedSizeButton(mount, sizeId);
      updateProductSelection(product, sizeId);
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
      imgEl.src = productImageSrc(product);
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
