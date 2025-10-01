(() => {
  async function loadOrders() {
    const container = document.getElementById("ordersContainer");
    if (!container) return;

    container.innerHTML = `<p>⏳ Loading your orders...</p>`;

    try {
      const res = await fetch("../php/getOrders.php", {
        credentials: "include",
      });
      const text = await res.text();
      console.log("[order.js] Response text:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON from server");
      }

      if (!data.ok) {
        container.innerHTML = `<p style="color:red;">❌ ${
          data.error || "Could not fetch orders"
        }</p>`;
        return;
      }

      const orders = data.orders || [];
      if (orders.length === 0) {
        container.innerHTML = `<p>No orders found.</p>`;
        return;
      }

      // ✅ Render orders with collapsible items
      container.innerHTML = `
        <div class="orders-list">
          ${orders
            .map(
              (o, idx) => `
              <div class="order-card">
                <div class="order-header">
                  <span class="order-id">Order #${o.order_id}</span>
                  <span class="order-date">${new Date(
                    o.created_at
                  ).toLocaleString()}</span>
                </div>

                <div class="order-body">
                  <p><strong>Status:</strong> 
                    <span class="order-status status-${o.status}">
                      ${o.status}
                    </span>
                  </p>
                  <p><strong>Total:</strong> $${parseFloat(o.total).toFixed(
                    2
                  )} (incl. Tax $${parseFloat(o.tax).toFixed(2)})</p>
                  <p><strong>Shipping to:</strong> ${o.guest_name || ""}, ${
                o.guest_address || "—"
              }</p>
                </div>

                ${
                  o.items && o.items.length
                    ? `
                  <button class="toggle-items-btn" data-target="items-${idx}">
                    Show Items
                  </button>
                  <div id="items-${idx}" class="order-items hidden">
                    <h4>Items:</h4>
                    <table class="order-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${o.items
                          .map(
                            (item) => `
                          <tr>
                            <td>${item.product_name}</td>
                            <td>${item.quantity}</td>
                            <td>$${parseFloat(item.price).toFixed(2)}</td>
                            <td>$${parseFloat(item.line_total).toFixed(2)}</td>
                          </tr>
                        `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                `
                    : ""
                }
              </div>
            `
            )
            .join("")}
        </div>
      `;

      // ✅ attach toggle functionality
      document.querySelectorAll(".toggle-items-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = document.getElementById(btn.dataset.target);
          target.classList.toggle("hidden");
          btn.textContent = target.classList.contains("hidden")
            ? "Show Items"
            : "Hide Items";
        });
      });
    } catch (err) {
      console.error("[order.js] Error:", err);
      container.innerHTML = `<p style="color:red;">⚠️ Failed to load orders.</p>`;
    }
  }

  window.loadOrders = loadOrders;
  document.addEventListener("DOMContentLoaded", loadOrders);
})();
