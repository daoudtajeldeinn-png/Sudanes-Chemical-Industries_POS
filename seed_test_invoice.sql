USE POSSystem;
GO

DECLARE @InvoiceID INT;
DECLARE @UserID INT = 1;
DECLARE @CustomerID INT = 1;
DECLARE @WarehouseID INT = 1;
DECLARE @ProductID INT = 1;
DECLARE @InvoiceNumber NVARCHAR(50) = 'TEST-' + FORMAT(GETDATE(), 'yyyyMMdd-HHmm');

-- 1. Insert into SalesInvoices
INSERT INTO SalesInvoices (
    InvoiceNumber, InvoiceType, InvoiceDate, CustomerID, UserID, WarehouseID,
    SubTotal, DiscountAmount, TaxAmount, TotalAmount, PaidAmount, RemainingAmount,
    PaymentMethod, Status, Notes
)
VALUES (
    @InvoiceNumber, 'SALE', GETDATE(), @CustomerID, @UserID, @WarehouseID,
    100.00, 0.00, 15.00, 115.00, 115.00, 0.00,
    'CASH', 'PAID', 'Test invoice for verification'
);

SET @InvoiceID = SCOPE_IDENTITY();

-- 2. Insert into SalesInvoiceDetails
-- Columns: InvoiceID, ProductID, Quantity, UnitPrice, CostPrice, Discount, TaxRate, TaxAmount, TotalPrice, Notes
INSERT INTO SalesInvoiceDetails (
    InvoiceID, ProductID, Quantity, UnitPrice, CostPrice, Discount, TaxRate, TaxAmount, TotalPrice, Notes
)
VALUES (
    @InvoiceID, @ProductID, 2, 50.00, 30.00, 0.00, 15.00, 15.00, 115.00, 'Test detail'
);

-- 3. Update ProductStock
UPDATE ProductStock 
SET Quantity = Quantity - 2, UpdatedAt = GETDATE()
WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;

-- 4. Insert into StockMovements
-- Columns: ProductID, WarehouseID, MovementType, ReferenceType, ReferenceID, Quantity, UnitCost, Notes, UserID, MovementDate
INSERT INTO StockMovements (
    ProductID, WarehouseID, MovementType, ReferenceType, ReferenceID, Quantity, UnitCost, Notes, UserID, MovementDate
)
VALUES (
    @ProductID, @WarehouseID, 'OUT', 'SALE', @InvoiceID, -2, 30.00, 'Test sale movement', @UserID, GETDATE()
);

SELECT 'Success' AS Status, @InvoiceNumber AS InvoiceNumber, @InvoiceID AS InvoiceID;
GO
