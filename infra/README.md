# Infraestructura — Fase 0

Stack: **Caddy** (proxy reverso + TLS interno) · **Directus** (API + panel) · **PostgreSQL**.

## Operación básica

```bash
cp .env.example .env      # primera vez: completar secretos
#   openssl rand -hex 32  → DIRECTUS_KEY / DIRECTUS_SECRET

docker compose up -d       # arrancar
docker compose ps          # estado (esperar "healthy")
docker compose logs -f directus
docker compose down        # parar (los datos persisten en volúmenes)
```

## Primer despliegue (volumen de uploads)

Directus corre como usuario `node` (uid 1000) pero Docker crea el volumen
`directus_data` como `root`. Si no se corrige, Directus avisa
`Upload directory (/datadir) is not read/writeable!` y falla la subida de archivos:

```bash
docker volume create comandosrr_directus_data
docker run --rm -v comandosrr_directus_data:/d alpine chown -R 1000:1000 /d
docker compose up -d
```

## Backup y restore

```bash
./infra/backup.sh                  # → backups/db-<fecha>.sql + uploads-<fecha>.tar.gz
./infra/restore.sh backups/db-…    # ⚠ sobrescribe la BD (pide confirmación)
```

El backup debe copiarse a **otro disco o NAS**: un backup en el mismo servidor no
protege contra fallas del equipo. Restauración de prueba (drill) recomendada al
menos una vez por mes.

## Restricciones conocidas

- **Email del admin:** debe usar un TLD real (`.co`, `.com`…). Joi 18 de Directus
  rechaza dominios como `.local` y el bootstrap falla.
- **Healthcheck:** usar `/server/ping` (devuelve 200). `/server/health` responde
  **403** en Directus 12.
- **Puertos publicados:** un servicio solo conectado a redes `internal: true`
  no publica puertos en el host. `directus` debe estar también en la red
  `frontend` para que funcione el mapeo `127.0.0.1:8056`.
- **Puerto Directus:** `127.0.0.1` únicamente (el acceso externo es por Caddy).
  En local el 8055 puede estar ocupado por otro proyecto → `DIRECTUS_PORT=8056`.

## Checklist con TI (pendiente — producción)

- [ ] Docker habilitado y ≥2 GB RAM libres
- [ ] Puertos 80/443 disponibles
- [ ] DNS interno: `portal.rr.local`
- [ ] Certificado: CA de la empresa (hoy `tls internal`, auto-firmado)
- [ ] Destino del backup (NAS/otro disco)
- [ ] Quién aplica los upgrades de Directus
