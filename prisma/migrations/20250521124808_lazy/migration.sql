BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ActivityTyre] DROP CONSTRAINT [ActivityTyre_installedTyreId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[ActivityTyre] DROP CONSTRAINT [ActivityTyre_removedTyreId_fkey];

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

-- RedefineTables
BEGIN TRANSACTION;
ALTER TABLE [dbo].[Tyre] DROP CONSTRAINT [Tyre_installedUnitId_positionTyre_key];
ALTER TABLE [dbo].[Tyre] DROP CONSTRAINT [Tyre_stockTyreId_key];
DECLARE @SQL NVARCHAR(MAX) = N''
SELECT @SQL += N'ALTER TABLE '
    + QUOTENAME(OBJECT_SCHEMA_NAME(PARENT_OBJECT_ID))
    + '.'
    + QUOTENAME(OBJECT_NAME(PARENT_OBJECT_ID))
    + ' DROP CONSTRAINT '
    + OBJECT_NAME(OBJECT_ID) + ';'
FROM SYS.OBJECTS
WHERE TYPE_DESC LIKE '%CONSTRAINT'
    AND OBJECT_NAME(PARENT_OBJECT_ID) = 'Tyre'
    AND SCHEMA_NAME(SCHEMA_ID) = 'dbo'
EXEC sp_executesql @SQL
;
CREATE TABLE [dbo].[_prisma_new_Tyre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tread1] FLOAT(53),
    [tread2] FLOAT(53),
    [isInstalled] BIT NOT NULL CONSTRAINT [Tyre_isInstalled_df] DEFAULT 0,
    [isReady] BIT NOT NULL CONSTRAINT [Tyre_isReady_df] DEFAULT 0,
    [isScrap] BIT NOT NULL CONSTRAINT [Tyre_isScrap_df] DEFAULT 0,
    [positionTyre] INT,
    [installedUnitId] INT,
    [removedPurposeId] INT,
    [stockTyreId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Tyre_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Tyre_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tyre_stockTyreId_key] UNIQUE NONCLUSTERED ([stockTyreId]),
    CONSTRAINT [Tyre_installedUnitId_positionTyre_key] UNIQUE NONCLUSTERED ([installedUnitId],[positionTyre])
);
SET IDENTITY_INSERT [dbo].[_prisma_new_Tyre] ON;
IF EXISTS(SELECT * FROM [dbo].[Tyre])
    EXEC('INSERT INTO [dbo].[_prisma_new_Tyre] ([createdAt],[id],[installedUnitId],[isInstalled],[isReady],[isScrap],[positionTyre],[removedPurposeId],[stockTyreId],[tread1],[tread2],[updatedAt]) SELECT [createdAt],[id],[installedUnitId],[isInstalled],[isReady],[isScrap],[positionTyre],[removedPurposeId],[stockTyreId],[tread1],[tread2],[updatedAt] FROM [dbo].[Tyre] WITH (holdlock tablockx)');
SET IDENTITY_INSERT [dbo].[_prisma_new_Tyre] OFF;
DROP TABLE [dbo].[Tyre];
EXEC SP_RENAME N'dbo._prisma_new_Tyre', N'Tyre';
COMMIT;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_removedTyreId_fkey] FOREIGN KEY ([removedTyreId]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_installedTyreId_fkey] FOREIGN KEY ([installedTyreId]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre1Id_fkey] FOREIGN KEY ([tyre1Id]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre2Id_fkey] FOREIGN KEY ([tyre2Id]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre3Id_fkey] FOREIGN KEY ([tyre3Id]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre4Id_fkey] FOREIGN KEY ([tyre4Id]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre5Id_fkey] FOREIGN KEY ([tyre5Id]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_tyre6Id_fkey] FOREIGN KEY ([tyre6Id]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
