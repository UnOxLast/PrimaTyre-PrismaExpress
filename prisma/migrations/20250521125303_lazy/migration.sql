BEGIN TRY

BEGIN TRAN;

-- AddForeignKey
ALTER TABLE [dbo].[Tyre] ADD CONSTRAINT [Tyre_stockTyreId_fkey] FOREIGN KEY ([stockTyreId]) REFERENCES [dbo].[StockTyre]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tyre] ADD CONSTRAINT [Tyre_installedUnitId_fkey] FOREIGN KEY ([installedUnitId]) REFERENCES [dbo].[Unit]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tyre] ADD CONSTRAINT [Tyre_removedPurposeId_fkey] FOREIGN KEY ([removedPurposeId]) REFERENCES [dbo].[RemovePurpose]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
