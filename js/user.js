const dashboardContent = document.getElementById("dashboardContent");

// ===== Greeting =====
function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

const currentUser = getLoggedInUser();
const greetingElement = document.getElementById("userGreeting");
if (greetingElement) {
  greetingElement.textContent =
    currentUser && currentUser.name ? `Hi, ${currentUser.name}` : "Hi, User";
}

// fetch latest user info from PHP
fetch("/Online-store/php/me.php", { credentials: "include" })
  .then((r) => r.json())
  .then((d) => {
    if (d && d.ok && greetingElement) {
      const name = [d.first_name || "", d.last_name || ""]
        .filter(Boolean)
        .join(" ")
        .trim();
      greetingElement.textContent = name
        ? `Hi, ${name}`
        : `Hi, ${d.username || "User"}`;
    }
  })
  .catch(() => {});

// ===== Routes (map to actual files you have) =====
const ROUTES = {
  dashboard: null, // inline welcome section
  homeContent: "homeContent.html", // ✅ avoid conflict with dashboard
  product: "product.html",
  profile: "profile.html",
  orders: "orders.html", // create this file if not present
};

// ===== Product Renderer Class =====
class ProductRenderer {
  constructor(containerSelector, cartManager) {
    this.container = document.querySelector(containerSelector);
    this.cartManager = cartManager;
    this.products = [];
  }

  async loadProducts({ limit = null, sortByNew = false } = {}) {
    if (!this.container) return;

    try {
      const res = await fetch("/Online-store/php/products.php?action=read");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      this.products = Array.isArray(data) ? data : data.products || [];

      let productsToRender = [...this.products];
      if (sortByNew)
        productsToRender.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      if (limit) productsToRender = productsToRender.slice(0, limit);

      this.renderProducts(productsToRender);
    } catch (err) {
      console.error("Failed to load products:", err);
      if (this.container)
        this.container.innerHTML = "<p>Failed to load products.</p>";
    }
  }

  renderProducts(products) {
    if (!this.container) return;

    this.container.innerHTML = products
      .map(
        (p) => `
      <div class="product-card">
        ${p.isNew ? '<div class="product-badge">New</div>' : ""}
        <div class="product-image">
          <img src="${p.image}" alt="${
          p.name
        }" onerror="this.src='../assets/images/placeholder.jpg'">
        </div>
        <div class="product-details">
          <h3>${p.name}</h3>
          <p>$${parseFloat(p.price).toFixed(2)}</p>
          <button class="add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>
    `
      )
      .join("");

    this.container.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const product = products.find((p) => p.id === id);
        if (product) this.cartManager?.addToCart(product);
      });
    });
  }

  filterByCategory(category) {
    const filtered = category
      ? this.products.filter(
          (p) => p.category?.toLowerCase() === category.toLowerCase()
        )
      : this.products;
    this.renderProducts(filtered);
  }

  searchProducts(query) {
    const filtered = query
      ? this.products.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category?.toLowerCase().includes(query.toLowerCase())
        )
      : this.products;
    this.renderProducts(filtered);
  }

  sortProducts(option) {
    let productsToSort = [...this.products];
    if (option === "price-low")
      productsToSort.sort((a, b) => a.price - b.price);
    else if (option === "price-high")
      productsToSort.sort((a, b) => b.price - a.price);
    else if (option === "rating")
      productsToSort.sort((a, b) => b.rating - a.rating);
    this.renderProducts(productsToSort);
  }
}

// ===== Profile Renderer =====
function renderProfileView() {
  dashboardContent.innerHTML = `
    <section class="profile-container" style="max-width:980px;margin:6rem auto 2rem;padding:1.25rem;background:#fff;border-radius:14px;box-shadow:0 10px 35px rgba(0,0,0,.08)">
      <h2 style="text-align:center;margin:0 0 1rem 0">My Profile</h2>

      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:.75rem 0">
        <div class="form-col"><label>Full Name</label><div id="ro-fullName" class="ro-field">—</div></div>
        <div class="form-col"><label>Email</label><div id="ro-email" class="ro-field">—</div></div>
      </div>

      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:.75rem 0">
        <div class="form-col"><label>Username</label><div id="ro-username" class="ro-field">—</div></div>
        <div class="form-col"><label>Phone Number</label><div id="ro-phone" class="ro-field">—</div></div>
      </div>

      <div style="margin-top:1rem;display:flex;justify-content:flex-end">
        <a href="/Online-store/pages/profile.html" class="btn">Update Profile</a>
      </div>
    </section>
  `;

  fetch("/Online-store/php/me.php", { credentials: "include" })
    .then((r) => r.json())
    .then((me) => {
      if (!me || !me.ok) return;
      const full = [me.first_name || "", me.last_name || ""]
        .filter(Boolean)
        .join(" ")
        .trim();
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v || "—";
      };
      set("ro-fullName", full || me.username || "—");
      set("ro-email", me.email || "—");
      set("ro-username", me.username || "—");
      set("ro-phone", me.phone || "—");
    })
    .catch(() => {});
}

