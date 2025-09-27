(() => {
  class ProductManager {
    constructor(cartManager) {
      this.products = [];
      this.cartManager = cartManager;
    }

    // Load products from backend (products.php)
    async loadProducts() {
      try {
        const res = await fetch("../php/products.php?action=read");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        this.products = data;
        this.renderProducts(this.products);
      } catch (err) {
        console.error("Failed to load products:", err);
        const container = document.querySelector(".product-container");
        if (container) container.innerHTML = "<p>Failed to load products.</p>";
      }
    }

    // Render products on page
    renderProducts(products) {
      const container = document.querySelector(".product-container");
      if (!container) return;

      if (!products.length) {
        container.innerHTML = "<p>No products available.</p>";
        return;
      }

      container.innerHTML = products
        .map(
          (p) => `
        <div class="product-card">
          <img src="${p.image ?? "../assets/images/placeholder.jpg"}" 
               alt="${p.name}" 
               onerror="this.src='../assets/images/placeholder.jpg'">
          <h3>${p.name}</h3>
          <p>$${parseFloat(p.price).toFixed(2)}</p>
          <button class="add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
        </div>
      `
        )
        .join("");

      // Hook Add to Cart buttons
      container.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseInt(btn.dataset.id, 10);
          const product = this.products.find((p) => p.id == id);
          if (product && this.cartManager) this.cartManager.addToCart(product);
        });
      });
    }

    // Filter by category (using category_id)
    filterByCategory(categoryId) {
      const filtered = categoryId
        ? this.products.filter((p) => p.category_id == categoryId)
        : this.products;
      this.renderProducts(filtered);
    }

    // Search by name or description
    searchProducts(query) {
      const filtered = query
        ? this.products.filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              (p.description &&
                p.description.toLowerCase().includes(query.toLowerCase()))
          )
        : this.products;
      this.renderProducts(filtered);
    }

    // Sort products
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

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    let cartManager = window.cartManager || null; // Prevent error if CartManager not defined
    const pm = new ProductManager(cartManager);
    pm.loadProducts();

    const searchInput = document.getElementById("searchInput");
    const categorySelect = document.getElementById("category");
    const sortSelect = document.getElementById("sort");

    if (searchInput)
      searchInput.addEventListener("input", (e) =>
        pm.searchProducts(e.target.value)
      );
    if (categorySelect)
      categorySelect.addEventListener("change", (e) =>
        pm.filterByCategory(e.target.value)
      );
    if (sortSelect)
      sortSelect.addEventListener("change", (e) =>
        pm.sortProducts(e.target.value)
      );
  });
})();
