-- ==========================================================
-- PORTAL DE CAPACITACIÓN RR / AS400
-- Esquema de la base de datos de procesos
-- Motor: MySQL 8 / MariaDB · Charset: utf8mb4
-- ==========================================================

-- Tabla principal: un proceso con su nombre y descripción
CREATE TABLE IF NOT EXISTS procesos (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(120)    NOT NULL,
  descripcion  TEXT            NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_procesos_nombre (nombre)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Tabla hija: los pasos ordenados de cada proceso
-- ON DELETE CASCADE: al borrar el proceso se borran sus pasos
CREATE TABLE IF NOT EXISTS proceso_pasos (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  proceso_id   INT UNSIGNED    NOT NULL,
  orden        SMALLINT UNSIGNED NOT NULL,
  descripcion  VARCHAR(500)    NOT NULL,
  PRIMARY KEY (id),
  KEY idx_pasos_proceso (proceso_id, orden),
  CONSTRAINT fk_pasos_proceso
    FOREIGN KEY (proceso_id) REFERENCES procesos (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
