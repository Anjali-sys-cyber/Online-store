const dashboardContent = document.getElementById("dashboardContent");

// ===== Greeting (same as before) =====
function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}
const currentUser = getLoggedInUser();
const greetingElement = document.getElementById("userGreeting");
if (greetingElement) {
  greetingElement.textContent =
    currentUser && currentUser.name ? `Hi, ${currentUser.name}` : "Hi, User";
}
fetch("/Online-store/php/me.php", { credentials: "include" })
  .then(r => r.json()).then(d => {
    if (d && d.ok && greetingElement) {
      const name = [d.first_name||"", d.last_name||""].filter(Boolean).join(" ").trim();
      greetingElement.textContent = name ? `Hi, ${name}` : `Hi, ${d.username || "User"}`;
    }
  }).catch(() => {});

// ===== Routes (unchanged) =====
const ROUTES = {
  home: null,
  index: "/Online-store/pages/index.html",
  product: "/Online-store/pages/product.html",
  profile: "/Online-store/pages/profile.html",
  orders: "/Online-store/pages/orders.html",
};

/* ===== NEW: read-only profile renderer ===== */
function renderProfileView() {
  dashboardContent.innerHTML = `
    <section class="profile-container" style="max-width:980px;margin:6rem auto 2rem;padding:1.25rem;background:#fff;border-radius:14px;box-shadow:0 10px 35px rgba(0,0,0,.08)">
      <h2 style="text-align:center;margin:0 0 1rem 0">My Profile</h2>

      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:.75rem 0">
        <div class="form-col" style="display:flex;flex-direction:column;gap:.4rem">
          <label style="font-weight:600">Full Name</label>
          <div id="ro-fullName" class="ro-field" style="padding:.7rem .8rem;border:1px solid #d6d6d6;border-radius:8px;background:#f7f7f7">—</div>
        </div>
        <div class="form-col" style="display:flex;flex-direction:column;gap:.4rem">
          <label style="font-weight:600">Email</label>
          <div id="ro-email" class="ro-field" style="padding:.7rem .8rem;border:1px solid #d6d6d6;border-radius:8px;background:#f7f7f7">—</div>
        </div>
      </div>

      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:.75rem 0">
        <div class="form-col" style="display:flex;flex-direction:column;gap:.4rem">
          <label style="font-weight:600">Username</label>
          <div id="ro-username" class="ro-field" style="padding:.7rem .8rem;border:1px solid #d6d6d6;border-radius:8px;background:#f7f7f7">—</div>
        </div>
        <div class="form-col" style="display:flex;flex-direction:column;gap:.4rem">
          <label style="font-weight:600">Phone Number</label>
          <div id="ro-phone" class="ro-field" style="padding:.7rem .8rem;border:1px solid #d6d6d6;border-radius:8px;background:#f7f7f7">—</div>
        </div>
      </div>

      <div style="margin-top:1rem;display:flex;justify-content:flex-end">
        <a href="/Online-store/pages/profile.html"
           class="btn"
           style="padding:.6rem .9rem;border:0;background:#1a2797;color:#fff;border-radius:8px;text-decoration:none">
          Update Profile
        </a>
      </div>
    </section>
  `;

  fetch("/Online-store/php/me.php", { credentials: "include" })
    .then(r => r.json())
    .then(me => {
      if (!me || !me.ok) return;
      const full = [me.first_name||"", me.last_name||""].filter(Boolean).join(" ").trim();
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v && String(v).trim() ? v : "—"; };
      set("ro-fullName", full || me.username || "—");
      set("ro-email", me.email || "—");
      set("ro-username", me.username || "—");
      set("ro-phone", (typeof me.phone !== "undefined" && me.phone) ? me.phone : "—");
    }).catch(() => {});
}

/* ===== Router ===== */
async function loadPage(pageName) {
  // Show the profile for Dashboard (home) and for My Profile
  if (pageName === "home" || pageName === "profile") {
    renderProfileView();
    return;
  }

  const url = ROUTES[pageName] || `/Online-store/pages/${pageName}.html`;
  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const htmlText = await response.text();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlText;
    const mainContent = tempDiv.querySelector("main") || tempDiv;
    dashboardContent.innerHTML = mainContent.innerHTML;
    tempDiv.querySelectorAll("script").forEach((script) => {
      if (!script.src) {
        const s = document.createElement("script");
        s.textContent = script.textContent;
        document.body.appendChild(s);
      }
    });
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

function initNavigation() {
  document.querySelectorAll(".nav-menu a[data-page]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      loadPage(link.dataset.page);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  loadPage("home"); // Dashboard now renders the profile view
});
