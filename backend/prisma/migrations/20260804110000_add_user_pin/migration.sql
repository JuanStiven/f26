-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "pin" TEXT;

-- Backfill: usuarios legacy guardaban su PIN/contraseña en `password`
-- Copiamos el hash existente a `pin` para que el acceso móvil (cédula + PIN) siga funcionando.
UPDATE "users" SET "pin" = "password" WHERE "pin" IS NULL;
