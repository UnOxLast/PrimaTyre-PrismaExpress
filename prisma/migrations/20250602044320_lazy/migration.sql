/*
  Warnings:

  - You are about to drop the column `unitId` on the `UnitTyreAmount` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[UnitTyreAmount] DROP CONSTRAINT [UnitTyreAmount_unitId_fkey];

-- DropIndex
ALTER TABLE [dbo].[UnitTyreAmount] DROP CONSTRAINT [UnitTyreAmount_unitId_key];

-- AlterTable
ALTER TABLE [dbo].[Unit] ADD [unitTyreAmountId] INT;

-- AlterTable
ALTER TABLE [dbo].[UnitTyreAmount] DROP COLUMN [unitId];

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_unitTyreAmountId_fkey] FOREIGN KEY ([unitTyreAmountId]) REFERENCES [dbo].[UnitTyreAmount]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
