/*
  Warnings:

  - You are about to drop the `StockTyre` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tyre` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ActivityTyre] DROP CONSTRAINT [ActivityTyre_installedTyreId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[ActivityTyre] DROP CONSTRAINT [ActivityTyre_removedTyreId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[StockTyre] DROP CONSTRAINT [StockTyre_merkId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[StockTyre] DROP CONSTRAINT [StockTyre_tyreSizeId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Tyre] DROP CONSTRAINT [Tyre_installedUnitId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Tyre] DROP CONSTRAINT [Tyre_removedPurposeId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Tyre] DROP CONSTRAINT [Tyre_stockTyreId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre1Id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre2Id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre3Id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre4Id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre5Id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre6Id_fkey];

-- DropTable
DROP TABLE [dbo].[StockTyre];

-- DropTable
DROP TABLE [dbo].[Tyre];

-- CreateTable
CREATE TABLE [dbo].[stockTyres] (
    [id] INT NOT NULL IDENTITY(1,1),
    [serialNumber] NVARCHAR(1000) NOT NULL,
    [merkId] INT NOT NULL,
    [type] NVARCHAR(1000),
    [pattern] NVARCHAR(1000),
    [otd] INT,
    [price] INT,
    [tyreSizeId] INT NOT NULL,
    CONSTRAINT [stockTyres_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [stockTyres_serialNumber_key] UNIQUE NONCLUSTERED ([serialNumber])
);

-- CreateTable
CREATE TABLE [dbo].[tyres] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tread1] FLOAT(53),
    [tread2] FLOAT(53),
    [isInstalled] BIT NOT NULL CONSTRAINT [tyres_isInstalled_df] DEFAULT 0,
    [isReady] BIT NOT NULL CONSTRAINT [tyres_isReady_df] DEFAULT 0,
    [isScrap] BIT NOT NULL CONSTRAINT [tyres_isScrap_df] DEFAULT 0,
    [positionTyre] INT,
    [installedUnitId] INT,
    [removedPurposeId] INT,
    [stockTyreId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [tyres_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [tyres_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [tyres_stockTyreId_key] UNIQUE NONCLUSTERED ([stockTyreId]),
    CONSTRAINT [tyres_installedUnitId_positionTyre_key] UNIQUE NONCLUSTERED ([installedUnitId],[positionTyre])
);

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_removedTyreId_fkey] FOREIGN KEY ([removedTyreId]) REFERENCES [dbo].[tyres]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_installedTyreId_fkey] FOREIGN KEY ([installedTyreId]) REFERENCES [dbo].[tyres]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre1Id_fkey] FOREIGN KEY ([tyre1Id]) REFERENCES [dbo].[tyres]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre2Id_fkey] FOREIGN KEY ([tyre2Id]) REFERENCES [dbo].[tyres]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre3Id_fkey] FOREIGN KEY ([tyre3Id]) REFERENCES [dbo].[tyres]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre4Id_fkey] FOREIGN KEY ([tyre4Id]) REFERENCES [dbo].[tyres]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre5Id_fkey] FOREIGN KEY ([tyre5Id]) REFERENCES [dbo].[tyres]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre6Id_fkey] FOREIGN KEY ([tyre6Id]) REFERENCES [dbo].[tyres]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stockTyres] ADD CONSTRAINT [stockTyres_merkId_fkey] FOREIGN KEY ([merkId]) REFERENCES [dbo].[Merk]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[stockTyres] ADD CONSTRAINT [stockTyres_tyreSizeId_fkey] FOREIGN KEY ([tyreSizeId]) REFERENCES [dbo].[TyreSize]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tyres] ADD CONSTRAINT [tyres_stockTyreId_fkey] FOREIGN KEY ([stockTyreId]) REFERENCES [dbo].[stockTyres]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tyres] ADD CONSTRAINT [tyres_installedUnitId_fkey] FOREIGN KEY ([installedUnitId]) REFERENCES [dbo].[Unit]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tyres] ADD CONSTRAINT [tyres_removedPurposeId_fkey] FOREIGN KEY ([removedPurposeId]) REFERENCES [dbo].[RemovePurpose]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
