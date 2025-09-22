// logout.js — let the <a href="..."> navigate; just log + guard double clicks
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".logout-link, .logout-btn").forEach((el) => {
    el.addEventListener("click", () => {
      console.log("[logout] clicked → navigating to", el.getAttribute("href"));
      // optional: prevent double clicks
      el.style.pointerEvents = "none";
      el.setAttribute("aria-busy", "true");
    });
  });
});
