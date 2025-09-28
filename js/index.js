document.addEventListener("DOMContentLoaded", async () => {
  const featuredContainer = document.getElementById("featuredProducts");
  const searchInput = document.getElementById("searchInput");

  // ===== Ensure cartManager exists =====
  window.cartManager = window.cartManager || {
    addToCart: (product) => {
      console.log("CartManager not initialized. Tried to add:", product);
      alert("Cart is not available yet.");
    },
  };

  // ===== Search functionality =====
  async function searchProduct() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    if (!query) return alert("Please enter a product name.");

    try {
      const response = await fetch(
        "/Online-store/php/products.php?action=read"
      );
      const data = await response.json();
      const products = data.products || [];

      const results = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.category || "").toLowerCase().includes(query)
      );

      if (results.length > 0) {
        sessionStorage.setItem("searchResults", JSON.stringify(results));
        window.location.href = `product.html?search=${encodeURIComponent(
          query
        )}`;
      } else {
        alert("No products found matching your search.");
      }
    } catch (error) {
      console.error("Error searching products:", error);
      alert("Error searching products. Please try again.");
    }
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchProduct();
      }
    });
  }

  // ===== Load featured products =====
  try {
    // Fetch products from PHP API
    const response = await fetch("../php/products.php?action=read");
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("Unexpected response format:", data);
      return;
    }

    // Get featured products (first 3)
    const featuredProducts = data.slice(0, 3);

    featuredContainer.innerHTML = featuredProducts
      .map(
        (product) => `
          <div class="product-card">
              ${product.isNew ? '<div class="product-badge">New</div>' : ""}
              <div class="product-image">
                  <img src="${product.image}" alt="${product.name}" />
                  <div class="product-overlay">
                      <button class="quick-view">
                          <i class="fas fa-eye"></i>
                          Quick View
                      </button>
                  </div>
              </div>
              <div class="product-details">
                  <h3>${product.name}</h3>
                  <div class="product-rating">
                      ${generateRatingStars(product.rating)}
                      <span>(${product.rating})</span>
                  </div>
                  <p class="price">
                      <span class="price-amount">$${product.price}</span>
                  </p>
                  <button
                      class="add-to-cart"
                      onclick="cartManager.addToCart({
                          id: '${product.id}',
                          name: '${product.name}',
                          price: ${product.price},
                          image: '${product.image}'
                      })"
                  >
                      <i class="fas fa-shopping-cart"></i>
                      Add to Cart
                  </button>
              </div>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading featured products:", error);
  }
});

// ===== Helper: generate rating stars =====
function generateRatingStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  return (
    '<i class="fas fa-star"></i>'.repeat(fullStars) +
    '<i class="fas fa-star-half-alt"></i>'.repeat(halfStar) +
    '<i class="far fa-star"></i>'.repeat(emptyStars)
  );
}
