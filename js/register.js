document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const feedback = document.getElementById('feedback');

  console.log('[register] script loaded. form?', !!form);

  function show(msg, type = 'error') {
    if (feedback) {
      feedback.textContent = msg;
      feedback.className = 'feedback ' + type;
    } else {
      alert(msg);
    }
  }

  if (!form) return;

  // absolute safety: block native submit even if our async fails
  form.setAttribute('novalidate', 'novalidate');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[register] submit');

    const fullname = document.getElementById('fullname')?.value.trim() || '';
    const email = (document.getElementById('email')?.value || '').trim().toLowerCase();
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const role = (document.getElementById("role")?.value || "user").toLowerCase();

    if (!fullname || !email || !password || !confirmPassword)
      return show('Please fill all fields');

    if (password !== confirmPassword)
      return show('Passwords do not match');

    try {
      const res = await fetch('/Online-store/php/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullname, email, password, confirmPassword, role })
      });

      const text = await res.text();
      console.log('[register] response:', res.status, text);
      let data = {};
      try { data = JSON.parse(text); } catch {}

      if (!res.ok || !data.ok) {
        return show(data.error || `Registration failed (${res.status}).`);
      }

      show('Registration successful! Redirecting...', 'success');
      setTimeout(() => { window.location.href = '/Online-store/pages/login.html'; }, 800);
    } catch (err) {
      console.error(err);
      show('Network error. Please try again.');
    }
  });
});
