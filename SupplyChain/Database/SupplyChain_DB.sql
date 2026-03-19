-- ============================================================
--  نظام سلاسل الإمداد والتوريد
--  الصناعات الكيماوية السودانية
--  إضافة على قاعدة بيانات POSSystem
-- ============================================================

USE POSSystem;
GO

-- ============================================================
-- 1. جدول المواد الخام والمكونات
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RawMaterials' AND xtype='U')
CREATE TABLE RawMaterials (
    RawMaterialID       INT IDENTITY(1,1) PRIMARY KEY,
    RMCode              NVARCHAR(30)    NOT NULL UNIQUE,
    RMName              NVARCHAR(200)   NOT NULL,
    RMNameAr            NVARCHAR(200)   NOT NULL,
    CategoryID          INT             REFERENCES Categories(CategoryID),
    UnitID              INT             REFERENCES Units(UnitID),
    RMType              NVARCHAR(50)    NOT NULL DEFAULT 'API',
    -- API = Active Pharmaceutical Ingredient
    -- Excipient = مواد مساعدة
    -- Packaging = مواد تغليف
    -- Chemical = مواد كيماوية
    CASNumber           NVARCHAR(50),           -- رقم CAS الكيماوي
    MolecularFormula    NVARCHAR(100),           -- الصيغة الجزيئية
    StorageConditions   NVARCHAR(500),           -- شروط التخزين
    MinTemperature      DECIMAL(5,2),            -- درجة حرارة دنيا
    MaxTemperature      DECIMAL(5,2),            -- درجة حرارة قصوى
    RequiresRefrigeration BIT DEFAULT 0,
    IsControlled        BIT DEFAULT 0,           -- مادة خاضعة للرقابة
    HazardLevel         NVARCHAR(20) DEFAULT 'Low', -- Low/Medium/High/Critical
    MinStockLevel       DECIMAL(18,4) DEFAULT 0,
    MaxStockLevel       DECIMAL(18,4) DEFAULT 0,
    ReorderPoint        DECIMAL(18,4) DEFAULT 0,
    CurrentStock        DECIMAL(18,4) DEFAULT 0,
    LastCostPrice       DECIMAL(18,4) DEFAULT 0,
    PreferredSupplierID INT             REFERENCES Suppliers(SupplierID),
    LeadTimeDays        INT DEFAULT 7,           -- مدة التوصيل المتوقعة
    ShelfLifeDays       INT DEFAULT 365,         -- مدة الصلاحية
    IsActive            BIT DEFAULT 1,
    Notes               NVARCHAR(1000),
    CreatedDate         DATETIME DEFAULT GETDATE(),
    CreatedBy           INT             REFERENCES Users(UserID)
);
GO

-- ============================================================
-- 2. جدول الموردين المعتمدين (تفصيلي للأدوية)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ApprovedSuppliers' AND xtype='U')
CREATE TABLE ApprovedSuppliers (
    ApprovedSupplierID  INT IDENTITY(1,1) PRIMARY KEY,
    SupplierID          INT NOT NULL REFERENCES Suppliers(SupplierID),
    RawMaterialID       INT NOT NULL REFERENCES RawMaterials(RawMaterialID),
    SupplierCode        NVARCHAR(50),            -- كود المادة عند المورد
    IsPreferred         BIT DEFAULT 0,
    QualificationStatus NVARCHAR(30) DEFAULT 'Approved',
    -- Approved / Under Review / Suspended / Rejected
    QualificationDate   DATE,
    NextReviewDate      DATE,
    QualificationDocs   NVARCHAR(500),
    LastAuditDate       DATE,
    AuditScore          DECIMAL(5,2),
    PricePerUnit        DECIMAL(18,4),
    MinOrderQty         DECIMAL(18,4),
    LeadTimeDays        INT,
    PaymentTerms        NVARCHAR(100),
    Notes               NVARCHAR(500),
    CreatedDate         DATETIME DEFAULT GETDATE()
);
GO

-- ============================================================
-- 3. جدول طلبات الشراء (Purchase Requisitions)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PurchaseRequisitions' AND xtype='U')
CREATE TABLE PurchaseRequisitions (
    RequisitionID       INT IDENTITY(1,1) PRIMARY KEY,
    RequisitionNumber   NVARCHAR(30)    NOT NULL UNIQUE,
    RequestDate         DATE            NOT NULL DEFAULT GETDATE(),
    RequestedBy         INT             NOT NULL REFERENCES Users(UserID),
    DepartmentID        INT,
    Priority            NVARCHAR(20)    DEFAULT 'Normal', -- Urgent/High/Normal/Low
    RequiredDate        DATE,
    Status              NVARCHAR(30)    DEFAULT 'Pending',
    -- Pending/Approved/Partially Approved/Rejected/Converted
    ApprovedBy          INT             REFERENCES Users(UserID),
    ApprovalDate        DATETIME,
    RejectionReason     NVARCHAR(500),
    Notes               NVARCHAR(1000),
    CreatedDate         DATETIME        DEFAULT GETDATE()
);
GO

