-- CreateEnum
CREATE TYPE "BookingChannel" AS ENUM ('ONLINE', 'COUNTER');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "channel" "BookingChannel" NOT NULL DEFAULT 'ONLINE';
