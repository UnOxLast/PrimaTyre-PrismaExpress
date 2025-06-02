BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[UnitTyrePosition] DROP CONSTRAINT [UnitTyrePosition_tyreId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[UnitTyrePosition] DROP CONSTRAINT [UnitTyrePosition_unitId_fkey];

-- AlterTable
ALTER TABLE [dbo].[UnitTyrePosition] ALTER COLUMN [unitId] INT NULL;
ALTER TABLE [dbo].[UnitTyrePosition] ALTER COLUMN [tyreId] INT NULL;
ALTER TABLE [dbo].[UnitTyrePosition] ALTER COLUMN [position] INT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[UnitTyrePosition] ADD CONSTRAINT [UnitTyrePosition_unitId_fkey] FOREIGN KEY ([unitId]) REFERENCES [dbo].[Unit]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UnitTyrePosition] ADD CONSTRAINT [UnitTyrePosition_tyreId_fkey] FOREIGN KEY ([tyreId]) REFERENCES [dbo].[Tyre]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