-- ============================================================
-- 4. تفاصيل طلبات الشراء
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PurchaseRequisitionDetails' AND xtype='U')
CREATE TABLE PurchaseRequisitionDetails (
    RequisitionDetailID INT IDENTITY(1,1) PRIMARY KEY,
    RequisitionID       INT NOT NULL REFERENCES PurchaseRequisitions(RequisitionID),
    RawMaterialID       INT NOT NULL REFERENCES RawMaterials(RawMaterialID),
    RequestedQty        DECIMAL(18,4)   NOT NULL,
    ApprovedQty         DECIMAL(18,4),
    EstimatedUnitCost   DECIMAL(18,4),
    Justification       NVARCHAR(500),
    Status              NVARCHAR(20)    DEFAULT 'Pending'
);
GO

-- ============================================================
-- 5. أوامر الشراء (Purchase Orders)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SCPurchaseOrders' AND xtype='U')
CREATE TABLE SCPurchaseOrders (
    POID                INT IDENTITY(1,1) PRIMARY KEY,
    PONumber            NVARCHAR(30)    NOT NULL UNIQUE,
    PODate              DATE            NOT NULL DEFAULT GETDATE(),
    SupplierID          INT             NOT NULL REFERENCES Suppliers(SupplierID),
    WarehouseID         INT             REFERENCES Warehouses(WarehouseID),
    RequisitionID       INT             REFERENCES PurchaseRequisitions(RequisitionID),
    ExpectedDelivery    DATE,
    DeliveryAddress     NVARCHAR(500),
    PaymentTerms        NVARCHAR(100),
    CurrencyCode        NVARCHAR(10)    DEFAULT 'SDG',
    ExchangeRate        DECIMAL(18,6)   DEFAULT 1,
    SubTotal            DECIMAL(18,4)   DEFAULT 0,
    TaxAmount           DECIMAL(18,4)   DEFAULT 0,
    ShippingCost        DECIMAL(18,4)   DEFAULT 0,
    TotalAmount         DECIMAL(18,4)   DEFAULT 0,
    Status              NVARCHAR(30)    DEFAULT 'Draft',
    -- Draft/Sent/Confirmed/Partially Received/Received/Cancelled
    SentDate            DATETIME,
    ConfirmedDate       DATETIME,
    InvoiceNumber       NVARCHAR(100),  -- رقم فاتورة المورد
    Notes               NVARCHAR(1000),
    CreatedBy           INT             REFERENCES Users(UserID),
    CreatedDate         DATETIME        DEFAULT GETDATE(),
    LastModifiedDate    DATETIME
);
GO

-- ============================================================
-- 6. تفاصيل أوامر الشراء
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SCPurchaseOrderDetails' AND xtype='U')
CREATE TABLE SCPurchaseOrderDetails (
    PODetailID          INT IDENTITY(1,1) PRIMARY KEY,
    POID                INT NOT NULL REFERENCES SCPurchaseOrders(POID),
    RawMaterialID       INT NOT NULL REFERENCES RawMaterials(RawMaterialID),
    RequestedQty        DECIMAL(18,4)   NOT NULL,
    ReceivedQty         DECIMAL(18,4)   DEFAULT 0,
    RejectedQty         DECIMAL(18,4)   DEFAULT 0,
    UnitPrice           DECIMAL(18,4)   NOT NULL,
    Discount            DECIMAL(5,2)    DEFAULT 0,
    TaxRate             DECIMAL(5,2)    DEFAULT 0,
    TotalPrice          DECIMAL(18,4)   NOT NULL,
    Status              NVARCHAR(20)    DEFAULT 'Pending'
    -- Pending/Partially Received/Received/Rejected
);
GO

