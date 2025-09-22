// /Online-store/js/profile.js — prefill + per-field updates with clear reasons
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // ---- Inline message helpers ----
  const MSG = {
    name: "pf-msg-name",
    email: "pf-msg-email",
    username: "pf-msg-username",
    phone: "pf-msg-phone",
    avatar: "pf-msg-avatar",
  };
  function setMsg(which, text, ok = true) {
    const el = $(MSG[which]);
    if (!el) return;
    el.textContent = text;
    el.classList.remove("ok", "err");
    el.classList.add(ok ? "ok" : "err");
  }
  function clearMsg(which) {
    const el = $(MSG[which]);
    if (!el) return;
    el.textContent = "";
    el.classList.remove("ok", "err");
  }
  function setBusy(btn, busy) {
    if (!btn) return;
    btn.setAttribute("aria-busy", busy ? "true" : "false");
    btn.disabled = !!busy;
  }

  // ---- Client-side validators (mirror PHP) ----
  const RX = {
    // letters, spaces, apostrophes, hyphens; at least 2 chars total, multi-part allowed
    fullName: /^[A-Za-z][A-Za-z' -]{1,98}(?:\s+[A-Za-z][A-Za-z' -]{0,98})*$/,
    // simple email + max 255
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
    // 3–32; letters numbers . _ -
    username: /^[A-Za-z0-9._-]{3,32}$/,
    // 6–20; digits spaces + - ( )
    phone: /^[0-9 +()\-]{6,20}$/,
  };

  function explainValidation(field, value) {
    const v = (value ?? "").trim();

    if (field === "name") {
      if (!v) return "Full name is required";
      if (!RX.fullName.test(v))
        return "Only letters, spaces, apostrophes, hyphens; must be at least 2 characters";
      return "";
    }

    if (field === "email") {
      if (!v) return "Email is required";
      if (v.length > 255) return "Email must be 255 characters or less";
      if (!RX.email.test(v)) return "Invalid email address";
      return "";
    }

    if (field === "username") {
      if (!v) return "Username is required";
      if (!RX.username.test(v))
        return "3–32 chars: letters, numbers, dot (.), underscore (_), hyphen (-)";
      return "";
    }

    if (field === "phone") {
      // empty phone allowed (means “clear number”)
      if (!v) return "";
      if (!RX.phone.test(v))
        return "Phone must be 6–20 chars; digits, spaces, +, -, () only";
      return "";
    }

    return "";
  }

  // Clear inline error as user types
  ["fullName", "email", "username", "phone"].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const map = { fullName: "name", email: "email", username: "username", phone: "phone" };
      clearMsg(map[id]);
    });
  });

  // ---- Prefill from server ----
  async function fetchMe() {
    const res = await fetch("/Online-store/php/me.php", { credentials: "include" });
    if (res.status === 401) {
      window.location.href = "/Online-store/pages/login.html";
      return null;
    }
    return res.json();
  }

  async function prefillProfile() {
    const me = await fetchMe();
    if (!me || !me.ok) return;

    const full = [me.first_name || "", me.last_name || ""].filter(Boolean).join(" ").trim();
    const fullNameEl = $("fullName");
    const emailEl    = $("email");
    const userEl     = $("username");
    const phoneEl    = $("phone");

    if (fullNameEl) fullNameEl.value = full;
    if (emailEl)    emailEl.value    = me.email || "";
    if (userEl)     userEl.value     = me.username || "";
    if (phoneEl && typeof me.phone !== "undefined") phoneEl.value = me.phone || "";

    // optional summary area
    const po = (id) => $(id);
    if (po("po-name"))     po("po-name").textContent     = full || me.username || "—";
    if (po("po-email"))    po("po-email").textContent    = me.email || "—";
    if (po("po-username")) po("po-username").textContent = me.username || "—";
    if (po("po-role"))     po("po-role").textContent     = me.role || "user";
    if (po("po-phone"))    po("po-phone").textContent    = (typeof me.phone !== "undefined" && me.phone) ? me.phone : "—";
  }

  prefillProfile();
  document.addEventListener("page:loaded", (e) => {
    if (e.detail === "profile") prefillProfile();
  });

  // ---- Robust fetch wrapper to surface server messages ----
  async function updateField(field, value) {
    try {
      const res  = await fetch("/Online-store/php/update_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ field, value }),
      });
      const raw  = await res.text();
      let data   = null;
      try { data = JSON.parse(raw); } catch {}
      if (res.status === 401) {
        window.location.href = "/Online-store/pages/login.html";
        return { ok: false, error: "Not authenticated" };
      }
      if (!res.ok) {
        return { ok: false, error: (data && data.error) || raw || `HTTP ${res.status}` };
      }
      if (!data || data.ok !== true) {
        return { ok: false, error: (data && data.error) || "Update failed" };
      }
      return { ok: true, message: data.message || "Updated" };
    } catch (err) {
      return { ok: false, error: err.message || "Network error" };
    }
  }

  // ---- Buttons: validate locally first; then call server; show exact reason ----
  document.addEventListener("click", async (e) => {
    const t = e.target;

    // Name
    if (t.id === "pf-save-name") {
      clearMsg("name");
      const v = $("fullName")?.value ?? "";
      const reason = explainValidation("name", v);
      if (reason) { setMsg("name", reason, false); return; }
      setBusy(t, true);
      try {
        const r = await updateField("name", v.trim());
        if (!r.ok) throw new Error(r.error);
        setMsg("name", "Name updated successfully", true);
        prefillProfile();
      } catch (err) {
        setMsg("name", err.message || "Update failed", false);
      } finally { setBusy(t, false); }
    }

    // Email
    if (t.id === "pf-save-email") {
      clearMsg("email");
      const v = ($("email")?.value ?? "").trim().toLowerCase();
      const reason = explainValidation("email", v);
      if (reason) { setMsg("email", reason, false); return; }
      setBusy(t, true);
      try {
        const r = await updateField("email", v);
        if (!r.ok) throw new Error(r.error); // surfaces “Email already in use”
        setMsg("email", "Email updated successfully", true);
        prefillProfile();
      } catch (err) {
        setMsg("email", err.message || "Update failed", false);
      } finally { setBusy(t, false); }
    }

    // Username
    if (t.id === "pf-save-username") {
      clearMsg("username");
      const v = $("username")?.value ?? "";
      const reason = explainValidation("username", v);
      if (reason) { setMsg("username", reason, false); return; }
      setBusy(t, true);
      try {
        const r = await updateField("username", v.trim());
        if (!r.ok) throw new Error(r.error); // surfaces “Username already in use”
        setMsg("username", "Username updated successfully", true);
        prefillProfile();
      } catch (err) {
        setMsg("username", err.message || "Update failed", false);
      } finally { setBusy(t, false); }
    }

    // Phone
    if (t.id === "pf-save-phone") {
      clearMsg("phone");
      const v = $("phone")?.value ?? "";
      const reason = explainValidation("phone", v);
      if (reason) { setMsg("phone", reason, false); return; }
      setBusy(t, true);
      try {
        const r = await updateField("phone", v.trim());
        if (!r.ok) throw new Error(r.error); // e.g., server rejects
        setMsg("phone", "Phone updated successfully", true);
        prefillProfile();
      } catch (err) {
        setMsg("phone", err.message || "Update failed", false);
      } finally { setBusy(t, false); }
    }

    // Avatar (optional)
    if (t.id === "pf-save-avatar") {
      clearMsg("avatar");
      setBusy(t, true);
      try {
        setMsg("avatar", "Implement /php/upload_avatar.php to enable this", false);
      } finally {
        setBusy(t, false);
      }
    }
  });

  // (Optional) one-shot form submit preserved; you can remove if you prefer buttons only
  const form = $("profileForm");
  if (form) {
    form.addEventListener("submit", (e) => e.preventDefault());
  }
});
