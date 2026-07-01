-- Make password nullable (OAuth users don't have a password)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Add googleId for Google OAuth
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
