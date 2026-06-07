-- Consolidate employee leave requests into the canonical LeaveRequest table.
ALTER TABLE "LeaveRequest"
  ADD COLUMN "subject" TEXT,
  ADD COLUMN "reviewedById" TEXT;

ALTER TABLE "EmployeeAbsence"
  DROP CONSTRAINT IF EXISTS "EmployeeAbsence_leaveRequestId_fkey";

INSERT INTO "LeaveRequest" (
  "id",
  "employeeId",
  "startAt",
  "endAt",
  "subject",
  "reason",
  "status",
  "reviewedById",
  "reviewedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  legacy."id",
  legacy."employeeId",
  legacy."startDate",
  COALESCE(legacy."endDate", legacy."startDate"),
  legacy."subject",
  COALESCE(NULLIF(legacy."reason", ''), legacy."subject"),
  CASE
    WHEN legacy."status"::text = 'ACCEPTED' THEN 'APPROVED'::"LeaveRequestStatus"
    WHEN legacy."status"::text = 'REFUSED' THEN 'REJECTED'::"LeaveRequestStatus"
    ELSE legacy."status"
  END,
  legacy."reviewedById",
  legacy."reviewedAt",
  legacy."requestDate",
  legacy."updatedAt"
FROM "EmployeeLeaveRequest" legacy
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "LeaveRequest"
  ADD CONSTRAINT "LeaveRequest_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "LeaveRequest_reviewedById_idx"
  ON "LeaveRequest"("reviewedById");

ALTER TABLE "EmployeeAbsence"
  ADD CONSTRAINT "EmployeeAbsence_leaveRequestId_fkey"
  FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE "EmployeeLeaveRequest";

-- Normalize the status vocabulary after legacy records have been copied.
UPDATE "LeaveRequest"
SET "status" = 'APPROVED'
WHERE "status"::text = 'ACCEPTED';

UPDATE "LeaveRequest"
SET "status" = 'REJECTED'
WHERE "status"::text = 'REFUSED';

ALTER TABLE "LeaveRequest"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE TEXT USING "status"::text;

DROP TYPE "LeaveRequestStatus";
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "LeaveRequest"
  ALTER COLUMN "status" TYPE "LeaveRequestStatus"
  USING "status"::"LeaveRequestStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Copy legacy salon schedules before removing their storage.
INSERT INTO "SalonOpeningHour" (
  "id",
  "salonId",
  "dayOfWeek",
  "isOpen",
  "startTime",
  "endTime",
  "createdAt",
  "updatedAt"
)
SELECT
  schedule."id",
  schedule."salonId",
  schedule."dayOfWeek",
  schedule."isOpen",
  schedule."startTime",
  schedule."endTime",
  schedule."createdAt",
  schedule."updatedAt"
FROM "SalonSchedule" schedule
WHERE NOT EXISTS (
  SELECT 1
  FROM "SalonOpeningHour" opening
  WHERE opening."salonId" = schedule."salonId"
    AND opening."dayOfWeek" = schedule."dayOfWeek"
);

-- Preserve the oldest JSON schedule format when no canonical row exists.
INSERT INTO "SalonOpeningHour" (
  "id",
  "salonId",
  "dayOfWeek",
  "isOpen",
  "startTime",
  "endTime",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-json-' || md5(salon."id" || '-' || hours.day_index::text),
  salon."id",
  hours.day_index,
  NOT COALESCE((hours.value->>'closed')::boolean, false),
  COALESCE(hours.value->>'open', '09:00'),
  COALESCE(hours.value->>'close', '18:00'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Salon" salon
CROSS JOIN LATERAL (
  SELECT
    value,
    CASE value->>'day'
      WHEN 'Dimanche' THEN 0
      WHEN 'Lundi' THEN 1
      WHEN 'Mardi' THEN 2
      WHEN 'Mercredi' THEN 3
      WHEN 'Jeudi' THEN 4
      WHEN 'Vendredi' THEN 5
      WHEN 'Samedi' THEN 6
      ELSE NULL
    END AS day_index
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(salon."openingHoursJson") = 'array'
        THEN salon."openingHoursJson"
      ELSE '[]'::jsonb
    END
  )
) hours
WHERE hours.day_index IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "SalonOpeningHour" opening
    WHERE opening."salonId" = salon."id"
      AND opening."dayOfWeek" = hours.day_index
  );

DROP TABLE "SalonSchedule";
ALTER TABLE "Salon" DROP COLUMN "openingHoursJson";
