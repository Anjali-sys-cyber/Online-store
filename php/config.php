<?php
return array(
  'dsn'  => 'mysql:host=127.0.0.1;dbname=online_store;charset=utf8mb4',
  'user' => 'root',
  'pass' => '',
  'pdo_options' => array(
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ),
);
