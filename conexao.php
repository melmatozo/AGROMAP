<?php
// Configure aqui os dados do seu MySQL local (XAMPP/Laragon/WAMP costumam usar root e senha vazia).
$host    = "localhost";
$banco   = "agromap_db";
$usuario = "root";
$senha   = "";
 
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$banco;charset=utf8mb4",
        $usuario,
        $senha,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false
        ]
    );
} catch (PDOException $e) {
    error_log($e->getMessage());
 
    http_response_code(500);
    header("Content-Type: application/json; charset=utf-8");
 
    echo json_encode([
        "sucesso"  => false,
        "mensagem" => "Não foi possível conectar ao banco de dados."
    ]);
 
    exit;
}
 