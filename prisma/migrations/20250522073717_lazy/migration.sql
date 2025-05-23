/*
  Warnings:

  - You are about to drop the column `brand` on the `InspectionTyre` table. All the data in the column will be lost.
  - You are about to drop the column `pattern` on the `InspectionTyre` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `InspectionTyre` table. All the data in the column will be lost.
  - You are about to drop the column `serialNumber` on the `InspectionTyre` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `InspectionTyre` table. All the data in the column will be lost.
  - You are about to drop the column `unitNumber` on the `InspectionTyre` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[InspectionTyre] DROP COLUMN [brand],
[pattern],
[position],
[serialNumber],
[size],
[unitNumber];
ALTER TABLE [dbo].[InspectionTyre] ADD [positionTyre] INT,
[unitId] INT;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
