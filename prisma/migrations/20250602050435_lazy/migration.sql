/*
  Warnings:

  - You are about to drop the column `jumlahBan` on the `UnitTyreAmount` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[amount]` on the table `UnitTyreAmount` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `UnitTyreAmount` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[UnitTyreAmount] DROP COLUMN [jumlahBan];
ALTER TABLE [dbo].[UnitTyreAmount] ADD [amount] INT NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[UnitTyreAmount] ADD CONSTRAINT [UnitTyreAmount_amount_key] UNIQUE NONCLUSTERED ([amount]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
