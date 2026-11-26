CREATE TABLE "TrackingRateLimit" (
    "key" VARCHAR(64) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "TrackingRateLimit_pkey" PRIMARY KEY ("key"),
    CONSTRAINT "TrackingRateLimit_count_positive" CHECK ("count" > 0)
);

CREATE INDEX "TrackingRateLimit_expiresAt_idx" ON "TrackingRateLimit"("expiresAt");
