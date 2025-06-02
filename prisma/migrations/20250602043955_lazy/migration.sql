/*
  Warnings:

  - You are about to drop the column `tyre1Id` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `tyre2Id` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `tyre3Id` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `tyre4Id` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `tyre5Id` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `tyre6Id` on the `Unit` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

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

-- DropIndex
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre1Id_key];

-- DropIndex
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre2Id_key];

-- DropIndex
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre3Id_key];

-- DropIndex
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre4Id_key];

-- DropIndex
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre5Id_key];

-- DropIndex
ALTER TABLE [dbo].[Unit] DROP CONSTRAINT [Unit_tyre6Id_key];

-- AlterTable
ALTER TABLE [dbo].[Unit] DROP COLUMN [tyre1Id],
[tyre2Id],
[tyre3Id],
[tyre4Id],
[tyre5Id],
[tyre6Id];

-- CreateTable
CREATE TABLE [dbo].[UnitTyrePosition] (
    [id] INT NOT NULL IDENTITY(1,1),
    [unitId] INT NOT NULL,
    [tyreId] INT NOT NULL,
    [position] INT NOT NULL,
    CONSTRAINT [UnitTyrePosition_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UnitTyrePosition_unitId_position_key] UNIQUE NONCLUSTERED ([unitId],[position])
);

-- CreateTable
CREATE TABLE [dbo].[UnitTyreAmount] (
    [id] INT NOT NULL IDENTITY(1,1),
    [unitId] INT NOT NULL,
    [jumlahBan] INT NOT NULL,
    CONSTRAINT [UnitTyreAmount_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UnitTyreAmount_unitId_key] UNIQUE NONCLUSTERED ([unitId])
);

-- AddForeignKey
ALTER TABLE [dbo].[UnitTyrePosition] ADD CONSTRAINT [UnitTyrePosition_unitId_fkey] FOREIGN KEY ([unitId]) REFERENCES [dbo].[Unit]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UnitTyrePosition] ADD CONSTRAINT [UnitTyrePosition_tyreId_fkey] FOREIGN KEY ([tyreId]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UnitTyreAmount] ADD CONSTRAINT [UnitTyreAmount_unitId_fkey] FOREIGN KEY ([unitId]) REFERENCES [dbo].[Unit]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
