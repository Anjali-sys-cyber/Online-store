// /Online-store/js/user.js — SAFE ROUTER + PRODUCT + ORDERS with collapsible items
(() => {
  const dashboardContent = document.getElementById("dashboardContent");
  if (!dashboardContent) return;

  // ----- helpers -----
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

  // ----- greeting -----
  function getLoggedInUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }
  const greetingElement = document.getElementById("userGreeting");
  (function initGreeting() {
    const u = getLoggedInUser();
    if (greetingElement) {
      greetingElement.textContent = u && u.name ? `Hi, ${u.name}` : "Hi, User";
    }
    fetch("/Online-store/php/me.php", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.ok || !greetingElement) return;
        const full = [d.first_name || "", d.last_name || ""]
          .filter(Boolean)
          .join(" ")
          .trim();
        greetingElement.textContent = full
          ? `Hi, ${full}`
          : `Hi, ${d.username || "User"}`;
      })
      .catch(() => {});
  })();

  // ----- Product renderer -----
  class ProductRenderer {
    constructor(containerSelector, cartManager) {
      this.containerSelector = containerSelector;
      this.cartManager = cartManager;
      this.products = [];
    }
    get container() {
      return dashboardContent.querySelector(this.containerSelector);
    }

    async loadProducts({ limit = null, sortByNew = false } = {}) {
      if (!this.container) return;
      try {
        const res = await fetch("/Online-store/php/products.php?action=read", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.products = Array.isArray(data) ? data : data.products || [];
        let list = [...this.products];
        if (sortByNew)
          list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        if (limit) list = list.slice(0, limit);
        this.renderProducts(list);
      } catch (e) {
        console.error("[user.js] loadProducts failed:", e);
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
            <p class="price"><span class="price-amount">${money(
              p.price
            )}</span></p>
            <button class="add-to-cart-btn" data-id="${p.id}">
              <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
          </div>
        </div>`
        )
        .join("");

      this.container.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          const product = this.products.find((p) => p.id === id);
          if (product && this.cartManager?.addToCart) {
            this.cartManager.addToCart(product);
          } else {
            alert("Cart is not available on this page.");
          }
        });
      });
    }
  }

  // ----- Home view -----
  function renderHomeDashboard() {
    dashboardContent.innerHTML = `
      <section id="homeContent">
        <h2>Welcome Back</h2>
        <p>Check out the latest products and offers!</p>
        <div class="product-container"></div>
      </section>`;
    const renderer = new ProductRenderer(
      ".product-container",
      window.cartManager
    );
    renderer.loadProducts({ limit: 6, sortByNew: true });
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

  // ----- router -----
  async function loadPage(page) {
    if (page === "dashboard") {
      dashboardContent.innerHTML = `
        <section id="dashboardWelcome">
          <h2>Welcome to the User Dashboard</h2>
          <p>Select an option from the Navbar.</p>
        </section>`;
    } else if (page === "homeContent") {
      renderHomeDashboard();
    } else if (page === "orders") {
      renderOrdersView();
    } else if (page === "profile") {
      const res = await fetch("/Online-store/pages/profile.html", {
        credentials: "include",
      });
      const html = await res.text();
      dashboardContent.innerHTML = html;

      if (!window.initProfilePage) {
        const script = document.createElement("script");
        script.src = "../js/profile.js?v=" + Date.now();
        script.onload = () =>
          window.initProfilePage && window.initProfilePage();
        document.body.appendChild(script);
      } else {
        window.initProfilePage();
      }
    } else if (page === "product") {
      // ✅ render products directly in dashboard (not public page)
      dashboardContent.innerHTML = `
        <section id="productSection">
          <h2>Our Products</h2>
          <div class="filters">
            <input type="text" id="searchInput" placeholder="Search products...">
            <select id="category">
              <option value="all">All Categories</option>
              <option value="mens">Men</option>
              <option value="womens">Women</option>
              <option value="kids">Kids</option>
              <option value="baby">Baby</option>
            </select>
            <select id="sort">
              <option value="new">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          <div class="product-container"></div>
        </section>`;

      const renderer = new ProductRenderer(
        ".product-container",
        window.cartManager
      );
      await renderer.loadProducts();

      const searchInput = dashboardContent.querySelector("#searchInput");
      const categorySelect = dashboardContent.querySelector("#category");
      const sortSelect = dashboardContent.querySelector("#sort");

      searchInput &&
        searchInput.addEventListener("input", (e) =>
          renderer.searchProducts(e.target.value)
        );
      categorySelect &&
        categorySelect.addEventListener("change", (e) =>
          renderer.filterByCategory(e.target.value)
        );
      sortSelect &&
        sortSelect.addEventListener("change", (e) =>
          renderer.sortProducts(e.target.value)
        );
    } else {
      dashboardContent.innerHTML = `<p style="color:red">⚠️ Page not recognized: ${esc(
        page
      )}</p>`;
    }
  }

  // ----- nav -----
  function initNavigation() {
    document.querySelectorAll(".nav-menu a[data-page]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        loadPage(page);
      });
    });
  }

  // ----- init -----
  document.addEventListener("DOMContentLoaded", () => {
    window.cartManager = window.cartManager || {
      addToCart: (p) => alert("Cart not initialized yet."),
    };
    initNavigation();
    loadPage("dashboard");
  });
})();
