// productManagement.js
function initProductManagement() {
  const productForm = document.getElementById("productForm");
  const productsTableBody = document.getElementById("productsTableBody");
  const productImageInput = document.getElementById("productImage");
  const previewImg = document.getElementById("previewImg");
  const notification = document.getElementById("notification");
  const searchInput = document.getElementById("searchInput");

  if (!productsTableBody || !productForm) return; // exit if loaded incorrectly

  let products = [];
  let uploadedImageData = "";
  let currentEditIndex = null;

  // Load products
  async function loadProducts() {
    try {
      const res = await fetch("../data/products.json");
      const data = await res.json();
      products = data.products || [];
      renderProducts(products);
    } catch (err) {
      console.error("Error loading products:", err);
      productsTableBody.innerHTML =
        "<tr><td colspan='6' style='color:red;'>Failed to load products.</td></tr>";
    }
  }

  function renderProducts(list = products) {
    if (!list || list.length === 0) {
      productsTableBody.innerHTML =
        "<tr><td colspan='6'>No products available.</td></tr>";
      return;
    }

    productsTableBody.innerHTML = list
      .map(
        (p, idx) => `
      <tr>
        <td><img src="${p.image || "../assets/images/placeholder.jpg"}" alt="${
          p.name
        }" style="width:60px;height:60px;object-fit:cover;"></td>
        <td>${p.name}</td>
        <td>$${p.price.toFixed(2)}</td>
        <td>${p.category}</td>
        <td>${p.inStock ? "In Stock" : "Out of Stock"}</td>
        <td>${p.description || ""}</td>
        <td>
          <button onclick="editProduct(${idx})" class="edit-btn">Edit</button>
          <button onclick="deleteProduct(${idx})" class="delete-btn">Delete</button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  // Image preview
  if (productImageInput) {
    productImageInput.addEventListener("change", () => {
      const file = productImageInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedImageData = e.target.result;
          previewImg.src = uploadedImageData;
          previewImg.style.display = "block";
        };
        reader.readAsDataURL(file);
      } else {
        uploadedImageData = "";
        previewImg.src = "";
        previewImg.style.display = "none";
      }
    });
  }

  // Form submit
  productForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newProduct = {
      name: document.getElementById("productName").value.trim(),
      price: parseFloat(document.getElementById("productPrice").value),
      category: document.getElementById("productCategory").value.trim(),
      stock: parseInt(document.getElementById("productStock").value, 10),
      description: document.getElementById("productDescription").value.trim(),
      image: uploadedImageData || "",
      inStock: true,
    };

    if (currentEditIndex !== null) {
      products[currentEditIndex] = newProduct;
      currentEditIndex = null;
      productForm.querySelector("#saveBtn").textContent = "Add Product";
      showNotification("Product updated!");
    } else {
      products.push(newProduct);
      showNotification("Product added! (Frontend only)");
    }

    productForm.reset();
    previewImg.src = "";
    previewImg.style.display = "none";
    uploadedImageData = "";
    renderProducts();
  });

  // Search
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
      renderProducts(filtered);
    });
  }

  // Global edit/delete
  window.editProduct = function (idx) {
    const p = products[idx];
    document.getElementById("productName").value = p.name;
    document.getElementById("productPrice").value = p.price;
    document.getElementById("productCategory").value = p.category;
    document.getElementById("productStock").value = p.stock;
    document.getElementById("productDescription").value = p.description;
    uploadedImageData = p.image || "";
    previewImg.src = uploadedImageData;
    previewImg.style.display = uploadedImageData ? "block" : "none";
    currentEditIndex = idx;
    productForm.querySelector("#saveBtn").textContent = "Update Product";
  };

  window.deleteProduct = function (idx) {
    if (confirm("Delete this product?")) {
      products.splice(idx, 1);
      renderProducts();
      showNotification("Product deleted!");
    }
  };

  function showNotification(msg) {
    if (!notification) return;
    notification.textContent = msg;
    notification.style.display = "block";
    setTimeout(() => (notification.style.display = "none"), 2000);
  }

  // Initial load
  loadProducts();
}

// Auto-init if standalone page
if (document.getElementById("productManagementC")) {
  initProductManagement();
}
