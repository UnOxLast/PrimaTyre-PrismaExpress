/*
  Warnings:

  - You are about to drop the column `dateTimeUpdate` on the `Tyre` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Tyre] DROP COLUMN [dateTimeUpdate];
ALTER TABLE [dbo].[Tyre] ADD [dateTimeWork] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
