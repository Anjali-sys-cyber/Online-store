// /Online-store/js/productManagement.js
(function () {
  // ---- Config ----
  const API_PRODUCTS = "/Online-store/php/products.php";
  const API_UPLOAD = "/Online-store/php/upload_product_image.php";

  // Category mapping (adjust to your DB if needed)
  const CAT_NAME_TO_ID = { Mens: 1, Womens: 2, Kids: 3, Baby: 4 };
  const CAT_ID_TO_NAME = { 1: "mens", 2: "womens", 3: "kids", 4: "baby" };

  // ---- Utils ----
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const money = (n) => (Number.isFinite(+n) ? `$${(+n).toFixed(2)}` : "$0.00");
  const j = (v) => {
    try {
      if (Array.isArray(v)) return v;
      if (typeof v === "string" && v.trim() !== "") return JSON.parse(v);
    } catch {}
    return [];
  };

  // ---- API helpers ----
  async function apiJson(res) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  async function apiRead() {
    const res = await fetch(`${API_PRODUCTS}?action=read`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Read failed: HTTP ${res.status}`);
    const data = await apiJson(res);
    if (!Array.isArray(data)) throw new Error("Unexpected response");
    return data.map((row) => ({
      id: +row.id,
      name: row.name || "",
      category_id: +row.category_id || 0,
      category: CAT_ID_TO_NAME[row.category_id] || "",
      price: +row.price || 0,
      description: row.description || "",
      image: row.image || "",
      isNew: +row.isNew || 0,
      rating: +row.rating || 0,
      reviews: +row.reviews || 0,
      colors: j(row.colors),
      sizes: j(row.sizes),
      inStock: +row.inStock ? 1 : 0,
    }));
  }

  async function apiCreate(payload) {
    const res = await fetch(`${API_PRODUCTS}?action=create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await apiJson(res);
    if (!res.ok || !data?.success)
      throw new Error(data?.error || "Create failed");
    return data.id;
  }

  async function apiUpdate(payload) {
    const res = await fetch(`${API_PRODUCTS}?action=update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await apiJson(res);
    if (!res.ok || !data?.success)
      throw new Error(data?.error || "Update failed");
    return true;
  }

  async function apiDelete(id) {
    const res = await fetch(
      `${API_PRODUCTS}?action=delete&id=${encodeURIComponent(id)}`,
      { method: "GET", credentials: "include" }
    );
    const data = await apiJson(res);
    if (!res.ok || !data?.success)
      throw new Error(data?.error || "Delete failed");
    return true;
  }

  // ---- Main init ----
  window.initProductManagement = function initProductManagement() {
    console.log("[PM] backend mode →", API_PRODUCTS);

    // DOM
    const productForm = document.getElementById("productForm");
    const productsTableBody = document.getElementById("productsTableBody");
    const productImageInput = document.getElementById("productImage");
    const previewImg = document.getElementById("previewImg");
    const notification = document.getElementById("notification");
    const searchInput = document.getElementById("searchInput");
    const saveBtn = document.getElementById("saveBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const formTitle = document.getElementById("formTitle");

    if (!productForm || !productsTableBody) {
      console.warn("[PM] form/table not found on this page");
      return;
    }

    // State
    let products = [];
    let currentEditId = null;
    let uploadedImageURL = "";

    // UI helpers
    const notify = (msg, ms = 2200) => {
      if (!notification) return;
      notification.textContent = msg;
      notification.style.display = "block";
      window.clearTimeout(notify._t);
      notify._t = window.setTimeout(
        () => (notification.style.display = "none"),
        ms
      );
    };

    // Render
    // ---- Render ----
    function render(list = products) {
      if (!list.length) {
        productsTableBody.innerHTML =
          "<tr><td colspan='7'>No products available.</td></tr>";
        return;
      }
      productsTableBody.innerHTML = list
        .map(
          (p) => `
        <tr>
          <td>
            ${
              p.image
                ? `<img src="${p.image}" 
                        alt="${esc(p.name)}"
                        style="width:60px;height:60px;object-fit:cover;border-radius:6px">`
                : "—"
            }
          </td>
          <td>${esc(p.name)}</td>
          <td>${money(p.price)}</td>
          <td>${p.category || "-"}</td>
          <td>${p.inStock ? "In Stock" : "Out of Stock"}</td>
          <td>${p.description ? esc(p.description) : ""}</td>
          <td>
            <button class="edit-btn" data-id="${p.id}">Edit</button>
            <button class="delete-btn" data-id="${p.id}">Delete</button>
          </td>
        </tr>`
        )
        .join("");
    }

    async function load() {
      try {
        products = await apiRead();
        render(products);
      } catch (e) {
        console.error(e);
        notify(e.message || "Failed to load products");
        productsTableBody.innerHTML =
          "<tr><td colspan='7' style='color:red'>Load failed</td></tr>";
      }
    }

    // Image upload + preview (robust)
    productImageInput?.addEventListener("change", async () => {
      const file = productImageInput.files?.[0];
      if (!file) {
        uploadedImageURL = "";
        previewImg.src = "";
        previewImg.style.display = "none";
        return;
      }

      // Local preview
      previewImg.src = URL.createObjectURL(file);
      previewImg.style.display = "block";

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch(API_UPLOAD, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const ct = res.headers.get("content-type") || "";
        const raw = ct.includes("application/json")
          ? await res.json()
          : { ok: false, error: await res.text() };

        console.log("[PM] upload →", res.status, raw);
        if (!res.ok || !raw?.ok)
          throw new Error(raw?.error || `Upload failed (HTTP ${res.status})`);

        uploadedImageURL = raw.url; // Use this URL when saving the product
        notify("Image uploaded");
      } catch (e) {
        alert(e.message || "Image upload failed");
        uploadedImageURL = "";
        previewImg.src = "";
        previewImg.style.display = "none";
      }
    });

    // Create/Update submit
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("productName").value.trim();
      const price = parseFloat(document.getElementById("productPrice").value);
      const categoryName = document
        .getElementById("productCategory")
        .value.trim();
      const stock = parseInt(document.getElementById("productStock").value, 10);
      const description = document
        .getElementById("productDescription")
        .value.trim();

      const category_id = CAT_NAME_TO_ID[categoryName] || null;

      if (!name || !Number.isFinite(price) || !category_id) {
        notify("Please fill Name, Price and Category correctly.");
        return;
      }

      const payload = {
        name,
        category_id,
        price,
        description,
        image: uploadedImageURL || "",
        isNew: 0,
        rating: 0,
        reviews: 0,
        colors: [],
        sizes: [],
        inStock: stock > 0 ? 1 : 0,
      };

      try {
        saveBtn.disabled = true;

        if (currentEditId != null) {
          await apiUpdate({ id: currentEditId, ...payload });
          notify("Product updated!");
        } else {
          await apiCreate(payload);
          notify("Product added!");
        }

        // Reset form
        productForm.reset();
        currentEditId = null;
        uploadedImageURL = "";
        previewImg.src = "";
        previewImg.style.display = "none";
        formTitle.textContent = "Add Product";
        saveBtn.textContent = "Add Product";
        cancelEditBtn.style.display = "none";

        await load();
      } catch (e) {
        console.error(e);
        notify(e.message || "Save failed");
      } finally {
        saveBtn.disabled = false;
      }
    });

    // Cancel edit
    cancelEditBtn?.addEventListener("click", () => {
      currentEditId = null;
      productForm.reset();
      uploadedImageURL = "";
      previewImg.src = "";
      previewImg.style.display = "none";
      formTitle.textContent = "Add Product";
      saveBtn.textContent = "Add Product";
      cancelEditBtn.style.display = "none";
    });

    // Row actions (edit/delete)
    productsTableBody.addEventListener("click", async (e) => {
      const edit = e.target.closest(".edit-btn");
      const del = e.target.closest(".delete-btn");

      if (edit) {
        const id = +edit.dataset.id;
        const p = products.find((x) => x.id === id);
        if (!p) return;

        document.getElementById("productName").value = p.name;
        document.getElementById("productPrice").value = p.price;
        document.getElementById("productCategory").value =
          Object.keys(CAT_NAME_TO_ID).find(
            (k) => CAT_NAME_TO_ID[k] === p.category_id
          ) || "";
        document.getElementById("productStock").value = p.inStock ? 1 : 0;
        document.getElementById("productDescription").value =
          p.description || "";

        uploadedImageURL = p.image || "";
        previewImg.src = uploadedImageURL || "";
        previewImg.style.display = uploadedImageURL ? "block" : "none";

        currentEditId = p.id;
        formTitle.textContent = "Edit Product";
        saveBtn.textContent = "Update Product";
        cancelEditBtn.style.display = "inline-block";
      }

      if (del) {
        const id = +del.dataset.id;
        if (!confirm("Delete this product?")) return;
        try {
          await apiDelete(id);
          notify("Product deleted!");
          await load();
        } catch (err) {
          console.error(err);
          notify(err.message || "Delete failed");
        }
      }
    });

    // Search
    searchInput?.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();
      render(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.category || "").toLowerCase().includes(q)
        )
      );
    });

    // Initial load
    load();
  };

  // Auto-init if used as a standalone page
  if (document.getElementById("productManagementC")) {
    window.initProductManagement();
  }
})();
