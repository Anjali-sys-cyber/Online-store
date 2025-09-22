document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const feedback = document.getElementById("feedback");
  const togglePassword = document.querySelector(".toggle-password");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.querySelector(".login-btn");

  if (!loginForm) return;

  // Toggle password visibility
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      togglePassword.classList.toggle("fa-eye");
      togglePassword.classList.toggle("fa-eye-slash");
    });
  }

  function show(msg, type) {
    if (typeof Utils !== "undefined" && Utils.showFeedback) {
      Utils.showFeedback(feedback, msg, type);
    } else {
      feedback.textContent = msg;
      feedback.className = "feedback " + (type || "error");
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btnText = loginBtn.querySelector("span");
    const btnLoader = loginBtn.querySelector(".fa-spinner");
    if (btnText && btnLoader) {
      btnText.style.display = "none";
      btnLoader.style.display = "inline-block";
    }

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = passwordInput.value;
    const remember = document.getElementById("remember")?.checked || false;

    try {
      if (!email || !password) throw new Error("Please fill in all fields");
      if (typeof Utils !== "undefined" && !Utils.validateEmail(email)) {
        throw new Error("Invalid email address");
      }

      const res = await fetch("/Online-store/php/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, remember })
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}
      console.log("login.php →", res.status, text);

      if (!res.ok || !data.ok) throw new Error(data.error || "Login failed");

      show("Login successful! Redirecting...", "success");

      // honor ?next=... if present
      setTimeout(() => {
        const params = new URLSearchParams(location.search);
        const next = params.get("next");
        if (data.role === "admin") {
          window.location.href = next || "/Online-store/pages/admin.html";
        } else {
          window.location.href = next || "/Online-store/pages/user.html";
        }
      }, 800);
    } catch (err) {
      show(err.message || "Login failed");
    } finally {
      if (btnText && btnLoader) {
        btnText.style.display = "inline-block";
        btnLoader.style.display = "none";
      }
    }
  });
});
