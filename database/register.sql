CREATE DATABASE `online_store`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

CREATE TABLE `online_store`.`users` (
  `user_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(32)  NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `first_name` VARCHAR(100) NULL,
  `last_name`  VARCHAR(100) NULL,
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email`    (`email`)
);

-- Table structure for table `categories`
CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
)


INSERT INTO `categories` (`id`, `name`) VALUES
(4, 'baby clothing'),
(3, 'kids clothing'),
(1, 'mens clothing'),
(2, 'womens clothing');


-- Table structure for table `products`
CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `isNew` tinyint(1) DEFAULT 0,
  `rating` decimal(2,1) DEFAULT NULL,
  `reviews` int(11) DEFAULT NULL,
  `colors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`colors`)),
  `sizes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`sizes`)),
  `inStock` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `products` (`id`, `name`, `category_id`, `price`, `description`, `image`, `isNew`, `rating`, `reviews`, `colors`, `sizes`, `inStock`) VALUES
(1, 'Men\'s Classic Fit Shirt', 1, 49.99, 'Classic cotton shirt with button-down collar', '../assets/images/products/mens-shirt.jpg', 1, 4.5, 128, '[\"White\",\"Blue\",\"Black\"]', '[\"S\",\"M\",\"L\",\"XL\"]', 1),
(2, 'Women\'s Summer Dress', 2, 79.99, 'Floral print summer dress with adjustable straps', '../assets/images/products/womens-dress.jpg', 1, 4.8, 245, '[\"Pink\",\"Yellow\",\"Blue\"]', '[\"XS\",\"S\",\"M\",\"L\"]', 1),
(3, 'Kids\' Denim Jeans', 3, 34.99, 'Comfortable stretch denim jeans for kids', '../assets/images/products/kids-jeans.jpg', 0, 4.6, 89, '[\"Blue\",\"Black\"]', '[\"4Y\",\"5Y\",\"6Y\",\"7Y\"]', 1),
(4, 'Baby Onesie Set', 4, 24.99, '3-piece cotton onesie set for babies', '../assets/images/products/baby-onesie.jpg', 1, 4.9, 156, '[\"White\",\"Pink\",\"Blue\"]', '[\"0-3M\",\"3-6M\",\"6-12M\"]', 1),
(5, 'Men\'s Slim Fit Jeans', 1, 59.99, 'Stretch denim slim fit jeans', '../assets/images/products/mens-jeans.jpg', 0, 4.4, 198, '[\"Dark Blue\",\"Black\",\"Grey\"]', '[\"30\",\"32\",\"34\",\"36\"]', 1),
(6, 'Women\'s Blazer', 2, 89.99, 'Professional fitted blazer for women', '../assets/images/products/womens-blazer.jpg', 0, 4.7, 167, '[\"Black\",\"Navy\",\"Grey\"]', '[\"S\",\"M\",\"L\"]', 1),
(7, 'Kids\' T-Shirt Pack', 3, 29.99, '3-pack colorful cotton t-shirts', '../assets/images/products/kids-tshirts.jpg', 1, 4.5, 78, '[\"Multicolor\"]', '[\"4Y\",\"5Y\",\"6Y\",\"7Y\"]', 1),
(8, 'Baby Winter Set', 4, 39.99, 'Warm winter set including hat and mittens', '../assets/images/products/baby-winter.jpg', 0, 4.8, 92, '[\"Pink\",\"Blue\",\"White\"]', '[\"0-3M\",\"3-6M\",\"6-12M\"]', 1),
(9, 'Women\'s Sneakers', 2, 69.99, 'Comfortable casual sneakers', '../assets/images/products/womens-sneakers.jpg', 1, 4.6, 215, '[\"White\",\"Pink\",\"Black\"]', '[\"36\",\"37\",\"38\",\"39\",\"40\"]', 1),
(10, 'Men\'s Leather Jacket', 1, 149.99, 'Classic leather motorcycle jacket', '../assets/images/products/mens-jacket.jpg', 0, 4.9, 178, '[\"Black\",\"Brown\"]', '[\"M\",\"L\",\"XL\"]', 1);

-- --------------------------------------------------------

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
)



-- Table structure for table `orders`
CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `guest_name` varchar(100) DEFAULT NULL,
  `guest_email` varchar(150) DEFAULT NULL,
  `guest_address` text DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','shipped','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
)


-- Table structure for table `order_items`
CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(150) NOT NULL,
  `quantity` int(11) NOT NULL CHECK (`quantity` > 0),
  `price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL
)




