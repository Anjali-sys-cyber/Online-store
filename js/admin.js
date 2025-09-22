document.addEventListener("DOMContentLoaded", () => {
  // ===== Admin greeting =====
  const adminName = localStorage.getItem("adminName") || "Admin";
  const greetingElement = document.getElementById("userGreeting");
  if (greetingElement) greetingElement.textContent = `Hi, ${adminName}`;

  const links = document.querySelectorAll(".sidebar-link");
  const contentArea = document.getElementById("dashboardContent");

  links.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const url = link.getAttribute("href");

      if (!url || url === "#") {
        console.warn("Sidebar link has no valid href:", link);
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Page not found");
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Load wrapper content
        const wrapper = doc.querySelector("#productManagementC") || doc.body;
        if (wrapper) {
          contentArea.innerHTML = wrapper.innerHTML;

          // Dynamically load productManagement.js if not already loaded
          const oldScript = document.getElementById("dynamicProductJS");
          if (oldScript) oldScript.remove();

          const script = document.createElement("script");
          script.src = "../js/productManagement.js";
          script.id = "dynamicProductJS";
          document.body.appendChild(script);

          // Initialize product management after script loads
          script.onload = () => {
            if (typeof initProductManagement === "function") {
              initProductManagement(contentArea);
            }
          };
        } else {
          contentArea.innerHTML = "<p>Content not found</p>";
        }
      } catch (err) {
        console.error(err);
        contentArea.innerHTML = `<p style="color:red;">Error loading ${url}</p>`;
      }
    });
  });

  // ===== Load Dashboard Welcome by default =====
  const dashboardSection = `
    <section class="dashboard-widgets">
      <h2>Welcome to the Admin Dashboard</h2>
      <p>Select a feature from the sidebar to manage your store.</p>
    </section>
  `;
  contentArea.innerHTML = dashboardSection;
});
