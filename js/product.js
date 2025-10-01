// /Online-store/js/product.js  — DB-backed product listing (public + after login)
(function () {
  const API = "/Online-store/php/products.php?action=read";

  // DOM
  const grid = document.querySelector(".product-container");
  const catSelect = document.getElementById("category"); // from product.html
  const sortSelect = document.getElementById("sort");
  const searchBox = document.getElementById("searchInput"); // header search

  // Category mapping from DB → frontend slugs
  const CAT_ID_TO_SLUG = { 1: "mens", 2: "womens", 3: "kids", 4: "baby" };

  // Also normalize user input / <select> values
  const CAT_LABEL_TO_SLUG = {
    "": "",
    all: "",
    "all categories": "",
    mens: "mens",
    "men's clothing": "mens",
    womens: "womens",
    "women's clothing": "womens",
    kids: "kids",
    "kids' clothing": "kids",
    baby: "baby",
    "baby clothing": "baby",
  };

  // State
  let PRODUCTS = [];
  let view = [];

  // ---------- helpers ----------
  const money = (n) => `$${Number(n || 0).toFixed(2)}`;
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (m) => {
      return (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m] || m
      );
    });

  function normalizeCategory(v) {
    const raw = (v ?? "").toString().trim().toLowerCase();
    if (!raw || raw === "all" || raw === "all categories") return "";
    return CAT_LABEL_TO_SLUG[raw] || raw;
  }

  function setSelectCategoryToSlug(slug) {
    if (!catSelect) return;
    for (const opt of catSelect.options) {
      if (normalizeCategory(opt.value) === slug) {
        opt.selected = true;
        return;
      }
      if (normalizeCategory(opt.textContent) === slug) {
        opt.selected = true;
        return;
      }
    }
  }

  // ---------- fetch ----------
  async function loadProducts() {
    try {
      const res = await fetch(API, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("[products] Invalid JSON:", text);
        throw new Error("Server returned invalid JSON");
      }

      if (!Array.isArray(data)) {
        console.error("[products] API error payload:", data);
        throw new Error(data?.error || "Failed to load products");
      }

      PRODUCTS = data.map((row) => ({
        id: Number(row.id),
        name: row.name || "",
        price: Number(row.price) || 0,
        description: row.description || "",
        image: row.image || "",
        category_id: Number(row.category_id) || 0,
        category: CAT_ID_TO_SLUG[row.category_id] || "", // ✅ matches DB
        rating: Number(row.rating) || 0,
        reviews: Number(row.reviews) || 0,
        isNew: Number(row.isNew) || 0,
        inStock: Number(row.inStock) ? 1 : 0,
      }));

      applyFilters(true);
    } catch (err) {
      console.error(err);
      renderError("Could not load products. Please try again.");
    }
  }

  // ---------- render ----------
  function renderError(msg) {
    if (!grid) return;
    grid.innerHTML = `<div style="padding:1rem;color:#c00;background:#ffeaea;border:1px solid #f3caca;border-radius:8px">${esc(
      msg
    )}</div>`;
  }

  function render() {
    if (!grid) return;
    if (!view.length) {
      grid.innerHTML = `<p style="padding:1rem;opacity:.7">No products found.</p>`;
      return;
    }

    grid.innerHTML = view
      .map(
        (p) => `
      <div class="product-card">
        ${p.isNew ? '<div class="product-badge">New</div>' : ""}
        <div class="product-image">
          <img src="${esc(
            p.image || "../assets/images/placeholder.jpg"
          )}" alt="${esc(p.name)}" />
          <div class="product-overlay">
            <button class="quick-view">
              <i class="fas fa-eye"></i> Quick View
            </button>
          </div>
        </div>
        <div class="product-details">
          <h3>${esc(p.name)}</h3>
          <div class="product-rating">
            ${ratingStars(p.rating)} <span>(${p.rating.toFixed(1)})</span>
          </div>
          <p class="price"><span class="price-amount">${money(
            p.price
          )}</span></p>
          <button class="add-to-cart" 
                  data-id="${p.id}" 
                  data-name="${esc(p.name)}" 
                  data-price="${p.price}" 
                  data-image="${esc(p.image)}">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>`
      )
      .join("");
  }

  function ratingStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 !== 0;
    let s = "";
    for (let i = 0; i < full; i++) s += '<i class="fas fa-star"></i>';
    if (half) s += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < 5 - Math.ceil(rating); i++)
      s += '<i class="far fa-star"></i>';
    return s;
  }

  // ---------- filter/sort/search ----------
  function applyFilters(setSelectFromURL = false) {
    let selected = "";
    if (catSelect) {
      selected = normalizeCategory(catSelect.value);
      if (!selected && catSelect.selectedIndex >= 0) {
        selected = normalizeCategory(
          catSelect.options[catSelect.selectedIndex].textContent
        );
      }
    }

    // If asked, capture ?category=... and set the select accordingly
    if (setSelectFromURL) {
      const urlCat = normalizeCategory(
        new URLSearchParams(location.search).get("category") || ""
      );
      if (urlCat) {
        selected = urlCat;
        setSelectCategoryToSlug(urlCat);
      }
    }

    const q = (searchBox?.value || "").trim().toLowerCase();

    view = PRODUCTS.filter((p) => {
      if (selected && selected !== "" && p.category !== selected) return false;
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q))
        return false;
      return true;
    });

    const sort = sortSelect?.value || "featured";
    switch (sort) {
      case "price-low":
        view.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        view.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        view.sort((a, b) => b.rating - a.rating);
        break;
      default:
        view.sort((a, b) => b.isNew - a.isNew || b.id - a.id);
    }

    render();
  }

  // ---------- events ----------
  catSelect?.addEventListener("change", () => applyFilters());
  sortSelect?.addEventListener("change", () => applyFilters());
  searchBox?.addEventListener("input", () => applyFilters());

  // cart delegation
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    const item = {
      id: Number(btn.dataset.id),
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      image: btn.dataset.image,
    };
    if (
      window.cartManager &&
      typeof window.cartManager.addToCart === "function"
    ) {
      window.cartManager.addToCart(item);
    } else {
      alert("Cart is not available on this page.");
    }
  });

  // ---------- go ----------
  if (!grid) {
    console.warn("[products] .product-container not found on this page.");
    return;
  }
  loadProducts();
})();