-- ============================================================
-- 7. جدول الدفعات / الوجبات (Batches) - قلب النظام الدوائي
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Batches' AND xtype='U')
CREATE TABLE Batches (
    BatchID             INT IDENTITY(1,1) PRIMARY KEY,
    BatchNumber         NVARCHAR(50)    NOT NULL UNIQUE,
    BatchType           NVARCHAR(20)    NOT NULL DEFAULT 'RawMaterial',
    -- RawMaterial / FinishedProduct
    RawMaterialID       INT             REFERENCES RawMaterials(RawMaterialID),
    ProductID           INT             REFERENCES Products(ProductID),
    POID                INT             REFERENCES SCPurchaseOrders(POID),
    SupplierID          INT             REFERENCES Suppliers(SupplierID),
    SupplierBatchNumber NVARCHAR(100),  -- رقم الدفعة عند المورد
    ManufacturerName    NVARCHAR(200),  -- اسم المصنّع الأصلي
    ManufactureDate     DATE,
    ExpiryDate          DATE            NOT NULL,
    ReceivedDate        DATE            DEFAULT GETDATE(),
    ReceivedQty         DECIMAL(18,4)   NOT NULL,
    CurrentQty          DECIMAL(18,4)   NOT NULL,
    ReservedQty         DECIMAL(18,4)   DEFAULT 0,
    UnitCost            DECIMAL(18,4),
    WarehouseID         INT             REFERENCES Warehouses(WarehouseID),
    StorageLocation     NVARCHAR(100),  -- رف / منطقة التخزين
    QCStatus            NVARCHAR(30)    DEFAULT 'Pending',
    -- Pending/Under Test/Approved/Rejected/Quarantine
    QCTestDate          DATE,
    QCApprovedBy        INT             REFERENCES Users(UserID),
    Status              NVARCHAR(20)    DEFAULT 'Active',
    -- Active/Depleted/Expired/Recalled/Quarantine
    IsExpiringSoon      AS (CASE WHEN DATEDIFF(day, GETDATE(), ExpiryDate) <= 90 THEN 1 ELSE 0 END),
    COADocument         NVARCHAR(500),  -- Certificate of Analysis مسار الملف
    Notes               NVARCHAR(1000),
    CreatedDate         DATETIME        DEFAULT GETDATE(),
    CreatedBy           INT             REFERENCES Users(UserID)
);
GO

-- ============================================================
-- 8. استلام الشحنات (Goods Receipt)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GoodsReceipt' AND xtype='U')
CREATE TABLE GoodsReceipt (
    GRN                 INT IDENTITY(1,1) PRIMARY KEY,
    GRNNumber           NVARCHAR(30)    NOT NULL UNIQUE,
    POID                INT             REFERENCES SCPurchaseOrders(POID),
    SupplierID          INT             NOT NULL REFERENCES Suppliers(SupplierID),
    ReceiptDate         DATE            NOT NULL DEFAULT GETDATE(),
    DeliveryNoteNumber  NVARCHAR(100),
    SupplierInvoiceNo   NVARCHAR(100),
    ReceivedBy          INT             NOT NULL REFERENCES Users(UserID),
    WarehouseID         INT             REFERENCES Warehouses(WarehouseID),
    TotalItems          INT             DEFAULT 0,
    TotalQtyReceived    DECIMAL(18,4)   DEFAULT 0,
    TotalQtyRejected    DECIMAL(18,4)   DEFAULT 0,
    Status              NVARCHAR(20)    DEFAULT 'Received',
    -- Received / Partially Accepted / Under QC / Completed
    VehicleNumber       NVARCHAR(50),
    DriverName          NVARCHAR(100),
    Temperature         DECIMAL(5,2),   -- درجة الحرارة عند الاستلام
    Notes               NVARCHAR(1000),
    CreatedDate         DATETIME        DEFAULT GETDATE()
);
GO

-- ============================================================
-- 9. تفاصيل استلام الشحنات
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GoodsReceiptDetails' AND xtype='U')
CREATE TABLE GoodsReceiptDetails (
    GRNDetailID         INT IDENTITY(1,1) PRIMARY KEY,
    GRN                 INT NOT NULL REFERENCES GoodsReceipt(GRN),
    RawMaterialID       INT NOT NULL REFERENCES RawMaterials(RawMaterialID),
    BatchID             INT             REFERENCES Batches(BatchID),
    PODetailID          INT             REFERENCES SCPurchaseOrderDetails(PODetailID),
    ReceivedQty         DECIMAL(18,4)   NOT NULL,
    AcceptedQty         DECIMAL(18,4)   DEFAULT 0,
    RejectedQty         DECIMAL(18,4)   DEFAULT 0,
    RejectionReason     NVARCHAR(300),
    UnitCost            DECIMAL(18,4),
    ExpiryDate          DATE,
    ManufactureDate     DATE,
    SupplierBatchNo     NVARCHAR(100),
    QCRequired          BIT DEFAULT 1,
    QCStatus            NVARCHAR(20)    DEFAULT 'Pending'
);
GO

