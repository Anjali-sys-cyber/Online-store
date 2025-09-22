async function searchProduct() {
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  if (!query) {
    alert("Please enter a product name.");
    return;
  }

  try {
    const response = await fetch("../data/products.json");
    const data = await response.json();

    const searchResults = data.products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );

    if (searchResults.length > 0) {
      // Store search results in sessionStorage
      sessionStorage.setItem("searchResults", JSON.stringify(searchResults));
      // Redirect to products page with search parameter
      window.location.href = `product.html?search=${encodeURIComponent(query)}`;
    } else {
      alert("No products found matching your search.");
    }
  } catch (error) {
    console.error("Error searching products:", error);
    alert("Error searching products. Please try again.");
  }
}

// Update search input to also trigger on Enter key
document
  .getElementById("searchInput")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      searchProduct();
    }
  });

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("../data/products.json");
    const data = await response.json();

    // Get featured products (first 3 products)
    const featuredProducts = data.products.slice(0, 3);

    const productGrid = document.getElementById("featuredProducts");

    productGrid.innerHTML = featuredProducts
      .map(
        (product) => `
                <div class="product-card">
                    ${
                      product.isNew
                        ? '<div class="product-badge">New</div>'
                        : ""
                    }
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

function generateRatingStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let stars = "";

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }

  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }

  return stars;
}

// seeding admin user if not exists
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("../data/dummyUsers.json");
    const users = await response.json();

    for (const user of users) {
      // Hash password
      const hashedPassword = await Utils.hashPassword(user.password);

      // Store user in localStorage by email
      localStorage.setItem(
        `user_${user.email}`,
        JSON.stringify({ ...user, password: hashedPassword })
      );
    }

    console.log("All dummy users loaded successfully");
  } catch (error) {
    console.error("Error loading dummy users:", error);
  }
});
