/*
  Warnings:

  - You are about to drop the column `removePurpose` on the `InspectionTyre` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[InspectionTyre] DROP COLUMN [removePurpose];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
