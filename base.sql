-- ═══════════════════════════════════════════════════════════════
--  Chat React — Schéma PostgreSQL complet
--  Généré pour : chat-react-plateforme-de-jeu
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════
--  TABLE Users
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Users" (
  id             SERIAL PRIMARY KEY,
  username       VARCHAR(255) NOT NULL UNIQUE,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,
  role           VARCHAR(20) NOT NULL DEFAULT 'membre',
  online         BOOLEAN NOT NULL DEFAULT FALSE,
  muted          BOOLEAN NOT NULL DEFAULT FALSE,
  "mutedUntil"   TIMESTAMP WITH TIME ZONE,
  "mutedReason"  VARCHAR(255) NOT NULL DEFAULT '',
  banned         BOOLEAN NOT NULL DEFAULT FALSE,
  "bannedReason" VARCHAR(255) NOT NULL DEFAULT '',
  "unoWins"      INTEGER NOT NULL DEFAULT 0,
  "chessWins"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "Users_role_check" CHECK (role IN ('membre', 'admin'))
);

-- ═══════════════════════════════════════════════════════════════
--  TABLE Rooms
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Rooms" (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL UNIQUE,
  description   VARCHAR(255) NOT NULL DEFAULT '',
  "createdById" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
--  TABLE Messages
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Messages" (
  id            SERIAL PRIMARY KEY,
  content       TEXT NOT NULL,
  type          VARCHAR(20) NOT NULL DEFAULT 'text',
  "senderId"    INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "receiverId"  INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
  "roomId"      INTEGER REFERENCES "Rooms"(id) ON DELETE CASCADE,
  "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "Messages_type_check" CHECK (type IN ('text', 'emoji', 'system'))
);

-- ═══════════════════════════════════════════════════════════════
--  TABLE Documents
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Documents" (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  url            VARCHAR(255) NOT NULL,
  size           INTEGER,
  mimetype       VARCHAR(100),
  "uploadedById" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  "roomId"       INTEGER REFERENCES "Rooms"(id) ON DELETE CASCADE,
  "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
--  TABLE BanList
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "BanList" (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255),
  reason      VARCHAR(255) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
--  TABLE RoomMembers
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "RoomMembers" (
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "userId"    INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "roomId"    INTEGER NOT NULL REFERENCES "Rooms"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY ("userId", "roomId")
);

-- ═══════════════════════════════════════════════════════════════
--  INDEX
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS "idx_messages_room"
  ON "Messages" ("roomId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_messages_sender_receiver"
  ON "Messages" ("senderId", "receiverId", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_messages_createdat"
  ON "Messages" ("createdAt");

CREATE INDEX IF NOT EXISTS "idx_documents_uploadedby"
  ON "Documents" ("uploadedById");

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "Users" (email);
CREATE INDEX IF NOT EXISTS "idx_users_username" ON "Users" (username);

-- ═══════════════════════════════════════════════════════════════
--  DONNÉES INITIALES
-- ═══════════════════════════════════════════════════════════════
INSERT INTO "Rooms" (name, description)
VALUES ('general', 'Salon principal')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 'Users'     AS table_name, COUNT(*) FROM "Users"
UNION ALL
SELECT 'Rooms',     COUNT(*) FROM "Rooms"
UNION ALL
SELECT 'Messages',  COUNT(*) FROM "Messages"
UNION ALL
SELECT 'Documents', COUNT(*) FROM "Documents"
UNION ALL
SELECT 'BanList',   COUNT(*) FROM "BanList";

-- 1. Repère les doublons existants
SELECT LOWER(email) AS e, COUNT(*)
FROM "Users"
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- 2. Supprime les doublons (garde l'id le plus petit)
DELETE FROM "Users" a
USING "Users" b
WHERE a.id > b.id
  AND LOWER(a.email) = LOWER(b.email);

-- 3. Normalise tous les emails restants
UPDATE "Users" SET email = LOWER(TRIM(email));

-- 4. Recrée la contrainte UNIQUE sur email
ALTER TABLE "Users" DROP CONSTRAINT IF EXISTS "Users_email_key";
ALTER TABLE "Users" ADD CONSTRAINT "Users_email_key" UNIQUE (email);

-- 5. (Recommandé) Index unique insensible à la casse : défense en profondeur
CREATE UNIQUE INDEX IF NOT EXISTS users_email_ci_unique
ON "Users" (LOWER(email));
