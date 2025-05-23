BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[InspectionTyre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tyreId] INT NOT NULL,
    [activityTyreId] INT,
    [unitNumber] NVARCHAR(1000) NOT NULL,
    [position] NVARCHAR(1000) NOT NULL,
    [size] NVARCHAR(1000),
    [brand] NVARCHAR(1000),
    [pattern] NVARCHAR(1000),
    [serialNumber] NVARCHAR(1000),
    [removeReason] NVARCHAR(1000),
    [removePurpose] NVARCHAR(1000),
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
    [dateTimeDone] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [InspectionTyre_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [InspectionTyre_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[InspectionTyre] ADD CONSTRAINT [InspectionTyre_tyreId_fkey] FOREIGN KEY ([tyreId]) REFERENCES [dbo].[tyres]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InspectionTyre] ADD CONSTRAINT [InspectionTyre_activityTyreId_fkey] FOREIGN KEY ([activityTyreId]) REFERENCES [dbo].[ActivityTyre]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InspectionTyre] ADD CONSTRAINT [InspectionTyre_removePurposeId_fkey] FOREIGN KEY ([removePurposeId]) REFERENCES [dbo].[RemovePurpose]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
