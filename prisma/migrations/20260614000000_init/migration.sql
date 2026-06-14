BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "default_preferences" (
    "notification_type" TEXT NOT NULL,
    "notification_channel" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "default_preferences_pkey" PRIMARY KEY ("notification_type","notification_channel"),
    CONSTRAINT "check_default_type" CHECK ("notification_type" IN (
      'marketing', 'transaction'
    )),
    CONSTRAINT "check_default_channel" CHECK ("notification_channel" IN (
      'email', 'sms', 'telegram', 'whatsapp', 'max', 'push'
    ))
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" UUID NOT NULL,
    "notification_type" TEXT NOT NULL,
    "notification_channel" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id","notification_type","notification_channel"),
    CONSTRAINT "check_user_type" CHECK ("notification_type" IN (
      'marketing', 'transaction'
    )),
    CONSTRAINT "check_user_channel" CHECK ("notification_channel" IN (
      'email', 'sms', 'telegram', 'whatsapp', 'max', 'push'
    ))
);

-- CreateTable
CREATE TABLE "user_quiet_hours" (
    "user_id" UUID NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quiet_hours_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "global_policies" (
    "notification_type" TEXT NOT NULL,
    "notification_channel" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_policies_pkey" PRIMARY KEY ("notification_type","notification_channel","region"),
    CONSTRAINT "check_policy_type" CHECK ("notification_type" IN (
      'marketing', 'transaction'
    )),
    CONSTRAINT "check_policy_channel" CHECK ("notification_channel" IN (
      'email', 'sms', 'telegram', 'whatsapp', 'max', 'push'
    ))
);

COMMIT;
