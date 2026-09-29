<?php
/**
 * ==========================================================
 * PORTAL DE CAPACITACIÓN RR / AS400
 * Configuración de la base de datos
 *
 * Este archivo contiene credenciales: NO debe subirse al
 * repositorio (está en .gitignore). Copia config.example.php
 * hacia config.php y ajusta los valores.
 * ==========================================================
 */

declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_PORT = 3306;
const DB_NAME = 'capacitacion_rr';
const DB_USER = 'capacitacion_rr';
const DB_PASS = 'CAMBIA_ESTE_VALOR';

/**
 * Conexión PDO reutilizable (singleton por petición).
 */
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        // No se filtra el detalle de la conexión al navegador
        error_log('DB connection error: ' . $e->getMessage());
        throw new RuntimeException('No se pudo conectar con la base de datos.');
    }

    return $pdo;
}

/**
 * Responde con JSON y termina la ejecución.
 */
function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Responde con un error controlado.
 */
function fail(string $message, int $status = 400): void
{
    respond(['ok' => false, 'error' => $message], $status);
}

/**
 * Lee y valida el cuerpo JSON de la petición.
 */
function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        fail('Cuerpo de la petición vacío.');
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        fail('El cuerpo de la petición no es JSON válido.');
    }

    return $data;
}
