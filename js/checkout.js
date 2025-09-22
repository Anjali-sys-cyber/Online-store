(() => {
  const TAX_RATE = 0.1; // 10% tax

  // ====== helpers ======
  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  function getCart() {
    try {
      const raw = localStorage.getItem("cart");
      const arr = JSON.parse(raw) || [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  // create or update a summary row (label + value)
  function upsertSummaryRow(containerDiv, id, labelText, valueText) {
    let row = document.getElementById(id);
    if (!row) {
      row = document.createElement("div");
      row.id = id;
      row.className = "summary-item";
      row.innerHTML = `<span>${labelText}</span><span class="value">${valueText}</span>`;
      // insert just before the total row if present, otherwise append
      const totalRow = containerDiv.querySelector(".summary-item.total");
      if (totalRow) containerDiv.insertBefore(row, totalRow);
      else containerDiv.appendChild(row);
    } else {
      row.querySelector(".value").textContent = valueText;
    }
  }

  // render order summary
  function renderOrderSummary() {
    const list = document.getElementById("orderSummaryList");
    const totalEl = document.getElementById("totalAmount");
    const orderSummarySection = totalEl
      ? totalEl.closest(".order-summary")
      : null;
    if (!list || !totalEl) return;

    const cart = getCart();
    list.innerHTML = "";

    if (cart.length === 0) {
      const li = document.createElement("li");
      li.className = "summary-item";
      li.textContent = "Your cart is empty.";
      list.appendChild(li);
      // ensure subtotal/tax/total show zeros
      if (orderSummarySection) {
        upsertSummaryRow(
          orderSummarySection,
          "subtotalRow",
          "Subtotal",
          money(0)
        );
        upsertSummaryRow(
          orderSummarySection,
          "taxRow",
          `Tax (${(TAX_RATE * 100).toFixed(0)}%)`,
          money(0)
        );
      }
      totalEl.textContent = money(0);
      return;
    }

    // build line items and subtotal
    let subtotal = 0;
    cart.forEach((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const lineTotal = qty * price;
      subtotal += lineTotal;

      const li = document.createElement("li");
      li.className = "summary-item";
      li.innerHTML = `<span>${item.name} × ${qty}</span><span>${money(
        lineTotal
      )}</span>`;
      list.appendChild(li);
    });

    // compute tax and total
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    // insert or update subtotal/tax rows (before total)
    if (orderSummarySection) {
      upsertSummaryRow(
        orderSummarySection,
        "subtotalRow",
        "Subtotal",
        money(subtotal)
      );
      upsertSummaryRow(
        orderSummarySection,
        "taxRow",
        `Tax (${(TAX_RATE * 100).toFixed(0)}%)`,
        money(tax)
      );
    }

    totalEl.textContent = money(total);
  }

  // ====== submit handler ======
  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    // Native validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const totalText = document.getElementById("totalAmount").textContent;
    const subtotalText =
      document.getElementById("subtotalRow")?.querySelector(".value")
        ?.textContent || "$0.00";
    const taxText =
      document.getElementById("taxRow")?.querySelector(".value")?.textContent ||
      "$0.00";

    // Save order record (simple localStorage queue)
    try {
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.push({
        id: "ORD-" + Date.now(),
        when: new Date().toISOString(),
        items: cart,
        subtotal: subtotalText,
        tax: taxText,
        total: totalText,
        customer: { name, email, address },
      });
      localStorage.setItem("orders", JSON.stringify(orders));
    } catch (err) {
      console.warn("Could not save order to localStorage", err);
    }

    // Clear cart and show confirmation
    localStorage.removeItem("cart");
    form.style.display = "none";
    const msg = document.getElementById("confirmationMessage");
    msg.innerHTML = `✅ Thank you, <strong>${name}</strong>! Your order of <strong>${totalText}</strong> has been placed successfully. A confirmation was sent to <strong>${email}</strong>.`;
    msg.style.display = "block";

    // update summary (now empty)
    renderOrderSummary();
  }

  // ====== init ======
  document.addEventListener("DOMContentLoaded", () => {
    renderOrderSummary();
    const form = document.getElementById("checkoutForm");
    if (form) form.addEventListener("submit", handleSubmit);
  });
})();
