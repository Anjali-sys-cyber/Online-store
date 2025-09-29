// /Online-store/js/auth-guard.js
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/Online-store/php/me.php", {
      credentials: "include",
    });
    const data = await res.json();

    const loginLink = document.getElementById("loginLink");
    const logoutLink = document.getElementById("logoutLink");
    const greet = document.getElementById("userGreeting");
    const navHome = document.getElementById("navHome");
    const navProducts = document.getElementById("navProducts");
    const continueBtn = document.getElementById("continueShoppingBtn"); // cart page button

    if (!data.ok) {
      // ------------------ Not logged in ------------------
      if (loginLink) loginLink.style.display = "inline";
      if (logoutLink) logoutLink.style.display = "none";
      if (greet) greet.textContent = "";

      // point nav + continue shopping → PUBLIC pages
      if (navHome) navHome.href = "/Online-store/index.html";
      if (navProducts) navProducts.href = "/Online-store/pages/product.html"; // match your folder
      if (continueBtn) continueBtn.href = "/Online-store/index.html";

      // redirect if this is a protected page
      const protectedPages = [
        "/Online-store/pages/user.html",
        "/Online-store/pages/cart.html",
        "/Online-store/pages/checkout.html",
      ];
      if (protectedPages.includes(location.pathname)) {
        const next = encodeURIComponent(
          location.pathname + location.search + location.hash
        );
        location.href = `/Online-store/pages/login.html?next=${next}`;
      }
      return;
    }

    // ------------------ Logged in ------------------
    if (loginLink) loginLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "inline";

    if (greet) {
      const name = data.first_name || data.username || "User";
      greet.textContent = `Hi, ${name}`;
    }

    // point nav + continue shopping → PRIVATE pages
    if (navHome) navHome.href = "/Online-store/pages/homeContent.html"; // private home page
    if (navProducts) navProducts.href = "/Online-store/pages/product.html";
    if (continueBtn) continueBtn.href = "/Online-store/pages/homeContent.html";
  } catch (err) {
    console.error("Auth check failed:", err);
    const next = encodeURIComponent(
      location.pathname + location.search + location.hash
    );
    location.href = `/Online-store/pages/login.html?next=${next}`;
  }
});
