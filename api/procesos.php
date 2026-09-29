<?php
/**
 * ==========================================================
 * PORTAL DE CAPACITACIÓN RR / AS400
 * API de procesos (CRUD)
 *
 *   GET    ?action=list        Lista todos los procesos con sus pasos
 *   GET    ?action=get&id=N    Un proceso concreto
 *   POST   {nombre, descripcion, pasos: []}   Crea un proceso
 *   PUT    {id, nombre, descripcion, pasos}   Actualiza un proceso
 *   DELETE ?id=N               Elimina un proceso (y sus pasos en cascada)
 *
 * Respuesta: { "ok": true, "data": ... } | { "ok": false, "error": "..." }
 * ==========================================================
 */

declare(strict_types=1);

require __DIR__ . '/config.php';

header('X-Content-Type-Options: nosniff');

const MAX_PASOS = 40;

try {
    $pdo = db();
} catch (Throwable $e) {
    fail('El servicio de procesos no está disponible. Revisa api/config.php.', 503);
}

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* ---------- Validación de la entrada ---------- */

/**
 * Normaliza nombre, descripción y pasos de un proceso.
 * Devuelve [datos, error].
 */
function validateProcess(array $input): array
{
    $name = trim((string) ($input['nombre'] ?? ''));
    $description = trim((string) ($input['descripcion'] ?? ''));
    $rawSteps = $input['pasos'] ?? [];

    if ($name === '') {
        return [null, 'Escribe un nombre para el proceso.'];
    }
    if (mb_strlen($name) > 120) {
        return [null, 'El nombre no puede superar los 120 caracteres.'];
    }
    if (mb_strlen($description) > 500) {
        return [null, 'La descripción no puede superar los 500 caracteres.'];
    }
    if (!is_array($rawSteps)) {
        return [null, 'La lista de pasos no es válida.'];
    }

    $steps = [];
    foreach ($rawSteps as $raw) {
        $text = trim((string) $raw);
        if ($text === '') {
            continue; // Los pasos vacíos no se guardan
        }
        if (mb_strlen($text) > 500) {
            return [null, 'Cada paso puede tener máximo 500 caracteres.'];
        }
        $steps[] = $text;
    }

    if (count($steps) === 0) {
        return [null, 'Agrega al menos un paso con contenido.'];
    }
    if (count($steps) > MAX_PASOS) {
        return [null, 'Un proceso admite máximo ' . MAX_PASOS . ' pasos.'];
    }

    return [
        ['nombre' => $name, 'descripcion' => $description, 'pasos' => $steps],
        null,
    ];
}

/**
 * Devuelve un proceso con sus pasos ya agrupados.
 */
function findProcess(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT id, nombre, descripcion, created_at, updated_at FROM procesos WHERE id = ?');
    $stmt->execute([$id]);
    $process = $stmt->fetch();

    if (!$process) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT descripcion FROM proceso_pasos WHERE proceso_id = ? ORDER BY orden ASC, id ASC');
    $stmt->execute([$id]);
    $process['pasos'] = array_column($stmt->fetchAll(), 'descripcion');

    return $process;
}

/**
 * Devuelve todos los procesos con sus pasos agrupados en una sola consulta.
 */
