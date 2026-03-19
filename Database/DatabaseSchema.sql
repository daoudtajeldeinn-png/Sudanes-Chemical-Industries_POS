/* ----------- Database --------------------------------------------------- */
IF DB_ID('POSSystem') IS NULL
BEGIN
    CREATE DATABASE POSSystem;
END
GO
USE POSSystem;
GO

/* ---------- Tables ------------------------------------------------------ */
CREATE TABLE [dbo].[User] (
    UserID          INT IDENTITY(1,1) PRIMARY KEY,
    UserName        NVARCHAR(100) NOT NULL,
    PasswordHash    VARBINARY(64) NOT NULL,
    FullNameAr      NVARCHAR(150) NULL,
    FullNameEn      NVARCHAR(150) NULL,
    Role            NVARCHAR(50)  NULL,
    IsActive        BIT           DEFAULT 1
);
GO

CREATE TABLE [dbo].[CompanySettings] (
    SettingID       INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName     NVARCHAR(200) NULL,
    CompanyNameAr   NVARCHAR(200) NULL,
    Address         NVARCHAR(300) NULL,
    Phone           NVARCHAR(50)  NULL,
    Email           NVARCHAR(150) NULL,
    TaxNumber       NVARCHAR(50)  NULL,
    TaxRate         DECIMAL(5,2)  DEFAULT 15,
    Currency        NVARCHAR(20)  DEFAULT N'ريال',
    CurrencyCode    NVARCHAR(10)  DEFAULT N'SAR',
    InvoiceHeader   NVARCHAR(MAX) NULL,
    InvoiceFooter   NVARCHAR(MAX) NULL,
    Logo            VARBINARY(MAX) NULL
);
GO

/* ------- Optional seed data ------------------------------------------------ */
INSERT INTO [dbo].[CompanySettings] (CompanyName, CompanyNameAr, Currency, CurrencyCode)
VALUES (N"My Company", N"شركتي", N'ريال', N'SAR');

INSERT INTO [dbo].[User] (UserName, PasswordHash, FullNameAr, FullNameEn, Role)
VALUES ('admin', HASHBYTES('SHA2_256', CAST('admin123' AS VARBINARY(50))), N'المسؤول', N'Administrator', N'Admin');
GO
