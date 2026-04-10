-- CreateEnum
CREATE TYPE "Role" AS ENUM ('pending', 'owner', 'driver', 'student', 'admin');

-- CreateEnum
CREATE TYPE "OwnerStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('morning', 'return');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('scheduled', 'active', 'completed');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "phone_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'pending',
    "fcm_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("phone_number")
);

-- CreateTable
CREATE TABLE "owners" (
    "phone_number" TEXT NOT NULL,
    "bus_logo" TEXT,
    "home_town" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "OwnerStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("phone_number")
);

-- CreateTable
CREATE TABLE "drivers" (
    "phone_number" TEXT NOT NULL,
    "home_town" TEXT,
    "owner_phone" TEXT NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("phone_number")
);

-- CreateTable
CREATE TABLE "destinations" (
    "destination_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "owner_phone" TEXT,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("destination_id")
);

-- CreateTable
CREATE TABLE "students" (
    "phone_number" TEXT NOT NULL,
    "destination_id" INTEGER,
    "home_address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "owner_phone" TEXT,

    CONSTRAINT "students_pkey" PRIMARY KEY ("phone_number")
);

-- CreateTable
CREATE TABLE "buses" (
    "bus_id" SERIAL NOT NULL,
    "bus_name" TEXT,
    "capacity" INTEGER NOT NULL,
    "owner_phone" TEXT NOT NULL,

    CONSTRAINT "buses_pkey" PRIMARY KEY ("bus_id")
);

-- CreateTable
CREATE TABLE "trips" (
    "trip_id" SERIAL NOT NULL,
    "bus_id" INTEGER,
    "driver_phone" TEXT,
    "destination_id" INTEGER,
    "pickup_time" TEXT,
    "dropoff_time" TEXT,
    "date" DATE,
    "type" "TripType",
    "status" "TripStatus" NOT NULL DEFAULT 'scheduled',
    "schedule" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("trip_id")
);

-- CreateTable
CREATE TABLE "students_assignment" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "student_phone" TEXT NOT NULL,

    CONSTRAINT "students_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "student_phone" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_weekly_schedules" (
    "id" SERIAL NOT NULL,
    "student_phone" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "morning_time" TEXT,
    "return_time" TEXT,
    "attendance_morning" BOOLEAN NOT NULL DEFAULT true,
    "attendance_return" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "student_weekly_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_schedule_overrides" (
    "id" SERIAL NOT NULL,
    "student_phone" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "override_morning_time" TEXT,
    "override_return_time" TEXT,
    "attendance_morning" BOOLEAN NOT NULL DEFAULT true,
    "attendance_return" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "student_schedule_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students_join_requests" (
    "req_id" SERIAL NOT NULL,
    "owner_phone" TEXT NOT NULL,
    "user_phone" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "req_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_join_requests_pkey" PRIMARY KEY ("req_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_phone" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "type" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "chat_id" TEXT NOT NULL,
    "participant_1_phone" TEXT NOT NULL,
    "participant_2_phone" TEXT NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "chat_id" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "message_text" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_requests" (
    "id" SERIAL NOT NULL,
    "user_phone" TEXT NOT NULL,
    "role" TEXT,
    "location" TEXT,
    "destination" TEXT,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride_requests" (
    "id" SERIAL NOT NULL,
    "user_phone" TEXT NOT NULL,
    "role" TEXT,
    "location" TEXT,
    "destination" TEXT,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_assignment_trip_id_student_phone_key" ON "students_assignment"("trip_id", "student_phone");

-- CreateIndex
CREATE UNIQUE INDEX "payments_trip_id_student_phone_key" ON "payments"("trip_id", "student_phone");

-- CreateIndex
CREATE UNIQUE INDEX "student_weekly_schedules_student_phone_day_of_week_key" ON "student_weekly_schedules"("student_phone", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "student_schedule_overrides_student_phone_date_key" ON "student_schedule_overrides"("student_phone", "date");

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_phone_number_fkey" FOREIGN KEY ("phone_number") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_phone_number_fkey" FOREIGN KEY ("phone_number") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_owner_phone_fkey" FOREIGN KEY ("owner_phone") REFERENCES "owners"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_owner_phone_fkey" FOREIGN KEY ("owner_phone") REFERENCES "owners"("phone_number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_phone_number_fkey" FOREIGN KEY ("phone_number") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("destination_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_owner_phone_fkey" FOREIGN KEY ("owner_phone") REFERENCES "owners"("phone_number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_owner_phone_fkey" FOREIGN KEY ("owner_phone") REFERENCES "owners"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("bus_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_phone_fkey" FOREIGN KEY ("driver_phone") REFERENCES "users"("phone_number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("destination_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_assignment" ADD CONSTRAINT "students_assignment_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_assignment" ADD CONSTRAINT "students_assignment_student_phone_fkey" FOREIGN KEY ("student_phone") REFERENCES "students"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_phone_fkey" FOREIGN KEY ("student_phone") REFERENCES "students"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_weekly_schedules" ADD CONSTRAINT "student_weekly_schedules_student_phone_fkey" FOREIGN KEY ("student_phone") REFERENCES "students"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_schedule_overrides" ADD CONSTRAINT "student_schedule_overrides_student_phone_fkey" FOREIGN KEY ("student_phone") REFERENCES "students"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_join_requests" ADD CONSTRAINT "students_join_requests_owner_phone_fkey" FOREIGN KEY ("owner_phone") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_join_requests" ADD CONSTRAINT "students_join_requests_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_participant_1_phone_fkey" FOREIGN KEY ("participant_1_phone") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_participant_2_phone_fkey" FOREIGN KEY ("participant_2_phone") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_phone_fkey" FOREIGN KEY ("sender_phone") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_requests" ADD CONSTRAINT "availability_requests_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;