-- ============================================================
-- 10. فحوصات الجودة (Quality Control)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QCTests' AND xtype='U')
CREATE TABLE QCTests (
    QCTestID            INT IDENTITY(1,1) PRIMARY KEY,
    QCTestNumber        NVARCHAR(30)    NOT NULL UNIQUE,
    TestType            NVARCHAR(30)    NOT NULL DEFAULT 'Incoming',
    -- Incoming / In-Process / Final / Stability
    BatchID             INT             NOT NULL REFERENCES Batches(BatchID),
    GRN                 INT             REFERENCES GoodsReceipt(GRN),
    SampleQty           DECIMAL(18,4),
    SampleUnit          NVARCHAR(20),
    TestDate            DATE            NOT NULL DEFAULT GETDATE(),
    TestedBy            INT             NOT NULL REFERENCES Users(UserID),
    TestStandard        NVARCHAR(100),  -- BP / USP / In-House
    OverallResult       NVARCHAR(20)    DEFAULT 'Pending',
    -- Pending / Pass / Fail / Marginal
    ApprovedBy          INT             REFERENCES Users(UserID),
    ApprovalDate        DATE,
    ExpiryDate          DATE,           -- تاريخ انتهاء صلاحية شهادة التحليل
    Remarks             NVARCHAR(1000),
    CreatedDate         DATETIME        DEFAULT GETDATE()
);
GO

-- ============================================================
-- 11. تفاصيل فحوصات الجودة
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QCTestParameters' AND xtype='U')
CREATE TABLE QCTestParameters (
    ParameterID         INT IDENTITY(1,1) PRIMARY KEY,
    QCTestID            INT NOT NULL REFERENCES QCTests(QCTestID),
    ParameterName       NVARCHAR(100)   NOT NULL,
    -- Appearance / pH / Moisture / Purity / Potency / Microbiology...
    Specification       NVARCHAR(200),  -- المواصفة المطلوبة
    ActualResult        NVARCHAR(200),  -- النتيجة الفعلية
    Unit                NVARCHAR(30),
    IsPass              BIT,
    TestMethod          NVARCHAR(100),
    Notes               NVARCHAR(300)
);
GO

-- ============================================================
-- 12. قائمة مكونات المنتج BOM (Bill of Materials)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BillOfMaterials' AND xtype='U')
CREATE TABLE BillOfMaterials (
    BOMID               INT IDENTITY(1,1) PRIMARY KEY,
    BOMCode             NVARCHAR(30)    NOT NULL UNIQUE,
    ProductID           INT             NOT NULL REFERENCES Products(ProductID),
    BOMName             NVARCHAR(200)   NOT NULL,
    Version             NVARCHAR(20)    DEFAULT '1.0',
    IsActive            BIT DEFAULT 1,
    BatchSize           DECIMAL(18,4)   NOT NULL,   -- حجم الدفعة الإنتاجية
    BatchSizeUnit       NVARCHAR(30),
    ValidFrom           DATE,
    ValidTo             DATE,
    ApprovedBy          INT             REFERENCES Users(UserID),
    ApprovalDate        DATE,
    Notes               NVARCHAR(1000),
    CreatedDate         DATETIME        DEFAULT GETDATE(),
    CreatedBy           INT             REFERENCES Users(UserID)
);
GO

-- ============================================================
-- 13. تفاصيل BOM
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BOMDetails' AND xtype='U')
CREATE TABLE BOMDetails (
    BOMDetailID         INT IDENTITY(1,1) PRIMARY KEY,
    BOMID               INT NOT NULL REFERENCES BillOfMaterials(BOMID),
    RawMaterialID       INT NOT NULL REFERENCES RawMaterials(RawMaterialID),
    QtyRequired         DECIMAL(18,6)   NOT NULL,   -- الكمية لكل وحدة إنتاج
    UnitID              INT             REFERENCES Units(UnitID),
    IsOptional          BIT DEFAULT 0,
    AlternativeMaterialID INT           REFERENCES RawMaterials(RawMaterialID),
    WastagePercent      DECIMAL(5,2)    DEFAULT 0,  -- نسبة الهدر المتوقعة
    Notes               NVARCHAR(300)
);
GO

