function showContent(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".about-content");
  sections.forEach((sec) => sec.classList.remove("active"));

  // Show the selected section
  const activeSection = document.getElementById(sectionId);
  if (activeSection) activeSection.classList.add("active");

  // Remove 'active' from all links
  const links = document.querySelectorAll(".about-link");
  links.forEach((link) => link.classList.remove("active"));

  // Add 'active' to the clicked link
  const clickedLink = Array.from(links).find((link) =>
    link.getAttribute("onclick").includes(sectionId)
  );
  if (clickedLink) clickedLink.classList.add("active");
}

// On page load - show welcome message
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("welcome").classList.add("active");
});
