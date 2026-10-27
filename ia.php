<?php
// Agro IA: ponte segura entre o site e a API da Groq (a chave nunca vai para o navegador).
session_start();
header('Content-Type: application/json; charset=utf-8');

const MODELO = 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// A chave vem da variável de ambiente GROQ_API_KEY ou do arquivo config.local.php (fora do Git).
$chave = getenv('GROQ_API_KEY') ?: '';
if ($chave === '' && is_file(__DIR__ . '/config.local.php')) {
    $cfg = require __DIR__ . '/config.local.php';
    $chave = is_array($cfg) ? trim((string)($cfg['GROQ_API_KEY'] ?? '')) : '';
}

function sai($ok, $campo, $txt, $code = 200) {
    http_response_code($code);
    echo json_encode(['sucesso' => $ok, $campo => $txt], JSON_UNESCAPED_UNICODE);
    exit;
}

if (empty($_SESSION['id_usuario'])) sai(false, 'mensagem', 'Faça login para usar a IA.', 401);
if ($chave === '') sai(false, 'mensagem', 'A IA ainda não foi configurada: crie o arquivo config.local.php com sua chave da Groq.', 503);

$in = json_decode(file_get_contents('php://input'), true);
$msgs = [];
foreach (array_slice($in['mensagens'] ?? [], -10) as $m) {
    if (in_array($m['role'] ?? '', ['user', 'assistant'], true) && is_string($m['content'] ?? null)) {
        $msgs[] = ['role' => $m['role'], 'content' => mb_substr($m['content'], 0, 2000)];
    }
}
if (!$msgs || end($msgs)['role'] !== 'user') sai(false, 'mensagem', 'Mensagem inválida.', 422);

$ctx = mb_substr(json_encode($in['contexto'] ?? new stdClass, JSON_UNESCAPED_UNICODE), 0, 6000);
$system = "Você é o Agro IA, assistente do AgroMap, plataforma de gestão rural para produtores brasileiros. "
 . "Responda em português do Brasil, com linguagem simples, direta e prática, em no máximo 180 palavras. "
 . "Use os dados do produtor abaixo (propriedade, clima atual, última simulação e perdas); não invente números que não estejam nos dados. "
 . "Quando faltar informação, diga o que falta. Em decisões de manejo, insumos ou defensivos, lembre de validar com um engenheiro agrônomo.\n\nDADOS DO PRODUTOR (JSON):\n" . $ctx;

// Groq usa o formato OpenAI (chat/completions): o "system" vai como primeira mensagem.
array_unshift($msgs, ['role' => 'system', 'content' => $system]);

$ch = curl_init(GROQ_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 40,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $chave],
    CURLOPT_POSTFIELDS => json_encode([
        'model' => MODELO,
        'messages' => $msgs,
        'max_completion_tokens' => 1500, // o gpt-oss é um modelo de raciocínio: parte dos tokens vai para o "pensamento"
        'reasoning_effort' => 'low',
        'temperature' => 0.4,
    ]),
]);
$resp = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$erroCurl = curl_error($ch);
curl_close($ch);

if ($resp === false) {
    error_log('Agro IA curl: ' . $erroCurl);
    sai(false, 'mensagem', 'Não consegui conectar à Groq. Verifique sua internet e o cURL/SSL do PHP.', 502);
}

$d = json_decode((string)$resp, true);
$texto = trim((string)($d['choices'][0]['message']['content'] ?? ''));
if ($status !== 200 || $texto === '') {
    error_log('Agro IA erro ' . $status . ': ' . $resp);
    $msg = $status === 401 ? 'Chave da Groq inválida ou revogada.' : ($status === 429 ? 'Limite de uso da Groq atingido. Tente em instantes.' : 'A IA não respondeu agora. Tente novamente.');
    sai(false, 'mensagem', $msg, 502);
}
sai(true, 'resposta', $texto);