-- ============================================================
-- 14. أوامر التوزيع وإدارة الطلبات
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DistributionOrders' AND xtype='U')
CREATE TABLE DistributionOrders (
    DistOrderID         INT IDENTITY(1,1) PRIMARY KEY,
    DONumber            NVARCHAR(30)    NOT NULL UNIQUE,
    OrderDate           DATE            NOT NULL DEFAULT GETDATE(),
    CustomerID          INT             NOT NULL REFERENCES Customers(CustomerID),
    SalesInvoiceID      INT             REFERENCES SalesInvoices(InvoiceID),
    WarehouseID         INT             REFERENCES Warehouses(WarehouseID),
    Priority            NVARCHAR(20)    DEFAULT 'Normal',
    RequiredDate        DATE,
    ShipmentDate        DATE,
    DeliveryDate        DATE,
    Status              NVARCHAR(30)    DEFAULT 'Pending',
    -- Pending/Picking/Packed/Shipped/Delivered/Partial/Cancelled
    DeliveryAddress     NVARCHAR(500)   NOT NULL,
    ContactPerson       NVARCHAR(150),
    ContactPhone        NVARCHAR(30),
    ShippingMethod      NVARCHAR(50),   -- Express/Standard/Cold Chain
    TrackingNumber      NVARCHAR(100),
    CarrierName         NVARCHAR(100),
    DriverName          NVARCHAR(100),
    VehicleNumber       NVARCHAR(50),
    DeliveredBy         INT             REFERENCES Users(UserID),
    ReceivedByCustomer  NVARCHAR(150),  -- اسم المستلم في العميل
    DeliverySignature   NVARCHAR(500),  -- مسار صورة التوقيع
    TotalWeight         DECIMAL(10,2),
    SpecialInstructions NVARCHAR(500),
    Notes               NVARCHAR(1000),
    CreatedBy           INT             REFERENCES Users(UserID),
    CreatedDate         DATETIME        DEFAULT GETDATE()
);
GO

-- ============================================================
-- 15. تفاصيل أوامر التوزيع مع تتبع الدفعات
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DistributionOrderDetails' AND xtype='U')
CREATE TABLE DistributionOrderDetails (
    DODetailID          INT IDENTITY(1,1) PRIMARY KEY,
    DistOrderID         INT NOT NULL REFERENCES DistributionOrders(DistOrderID),
    ProductID           INT NOT NULL REFERENCES Products(ProductID),
    BatchID             INT             REFERENCES Batches(BatchID),
    RequestedQty        DECIMAL(18,4)   NOT NULL,
    PickedQty           DECIMAL(18,4)   DEFAULT 0,
    ShippedQty          DECIMAL(18,4)   DEFAULT 0,
    DeliveredQty        DECIMAL(18,4)   DEFAULT 0,
    ReturnedQty         DECIMAL(18,4)   DEFAULT 0,
    UnitPrice           DECIMAL(18,4),
    Status              NVARCHAR(20)    DEFAULT 'Pending'
);
GO

-- ============================================================
-- 16. تتبع مسار الدفعة الكامل (Traceability)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BatchTraceability' AND xtype='U')
CREATE TABLE BatchTraceability (
    TraceID             INT IDENTITY(1,1) PRIMARY KEY,
    BatchID             INT NOT NULL REFERENCES Batches(BatchID),
    EventType           NVARCHAR(50)    NOT NULL,
    -- Received / QC_Started / QC_Passed / QC_Failed / Released
    -- Allocated / Picked / Shipped / Delivered / Returned / Recalled
    EventDate           DATETIME        NOT NULL DEFAULT GETDATE(),
    EventBy             INT             REFERENCES Users(UserID),
    Quantity            DECIMAL(18,4),
    ReferenceType       NVARCHAR(30),   -- GRN / QCTest / DistOrder / Invoice
    ReferenceID         INT,
    ReferenceNumber     NVARCHAR(50),
    FromLocation        NVARCHAR(100),
    ToLocation          NVARCHAR(100),
    CustomerID          INT             REFERENCES Customers(CustomerID),
    Notes               NVARCHAR(500)
);
GO

-- ============================================================
-- 17. الاسترجاع/السحب (Recalls)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductRecalls' AND xtype='U')
CREATE TABLE ProductRecalls (
    RecallID            INT IDENTITY(1,1) PRIMARY KEY,
    RecallNumber        NVARCHAR(30)    NOT NULL UNIQUE,
    RecallDate          DATE            NOT NULL DEFAULT GETDATE(),
    RecallType          NVARCHAR(20)    DEFAULT 'Voluntary',
    -- Voluntary / Mandatory
    RecallLevel         NVARCHAR(20)    DEFAULT 'Class_I',
    -- Class_I (خطر صحي) / Class_II (محتمل) / Class_III (غير مؤذٍ)
    ProductID           INT             REFERENCES Products(ProductID),
    RawMaterialID       INT             REFERENCES RawMaterials(RawMaterialID),
    AffectedBatches     NVARCHAR(MAX),  -- قائمة أرقام الدفعات
    Reason              NVARCHAR(1000)  NOT NULL,
    ActionRequired      NVARCHAR(500),
    Status              NVARCHAR(30)    DEFAULT 'Open',
    -- Open / In Progress / Completed / Closed
    InitiatedBy         INT             REFERENCES Users(UserID),
    ClosedBy            INT             REFERENCES Users(UserID),
    ClosedDate          DATE,
    RegulatoryNotified  BIT DEFAULT 0,
    Notes               NVARCHAR(2000),
    CreatedDate         DATETIME        DEFAULT GETDATE()
);
GO

