(() => {
  class ProductManager {
    constructor(cartManager) {
      this.products = [];
      this.cartManager = cartManager;
    }

    async loadProducts() {
      try {
        const res = await fetch("../data/products.json");
        const data = await res.json();
        this.products = data.products;
        this.renderProducts(this.products);
      } catch (err) {
        console.error("Failed to load products:", err);
        const container = document.querySelector(".product-container");
        if (container) container.innerHTML = "<p>Failed to load products.</p>";
      }
    }

    renderProducts(products) {
      const container = document.querySelector(".product-container");
      if (!container) return;

      container.innerHTML = products
        .map(
          (p) => `
        <div class="product-card">
          <img src="${p.image}" alt="${
            p.name
          }" onerror="this.src='../assets/images/placeholder.jpg'">
          <h3>${p.name}</h3>
          <p>$${p.price.toFixed(2)}</p>
          <button class="add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
        </div>
      `
        )
        .join("");

      container.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseInt(btn.dataset.id);
          const product = this.products.find((p) => p.id === id);
          if (product && this.cartManager) this.cartManager.addToCart(product);
        });
      });
    }

    filterByCategory(category) {
      const filtered = category
        ? this.products.filter((p) => p.category === category)
        : this.products;
      this.renderProducts(filtered);
    }

    searchProducts(query) {
      const filtered = query
        ? this.products.filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.category.toLowerCase().includes(query.toLowerCase())
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

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    let cartManager = window.cartManager || null; // prevent error if CartManager not defined
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
