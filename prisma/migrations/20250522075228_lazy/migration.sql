/*
  Warnings:

  - You are about to drop the column `otd` on the `stockTyres` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[stockTyres] DROP COLUMN [otd];
ALTER TABLE [dbo].[stockTyres] ADD [otd1] INT,
[otd2] INT;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
