// /Online-store/js/auth-guard.js
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/Online-store/php/me.php", { credentials: "include" });
    const data = await res.json();

    if (!data.ok) {
      // Not logged in → send to login, remember where to return
      const next = encodeURIComponent(location.pathname + location.search + location.hash);
      location.href = `/Online-store/pages/login.html?next=${next}`;
      return;
    }

    // Logged in → optionally set greeting
    const greet = document.getElementById("userGreeting");
    if (greet) {
      const name = data.first_name || data.username || "User";
      greet.textContent = `Hi, ${name}`;
    }
  } catch {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.href = `/Online-store/pages/login.html?next=${next}`;
  }
});
