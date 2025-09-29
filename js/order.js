document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("ordersContainer");

  fetch("../php/getOrders.php", { credentials: "include" })
    .then((res) => res.json())
    .then((data) => {
      console.log("Orders response:", data); // 👀 debug log

      if (!data.ok) {
        container.innerHTML = `<p style="color:red;">⚠️ ${
          data.error || "Could not load orders"
        }</p>`;
        return;
      }

      if (!data.orders || data.orders.length === 0) {
        container.innerHTML = `<p>No orders yet.</p>`;
        return;
      }

      container.innerHTML = data.orders
        .map(
          (order) => `
          <div class="order-card" style="border:1px solid #ccc;border-radius:8px;padding:1rem;margin-bottom:1rem;background:#fff;">
            <h3>Order #${order.order_id}</h3>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${new Date(
              order.created_at
            ).toLocaleString()}</p>
            <p><strong>Total:</strong> $${parseFloat(order.total).toFixed(
              2
            )}</p>
            <h4>Items:</h4>
            <ul>
              ${order.items
                .map(
                  (item) =>
                    `<li>${item.product_name} × ${
                      item.quantity
                    } — $${parseFloat(item.line_total).toFixed(2)}</li>`
                )
                .join("")}
            </ul>
          </div>
        `
        )
        .join("");
    })
    .catch((err) => {
      console.error("Error loading orders:", err);
      container.innerHTML = `<p style="color:red;">⚠️ Failed to load orders.</p>`;
    });
});