-- ============================================================
-- 18. تسجيل المسار لحركات المخزون
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SCStockMovements' AND xtype='U')
CREATE TABLE SCStockMovements (
    MovementID          INT IDENTITY(1,1) PRIMARY KEY,
    MovementDate        DATETIME        NOT NULL DEFAULT GETDATE(),
    MovementType        NVARCHAR(30)    NOT NULL,
    -- Purchase_Receipt / QC_Rejection / Adjustment / Distribution
    -- Return_Supplier / Return_Customer / Recall / Expired / Transfer
    RawMaterialID       INT             REFERENCES RawMaterials(RawMaterialID),
    ProductID           INT             REFERENCES Products(ProductID),
    BatchID             INT             REFERENCES Batches(BatchID),
    WarehouseID         INT             REFERENCES Warehouses(WarehouseID),
    Quantity            DECIMAL(18,4)   NOT NULL,
    Direction           CHAR(1)         NOT NULL CHECK (Direction IN ('+', '-')),
    BalanceBefore       DECIMAL(18,4),
    BalanceAfter        DECIMAL(18,4),
    ReferenceType       NVARCHAR(30),
    ReferenceID         INT,
    ReferenceNumber     NVARCHAR(50),
    PerformedBy         INT             REFERENCES Users(UserID),
    Notes               NVARCHAR(500)
);
GO

-- ============================================================
-- INDEXES للأداء
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Batches_ExpiryDate' AND object_id = OBJECT_ID('Batches'))
    CREATE INDEX IX_Batches_ExpiryDate ON Batches(ExpiryDate) WHERE Status = 'Active';
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Batches_QCStatus' AND object_id = OBJECT_ID('Batches'))
    CREATE INDEX IX_Batches_QCStatus ON Batches(QCStatus);
CREATE INDEX IX_BatchTraceability_BatchID ON BatchTraceability(BatchID);
CREATE INDEX IX_SCPurchaseOrders_Status ON SCPurchaseOrders(Status);
CREATE INDEX IX_DistributionOrders_Status ON DistributionOrders(Status);
CREATE INDEX IX_SCStockMovements_Date ON SCStockMovements(MovementDate);
GO

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- SP: الحصول على الدفعات المنتهية أو القريبة من الانتهاء
CREATE OR ALTER PROCEDURE sp_GetExpiringBatches
    @DaysAhead INT = 90
AS
BEGIN
    SELECT 
        b.BatchID, b.BatchNumber, b.BatchType,
        COALESCE(rm.RMName, p.ProductName) AS ItemName,
        b.CurrentQty, u.UnitName,
        b.ExpiryDate,
        DATEDIFF(day, GETDATE(), b.ExpiryDate) AS DaysUntilExpiry,
        b.QCStatus, b.Status,
        s.SupplierName,
        w.WarehouseName
    FROM Batches b
    LEFT JOIN RawMaterials rm ON b.RawMaterialID = rm.RawMaterialID
    LEFT JOIN Products p ON b.ProductID = p.ProductID
    LEFT JOIN Suppliers s ON b.SupplierID = s.SupplierID
    LEFT JOIN Warehouses w ON b.WarehouseID = w.WarehouseID
    LEFT JOIN Units u ON COALESCE(rm.UnitID, p.UnitID) = u.UnitID
    WHERE b.Status = 'Active'
      AND b.ExpiryDate <= DATEADD(day, @DaysAhead, GETDATE())
      AND b.CurrentQty > 0
    ORDER BY b.ExpiryDate ASC;
END
GO

-- SP: تتبع مسار دفعة كامل
CREATE OR ALTER PROCEDURE sp_BatchFullTrace
    @BatchID INT
AS
BEGIN
    SELECT 
        bt.TraceID,
        bt.EventType,
        bt.EventDate,
        u.FullName AS PerformedBy,
        bt.Quantity,
        bt.ReferenceType,
        bt.ReferenceNumber,
        bt.FromLocation,
        bt.ToLocation,
        c.CustomerName,
        bt.Notes
    FROM BatchTraceability bt
    LEFT JOIN Users u ON bt.EventBy = u.UserID
    LEFT JOIN Customers c ON bt.CustomerID = c.CustomerID
    WHERE bt.BatchID = @BatchID
    ORDER BY bt.EventDate ASC;
