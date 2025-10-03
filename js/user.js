// /Online-store/js/user.js — SAFE ROUTER + PRODUCT + ORDERS (scoped)
(() => {
  const dashboardContent = document.getElementById("dashboardContent");
  if (!dashboardContent) return;

  // ---- helpers ----
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  const money = (n) => `$${Number(n || 0).toFixed(2)}`;

  // keep reference for header search/filter
  let activeRenderer = null;

  // ---- Product Renderer ----
  class ProductRenderer {
    constructor(containerSelector, cartManager) {
      this.containerSelector = containerSelector;
      this.cartManager = cartManager;
      this.products = [];
    }
    get container() {
      return dashboardContent.querySelector(this.containerSelector);
    }

    async loadProducts() {
      if (!this.container) return;
      try {
        const res = await fetch("/Online-store/php/products.php?action=read", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.products = Array.isArray(data) ? data : data.products || [];
        this.renderProducts(this.products);
      } catch (err) {
        console.error("[user.js] loadProducts failed:", err);
        this.container.innerHTML = "<p>Failed to load products.</p>";
      }
    }

    renderProducts(list) {
      if (!this.container) return;
      if (!list || !list.length) {
        this.container.innerHTML = "<p>No products found.</p>";
        return;
      }
      this.container.innerHTML = list
        .map(
          (p) => `
          <div class="product-card">
            ${p.isNew ? '<div class="product-badge">New</div>' : ""}
            <div class="product-image">
              <img src="${esc(p.image)}" alt="${esc(p.name)}"
                   onerror="this.src='../assets/images/placeholder.jpg'">
            </div>
            <div class="product-details">
              <h3>${esc(p.name)}</h3>
              <p class="price"><span>${money(p.price)}</span></p>
              <button class="add-to-cart-btn" data-id="${p.id}">
                <i class="fas fa-shopping-cart"></i> Add to Cart
              </button>
            </div>
          </div>
        `
        )
        .join("");

      // bind add-to-cart
      this.container.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          const product = this.products.find((p) => p.id === id);
          if (product && this.cartManager?.addToCart) {
            this.cartManager.addToCart(product);
          } else {
            alert("Cart is not available.");
          }
        });
      });
    }

    filterByCategory(val) {
      const raw = (val ?? "").toString().trim().toLowerCase();

      // Category mapping from DB → frontend slugs
      const CAT_ID_TO_SLUG = { 1: "mens", 2: "womens", 3: "kids", 4: "baby" };

      // Normalize user input / <select> values
      const CAT_LABEL_TO_SLUG = {
        "": "",
        all: "all",
        "all categories": "all",
        mens: "mens",
        "men's clothing": "mens",
        men: "mens",
        womens: "womens",
        "women's clothing": "womens",
        women: "womens",
        kids: "kids",
        "kids' clothing": "kids",
        kid: "kids",
        baby: "baby",
        "baby clothing": "baby",
      };

      const slug = CAT_LABEL_TO_SLUG[raw] || raw;

      // ✅ If "all" is chosen → reset to full list
      if (!slug || slug === "all") {
        this.renderProducts(this.products);
        return;
      }

      const filtered = this.products.filter((p) => {
        const pid = Number(p.category_id || 0);
        const pslug = (p.category || "").toString().trim().toLowerCase();
        return CAT_ID_TO_SLUG[pid] === slug || pslug === slug;
      });

      this.renderProducts(filtered);
    }

    searchProducts(q) {
      const query = (q || "").toLowerCase();
      if (!query) {
        this.renderProducts(this.products);
        return;
      }
      const filtered = this.products.filter((p) =>
        `${p.name} ${p.description || ""}`.toLowerCase().includes(query)
      );
      this.renderProducts(filtered);
    }

    sortProducts(opt) {
      const list = [...this.products];
      if (opt === "price-low") list.sort((a, b) => a.price - b.price);
      else if (opt === "price-high") list.sort((a, b) => b.price - a.price);
      this.renderProducts(list);
    }
  }

  // ----- Orders view -----
  async function renderOrdersView() {
    dashboardContent.innerHTML = `
      <section id="ordersSection" class="orders-section">
        <h2>My Orders List</h2>
        <div id="ordersContainer" class="orders-container"><p>Loading your orders...</p></div>
      </section>`;
    const container = document.getElementById("ordersContainer");

    try {
      const res = await fetch("/Online-store/php/getOrders.php", {
        credentials: "include",
      });
      const data = await res.json();

      if (!data.ok) {
        container.innerHTML = `<p style="color:red">${
          data.error || "Failed to load orders"
        }</p>`;
        return;
      }

      const orders = Array.isArray(data.orders) ? data.orders : [];
      if (!orders.length) {
        container.innerHTML = "<p>You have no orders yet.</p>";
        return;
      }

      container.innerHTML = orders
        .map(
          (o, idx) => `
          <div class="order-card">
            <div class="order-header">
              <span class="order-id">Order #${esc(o.order_id)}</span>
              <span class="order-date">${new Date(
                o.created_at
              ).toLocaleString()}</span>
            </div>
            <div class="order-body">
              <p><strong>Status:</strong> 
                <span class="order-status status-${esc(
                  o.status.toLowerCase()
                )}">${esc(o.status)}</span>
              </p>
              <p><strong>Total:</strong> $${parseFloat(o.total).toFixed(
                2
              )} (incl. Tax $${parseFloat(o.tax).toFixed(2)})</p>
              <p><strong>Shipping to:</strong> ${esc(
                o.guest_name || ""
              )}, ${esc(o.guest_address || "—")}</p>
              ${
                Array.isArray(o.items) && o.items.length
                  ? `<button class="toggle-items-btn" data-target="items-${idx}">Show Items</button>
                     <div id="items-${idx}" class="order-items" style="display:none; margin-top:0.5rem">
                       <ul>
                         ${o.items
                           .map(
                             (it) => `
                               <li>
                                 ${esc(it.product_name)} — Qty: ${esc(
                               it.quantity
                             )} — $${parseFloat(it.price).toFixed(2)}
                               </li>`
                           )
                           .join("")}
                       </ul>
                     </div>`
                  : "<p>No items found for this order.</p>"
              }
            </div>
          </div>`
        )
        .join("");

      // collapse/expand
      container.querySelectorAll(".toggle-items-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = document.getElementById(btn.dataset.target);
          if (!target) return;
          const isHidden = target.style.display === "none";
          target.style.display = isHidden ? "block" : "none";
          btn.textContent = isHidden ? "Hide Items" : "Show Items";
        });
      });
    } catch (err) {
      console.error("[orders] load failed:", err);
      container.innerHTML =
        "<p style='color:red'>Error loading orders. Try again.</p>";
    }
  }

  // ---- Router ----
  async function loadPage(page) {
    if (page === "dashboard") {
      dashboardContent.innerHTML = `
       <section class="dashboard-hero">
        <div class="hero-text">
          <h1>👋 Welcome Back</h1>
          <p>Explore new arrivals, track your orders, and manage your profile.</p>
        </div>
      </section>

      <section class="dashboard-stats">
        <div class="dash-card" data-page="orders">
          <i class="fas fa-box"></i>
          <h3>My Orders</h3>
          <p>Track your past & current orders</p>
        </div>
        <div class="dash-card" data-page="cart">
          <i class="fas fa-shopping-cart"></i>
          <h3>Cart</h3>
          <p>Continue shopping your saved items</p>
        </div>
        <div class="dash-card" data-page="profile">
          <i class="fas fa-user"></i>
          <h3>Profile</h3>
          <p>Manage your personal details</p>
        </div>
      </section>

      <section class="dashboard-latest">
        <h2>🔥 Latest Products</h2>
        <div class="product-container"></div>
      </section>
      `;

      // Make the cards clickable
      // Make the cards clickable
      dashboardContent.querySelectorAll(".dash-card").forEach((card) => {
        card.addEventListener("click", () => {
          if (card.dataset.page === "cart") {
            // ✅ redirect to standalone cart page
            window.location.href = "/Online-store/pages/cart.html";
          } else {
            loadPage(card.dataset.page);
          }
        });
      });

      // Render latest products
      const renderer = new ProductRenderer(
        ".product-container",
        window.cartManager
      );
      renderer.loadProducts({ limit: 6, sortByNew: true });
    } else if (page === "orders") {
      await renderOrdersView();
    } else if (page === "profile") {
      const res = await fetch("/Online-store/pages/profile.html");
      const html = await res.text();
      dashboardContent.innerHTML = html;

      if (!window.initProfilePage) {
        const script = document.createElement("script");
        script.src = "/Online-store/js/profile.js?v=" + Date.now();
        script.onload = () => window.initProfilePage?.();
        document.body.appendChild(script);
      } else {
        window.initProfilePage();
      }
    } else if (page === "product") {
      // ✅ render inline dashboard product view
      dashboardContent.innerHTML = `
        <section class="dashboard-products">
          <h2>Products</h2>
          <div style="margin:1rem 0;display:flex;gap:1rem;">
            <select id="category">
              <option value="all">All</option>
              <option value="mens">Mens</option>
              <option value="womens">Womens</option>
              <option value="kids">Kids</option>
              <option value="baby">Baby</option>
            </select>
            <select id="sort">
              <option value="default">Default</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
            </select>
          </div>
          <div class="product-container" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;"></div>
        </section>`;

      const renderer = new ProductRenderer(
        ".product-container",
        window.cartManager
      );
      await renderer.loadProducts();
      activeRenderer = renderer; // ✅ make it globally accessible for header

      // local category + sort
      dashboardContent
        .querySelector("#category")
        ?.addEventListener("change", (e) =>
          renderer.filterByCategory(e.target.value)
        );
      dashboardContent
        .querySelector("#sort")
        ?.addEventListener("change", (e) =>
          renderer.sortProducts(e.target.value)
        );
    }
  }

  // ---- nav ----
  function initNavigation() {
    document.querySelectorAll(".nav-menu a[data-page]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        loadPage(link.dataset.page);
      });
    });
  }

  // ---- header search ----
  function initHeaderControls() {
    const headerSearch = document.querySelector("#searchInput");
    const headerCategory = document.querySelector("header #category");

    if (headerSearch) {
      headerSearch.addEventListener("input", (e) => {
        if (activeRenderer) {
          activeRenderer.searchProducts(e.target.value);
        }
      });
    }
    if (headerCategory) {
      headerCategory.addEventListener("change", (e) => {
        if (activeRenderer) {
          activeRenderer.filterByCategory(e.target.value);
        }
      });
    }
  }

  // ---- init ----
  document.addEventListener("DOMContentLoaded", () => {
    window.cartManager = window.cartManager || {
      addToCart: () => alert("Cart not ready"),
    };
    initNavigation();
    initHeaderControls(); // ✅ connect header search & filter
    loadPage("dashboard");
  });
})();
