<?php
/**
 * ==========================================================
 * PORTAL DE CAPACITACIÓN RR / AS400
 * Instalador de la base de datos (solo línea de comandos)
 *
 * Crea la base, el usuario de la aplicación y las tablas.
 * Nunca se ejecuta desde el navegador: requiere privilegios
 * de administrador, por eso la contraseña de root se recibe
 * por variable de entorno y no se guarda en el repositorio.
 *
 * Uso (PowerShell):
 *   $env:MYSQL_ROOT_PASSWORD = "tu-password"
 *   php api\install.php
 * ==========================================================
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('El instalador solo se ejecuta desde la línea de comandos.');
}

require __DIR__ . '/config.example.php'; // Solo para reutilizar los nombres de base y usuario

/* ---------- 1. Credenciales de administrador ---------- */

$rootPass = getenv('MYSQL_ROOT_PASSWORD');
if ($rootPass === false || $rootPass === '') {
    fwrite(STDERR, "Falta la variable de entorno MYSQL_ROOT_PASSWORD.\n");
    fwrite(STDERR, "PowerShell:  \$env:MYSQL_ROOT_PASSWORD = \"tu-password\"\n");
    exit(1);
}

$appPass = getenv('PB_DB_PASS');
if ($appPass === false || $appPass === '') {
    // Si no se indica, se genera una contraseña aleatoria y se imprime
    $appPass = bin2hex(random_bytes(12));
    $generated = true;
} else {
    $generated = false;
}

function out(string $msg): void
{
    echo $msg . PHP_EOL;
}

try {
    /* ---------- 2. Base de datos y usuario ---------- */

    $root = new PDO(
        sprintf('mysql:host=%s;port=%d;charset=utf8mb4', DB_HOST, DB_PORT),
        'root',
        $rootPass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    out('  [ok] Conexion como root');

    $root->exec(sprintf(
        'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        DB_NAME
    ));
    out(sprintf('  [ok] Base de datos `%s`', DB_NAME));

    $root->exec(sprintf(
        "CREATE USER IF NOT EXISTS '%s'@'localhost' IDENTIFIED BY '%s'",
        DB_USER,
        $appPass
    ));
    $root->exec(sprintf(
        "GRANT ALL PRIVILEGES ON `%s`.* TO '%s'@'localhost'",
        DB_NAME,
        DB_USER
    ));
    $root->exec('FLUSH PRIVILEGES');
    out(sprintf('  [ok] Usuario `%s` con permisos sobre esa base', DB_USER));

    /* ---------- 3. Tablas ---------- */

    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME),
        DB_USER,
        $appPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]
    );

    $sql = file_get_contents(__DIR__ . '/schema.sql');
    if ($sql === false) {
        throw new RuntimeException('No se pudo leer api/schema.sql');
    }

    // El archivo puede traer varios sentencias: se ejecutan una a una
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
        // Quita comentarios de línea para no enviar sentencias vacías
        $statement = trim(preg_replace('/^\s*--.*$/m', '', $statement));
        if ($statement === '') {
            continue;
        }
        $pdo->exec($statement);
    }
    out('  [ok] Tablas `procesos` y `proceso_pasos`');

    $tablas = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    out('  Tablas en la base: ' . implode(', ', $tablas));

    /* ---------- 4. Credenciales para api/config.php ---------- */

    out('');
    out('  Instalacion completada. Copia estos valores en api/config.php:');
    out(sprintf("    const DB_NAME = '%s';", DB_NAME));
    out(sprintf("    const DB_USER = '%s';", DB_USER));
    out(sprintf("    const DB_PASS = '%s';", $appPass));

    if ($generated) {
        out('');
        out('  La contrasena del usuario se genero automaticamente: copiala ahora,');
        out('  no volvera a mostrarse.');
    }
} catch (Throwable $e) {
    fwrite(STDERR, "\n  ERROR: " . $e->getMessage() . "\n");
    exit(1);
}