function listProcesses(PDO $pdo): array
{
    $rows = $pdo->query(
        'SELECT p.id, p.nombre, p.descripcion, p.created_at, p.updated_at, s.descripcion AS paso
         FROM procesos p
         LEFT JOIN proceso_pasos s ON s.proceso_id = p.id
         ORDER BY p.id DESC, s.orden ASC, s.id ASC'
    )->fetchAll();

    $processes = [];
    foreach ($rows as $row) {
        $id = (int) $row['id'];
        if (!isset($processes[$id])) {
            $processes[$id] = [
                'id'         => $id,
                'nombre'     => $row['nombre'],
                'descripcion' => $row['descripcion'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'pasos'      => [],
            ];
        }
        if ($row['paso'] !== null) {
            $processes[$id]['pasos'][] = $row['paso'];
        }
    }

    return array_values($processes);
}

/**
 * Reemplaza los pasos de un proceso por la lista recibida.
 */
function replaceSteps(PDO $pdo, int $processId, array $steps): void
{
    $delete = $pdo->prepare('DELETE FROM proceso_pasos WHERE proceso_id = ?');
    $delete->execute([$processId]);

    $insert = $pdo->prepare('INSERT INTO proceso_pasos (proceso_id, orden, descripcion) VALUES (?, ?, ?)');
    foreach (array_values($steps) as $index => $text) {
        $insert->execute([$processId, $index + 1, $text]);
    }
}

/* ---------- Enrutado ---------- */

try {
    switch ($action) {
        /* Listar todos */
        case 'list':
            if ($method !== 'GET') {
                fail('Método no permitido.', 405);
            }
            respond(['ok' => true, 'data' => listProcesses($pdo)]);

        // no break: respond() termina la ejecución

        /* Obtener uno */
        case 'get':
            if ($method !== 'GET') {
                fail('Método no permitido.', 405);
            }
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                fail('Falta el id del proceso.');
            }
            $process = findProcess($pdo, $id);
            if (!$process) {
                fail('El proceso no existe.', 404);
            }
            respond(['ok' => true, 'data' => $process]);

        // no break

        /* Crear */
        case 'create':
            if ($method !== 'POST') {
                fail('Método no permitido.', 405);
            }
            [$data, $error] = validateProcess(readJsonBody());
            if ($error !== null) {
                fail($error);
            }

            $pdo->beginTransaction();
            $insert = $pdo->prepare('INSERT INTO procesos (nombre, descripcion) VALUES (?, ?)');
            $insert->execute([$data['nombre'], $data['descripcion']]);
            $newId = (int) $pdo->lastInsertId();
            replaceSteps($pdo, $newId, $data['pasos']);
            $pdo->commit();

            respond(['ok' => true, 'data' => findProcess($pdo, $newId)], 201);

        // no break

        /* Actualizar */
        case 'update':
            if ($method !== 'PUT') {
                fail('Método no permitido.', 405);
            }
            $body = readJsonBody();
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id) {
                fail('Falta el id del proceso a actualizar.');
            }
            if (!findProcess($pdo, $id)) {
                fail('El proceso no existe.', 404);
            }
            [$data, $error] = validateProcess($body);
            if ($error !== null) {
                fail($error);
            }

            $pdo->beginTransaction();
            $update = $pdo->prepare('UPDATE procesos SET nombre = ?, descripcion = ? WHERE id = ?');
            $update->execute([$data['nombre'], $data['descripcion'], $id]);
            replaceSteps($pdo, $id, $data['pasos']);
            $pdo->commit();

            respond(['ok' => true, 'data' => findProcess($pdo, $id)]);

        // no break

        /* Eliminar */
        case 'delete':
            if ($method !== 'DELETE') {
                fail('Método no permitido.', 405);
            }
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                fail('Falta el id del proceso a eliminar.');
            }
            if (!findProcess($pdo, $id)) {
                fail('El proceso no existe.', 404);
            }
            // Los pasos se borran en cascada (FK ON DELETE CASCADE)
            $delete = $pdo->prepare('DELETE FROM procesos WHERE id = ?');
            $delete->execute([$id]);

            respond(['ok' => true, 'data' => ['id' => $id]]);

        // no break

        default:
            fail('Acción no reconocida.', 404);
    }
} catch (PDOException $e) {
    error_log('DB error: ' . $e->getMessage());
    fail('Error de base de datos. Intenta de nuevo.', 500);
} catch (Throwable $e) {
    error_log('API error: ' . $e->getMessage());
    fail('Error inesperado en el servidor.', 500);
}
