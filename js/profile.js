// /Online-store/js/profile.js — SAFE INIT + PREFILL + EDIT HANDLER
window.initProfilePage = function () {
  const viewDiv = document.getElementById("profile-view");
  const editForm = document.getElementById("profile-edit");
  const msgBox = document.getElementById("pf-msg-all");

  function setMsg(text, ok = true) {
    if (!msgBox) return;
    msgBox.textContent = text;
    msgBox.style.color = ok ? "green" : "red";
  }

  // ---- Fetch user details
  async function fetchMe() {
    try {
      const res = await fetch("/Online-store/php/me.php", {
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/Online-store/pages/login.html";
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error("[profile.js] fetchMe failed:", err);
      return null;
    }
  }

  // ---- Prefill both view + edit
  async function prefillProfile() {
    const me = await fetchMe();
    if (!me || !me.ok) return;

    const full = [me.first_name || "", me.last_name || ""]
      .filter(Boolean)
      .join(" ")
      .trim();

    // Generic setter for view mode
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v || "—";
    };

    set("po-name", full || me.username || "—");
    set("po-email", me.email);
    set("po-username", me.username);
    set("po-phone", me.phone);
    set("po-address", me.address);
    set("po-city", me.city);
    set("po-postcode", me.postcode);

    // ---- Payment Method (VIEW)
    const pmView = document.getElementById("po-method");
    if (pmView) {
      pmView.innerHTML = "";
      if (me.payment_method) {
        let icon = "";
        let label = me.payment_method;

        switch (me.payment_method.toLowerCase()) {
          case "mastercard":
            icon =
              '<i class="fab fa-cc-mastercard fa-2x" style="color:#e6772e"></i>';
            label = "Mastercard";
            break;
          case "visa":
            icon = '<i class="fab fa-cc-visa fa-2x" style="color:#1a1f71"></i>';
            label = "Visa";
            break;
          case "paypal":
            icon =
              '<i class="fab fa-cc-paypal fa-2x" style="color:#003087"></i>';
            label = "PayPal";
            break;
        }
        pmView.innerHTML = `${icon} <span>${label}</span>`;
      } else {
        pmView.innerHTML =
          '<span style="color:#888;font-style:italic">Select a payment method</span>';
      }
    }

    set("po-card", me.card_number ? "**** " + me.card_number.slice(-4) : "—");
    set("po-expiry", me.card_expiry);
    set("po-cvv", me.cvv ? "***" : "—");

    // ---- Clear radios
    document.querySelectorAll('input[name="paymentMethod"]').forEach((r) => {
      r.checked = false;
    });

    // ---- Payment Method (EDIT radios)
    if (me.payment_method) {
      const pm = document.querySelector(
        `input[name="paymentMethod"][value="${me.payment_method.toLowerCase()}"]`
      );
      if (pm) pm.checked = true;
    }

    // ---- Edit Mode fields
    const safeSet = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v || "";
    };

    safeSet("fullName", full);
    safeSet("email", me.email);
    safeSet("username", me.username);
    safeSet("phone", me.phone);
    safeSet("address", me.address);
    safeSet("city", me.city);
    safeSet("postcode", me.postcode);
    safeSet("cardNumber", me.card_number);
    safeSet("expiry", me.card_expiry);
    safeSet("cvv", me.cvv);
  }

  // Initial prefill
  prefillProfile();

  // ---- Toggle Edit
  const btnEdit = document.getElementById("btn-edit");
  btnEdit &&
    btnEdit.addEventListener("click", () => {
      if (viewDiv) viewDiv.style.display = "none";
      if (editForm) editForm.style.display = "block";
    });

  // ---- Cancel Edit
  const btnCancel = document.getElementById("btn-cancel");
  btnCancel &&
    btnCancel.addEventListener("click", () => {
      if (editForm) editForm.style.display = "none";
      if (viewDiv) viewDiv.style.display = "block";
    });

  // ---- Save Changes
  const btnSave = document.getElementById("btn-save");
  btnSave &&
    btnSave.addEventListener("click", async () => {
      setMsg("Updating...");
      const payload = {
        fullName: document.getElementById("fullName")?.value.trim() || "",
        email: document.getElementById("email")?.value.trim() || "",
        username: document.getElementById("username")?.value.trim() || "",
        phone: document.getElementById("phone")?.value.trim() || "",
        address: document.getElementById("address")?.value.trim() || "",
        city: document.getElementById("city")?.value.trim() || "",
        postcode: document.getElementById("postcode")?.value.trim() || "",
        paymentMethod:
          document.querySelector('input[name="paymentMethod"]:checked')
            ?.value || "",
        cardNumber: document.getElementById("cardNumber")?.value.trim() || "",
        expiry: document.getElementById("expiry")?.value.trim() || "",
        cvv: document.getElementById("cvv")?.value.trim() || "",
      };

      try {
        const res = await fetch("/Online-store/php/update_profile.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const raw = await res.text();
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error("Invalid response: " + raw);
        }
        if (!data.ok) throw new Error(data.error || "Update failed");

        setMsg("✅ Profile updated successfully");
        await prefillProfile();
        if (editForm) editForm.style.display = "none";
        if (viewDiv) viewDiv.style.display = "block";
      } catch (err) {
        console.error("[profile.js] update failed:", err);
        setMsg("❌ " + (err.message || "Update failed"), false);
      }
    });
};
