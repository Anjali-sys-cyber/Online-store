class CartPage {
  constructor() {
    this.cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    this.cartContainer = document.getElementById("cart-items");
    this.emptyCartEl = document.getElementById("empty-cart");
    this.subtotalEl = document.getElementById("subtotal");
    this.taxEl = document.getElementById("tax");
    this.totalEl = document.getElementById("total");
    this.checkoutBtn = document.getElementById("checkout-btn");

    this.init();
  }

  init() {
    this.renderCart();
    this.bindEvents();
  }

  bindEvents() {
    this.checkoutBtn?.addEventListener("click", () => this.checkout());

    this.cartContainer?.addEventListener("click", (e) => {
      const cartItemEl = e.target.closest(".cart-item");
      if (!cartItemEl) return;
      const itemId = parseInt(cartItemEl.dataset.id);

      if (e.target.classList.contains("increase-btn")) {
        this.changeQuantity(itemId, 1);
      } else if (e.target.classList.contains("decrease-btn")) {
        this.changeQuantity(itemId, -1);
      } else if (
        e.target.classList.contains("remove-btn") ||
        e.target.closest(".remove-btn")
      ) {
        this.removeItem(itemId);
      }
    });
  }

  renderCart() {
    this.cartItems = JSON.parse(localStorage.getItem("cart")) || [];

    if (!this.cartContainer) return;

    if (this.cartItems.length === 0) {
      this.cartContainer.parentElement.classList.add("hidden");
      this.emptyCartEl?.classList.remove("hidden");
      this.updateTotals();
      return;
    }

    this.cartContainer.parentElement.classList.remove("hidden");
    this.emptyCartEl?.classList.add("hidden");

    this.cartContainer.innerHTML = this.cartItems
      .map(
        (item) => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="item-details">
          <h4>${item.name}</h4>
          <p class="price">$${item.price.toFixed(2)}</p>
          <div class="quantity-controls">
            <button class="decrease-btn">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="increase-btn">+</button>
          </div>
          <button class="remove-btn">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>
    `
      )
      .join("");

    this.updateTotals();
  }

  changeQuantity(id, delta) {
    const item = this.cartItems.find((i) => i.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) this.removeItem(id);
    else {
      this.saveCart();
      this.renderCart();
    }
  }

  removeItem(id) {
    this.cartItems = this.cartItems.filter((i) => i.id !== id);
    this.saveCart();
    this.renderCart();
  }

  saveCart() {
    localStorage.setItem("cart", JSON.stringify(this.cartItems));
  }

  updateTotals() {
    const subtotal = this.cartItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    if (this.subtotalEl)
      this.subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (this.taxEl) this.taxEl.textContent = `$${tax.toFixed(2)}`;
    if (this.totalEl) this.totalEl.textContent = `$${total.toFixed(2)}`;
  }

  checkout() {
    if (this.cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    // Redirect to checkout page
    window.location.href = "checkout.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.cartPage = new CartPage();
});
