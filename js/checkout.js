(() => {
  const TAX_RATE = 0.1; // 10% tax

  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  }

  function upsertSummaryRow(containerDiv, id, labelText, valueText) {
    let row = document.getElementById(id);
    if (!row) {
      row = document.createElement("div");
      row.id = id;
      row.className = "summary-item";
      row.innerHTML = `<span>${labelText}</span><span class="value">${valueText}</span>`;
      const totalRow = containerDiv.querySelector(".summary-item.total");
      if (totalRow) containerDiv.insertBefore(row, totalRow);
      else containerDiv.appendChild(row);
    } else {
      row.querySelector(".value").textContent = valueText;
    }
  }

  // ====== auto-fill checkout form for logged-in users ======
  async function autofillUserDetails() {
    try {
      const res = await fetch("../php/me.php", { credentials: "include" });
      if (!res.ok) return;

      const user = await res.json();
      if (!user || !user.ok) return;

      // Full Name
      document.getElementById("name").value = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ");

      // Email
      document.getElementById("email").value = user.email || "";

      // ✅ Phone (new autofill line)
      if (document.getElementById("phone")) {
        document.getElementById("phone").value = user.phone || "";
      }

      // Address
      document.getElementById("address").value = user.address || "";
      if (user.city) document.getElementById("city").value = user.city;
      if (user.postcode)
        document.getElementById("postcode").value = user.postcode;
      if (user.country) document.getElementById("country").value = user.country;

      // 🔑 store user_id in localStorage for checkout
      if (user.user_id) {
        localStorage.setItem("user_id", user.user_id);
      }
    } catch (err) {
      console.warn("Autofill failed", err);
    }
  }

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
          `Tax (${TAX_RATE * 100}%)`,
          money(0)
        );
      }
      totalEl.textContent = money(0);
      return;
    }

    let subtotal = 0;
    cart.forEach((item) => {
      const qty = Number(item.quantity) || 1;
      const lineTotal = qty * (Number(item.price) || 0);
      subtotal += lineTotal;
      const li = document.createElement("li");
      li.className = "summary-item";
      li.innerHTML = `<span>${item.name} × ${qty}</span><span>${money(
        lineTotal
      )}</span>`;
      list.appendChild(li);
    });

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

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
        `Tax (${TAX_RATE * 100}%)`,
        money(tax)
      );
    }

    totalEl.textContent = money(total);
  }

  // ====== submit handler ======
  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    // collect inputs
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    // const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const postcode = document.getElementById("postcode").value.trim();

    const subtotalText =
      document.getElementById("subtotalRow")?.querySelector(".value")
        ?.textContent || "$0.00";
    const taxText =
      document.getElementById("taxRow")?.querySelector(".value")?.textContent ||
      "$0.00";
    const totalText = document.getElementById("totalAmount").textContent;

    // 🔑 detect user_id
    const userId = localStorage.getItem("user_id");

    const orderData = {
      user_id: userId ? Number(userId) : null,
      guest_name: name, // always include
      guest_email: email, // always include
      // guest_phone: phone, // always include
      guest_address: `${address}, ${city} ${postcode}`, // always include
      subtotal: subtotalText.replace("$", ""),
      tax: taxText.replace("$", ""),
      total: totalText.replace("$", ""),
      items: cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        line_total: (item.quantity * item.price).toFixed(2),
      })),
    };

    fetch("../php/placeOrder.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          localStorage.removeItem("cart");
          form.style.display = "none";
          document.getElementById(
            "confirmationMessage"
          ).innerHTML = `✅ Thank you, <strong>${
            name || "User"
          }</strong>! Your order of <strong>${totalText}</strong> has been placed successfully.`;
          document.getElementById("confirmationMessage").style.display =
            "block";
          renderOrderSummary();
        } else {
          alert("Order failed: " + data.message);
        }
      })
      .catch((err) => console.error("Order error", err));
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderOrderSummary();
    autofillUserDetails();
    const form = document.getElementById("checkoutForm");
    if (form) form.addEventListener("submit", handleSubmit);
  });
})();
