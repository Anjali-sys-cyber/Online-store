class CartManager {
  constructor() {
    this.cart = [];
    this.cartItemsContainer = document.getElementById("cart-items");
    this.subtotalEl = document.getElementById("subtotal");
    this.taxEl = document.getElementById("tax");
    this.totalEl = document.getElementById("total");
    this.emptyCartEl = document.getElementById("empty-cart");

    this.init();
  }

  async init() {
    await this.loadCart(); // ✅ load from DB if logged in, else localStorage
    this.renderCart();
    this.updateCartDisplay();

    // Event delegation
    if (this.cartItemsContainer) {
      this.cartItemsContainer.addEventListener("click", (e) => {
        const cartItem = e.target.closest(".cart-item");
        if (!cartItem) return;
        const id = parseInt(cartItem.dataset.id);

        if (e.target.classList.contains("increase-btn")) {
          this.changeQuantity(id, 1);
        } else if (e.target.classList.contains("decrease-btn")) {
          this.changeQuantity(id, -1);
        } else if (e.target.classList.contains("remove-btn")) {
          this.removeItem(id);
        }
      });
    }
  }

  async loadCart() {
    try {
      const res = await fetch("/Online-store/php/cart.php", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.cart)) {
          this.cart = data.cart.map((item) => ({
            id: parseInt(item.product_id),
            name: item.name,
            price: parseFloat(item.price),
            image: item.image,
            quantity: parseInt(item.quantity),
          }));
          localStorage.setItem("cart", JSON.stringify(this.cart)); // keep backup
          return;
        }
      }
    } catch (err) {
      console.warn("[CartManager] Could not load from DB:", err);
    }

    // fallback → guest cart
    this.cart = JSON.parse(localStorage.getItem("cart")) || [];
  }

  async addToCart(product) {
    const existingItem = this.cart.find((item) => item.id === product.id);
    if (existingItem) existingItem.quantity += 1;
    else this.cart.push({ ...product, quantity: 1 });

    await this.saveCart();
    this.renderCart();
    this.updateCartDisplay();
    this.showNotification(`${product.name} added to cart!`);
  }

  async saveCart() {
    // always keep local copy
    localStorage.setItem("cart", JSON.stringify(this.cart));

    // try syncing with DB if logged in
    try {
      for (const item of this.cart) {
        await fetch("/Online-store/php/cart.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            product_id: item.id,
            quantity: item.quantity,
          }),
        });
      }
    } catch (err) {
      console.warn("[CartManager] DB sync failed:", err);
    }
  }

  updateCartDisplay() {
    const cartCount = document.querySelector(".cart-count");
    const cartTotal = document.querySelector(".cart-total");

    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = this.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = `($${totalPrice.toFixed(2)})`;
  }

  renderCart() {
    if (!this.cartItemsContainer) return;

    if (this.cart.length === 0) {
      this.cartItemsContainer.innerHTML = "";
      this.emptyCartEl?.classList.remove("hidden");
      return;
    }

    this.emptyCartEl?.classList.add("hidden");

    this.cartItemsContainer.innerHTML = this.cart
      .map(
        (item) => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="item-details">
          <h4>${item.name}</h4>
          <p>$${item.price.toFixed(2)}</p>
          <div class="quantity-controls">
            <button class="decrease-btn">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="increase-btn">+</button>
          </div>
        </div>
        <button class="remove-btn">&times;</button>
      </div>
    `
      )
      .join("");

    this.updateSummary();
  }

  async changeQuantity(id, delta) {
    const item = this.cart.find((i) => i.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      await this.removeItem(id);
    } else {
      await this.saveCart();
      this.renderCart();
      this.updateCartDisplay();
    }
  }

  async removeItem(id) {
    this.cart = this.cart.filter((i) => i.id !== id);
    await this.saveCart();
    this.renderCart();
    this.updateCartDisplay();

    // delete from DB explicitly
    try {
      await fetch("/Online-store/php/cart.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: id }),
      });
    } catch (err) {
      console.warn("[CartManager] Failed to delete from DB:", err);
    }
  }

  updateSummary() {
    const subtotal = this.cart.reduce(
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

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification success";
    notification.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(() => {
      notification.classList.add("hide");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.cartManager = new CartManager();
});
