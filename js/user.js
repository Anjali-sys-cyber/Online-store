const dashboardContent = document.getElementById("dashboardContent");

// ===== Greeting from localStorage (kept) =====
function getLoggedInUser() {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
    return null;
  }
}
const currentUser = getLoggedInUser();
const greetingElement = document.getElementById("userGreeting");
if (greetingElement) {
  greetingElement.textContent = currentUser && currentUser.name ? `Hi, ${currentUser.name}` : "Hi, User";
}

// ✅ NEW: also try the server (authoritative)
fetch("/Online-store/php/me.php", { credentials: "include" })
  .then(r => r.json())
  .then(d => {
    if (d && d.ok && greetingElement) {
      const name = [d.first_name || "", d.last_name || ""].filter(Boolean).join(" ").trim();
      greetingElement.textContent = name ? `Hi, ${name}` : `Hi, ${d.username || "User"}`;
    }
  })
  .catch(() => {});

// ===== Route map (kept) =====
const ROUTES = {
  home: null, // internal dashboard (no fetch)
  index: "/Online-store/pages/index.html",
  product: "/Online-store/pages/product.html",
  profile: "/Online-store/pages/profile.html",
  orders: "/Online-store/pages/orders.html",
};

function renderHome() {
  dashboardContent.innerHTML = `
    <section id="dashboardWelcome">
      <h2>Welcome to the User Dashboard</h2>
      <p>Select an option from the Navbar to enjoy your shopping.</p>
    </section>
  `;
  // 👉 announce home view loaded
  document.dispatchEvent(new CustomEvent("page:loaded", { detail: "home" }));
}

// Execute inline scripts from loaded HTML (kept)
function executeScripts(container) {
  container.querySelectorAll("script").forEach((script) => {
    if (!script.src) {
      const inlineScript = document.createElement("script");
      inlineScript.textContent = script.textContent;
      document.body.appendChild(inlineScript);
    }
  });
}

// Load the main content of a page into the dashboard
async function loadPage(pageName) {
  // Internal “home” view
  if (pageName === "home" || ROUTES[pageName] === null) {
    renderHome();
    return;
  }

  // Resolve URL → prefer explicit mapping, else conventional path
  const url = ROUTES[pageName] || `/Online-store/pages/${pageName}.html`;

  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    const htmlText = await response.text();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlText;

    // Prefer the <main> of the fetched page; fallback to whole document
    const mainContent = tempDiv.querySelector("main") || tempDiv;
    dashboardContent.innerHTML = mainContent.innerHTML;

    executeScripts(tempDiv);

    // 👉 announce injected page finished loading
    document.dispatchEvent(new CustomEvent("page:loaded", { detail: pageName }));

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

// Initialize navigation links (kept)
function initNavigation() {
  document.querySelectorAll(".nav-menu a[data-page]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      loadPage(page);
    });
  });
}

// Initialize dashboard (kept)
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  loadPage("home"); // default
});