END
GO

-- SP: تقرير حالة المخزون من المواد الخام
CREATE OR ALTER PROCEDURE sp_RawMaterialStockReport
AS
BEGIN
    SELECT
        rm.RMCode, rm.RMName, rm.RMType,
        rm.CurrentStock,
        u.UnitName,
        rm.MinStockLevel, rm.ReorderPoint,
        CASE 
            WHEN rm.CurrentStock <= 0 THEN 'نفذ المخزون'
            WHEN rm.CurrentStock <= rm.MinStockLevel THEN 'أقل من الحد الأدنى'
            WHEN rm.CurrentStock <= rm.ReorderPoint THEN 'يحتاج طلب شراء'
            ELSE 'طبيعي'
        END AS StockStatus,
        COUNT(b.BatchID) AS ActiveBatches,
        MIN(b.ExpiryDate) AS NearestExpiry,
        rm.LastCostPrice,
        rm.CurrentStock * rm.LastCostPrice AS StockValue,
        s.SupplierName AS PreferredSupplier,
        rm.LeadTimeDays
    FROM RawMaterials rm
    LEFT JOIN Units u ON rm.UnitID = u.UnitID
    LEFT JOIN Batches b ON b.RawMaterialID = rm.RawMaterialID AND b.Status = 'Active'
    LEFT JOIN Suppliers s ON rm.PreferredSupplierID = s.SupplierID
    WHERE rm.IsActive = 1
    GROUP BY rm.RMCode, rm.RMName, rm.RMType, rm.CurrentStock, u.UnitName,
             rm.MinStockLevel, rm.ReorderPoint, rm.LastCostPrice, s.SupplierName, rm.LeadTimeDays
    ORDER BY StockStatus, rm.RMName;
END
GO

-- SP: لوحة تحكم سلسلة الإمداد
CREATE OR ALTER PROCEDURE sp_SupplyChainDashboard
AS
BEGIN
    SELECT
        -- طلبات شراء معلقة
        (SELECT COUNT(*) FROM PurchaseRequisitions WHERE Status = 'Pending') AS PendingRequisitions,
        -- أوامر شراء مفتوحة
        (SELECT COUNT(*) FROM SCPurchaseOrders WHERE Status IN ('Sent','Confirmed','Partially Received')) AS OpenPurchaseOrders,
        -- استلامات تحت الفحص
        (SELECT COUNT(*) FROM Batches WHERE QCStatus = 'Under Test') AS BatchesUnderQC,
        -- دفعات منتهية الصلاحية خلال 90 يوم
        (SELECT COUNT(*) FROM Batches WHERE Status='Active' AND DATEDIFF(day,GETDATE(),ExpiryDate) BETWEEN 0 AND 90) AS ExpiringBatches,
        -- طلبات توزيع معلقة
        (SELECT COUNT(*) FROM DistributionOrders WHERE Status IN ('Pending','Picking','Packed')) AS PendingDistribution,
        -- مواد خام منخفضة المخزون
        (SELECT COUNT(*) FROM RawMaterials WHERE IsActive=1 AND CurrentStock <= ReorderPoint AND CurrentStock > 0) AS LowStockMaterials,
        -- مواد خام نفذت
        (SELECT COUNT(*) FROM RawMaterials WHERE IsActive=1 AND CurrentStock <= 0) AS OutOfStockMaterials,
        -- قيمة المخزون الإجمالية
        (SELECT ISNULL(SUM(CurrentStock * LastCostPrice),0) FROM RawMaterials WHERE IsActive=1) AS TotalStockValue;
END
GO

-- ============================================================
-- بيانات افتراضية للمصنع
-- ============================================================

-- تصنيفات المواد الخام
IF NOT EXISTS (SELECT * FROM Categories WHERE CategoryName = 'Active Pharmaceutical Ingredients')
INSERT INTO Categories (CategoryName, CategoryNameAr, IsActive) VALUES
('Active Pharmaceutical Ingredients', 'مواد فعالة API', 1),
('Excipients', 'مواد مساعدة', 1),
('Packaging Materials', 'مواد تغليف', 1),
('Chemicals', 'كيماويات', 1),
('Solvents', 'مذيبات', 1);
GO

-- نماذج من مواد خام دوائية
IF NOT EXISTS (SELECT 1 FROM RawMaterials WHERE RMCode = 'API-001')
INSERT INTO RawMaterials 
(RMCode, RMName, RMNameAr, RMType, CASNumber, StorageConditions, MinTemperature, MaxTemperature, 
 MinStockLevel, ReorderPoint, MaxStockLevel, CurrentStock, LeadTimeDays, ShelfLifeDays, IsActive)
