BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ActivityTyre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [unitId] INT NOT NULL,
    [hmAtActivity] INT NOT NULL,
    [kmAtActivity] INT NOT NULL,
    [location] NVARCHAR(1000),
    [removedTyreId] INT,
    [tread1Remove] FLOAT(53),
    [tread2Remove] FLOAT(53),
    [removeReasonId] VARCHAR(10),
    [removePurposeId] INT,
    [installedTyreId] INT,
    [tread1Install] FLOAT(53),
    [tread2Install] FLOAT(53),
    [airConditionId] INT,
    [airPressure] INT,
    [manpower] NVARCHAR(1000),
    [dateTimeWork] DATETIME2,
    [dateTimeDone] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ActivityTyre_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [tyrePosition] INT,
    CONSTRAINT [ActivityTyre_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[InspectionTyre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tyreId] INT NOT NULL,
    [activityTyreId] INT,
    [removeReason] NVARCHAR(1000),
    [otd] FLOAT(53),
    [treadRemaining] FLOAT(53),
    [treadValue] FLOAT(53),
    [ageTotal] INT,
    [installDate] DATETIME2,
    [removeDate] DATETIME2,
    [ageFront] INT,
    [ageRear] INT,
    [incidentNote] NVARCHAR(1000),
    [analysisNote] NVARCHAR(1000),
    [removePurposeId] INT,
    [inspectedBy] NVARCHAR(1000),
    [dateTimeIn] DATETIME2 NOT NULL,
    [dateTimeWork] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [InspectionTyre_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [positionTyre] INT,
    [unitId] INT,
    [isDone] BIT CONSTRAINT [InspectionTyre_isDone_df] DEFAULT 0,
    [actionTyreId] INT,
    CONSTRAINT [InspectionTyre_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [InspectionTyre_actionTyreId_key] UNIQUE NONCLUSTERED ([actionTyreId])
);

-- CreateTable
CREATE TABLE [dbo].[ActionTyre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [removePurposeId] INT,
    [isDone] BIT NOT NULL CONSTRAINT [ActionTyre_isDone_df] DEFAULT 0,
    [dateTimeIn] DATETIME2,
    [dateTimeWork] DATETIME2,
    [dateTimeDone] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ActionTyre_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ActionTyre_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Tyre] (
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
    [hmTyre] INT,
    [kmTyre] INT,
    CONSTRAINT [Tyre_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tyre_stockTyreId_key] UNIQUE NONCLUSTERED ([stockTyreId])
);

-- CreateTable
CREATE TABLE [dbo].[StockTyre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [serialNumber] NVARCHAR(1000) NOT NULL,
    [merkId] INT NOT NULL,
    [type] NVARCHAR(1000),
    [pattern] NVARCHAR(1000),
    [price] INT,
    [tyreSizeId] INT NOT NULL,
    [otd1] INT,
    [otd2] INT,
    [oHM] INT CONSTRAINT [StockTyre_oHM_df] DEFAULT 0,
    [oKM] INT CONSTRAINT [StockTyre_oKM_df] DEFAULT 0,
    CONSTRAINT [StockTyre_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [StockTyre_serialNumber_key] UNIQUE NONCLUSTERED ([serialNumber])
);

-- CreateTable
CREATE TABLE [dbo].[TyreSize] (
    [id] INT NOT NULL IDENTITY(1,1),
    [size] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TyreSize_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TyreSize_size_key] UNIQUE NONCLUSTERED ([size])
);

-- CreateTable
CREATE TABLE [dbo].[Unit] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nomorUnit] NVARCHAR(1000) NOT NULL,
    [hmUnit] INT NOT NULL,
    [kmUnit] INT NOT NULL,
    [siteId] INT NOT NULL,
    [location] NVARCHAR(1000),
    [tyre1Id] INT,
    [tyre2Id] INT,
    [tyre3Id] INT,
    [tyre4Id] INT,
    [tyre5Id] INT,
    [tyre6Id] INT,
    CONSTRAINT [Unit_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Unit_nomorUnit_key] UNIQUE NONCLUSTERED ([nomorUnit]),
    CONSTRAINT [Unit_tyre1Id_key] UNIQUE NONCLUSTERED ([tyre1Id]),
    CONSTRAINT [Unit_tyre2Id_key] UNIQUE NONCLUSTERED ([tyre2Id]),
    CONSTRAINT [Unit_tyre3Id_key] UNIQUE NONCLUSTERED ([tyre3Id]),
    CONSTRAINT [Unit_tyre4Id_key] UNIQUE NONCLUSTERED ([tyre4Id]),
    CONSTRAINT [Unit_tyre5Id_key] UNIQUE NONCLUSTERED ([tyre5Id]),
    CONSTRAINT [Unit_tyre6Id_key] UNIQUE NONCLUSTERED ([tyre6Id])
);

