-- AlterTable
ALTER TABLE "public"."Otp" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Otp_otpExpiry_idx" ON "public"."Otp"("otpExpiry");

-- CreateIndex
CREATE INDEX "VerificationToken_tokenExpiry_idx" ON "public"."VerificationToken"("tokenExpiry");
