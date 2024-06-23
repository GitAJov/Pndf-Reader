<?php
// Konfigurasi database
$host = 'localhost';
$dbname = 'db_pndf';
$username = 'root';
$password = '123';

// Membuat koneksi ke database
$conn = new mysqli($host, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Koneksi gagal: ". $conn->connect_error);
}

// Mengatur charset ke utf8mb4
$conn->set_charset("utf8mb4");

?>