-- CreateTable
CREATE TABLE [dbo].[AirCondition] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [AirCondition_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AirCondition_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[ApiKey] (
    [id] INT NOT NULL IDENTITY(1,1),
    [key] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [ApiKey_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ApiKey_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ApiKey_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ApiKey_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[Merk] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Merk_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Merk_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[RemovePurpose] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [RemovePurpose_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RemovePurpose_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[RemoveReason] (
    [id] VARCHAR(10) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [RemoveReason_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[RoleUser] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [RoleUser_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RoleUser_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Site] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Site_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Site_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [roleId] INT NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_name_key] UNIQUE NONCLUSTERED ([name])
);

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_airConditionId_fkey] FOREIGN KEY ([airConditionId]) REFERENCES [dbo].[AirCondition]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_installedTyreId_fkey] FOREIGN KEY ([installedTyreId]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_removedTyreId_fkey] FOREIGN KEY ([removedTyreId]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_removePurposeId_fkey] FOREIGN KEY ([removePurposeId]) REFERENCES [dbo].[RemovePurpose]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_removeReasonId_fkey] FOREIGN KEY ([removeReasonId]) REFERENCES [dbo].[RemoveReason]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityTyre] ADD CONSTRAINT [ActivityTyre_unitId_fkey] FOREIGN KEY ([unitId]) REFERENCES [dbo].[Unit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InspectionTyre] ADD CONSTRAINT [InspectionTyre_activityTyreId_fkey] FOREIGN KEY ([activityTyreId]) REFERENCES [dbo].[ActivityTyre]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InspectionTyre] ADD CONSTRAINT [InspectionTyre_removePurposeId_fkey] FOREIGN KEY ([removePurposeId]) REFERENCES [dbo].[RemovePurpose]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InspectionTyre] ADD CONSTRAINT [InspectionTyre_tyreId_fkey] FOREIGN KEY ([tyreId]) REFERENCES [dbo].[Tyre]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InspectionTyre] ADD CONSTRAINT [InspectionTyre_actionTyreId_fkey] FOREIGN KEY ([actionTyreId]) REFERENCES [dbo].[ActionTyre]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ActionTyre] ADD CONSTRAINT [ActionTyre_removePurposeId_fkey] FOREIGN KEY ([removePurposeId]) REFERENCES [dbo].[RemovePurpose]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tyre] ADD CONSTRAINT [Tyre_installedUnitId_fkey] FOREIGN KEY ([installedUnitId]) REFERENCES [dbo].[Unit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Tyre] ADD CONSTRAINT [Tyre_removedPurposeId_fkey] FOREIGN KEY ([removedPurposeId]) REFERENCES [dbo].[RemovePurpose]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Tyre] ADD CONSTRAINT [Tyre_stockTyreId_fkey] FOREIGN KEY ([stockTyreId]) REFERENCES [dbo].[StockTyre]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[StockTyre] ADD CONSTRAINT [StockTyre_merkId_fkey] FOREIGN KEY ([merkId]) REFERENCES [dbo].[Merk]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StockTyre] ADD CONSTRAINT [StockTyre_tyreSizeId_fkey] FOREIGN KEY ([tyreSizeId]) REFERENCES [dbo].[TyreSize]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Unit] ADD CONSTRAINT [Unit_siteId_fkey] FOREIGN KEY ([siteId]) REFERENCES [dbo].[Site]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[RoleUser]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