// ===== Home Dashboard with Featured Products =====
// ===== Home Dashboard with Featured Products =====
function renderHomeDashboard() {
  dashboardContent.innerHTML = `
    <section class="dashboard-home" style="max-width:1200px;margin:6rem auto 2rem;padding:1rem;">
      <h2 id="homeGreeting">Hi, User!</h2>
      <p>Check out some of our featured products:</p>
      <div class="product-container" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;"></div>
    </section>
  `;

  // 🔑 fetch live user info for greeting
  fetch("/Online-store/php/me.php", { credentials: "include" })
    .then((r) => r.json())
    .then((d) => {
      if (d && d.ok) {
        const name = [d.first_name || "", d.last_name || ""]
          .filter(Boolean)
          .join(" ")
          .trim();
        const greet = document.getElementById("homeGreeting");
        if (greet) {
          greet.textContent = name
            ? `Hi, ${name}!`
            : `Hi, ${d.username || "User"}!`;
        }
      }
    })
    .catch(() => {
      // fallback from localStorage
      const user = getLoggedInUser();
      const greet = document.getElementById("homeGreeting");
      if (greet && user) {
        greet.textContent = user.name ? `Hi, ${user.name}!` : "Hi, User!";
      }
    });

  // render featured products
  const renderer = new ProductRenderer(
    ".product-container",
    window.cartManager
  );
  renderer.loadProducts({ limit: 6, sortByNew: true });
}

// ===== Router =====
async function loadPage(pageName) {
  if (pageName === "dashboard") {
    dashboardContent.innerHTML = `
      <section id="dashboardWelcome">
        <h2>Welcome to the User Dashboard</h2>
        <p>Select an option from the Navbar to enjoy your shopping.</p>
      </section>
    `;
    return;
  }
  if (pageName === "homeContent") {
    renderHomeDashboard();
    return;
  }
  if (pageName === "profile") {
    renderProfileView();
    return;
  }

  const fileToLoad = ROUTES[pageName];
  if (!fileToLoad) {
    dashboardContent.innerHTML = `<p style="color:red;">⚠️ Page not mapped: ${pageName}</p>`;
    return;
  }

  const url = `/Online-store/pages/${fileToLoad}`;
  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok)
      throw new Error(`${response.status} ${response.statusText}`);
    const htmlText = await response.text();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlText;
    const mainContent = tempDiv.querySelector("main") || tempDiv;
    dashboardContent.innerHTML = mainContent.innerHTML;

    // If this is the product page, initialize the product renderer
    if (pageName === "product") {
      const renderer = new ProductRenderer(
        ".product-container",
        window.cartManager
      );
      renderer.loadProducts();

      const searchInput = document.getElementById("searchInput");
      const categorySelect = document.getElementById("category");
      const sortSelect = document.getElementById("sort");

      if (searchInput)
        searchInput.addEventListener("input", (e) =>
          renderer.searchProducts(e.target.value)
        );
      if (categorySelect)
        categorySelect.addEventListener("change", (e) =>
          renderer.filterByCategory(e.target.value)
        );
      if (sortSelect)
        sortSelect.addEventListener("change", (e) =>
          renderer.sortProducts(e.target.value)
        );
    }
  } catch (error) {
    console.error("Error loading page:", url, error);
    dashboardContent.innerHTML = `
      <div style="padding:1rem">
        <p><strong>Could not load “${pageName}”.</strong></p>
        <p>Make sure this file exists:</p>
        <code>${url}</code>
      </div>
    `;
  }
}

// ===== Navigation =====
function initNavigation() {
  document.querySelectorAll(".nav-menu a[data-page]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      loadPage(link.dataset.page);
    });
  });
}

// ===== Initialize Dashboard =====
document.addEventListener("DOMContentLoaded", () => {
  window.cartManager = window.cartManager || {
    addToCart: (product) => alert("Cart not initialized yet."),
  };

  initNavigation();
  loadPage("dashboard"); // ✅ start at dashboard, not homeContent
});
