-- ============================================================
--  نظام إدارة المبيعات والمخازن (POS System)
--  قاعدة البيانات - Microsoft SQL Server
--  الإصدار: 2.0
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'POSSystem')
    DROP DATABASE POSSystem;
GO

CREATE DATABASE POSSystem
    COLLATE Arabic_CI_AS;
GO

USE POSSystem;
GO

-- ============================================================
--  جدول الأدوار والصلاحيات
-- ============================================================
CREATE TABLE Roles (
    RoleID      INT IDENTITY(1,1) PRIMARY KEY,
    RoleName    NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    IsActive    BIT DEFAULT 1,
    CreatedAt   DATETIME DEFAULT GETDATE()
);

CREATE TABLE Permissions (
    PermissionID   INT IDENTITY(1,1) PRIMARY KEY,
    PermissionName NVARCHAR(100) NOT NULL,
    ModuleName     NVARCHAR(100) NOT NULL,
    Description    NVARCHAR(500)
);

CREATE TABLE RolePermissions (
    RoleID       INT NOT NULL,
    PermissionID INT NOT NULL,
    PRIMARY KEY (RoleID, PermissionID),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
    FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID)
);

-- ============================================================
--  جدول المستخدمين
-- ============================================================
CREATE TABLE Users (
    UserID       INT IDENTITY(1,1) PRIMARY KEY,
    Username     NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(256) NOT NULL,
    FullName     NVARCHAR(200) NOT NULL,
    Email        NVARCHAR(200),
    Phone        NVARCHAR(50),
    RoleID       INT NOT NULL,
    IsActive     BIT DEFAULT 1,
    LastLogin    DATETIME,
    CreatedAt    DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

CREATE TABLE UserSessions (
    SessionID  INT IDENTITY(1,1) PRIMARY KEY,
    UserID     INT NOT NULL,
    LoginTime  DATETIME DEFAULT GETDATE(),
    LogoutTime DATETIME,
    IPAddress  NVARCHAR(50),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- ============================================================
--  إعدادات الشركة
-- ============================================================
CREATE TABLE CompanySettings (
    SettingID      INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName    NVARCHAR(300) NOT NULL,
    CompanyNameAr  NVARCHAR(300),
    Address        NVARCHAR(500),
    Phone          NVARCHAR(100),
    Email          NVARCHAR(200),
    Website        NVARCHAR(200),
    TaxNumber      NVARCHAR(100),
    TaxRate        DECIMAL(5,2) DEFAULT 15.00,
    Currency       NVARCHAR(10) DEFAULT N'ريال',
    CurrencyCode   NVARCHAR(5)  DEFAULT 'SAR',
    Logo           VARBINARY(MAX),
    InvoiceHeader  NVARCHAR(1000),
    InvoiceFooter  NVARCHAR(1000),
    UpdatedAt      DATETIME DEFAULT GETDATE()
);

-- ============================================================
--  المخازن والفروع
-- ============================================================
CREATE TABLE Warehouses (
    WarehouseID   INT IDENTITY(1,1) PRIMARY KEY,
    WarehouseName NVARCHAR(200) NOT NULL,
    Location      NVARCHAR(500),
    ManagerID     INT,
    IsDefault     BIT DEFAULT 0,
    IsActive      BIT DEFAULT 1,
    CreatedAt     DATETIME DEFAULT GETDATE()
);

-- ============================================================
--  تصنيفات المنتجات
-- ============================================================
CREATE TABLE Categories (
    CategoryID     INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName   NVARCHAR(200) NOT NULL,
    CategoryNameAr NVARCHAR(200) NULL,
    ParentID       INT,
    Description    NVARCHAR(500),
    IsActive       BIT DEFAULT 1,
    FOREIGN KEY (ParentID) REFERENCES Categories(CategoryID)
);

CREATE TABLE Units (
    UnitID   INT IDENTITY(1,1) PRIMARY KEY,
    UnitName NVARCHAR(100) NOT NULL,
    UnitCode NVARCHAR(20),
    IsActive BIT DEFAULT 1
);

-- ============================================================
--  المنتجات
-- ============================================================
CREATE TABLE Products (
    ProductID      INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode    NVARCHAR(100) NOT NULL UNIQUE,
    Barcode        NVARCHAR(100),
    ProductName    NVARCHAR(300) NOT NULL,
    ProductNameAr  NVARCHAR(300),
    CategoryID     INT,
    UnitID         INT,
    CostPrice      DECIMAL(18,2) DEFAULT 0,
    WholesalePrice DECIMAL(18,2) DEFAULT 0,
    RetailPrice    DECIMAL(18,2) DEFAULT 0,
    TaxRate        DECIMAL(5,2)  DEFAULT 0,
    MinStock       DECIMAL(18,3) DEFAULT 0,
    MaxStock       DECIMAL(18,3) DEFAULT 0,
    Description    NVARCHAR(1000),
    ProductImage   VARBINARY(MAX),
    IsActive       BIT DEFAULT 1,
    CreatedAt      DATETIME DEFAULT GETDATE(),
    UpdatedAt      DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    FOREIGN KEY (UnitID) REFERENCES Units(UnitID)
);

CREATE TABLE ProductStock (
    StockID     INT IDENTITY(1,1) PRIMARY KEY,
    ProductID   INT NOT NULL,
    WarehouseID INT NOT NULL,
    Quantity    DECIMAL(18,3) DEFAULT 0,
    UpdatedAt   DATETIME DEFAULT GETDATE(),
    UNIQUE (ProductID, WarehouseID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);

CREATE TABLE StockMovements (
    MovementID    INT IDENTITY(1,1) PRIMARY KEY,
    ProductID     INT NOT NULL,
    WarehouseID   INT NOT NULL,
    MovementType  NVARCHAR(50) NOT NULL, -- IN, OUT, TRANSFER, ADJUST
    ReferenceType NVARCHAR(50),           -- PURCHASE, SALE, ADJUSTMENT
    ReferenceID   INT,
    Quantity      DECIMAL(18,3) NOT NULL,
    UnitCost      DECIMAL(18,2),
    Notes         NVARCHAR(500),
    UserID        INT,
    MovementDate  DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);

-- ============================================================
--  العملاء
-- ============================================================
CREATE TABLE CustomerGroups (
    GroupID       INT IDENTITY(1,1) PRIMARY KEY,
    GroupName     NVARCHAR(200) NOT NULL,
    DiscountRate  DECIMAL(5,2) DEFAULT 0,
    CreditLimit   DECIMAL(18,2) DEFAULT 0,
    IsActive      BIT DEFAULT 1
);

CREATE TABLE Customers (
    CustomerID    INT IDENTITY(1,1) PRIMARY KEY,
    CustomerCode  NVARCHAR(50) NOT NULL UNIQUE,
    CustomerName  NVARCHAR(300) NOT NULL,
    GroupID       INT,
    Phone         NVARCHAR(100),
    Phone2        NVARCHAR(100),
    Email         NVARCHAR(200),
    Address       NVARCHAR(500),
    City          NVARCHAR(100),
    TaxNumber     NVARCHAR(100),
    CreditLimit   DECIMAL(18,2) DEFAULT 0,
    CurrentBalance DECIMAL(18,2) DEFAULT 0,
    Notes         NVARCHAR(1000),
    IsActive      BIT DEFAULT 1,
    CreatedAt     DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (GroupID) REFERENCES CustomerGroups(GroupID)
);

-- ============================================================
--  الموردون
-- ============================================================
CREATE TABLE Suppliers (
    SupplierID   INT IDENTITY(1,1) PRIMARY KEY,
    SupplierCode NVARCHAR(50) NOT NULL UNIQUE,
    SupplierName NVARCHAR(300) NOT NULL,
    Phone        NVARCHAR(100),
    Phone2       NVARCHAR(100),
    Email        NVARCHAR(200),
    Address      NVARCHAR(500),
    City         NVARCHAR(100),
    TaxNumber    NVARCHAR(100),
    CurrentBalance DECIMAL(18,2) DEFAULT 0,
    Notes        NVARCHAR(1000),
    IsActive     BIT DEFAULT 1,
    CreatedAt    DATETIME DEFAULT GETDATE()
);

-- ============================================================
--  المبيعات
-- ============================================================
CREATE TABLE SalesInvoices (
    InvoiceID      INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceNumber  NVARCHAR(50) NOT NULL UNIQUE,
    InvoiceType    NVARCHAR(20) DEFAULT 'RETAIL', -- RETAIL, WHOLESALE
    InvoiceDate    DATETIME DEFAULT GETDATE(),
    CustomerID     INT,
    WarehouseID    INT NOT NULL,
    UserID         INT NOT NULL,
    SubTotal       DECIMAL(18,2) DEFAULT 0,
    DiscountType   NVARCHAR(20) DEFAULT 'AMOUNT', -- AMOUNT, PERCENT
    DiscountValue  DECIMAL(18,2) DEFAULT 0,
    DiscountAmount DECIMAL(18,2) DEFAULT 0,
    TaxAmount      DECIMAL(18,2) DEFAULT 0,
    TotalAmount    DECIMAL(18,2) DEFAULT 0,
    PaidAmount     DECIMAL(18,2) DEFAULT 0,
    RemainingAmount DECIMAL(18,2) DEFAULT 0,
    PaymentMethod  NVARCHAR(50) DEFAULT 'CASH', -- CASH, CARD, CREDIT, TRANSFER
    Status         NVARCHAR(20) DEFAULT 'PAID', -- PAID, PARTIAL, CREDIT, CANCELLED
    Notes          NVARCHAR(1000),
    QRCode         NVARCHAR(MAX),
    CreatedAt      DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE SalesInvoiceDetails (
    DetailID    INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID   INT NOT NULL,
    ProductID   INT NOT NULL,
    Quantity    DECIMAL(18,3) NOT NULL,
    UnitPrice   DECIMAL(18,2) NOT NULL,
    CostPrice   DECIMAL(18,2) NOT NULL,
    Discount    DECIMAL(18,2) DEFAULT 0,
    TaxRate     DECIMAL(5,2)  DEFAULT 0,
    TaxAmount   DECIMAL(18,2) DEFAULT 0,
    TotalPrice  DECIMAL(18,2) NOT NULL,
    Notes       NVARCHAR(500),
    FOREIGN KEY (InvoiceID) REFERENCES SalesInvoices(InvoiceID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

CREATE TABLE SalesReturns (
    ReturnID       INT IDENTITY(1,1) PRIMARY KEY,
    ReturnNumber   NVARCHAR(50) NOT NULL UNIQUE,
    OriginalInvoiceID INT,
    ReturnDate     DATETIME DEFAULT GETDATE(),
    CustomerID     INT,
    WarehouseID    INT NOT NULL,
    UserID         INT NOT NULL,
    TotalAmount    DECIMAL(18,2) DEFAULT 0,
    Notes          NVARCHAR(1000),
    FOREIGN KEY (OriginalInvoiceID) REFERENCES SalesInvoices(InvoiceID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);

CREATE TABLE SalesReturnDetails (
    DetailID  INT IDENTITY(1,1) PRIMARY KEY,
    ReturnID  INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity  DECIMAL(18,3) NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    Total     DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (ReturnID) REFERENCES SalesReturns(ReturnID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ============================================================
--  المشتريات
-- ============================================================
CREATE TABLE PurchaseInvoices (
    InvoiceID      INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceNumber  NVARCHAR(50) NOT NULL UNIQUE,
    SupplierInvoice NVARCHAR(100),
    InvoiceDate    DATETIME DEFAULT GETDATE(),
    SupplierID     INT NOT NULL,
    WarehouseID    INT NOT NULL,
    UserID         INT NOT NULL,
    SubTotal       DECIMAL(18,2) DEFAULT 0,
    DiscountAmount DECIMAL(18,2) DEFAULT 0,
    TaxAmount      DECIMAL(18,2) DEFAULT 0,
    TotalAmount    DECIMAL(18,2) DEFAULT 0,
    PaidAmount     DECIMAL(18,2) DEFAULT 0,
    RemainingAmount DECIMAL(18,2) DEFAULT 0,
    PaymentMethod  NVARCHAR(50) DEFAULT 'CASH',
    Status         NVARCHAR(20) DEFAULT 'PAID',
    Notes          NVARCHAR(1000),
    CreatedAt      DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE PurchaseInvoiceDetails (
    DetailID   INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID  INT NOT NULL,
    ProductID  INT NOT NULL,
    Quantity   DECIMAL(18,3) NOT NULL,
    UnitCost   DECIMAL(18,2) NOT NULL,
    TaxRate    DECIMAL(5,2)  DEFAULT 0,
    TaxAmount  DECIMAL(18,2) DEFAULT 0,
    TotalCost  DECIMAL(18,2) NOT NULL,
    Notes      NVARCHAR(500),
    FOREIGN KEY (InvoiceID) REFERENCES PurchaseInvoices(InvoiceID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ============================================================
--  المصروفات
-- ============================================================
CREATE TABLE ExpenseCategories (
    CategoryID   INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(200) NOT NULL,
    Description  NVARCHAR(500),
    IsActive     BIT DEFAULT 1
);

CREATE TABLE Expenses (
    ExpenseID    INT IDENTITY(1,1) PRIMARY KEY,
    ExpenseDate  DATETIME DEFAULT GETDATE(),
    CategoryID   INT NOT NULL,
    Amount       DECIMAL(18,2) NOT NULL,
    Description  NVARCHAR(1000),
    PaymentMethod NVARCHAR(50) DEFAULT 'CASH',
    UserID       INT NOT NULL,
    Notes        NVARCHAR(500),
    CreatedAt    DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CategoryID) REFERENCES ExpenseCategories(CategoryID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- ============================================================
--  سجل الدفعات
-- ============================================================
CREATE TABLE Payments (
    PaymentID     INT IDENTITY(1,1) PRIMARY KEY,
    PaymentDate   DATETIME DEFAULT GETDATE(),
    PaymentType   NVARCHAR(20) NOT NULL, -- CUSTOMER, SUPPLIER
    ReferenceID   INT NOT NULL,          -- CustomerID or SupplierID
    Amount        DECIMAL(18,2) NOT NULL,
    PaymentMethod NVARCHAR(50) DEFAULT 'CASH',
    InvoiceID     INT,
    Notes         NVARCHAR(500),
    UserID        INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- ============================================================
--  صناديق النقدية (Cashier Sessions)
-- ============================================================
CREATE TABLE CashierSessions (
    SessionID      INT IDENTITY(1,1) PRIMARY KEY,
    UserID         INT NOT NULL,
    WarehouseID    INT NOT NULL,
    OpeningBalance DECIMAL(18,2) DEFAULT 0,
    ClosingBalance DECIMAL(18,2),
    TotalSales     DECIMAL(18,2) DEFAULT 0,
    TotalReturns   DECIMAL(18,2) DEFAULT 0,
    TotalExpenses  DECIMAL(18,2) DEFAULT 0,
    OpenedAt       DATETIME DEFAULT GETDATE(),
    ClosedAt       DATETIME,
    Status         NVARCHAR(20) DEFAULT 'OPEN',
    Notes          NVARCHAR(500),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);

-- ============================================================
--  طلبات الشراء
-- ============================================================
CREATE TABLE PurchaseOrders (
    OrderID       INT IDENTITY(1,1) PRIMARY KEY,
    OrderNumber   NVARCHAR(50) NOT NULL UNIQUE,
    OrderDate     DATETIME DEFAULT GETDATE(),
    SupplierID    INT NOT NULL,
    WarehouseID   INT NOT NULL,
    UserID        INT NOT NULL,
    TotalAmount   DECIMAL(18,2) DEFAULT 0,
    Status        NVARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, RECEIVED, CANCELLED
    Notes         NVARCHAR(1000),
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);

CREATE TABLE PurchaseOrderDetails (
    DetailID  INT IDENTITY(1,1) PRIMARY KEY,
    OrderID   INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity  DECIMAL(18,3) NOT NULL,
    UnitCost  DECIMAL(18,2) NOT NULL,
    Total     DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES PurchaseOrders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ============================================================
--  جدول تسلسلات الأرقام
-- ============================================================
CREATE TABLE NumberSequences (
    SequenceID   INT IDENTITY(1,1) PRIMARY KEY,
    SequenceType NVARCHAR(50) NOT NULL UNIQUE,
    Prefix       NVARCHAR(20),
    CurrentValue INT DEFAULT 0,
    PaddingLength INT DEFAULT 6
);

-- ============================================================
--  الفهارس لتحسين الأداء
-- ============================================================
CREATE INDEX IX_Products_Barcode ON Products(Barcode);
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
CREATE INDEX IX_SalesInvoices_Date ON SalesInvoices(InvoiceDate);
CREATE INDEX IX_SalesInvoices_CustomerID ON SalesInvoices(CustomerID);
CREATE INDEX IX_PurchaseInvoices_Date ON PurchaseInvoices(InvoiceDate);
CREATE INDEX IX_StockMovements_ProductID ON StockMovements(ProductID);
GO

-- ============================================================
--  الإجراءات المخزنة (Stored Procedures)
-- ============================================================

-- الحصول على رقم الفاتورة التالي
CREATE PROCEDURE sp_GetNextNumber
    @SequenceType NVARCHAR(50),
    @NextNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentVal INT;
    DECLARE @Prefix NVARCHAR(20);
    DECLARE @Padding INT;
    
    UPDATE NumberSequences
    SET @CurrentVal = CurrentValue = CurrentValue + 1,
        @Prefix = Prefix,
        @Padding = PaddingLength
    WHERE SequenceType = @SequenceType;
    
    IF @CurrentVal IS NULL
    BEGIN
        INSERT INTO NumberSequences (SequenceType, Prefix, CurrentValue, PaddingLength)
        VALUES (@SequenceType, LEFT(@SequenceType, 3), 1, 6);
        SET @CurrentVal = 1;
        SET @Prefix = LEFT(@SequenceType, 3);
        SET @Padding = 6;
    END
    
    SET @NextNumber = @Prefix + '-' + RIGHT(REPLICATE('0', @Padding) + CAST(@CurrentVal AS VARCHAR), @Padding);
END;
GO

-- تحديث مخزون المنتج
CREATE PROCEDURE sp_UpdateStock
    @ProductID   INT,
    @WarehouseID INT,
    @Quantity    DECIMAL(18,3),
    @MovementType NVARCHAR(50),
    @ReferenceType NVARCHAR(50) = NULL,
    @ReferenceID INT = NULL,
    @UnitCost    DECIMAL(18,2) = NULL,
    @Notes       NVARCHAR(500) = NULL,
    @UserID      INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- تحديث أو إنشاء سجل المخزون
        IF EXISTS (SELECT 1 FROM ProductStock WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID)
        BEGIN
            UPDATE ProductStock
            SET Quantity = Quantity + @Quantity,
                UpdatedAt = GETDATE()
            WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;
        END
        ELSE
        BEGIN
            INSERT INTO ProductStock (ProductID, WarehouseID, Quantity)
            VALUES (@ProductID, @WarehouseID, @Quantity);
        END
        
        -- تسجيل حركة المخزون
        INSERT INTO StockMovements (ProductID, WarehouseID, MovementType, ReferenceType, ReferenceID, Quantity, UnitCost, Notes, UserID)
        VALUES (@ProductID, @WarehouseID, @MovementType, @ReferenceType, @ReferenceID, @Quantity, @UnitCost, @Notes, @UserID);
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- الحصول على ملخص المبيعات اليومية
CREATE PROCEDURE sp_GetDailySummary
    @Date DATE = NULL,
    @WarehouseID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Date IS NULL SET @Date = CAST(GETDATE() AS DATE);
    
    SELECT 
        COUNT(*) AS TotalInvoices,
        SUM(TotalAmount) AS TotalSales,
        SUM(DiscountAmount) AS TotalDiscounts,
        SUM(TaxAmount) AS TotalTax,
        SUM(CASE WHEN PaymentMethod = 'CASH' THEN TotalAmount ELSE 0 END) AS CashSales,
        SUM(CASE WHEN PaymentMethod = 'CARD' THEN TotalAmount ELSE 0 END) AS CardSales,
        SUM(CASE WHEN PaymentMethod = 'CREDIT' THEN TotalAmount ELSE 0 END) AS CreditSales
    FROM SalesInvoices
    WHERE CAST(InvoiceDate AS DATE) = @Date
      AND Status != 'CANCELLED'
      AND (@WarehouseID IS NULL OR WarehouseID = @WarehouseID);
END;
GO

-- تقرير الأرباح والخسائر
CREATE PROCEDURE sp_ProfitLossReport
    @StartDate DATE,
    @EndDate   DATE,
    @WarehouseID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- إجمالي المبيعات
    DECLARE @TotalSales     DECIMAL(18,2);
    DECLARE @TotalCOGS      DECIMAL(18,2);
    DECLARE @TotalReturns   DECIMAL(18,2);
    DECLARE @TotalExpenses  DECIMAL(18,2);
    DECLARE @TotalTax       DECIMAL(18,2);
    
    SELECT @TotalSales = ISNULL(SUM(si.TotalAmount), 0),
           @TotalTax   = ISNULL(SUM(si.TaxAmount), 0)
    FROM SalesInvoices si
    WHERE CAST(si.InvoiceDate AS DATE) BETWEEN @StartDate AND @EndDate
      AND si.Status != 'CANCELLED'
      AND (@WarehouseID IS NULL OR si.WarehouseID = @WarehouseID);
    
    SELECT @TotalCOGS = ISNULL(SUM(sid.Quantity * sid.CostPrice), 0)
    FROM SalesInvoiceDetails sid
    INNER JOIN SalesInvoices si ON sid.InvoiceID = si.InvoiceID
    WHERE CAST(si.InvoiceDate AS DATE) BETWEEN @StartDate AND @EndDate
      AND si.Status != 'CANCELLED'
      AND (@WarehouseID IS NULL OR si.WarehouseID = @WarehouseID);
    
    SELECT @TotalExpenses = ISNULL(SUM(Amount), 0)
    FROM Expenses
    WHERE CAST(ExpenseDate AS DATE) BETWEEN @StartDate AND @EndDate;
    
    SELECT 
        @TotalSales     AS TotalSales,
        @TotalCOGS      AS TotalCOGS,
        @TotalSales - @TotalCOGS AS GrossProfit,
        @TotalExpenses  AS TotalExpenses,
        @TotalSales - @TotalCOGS - @TotalExpenses AS NetProfit,
        @TotalTax       AS TotalVAT,
        CASE WHEN @TotalSales > 0 
             THEN CAST((@TotalSales - @TotalCOGS) / @TotalSales * 100 AS DECIMAL(5,2))
             ELSE 0 END AS GrossProfitMargin;
END;
GO

-- ============================================================
--  البيانات الافتراضية
-- ============================================================

-- الأدوار
INSERT INTO Roles (RoleName, Description) VALUES
(N'مدير النظام',    N'صلاحية كاملة على جميع أجزاء النظام'),
(N'مدير المبيعات',  N'إدارة المبيعات والعملاء والتقارير'),
(N'أمين المخزن',    N'إدارة المخزون والمنتجات والمشتريات'),
(N'كاشير',          N'نقطة البيع فقط'),
(N'محاسب',          N'المشتريات والمصروفات والتقارير المالية');

-- الصلاحيات
INSERT INTO Permissions (PermissionName, ModuleName) VALUES
('POS_VIEW',           'POS'),
('POS_SALE',           'POS'),
('POS_RETURN',         'POS'),
('SALES_VIEW',         'Sales'),
('SALES_CREATE',       'Sales'),
('SALES_EDIT',         'Sales'),
('SALES_DELETE',       'Sales'),
('PURCHASE_VIEW',      'Purchases'),
('PURCHASE_CREATE',    'Purchases'),
('PURCHASE_EDIT',      'Purchases'),
('INVENTORY_VIEW',     'Inventory'),
('INVENTORY_ADJUST',   'Inventory'),
('PRODUCTS_VIEW',      'Products'),
('PRODUCTS_CREATE',    'Products'),
('PRODUCTS_EDIT',      'Products'),
('PRODUCTS_DELETE',    'Products'),
('CUSTOMERS_VIEW',     'Customers'),
('CUSTOMERS_CREATE',   'Customers'),
('SUPPLIERS_VIEW',     'Suppliers'),
('SUPPLIERS_CREATE',   'Suppliers'),
('EXPENSES_VIEW',      'Expenses'),
('EXPENSES_CREATE',    'Expenses'),
('REPORTS_VIEW',       'Reports'),
('REPORTS_FINANCIAL',  'Reports'),
('USERS_VIEW',         'Users'),
('USERS_CREATE',       'Users'),
('SETTINGS_VIEW',      'Settings'),
('SETTINGS_EDIT',      'Settings');

-- منح جميع الصلاحيات للمدير
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT 1, PermissionID FROM Permissions;

-- منح صلاحيات مدير المبيعات
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT 2, PermissionID FROM Permissions 
WHERE ModuleName IN ('POS','Sales','Customers','Reports');

-- منح صلاحيات الكاشير
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT 4, PermissionID FROM Permissions 
WHERE ModuleName IN ('POS') OR PermissionName IN ('PRODUCTS_VIEW','CUSTOMERS_VIEW','INVENTORY_VIEW');

-- المستخدم الافتراضي (admin / 123456)
INSERT INTO Users (Username, PasswordHash, FullName, Email, RoleID)
VALUES ('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        N'مدير النظام', 'admin@pos.com', 1);

-- المخزن الافتراضي
INSERT INTO Warehouses (WarehouseName, Location, IsDefault, IsActive)
VALUES (N'المخزن الرئيسي', N'المقر الرئيسي', 1, 1);

-- الوحدات
INSERT INTO Units (UnitName, UnitCode) VALUES
(N'قطعة',   'PCS'),
(N'كيلو',   'KG'),
(N'لتر',    'L'),
(N'متر',    'M'),
(N'كرتون',  'CTN'),
(N'صندوق',  'BOX'),
(N'دزينة',  'DOZ');

-- التصنيفات
INSERT INTO Categories (CategoryName, CategoryNameAr) VALUES
(N'إلكترونيات', N'Electronics'),
(N'ملابس', N'Clothing'),
(N'مواد غذائية', N'Food'),
(N'مستلزمات منزلية', N'Home Supplies'),
(N'عطور ومستحضرات', N'Perfumes & Cosmetics');

-- مجموعات العملاء
INSERT INTO CustomerGroups (GroupName, DiscountRate, CreditLimit) VALUES
(N'عميل عادي',    0,    0),
(N'عميل جملة',    5,    50000),
(N'عميل مميز',    10,   100000),
(N'موزع معتمد',   15,   200000);

-- فئات المصروفات
INSERT INTO ExpenseCategories (CategoryName) VALUES
(N'إيجار'),
(N'رواتب'),
(N'كهرباء وماء'),
(N'صيانة'),
(N'مواصلات'),
(N'اتصالات'),
(N'مصروفات إدارية'),
(N'أخرى');

-- تسلسلات الأرقام
INSERT INTO NumberSequences (SequenceType, Prefix, CurrentValue, PaddingLength) VALUES
('SALE',     'INV', 0, 6),
('PURCHASE', 'PUR', 0, 6),
('RETURN',   'RET', 0, 6),
('ORDER',    'ORD', 0, 6);

-- إعدادات الشركة الافتراضية
INSERT INTO CompanySettings (CompanyName, CompanyNameAr, TaxRate, Currency, CurrencyCode)
VALUES ('My Company', N'شركتي', 15.00, N'ريال', 'SAR');

-- منتجات تجريبية
INSERT INTO Products (ProductCode, Barcode, ProductName, CategoryID, UnitID, CostPrice, WholesalePrice, RetailPrice, TaxRate, MinStock)
VALUES 
('PRD-001', '6001234567890', N'هاتف سامسونج A54',    1, 1, 900,  1100, 1299, 15, 5),
('PRD-002', '6001234567891', N'سماعة بلوتوث',         1, 1, 80,   120,  149,  15, 10),
('PRD-003', '6001234567892', N'قميص رجالي قطن',       2, 1, 35,   55,   79,   15, 20),
('PRD-004', '6001234567893', N'أرز بسمتي 5 كيلو',     3, 2, 25,   32,   39,   0,  50),
('PRD-005', '6001234567894', N'زيت زيتون 750 مل',     3, 3, 28,   38,   45,   0,  30);

-- مخزون تجريبي
INSERT INTO ProductStock (ProductID, WarehouseID, Quantity) VALUES
(1, 1, 50), (2, 1, 100), (3, 1, 200), (4, 1, 500), (5, 1, 150);

-- عملاء تجريبيون
INSERT INTO Customers (CustomerCode, CustomerName, Phone, GroupID)
VALUES 
('CUST-001', N'عميل نقدي',      '0500000000', 1),
('CUST-002', N'شركة الفيصل',    '0111234567', 2),
('CUST-003', N'محمد أحمد',      '0551234567', 1);

-- موردون تجريبيون
INSERT INTO Suppliers (SupplierCode, SupplierName, Phone)
VALUES 
('SUPP-001', N'المورد العام',          '0212345678'),
('SUPP-002', N'شركة الاستيراد المتحدة', '0113456789');

PRINT N'تم إنشاء قاعدة البيانات بنجاح!';
GO
