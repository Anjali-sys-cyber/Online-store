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
UPDATE users SET role='admin' WHERE email='anjali@gmail.com';
ALTER TABLE online_store.users
  ADD COLUMN phone VARCHAR(20) NULL AFTER last_name;
test sujan time 11:02
