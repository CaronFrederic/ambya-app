DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminScope') THEN
        CREATE TYPE "AdminScope" AS ENUM ('SUPER_ADMIN', 'SUPPORT', 'OPS');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "scope" "AdminScope" NOT NULL DEFAULT 'SUPPORT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "actorUserId" TEXT,
    "actorRole" "UserRole",
    "actorAdminScope" "AdminScope",
    "requestId" TEXT,
    "route" TEXT,
    "method" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminProfile_userId_key" ON "AdminProfile"("userId");
CREATE INDEX IF NOT EXISTS "AdminProfile_scope_idx" ON "AdminProfile"("scope");
CREATE INDEX IF NOT EXISTS "AuditLog_actionType_createdAt_idx" ON "AuditLog"("actionType", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_createdAt_idx" ON "AuditLog"("entityType", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'AdminProfile_userId_fkey'
    ) THEN
        ALTER TABLE "AdminProfile"
        ADD CONSTRAINT "AdminProfile_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'AuditLog_actorUserId_fkey'
    ) THEN
        ALTER TABLE "AuditLog"
        ADD CONSTRAINT "AuditLog_actorUserId_fkey"
        FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