VALUES
('API-001', 'Amoxicillin Trihydrate', 'أموكسيسيلين ثلاثي الهيدرات', 'API', '61336-70-7', 
 'Store at 15-25°C in dry place', 15, 25, 50, 100, 500, 250, 14, 730, 1);

IF NOT EXISTS (SELECT 1 FROM RawMaterials WHERE RMCode = 'API-002')
INSERT INTO RawMaterials 
(RMCode, RMName, RMNameAr, RMType, CASNumber, StorageConditions, MinTemperature, MaxTemperature, 
 MinStockLevel, ReorderPoint, MaxStockLevel, CurrentStock, LeadTimeDays, ShelfLifeDays, IsActive)
VALUES
('API-002', 'Paracetamol (Acetaminophen)', 'باراسيتامول', 'API', '103-90-2', 
 'Store at room temperature', 10, 30, 100, 200, 1000, 450, 10, 1095, 1);

IF NOT EXISTS (SELECT 1 FROM RawMaterials WHERE RMCode = 'API-003')
INSERT INTO RawMaterials 
(RMCode, RMName, RMNameAr, RMType, CASNumber, StorageConditions, MinTemperature, MaxTemperature, 
 MinStockLevel, ReorderPoint, MaxStockLevel, CurrentStock, LeadTimeDays, ShelfLifeDays, IsActive)
VALUES
('API-003', 'Metformin HCl', 'ميتفورمين هيدروكلوريد', 'API', '1115-70-4', 
 'Store below 30°C', 5, 30, 50, 100, 600, 180, 14, 1095, 1);

IF NOT EXISTS (SELECT 1 FROM RawMaterials WHERE RMCode = 'EXC-001')
INSERT INTO RawMaterials 
(RMCode, RMName, RMNameAr, RMType, CASNumber, StorageConditions, MinTemperature, MaxTemperature, 
 MinStockLevel, ReorderPoint, MaxStockLevel, CurrentStock, LeadTimeDays, ShelfLifeDays, IsActive)
VALUES
('EXC-001', 'Microcrystalline Cellulose', 'سليولوز ميكروكريستالي', 'Excipient', '9004-34-6', 
 'Store in cool dry place', 10, 30, 200, 300, 2000, 800, 21, 1825, 1);

IF NOT EXISTS (SELECT 1 FROM RawMaterials WHERE RMCode = 'EXC-002')
INSERT INTO RawMaterials 
(RMCode, RMName, RMNameAr, RMType, CASNumber, StorageConditions, MinTemperature, MaxTemperature, 
 MinStockLevel, ReorderPoint, MaxStockLevel, CurrentStock, LeadTimeDays, ShelfLifeDays, IsActive)
VALUES
('EXC-002', 'Magnesium Stearate', 'ستيارات المغنيسيوم', 'Excipient', '557-04-0', 
 'Store in cool dry place', 10, 30, 50, 100, 500, 220, 21, 1825, 1);

IF NOT EXISTS (SELECT 1 FROM RawMaterials WHERE RMCode = 'PKG-001')
INSERT INTO RawMaterials 
(RMCode, RMName, RMNameAr, RMType, CASNumber, StorageConditions, MinTemperature, MaxTemperature, 
 MinStockLevel, ReorderPoint, MaxStockLevel, CurrentStock, LeadTimeDays, ShelfLifeDays, IsActive)
VALUES
('PKG-001', 'HDPE Bottles 100ml', 'زجاجات HDPE 100 مل', 'Packaging', NULL, 
 'Store away from heat', NULL, 40, 500, 1000, 10000, 3200, 30, 1825, 1);

IF NOT EXISTS (SELECT 1 FROM RawMaterials WHERE RMCode = 'PKG-002')
INSERT INTO RawMaterials 
(RMCode, RMName, RMNameAr, RMType, CASNumber, StorageConditions, MinTemperature, MaxTemperature, 
 MinStockLevel, ReorderPoint, MaxStockLevel, CurrentStock, LeadTimeDays, ShelfLifeDays, IsActive)
VALUES
('PKG-002', 'Blister Foil PVC/Aluminum', 'رقائق بليستر PVC/ألومنيوم', 'Packaging', NULL, 
 'Store in dry place', 10, 30, 100, 200, 2000, 600, 21, 1095, 1);
GO

PRINT '✅ تم إنشاء قاعدة بيانات سلاسل الإمداد بنجاح';
PRINT '   الصناعات الكيماوية السودانية';
GO
