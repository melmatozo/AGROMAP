<?php
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'
]);
session_start();
 
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
 
require __DIR__ . '/conexao.php';
 
function responder($dados, $status = 200) {
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}
 
function texto($entrada, $campo, $max = 255) {
    $valor = trim((string)($entrada[$campo] ?? ''));
    return mb_substr($valor, 0, $max);
}
 
function numero($entrada, $campo) {
    $valor = trim((string)($entrada[$campo] ?? ''));
    if ($valor === '') return null;
    $valor = str_replace(',', '.', $valor);
    if (!is_numeric($valor) || (float)$valor < 0) return false;
    return (float)$valor;
}
 
// Aceita JSON (fetch) ou formulário comum
$entrada = json_decode(file_get_contents('php://input'), true);
if (!is_array($entrada)) $entrada = $_POST;
 
$acao = $entrada['acao'] ?? ($_GET['acao'] ?? '');
 
try {
    switch ($acao) {
 
        // ------------------------------------------------ CADASTRO
        case 'cadastro':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(['sucesso' => false, 'mensagem' => 'Método inválido.'], 405);
 
            $nome     = texto($entrada, 'nome', 120);
            $email    = strtolower(texto($entrada, 'email', 150));
            $senha    = (string)($entrada['senha'] ?? '');
            $telefone = texto($entrada, 'telefone', 30);
 
            if ($nome === '')                              responder(['sucesso' => false, 'mensagem' => 'Informe seu nome.'], 422);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) responder(['sucesso' => false, 'mensagem' => 'Informe um e-mail válido.'], 422);
            if (strlen($senha) < 6)                        responder(['sucesso' => false, 'mensagem' => 'Sua senha precisa ter pelo menos 6 caracteres.'], 422);
 
            $total     = numero($entrada, 'hectares_total');
            $plantados = numero($entrada, 'hectares_plantados');
 
            if ($total === false)     responder(['sucesso' => false, 'mensagem' => 'A área total deve ser um número igual ou maior que zero.'], 422);
            if ($plantados === false) responder(['sucesso' => false, 'mensagem' => 'A área plantada deve ser um número igual ou maior que zero.'], 422);
            if ($total !== null && $plantados !== null && $plantados > $total) {
                responder(['sucesso' => false, 'mensagem' => 'A área plantada não pode ser maior que a área total.'], 422);
            }
 
            $cidade = texto($entrada, 'cidade', 100);
            $estado = texto($entrada, 'estado', 2);
 
            $stmt = $pdo->prepare('SELECT 1 FROM usuario WHERE email = ?');
            $stmt->execute([$email]);
            if ($stmt->fetch()) responder(['sucesso' => false, 'mensagem' => 'Este e-mail já possui cadastro. Tente entrar.'], 409);
 
            $pdo->beginTransaction();
 
            $stmt = $pdo->prepare('INSERT INTO usuario (nome, email, telefone, senha) VALUES (?, ?, ?, ?)');
            $stmt->execute([$nome, $email, $telefone ?: null, password_hash($senha, PASSWORD_DEFAULT)]);
            $idUsuario = (int)$pdo->lastInsertId();
 
            $stmt = $pdo->prepare(
                'INSERT INTO propriedade
                 (nome, localizacao, endereco, cidade, estado, area_total, hectares_plantados,
                  cultura_principal, outras_culturas, epoca_plantio, irrigacao, observacoes, id_usuario)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                texto($entrada, 'nome_fazenda', 120) ?: 'Minha propriedade',
                implode(', ', array_filter([$cidade, $estado])) ?: null,
                texto($entrada, 'endereco', 255) ?: null,
                $cidade ?: null,
                $estado ?: null,
                $total,
                $plantados,
                texto($entrada, 'cultura_principal', 100) ?: null,
                texto($entrada, 'outras_culturas', 255) ?: null,
                texto($entrada, 'epoca_plantio', 100) ?: null,
                texto($entrada, 'irrigacao', 50) ?: null,
                texto($entrada, 'observacoes', 2000) ?: null,
                $idUsuario
            ]);
 
            $pdo->commit();
 
            session_regenerate_id(true);
            $_SESSION['id_usuario'] = $idUsuario;
 
            responder(['sucesso' => true, 'mensagem' => 'Conta criada com sucesso!']);
 
        // ------------------------------------------------ LOGIN
        case 'login':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(['sucesso' => false, 'mensagem' => 'Método inválido.'], 405);
 
            $email = strtolower(texto($entrada, 'email', 150));
            $senha = (string)($entrada['senha'] ?? '');
 
            if ($email === '' || $senha === '') responder(['sucesso' => false, 'mensagem' => 'Informe e-mail e senha.'], 422);
 
            $stmt = $pdo->prepare('SELECT id_usuario, senha FROM usuario WHERE email = ?');
            $stmt->execute([$email]);
            $usuario = $stmt->fetch();
 
            if (!$usuario || !password_verify($senha, $usuario['senha'])) {
                responder(['sucesso' => false, 'mensagem' => 'E-mail ou senha incorretos.'], 401);
            }
 
            if (password_needs_rehash($usuario['senha'], PASSWORD_DEFAULT)) {
                $pdo->prepare('UPDATE usuario SET senha = ? WHERE id_usuario = ?')
                    ->execute([password_hash($senha, PASSWORD_DEFAULT), $usuario['id_usuario']]);
            }
 
            session_regenerate_id(true);
            $_SESSION['id_usuario'] = (int)$usuario['id_usuario'];
 
            responder(['sucesso' => true, 'mensagem' => 'Login realizado!']);
 
        // ------------------------------------------------ PERFIL (dashboard)
        case 'perfil':
            if (empty($_SESSION['id_usuario'])) responder(['sucesso' => false, 'mensagem' => 'Não autenticado.'], 401);
 
            $stmt = $pdo->prepare('SELECT nome, email FROM usuario WHERE id_usuario = ?');
            $stmt->execute([$_SESSION['id_usuario']]);
            $usuario = $stmt->fetch();
 
            if (!$usuario) {
                session_destroy();
                responder(['sucesso' => false, 'mensagem' => 'Não autenticado.'], 401);
            }
 
            $stmt = $pdo->prepare(
                'SELECT id_propriedade AS id, nome, cidade, estado, endereco, area_total, hectares_plantados,
                        cultura_principal, outras_culturas, epoca_plantio, irrigacao, observacoes, latitude, longitude
                 FROM propriedade WHERE id_usuario = ? ORDER BY id_propriedade ASC LIMIT 1'
            );
            $stmt->execute([$_SESSION['id_usuario']]);
            $propriedade = $stmt->fetch() ?: null;
 
            responder(['sucesso' => true, 'usuario' => $usuario, 'propriedade' => $propriedade]);
 
        // ------------------------------------------------ SALVAR LOCALIZAÇÃO (Google Maps)
        case 'salvar_localizacao':
            if (empty($_SESSION['id_usuario'])) responder(['sucesso' => false, 'mensagem' => 'Não autenticado.'], 401);
            $lat = filter_var($entrada['latitude'] ?? null, FILTER_VALIDATE_FLOAT);
            $lng = filter_var($entrada['longitude'] ?? null, FILTER_VALIDATE_FLOAT);
            if ($lat === false || $lng === false || abs($lat) > 90 || abs($lng) > 180) {
                responder(['sucesso' => false, 'mensagem' => 'Coordenadas inválidas.'], 422);
            }
            $pdo->prepare('UPDATE propriedade SET latitude = ?, longitude = ? WHERE id_usuario = ? ORDER BY id_propriedade ASC LIMIT 1')
                ->execute([$lat, $lng, $_SESSION['id_usuario']]);
            responder(['sucesso' => true, 'mensagem' => 'Localização salva!']);
 
        // ------------------------------------------------ LOGOUT
        case 'logout':
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $p = session_get_cookie_params();
                setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
            }
            session_destroy();
            responder(['sucesso' => true]);
 
        default:
            responder(['sucesso' => false, 'mensagem' => 'Ação inválida.'], 400);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log($e->getMessage());
    responder(['sucesso' => false, 'mensagem' => 'Erro no banco de dados. Verifique se o agromap.sql foi importado.'], 500);
}