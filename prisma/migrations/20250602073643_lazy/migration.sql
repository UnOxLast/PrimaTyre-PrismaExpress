BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[UnitTyrePosition] DROP CONSTRAINT [UnitTyrePosition_unitId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Tyre] ADD [siteId] INT;

-- AddForeignKey
ALTER TABLE [dbo].[Tyre] ADD CONSTRAINT [Tyre_siteId_fkey] FOREIGN KEY ([siteId]) REFERENCES [dbo].[Site]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UnitTyrePosition] ADD CONSTRAINT [UnitTyrePosition_unitId_fkey] FOREIGN KEY ([unitId]) REFERENCES [dbo].[Unit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
