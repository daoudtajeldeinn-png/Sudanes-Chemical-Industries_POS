using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using POSSystem.Models;

namespace POSSystem.DAL
{
    // ============================================================
    //  إدارة المشتريات
    // ============================================================
    public class PurchaseDAL
    {
        public static int SaveInvoice(PurchaseInvoice invoice)
        {
            int invoiceID = invoice.InvoiceID;

            DatabaseHelper.ExecuteTransaction((conn, tran) =>
            {
                if (invoiceID == 0)
                {
                    if (string.IsNullOrEmpty(invoice.InvoiceNumber))
                        invoice.InvoiceNumber = DatabaseHelper.GetNextNumber("PURCHASE");

                    string sqlHeader = @"
                        INSERT INTO PurchaseInvoices
                            (InvoiceNumber, SupplierInvoice, InvoiceDate, SupplierID, WarehouseID, UserID,
                             SubTotal, DiscountAmount, TaxAmount, TotalAmount, PaidAmount, RemainingAmount,
                             PaymentMethod, Status, Notes, Currency, ExchangeRate)
                        OUTPUT INSERTED.InvoiceID
                        VALUES
                            (@InvoiceNumber, @SupplierInvoice, @InvoiceDate, @SupplierID, @WarehouseID, @UserID,
                             @SubTotal, @DiscountAmount, @TaxAmount, @TotalAmount, @PaidAmount, @RemainingAmount,
                             @PaymentMethod, @Status, @Notes, @Currency, @ExchangeRate)";

                    using (var cmd = new SqlCommand(sqlHeader, conn, tran))
                    {
                        cmd.Parameters.AddWithValue("@InvoiceNumber",  invoice.InvoiceNumber);
                        cmd.Parameters.AddWithValue("@SupplierInvoice",invoice.SupplierInvoice ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@InvoiceDate",    invoice.InvoiceDate);
                        cmd.Parameters.AddWithValue("@SupplierID",     invoice.SupplierID);
                        cmd.Parameters.AddWithValue("@WarehouseID",    invoice.WarehouseID);
                        cmd.Parameters.AddWithValue("@UserID",         invoice.UserID);
                        cmd.Parameters.AddWithValue("@SubTotal",       invoice.SubTotal);
                        cmd.Parameters.AddWithValue("@DiscountAmount", invoice.DiscountAmount);
                        cmd.Parameters.AddWithValue("@TaxAmount",      invoice.TaxAmount);
                        cmd.Parameters.AddWithValue("@TotalAmount",    invoice.TotalAmount);
                        cmd.Parameters.AddWithValue("@PaidAmount",     invoice.PaidAmount);
                        cmd.Parameters.AddWithValue("@RemainingAmount",invoice.RemainingAmount);
                        cmd.Parameters.AddWithValue("@PaymentMethod",  invoice.PaymentMethod);
                        cmd.Parameters.AddWithValue("@Status",         invoice.Status);
                        cmd.Parameters.AddWithValue("@Notes",          invoice.Notes ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Currency",       invoice.Currency ?? "SDG");
                        cmd.Parameters.AddWithValue("@ExchangeRate",   invoice.ExchangeRate);
                        invoiceID = (int)cmd.ExecuteScalar();
                    }
                }
                else
                {
                    // Reverse old stock and balance if updating
                    var oldInv = GetInvoiceByID(invoiceID);
                    if (oldInv != null)
                    {
                        foreach (var item in oldInv.Items)
                        {
                            using (var cmd = new SqlCommand("sp_UpdateStock", conn, tran))
                            {
                                cmd.CommandType = CommandType.StoredProcedure;
                                cmd.Parameters.AddWithValue("@ProductID",   item.ProductID);
                                cmd.Parameters.AddWithValue("@WarehouseID", oldInv.WarehouseID);
                                cmd.Parameters.AddWithValue("@Quantity",    -item.Quantity);
                                cmd.Parameters.AddWithValue("@MovementType", "UPDATE_REVERSE");
                                cmd.Parameters.AddWithValue("@ReferenceType","PURCHASE");
                                cmd.Parameters.AddWithValue("@ReferenceID",  invoiceID);
                                cmd.Parameters.AddWithValue("@UserID",       invoice.UserID);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        // Revert supplier balance
                        if (oldInv.RemainingAmount > 0)
                        {
                            using (var cmd = new SqlCommand("UPDATE Suppliers SET CurrentBalance = CurrentBalance - @Amt WHERE SupplierID = @SID", conn, tran))
                            {
                                cmd.Parameters.AddWithValue("@Amt", oldInv.RemainingAmount);
                                cmd.Parameters.AddWithValue("@SID", oldInv.SupplierID);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        // Delete old details
                        using (var cmd = new SqlCommand("DELETE FROM PurchaseInvoiceDetails WHERE InvoiceID = @ID", conn, tran))
                        {
                            cmd.Parameters.AddWithValue("@ID", invoiceID);
                            cmd.ExecuteNonQuery();
                        }

                        // Update Header
                        string sqlUpdate = @"
                            UPDATE PurchaseInvoices SET
                                SupplierInvoice=@SupplierInvoice, SupplierID=@SupplierID, Notes=@Notes,
                                SubTotal=@SubTotal, TaxAmount=@TaxAmount, TotalAmount=@TotalAmount,
                                RemainingAmount=@RemainingAmount, PaidAmount=@PaidAmount,
                                Currency=@Currency, ExchangeRate=@ExchangeRate, UpdatedAt=GETDATE()
                            WHERE InvoiceID=@ID";
                        
                        using (var cmd = new SqlCommand(sqlUpdate, conn, tran))
                        {
                            cmd.Parameters.AddWithValue("@ID", invoiceID);
                            cmd.Parameters.AddWithValue("@SupplierInvoice", invoice.SupplierInvoice ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@SupplierID", invoice.SupplierID);
                            cmd.Parameters.AddWithValue("@Notes", invoice.Notes ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@SubTotal", invoice.SubTotal);
                            cmd.Parameters.AddWithValue("@TaxAmount", invoice.TaxAmount);
                            cmd.Parameters.AddWithValue("@TotalAmount", invoice.TotalAmount);
                            cmd.Parameters.AddWithValue("@RemainingAmount", invoice.RemainingAmount);
                            cmd.Parameters.AddWithValue("@PaidAmount", invoice.PaidAmount);
                            cmd.Parameters.AddWithValue("@Currency", invoice.Currency);
                            cmd.Parameters.AddWithValue("@ExchangeRate", invoice.ExchangeRate);
                            cmd.ExecuteNonQuery();
                        }
                    }
                }

                DatabaseHelper.LogAction(invoice.UserID, "PURCHASE_INV", $"Saved Invoice {invoice.InvoiceNumber}");

                foreach (var item in invoice.Items)
                {
                    string sqlDetail = @"
                        INSERT INTO PurchaseInvoiceDetails
                            (InvoiceID, ProductID, Quantity, UnitCost, TaxRate, TaxAmount, TotalCost)
                        VALUES (@InvoiceID, @ProductID, @Quantity, @UnitCost, @TaxRate, @TaxAmount, @TotalCost)";

                    using (var cmd = new SqlCommand(sqlDetail, conn, tran))
                    {
                        cmd.Parameters.AddWithValue("@InvoiceID",  invoiceID);
                        cmd.Parameters.AddWithValue("@ProductID",  item.ProductID);
                        cmd.Parameters.AddWithValue("@Quantity",   item.Quantity);
                        cmd.Parameters.AddWithValue("@UnitCost",   item.UnitCost);
                        cmd.Parameters.AddWithValue("@TaxRate",    item.TaxRate);
                        cmd.Parameters.AddWithValue("@TaxAmount",  item.TaxAmount);
                        cmd.Parameters.AddWithValue("@TotalCost",  item.TotalCost);
                        cmd.ExecuteNonQuery();
                    }

                    using (var cmd = new SqlCommand("sp_UpdateStock", conn, tran))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@ProductID",     item.ProductID);
                        cmd.Parameters.AddWithValue("@WarehouseID",   invoice.WarehouseID);
                        cmd.Parameters.AddWithValue("@Quantity",      item.Quantity);
                        cmd.Parameters.AddWithValue("@MovementType",  "IN");
                        cmd.Parameters.AddWithValue("@ReferenceType", "PURCHASE");
                        cmd.Parameters.AddWithValue("@ReferenceID",   invoiceID);
                        cmd.Parameters.AddWithValue("@UnitCost",      item.UnitCost);
                        cmd.Parameters.AddWithValue("@Notes",         DBNull.Value);
                        cmd.Parameters.AddWithValue("@UserID",        invoice.UserID);
                        cmd.ExecuteNonQuery();
                    }

                    using (var cmd = new SqlCommand("UPDATE Products SET CostPrice=@Cost, UpdatedAt=GETDATE() WHERE ProductID=@PID", conn, tran))
                    {
                        cmd.Parameters.AddWithValue("@Cost", item.UnitCost);
                        cmd.Parameters.AddWithValue("@PID",  item.ProductID);
                        cmd.ExecuteNonQuery();
                    }
                }

                if (invoice.RemainingAmount > 0)
                {
                    using (var cmd = new SqlCommand("UPDATE Suppliers SET CurrentBalance = CurrentBalance + @Amt WHERE SupplierID = @SID", conn, tran))
                    {
                        cmd.Parameters.AddWithValue("@Amt", invoice.RemainingAmount);
                        cmd.Parameters.AddWithValue("@SID", invoice.SupplierID);
                        cmd.ExecuteNonQuery();
                    }
                }
            });

            return invoiceID;
        }

        public static DataTable GetInvoices(DateTime? fromDate = null, DateTime? toDate = null,
                                             int? supplierID = null)
        {
            string sql = @"
                SELECT pi.InvoiceID, pi.InvoiceNumber, pi.SupplierInvoice, pi.InvoiceDate,
                       s.SupplierName, pi.SubTotal, pi.DiscountAmount, pi.TaxAmount,
                       pi.TotalAmount, pi.PaidAmount, pi.RemainingAmount,
                       pi.PaymentMethod, pi.Status, u.FullName AS UserName
                FROM PurchaseInvoices pi
                INNER JOIN Suppliers s ON pi.SupplierID = s.SupplierID
                INNER JOIN Users u ON pi.UserID = u.UserID
                WHERE (@FromDate IS NULL OR CAST(pi.InvoiceDate AS DATE) >= @FromDate)
                  AND (@ToDate IS NULL OR CAST(pi.InvoiceDate AS DATE) <= @ToDate)
                  AND (@SupplierID IS NULL OR pi.SupplierID = @SupplierID)
                ORDER BY pi.InvoiceDate DESC";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@FromDate",   fromDate.HasValue ? (object)fromDate.Value.Date : DBNull.Value),
                new SqlParameter("@ToDate",     toDate.HasValue ? (object)toDate.Value.Date : DBNull.Value),
                new SqlParameter("@SupplierID", supplierID.HasValue ? (object)supplierID.Value : DBNull.Value));
        }

        public static PurchaseInvoice GetInvoiceByID(int id)
        {
            var dt = DatabaseHelper.ExecuteQuery("SELECT pi.*, s.SupplierName, u.FullName AS UserName FROM PurchaseInvoices pi INNER JOIN Suppliers s ON pi.SupplierID = s.SupplierID INNER JOIN Users u ON pi.UserID = u.UserID WHERE pi.InvoiceID=@ID", new SqlParameter("@ID", id));
            if (dt.Rows.Count == 0) return null;
            var row = dt.Rows[0];
            var inv = new PurchaseInvoice {
                InvoiceID = (int)row["InvoiceID"],
                InvoiceNumber = row["InvoiceNumber"].ToString(),
                SupplierInvoice = row["SupplierInvoice"]?.ToString(),
                InvoiceDate = (DateTime)row["InvoiceDate"],
                SupplierID = (int)row["SupplierID"],
                WarehouseID = (int)row["WarehouseID"],
                UserID = (int)row["UserID"],
                SubTotal = (decimal)row["SubTotal"],
                DiscountAmount = (decimal)row["DiscountAmount"],
                TaxAmount = (decimal)row["TaxAmount"],
                TotalAmount = (decimal)row["TotalAmount"],
                PaidAmount = (decimal)row["PaidAmount"],
                RemainingAmount = (decimal)row["RemainingAmount"],
                PaymentMethod = row["PaymentMethod"]?.ToString(),
                Status = row["Status"]?.ToString(),
                Notes = row["Notes"]?.ToString(),
                Currency = row["Currency"]?.ToString(),
                ExchangeRate = (decimal)row["ExchangeRate"],
                Items = new List<PurchaseItem>()
            };

            var dtd = DatabaseHelper.ExecuteQuery("SELECT pd.*, p.ProductName FROM PurchaseInvoiceDetails pd INNER JOIN Products p ON pd.ProductID = p.ProductID WHERE pd.InvoiceID=@ID", new SqlParameter("@ID", id));
            foreach (DataRow r in dtd.Rows)
            {
                inv.Items.Add(new PurchaseItem {
                    ProductID = (int)r["ProductID"],
                    ProductName = r["ProductName"].ToString(),
                    Quantity = (decimal)r["Quantity"],
                    UnitCost = (decimal)r["UnitCost"],
                    TaxRate = (decimal)r["TaxRate"]
                });
            }
            return inv;
        }
    }

    // ============================================================
    //  إدارة العملاء
    // ============================================================
    public class CustomerDAL
    {
        public static DataTable GetAll(string search = "", bool activeOnly = true)
        {
            string sql = @"
                SELECT c.CustomerID, c.CustomerCode, c.CustomerName, 
                       g.GroupName, c.Phone, c.Email, c.Address,
                       c.CreditLimit, c.CurrentBalance, c.IsActive
                FROM Customers c
                LEFT JOIN CustomerGroups g ON c.GroupID = g.GroupID
                WHERE (@ActiveOnly = 0 OR c.IsActive = 1)
                  AND (@Search = '' OR c.CustomerName LIKE @Like 
                       OR c.CustomerCode LIKE @Like OR c.Phone LIKE @Like)
                ORDER BY c.CustomerName";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@Search",     search ?? ""),
                new SqlParameter("@Like",       $"%{search}%"),
                new SqlParameter("@ActiveOnly", activeOnly ? 1 : 0));
        }

        public static int Save(Customer customer)
        {
            if (customer.CustomerID == 0)
            {
                if (string.IsNullOrEmpty(customer.CustomerCode))
                {
                    var seq = DatabaseHelper.ExecuteScalar(
                        "SELECT ISNULL(MAX(CustomerID),0)+1 FROM Customers");
                    customer.CustomerCode = "CUST-" + seq.ToString().PadLeft(5, '0');
                }

                string sql = @"
                    INSERT INTO Customers (CustomerCode, CustomerName, CustomerNameAr, GroupID, Phone, Mobile, Email,
                        Address, City, TaxNumber, CreditLimit, Notes, IsActive, DateAdded)
                    OUTPUT INSERTED.CustomerID
                    VALUES (@Code, @Name, @NameAr, @GroupID, @Phone, @Mobile, @Email,
                        @Address, @City, @TaxNum, @CreditLimit, @Notes, @IsActive, GETDATE())";

                return (int)DatabaseHelper.ExecuteScalar(sql,
                    new SqlParameter("@Code",        customer.CustomerCode),
                    new SqlParameter("@Name",        customer.CustomerName),
                    new SqlParameter("@NameAr",      customer.CustomerNameAr ?? (object)DBNull.Value),
                    new SqlParameter("@GroupID",     customer.GroupID.HasValue ? (object)customer.GroupID.Value : DBNull.Value),
                    new SqlParameter("@Phone",       customer.Phone ?? (object)DBNull.Value),
                    new SqlParameter("@Mobile",      customer.Mobile ?? (object)DBNull.Value),
                    new SqlParameter("@Email",       customer.Email ?? (object)DBNull.Value),
                    new SqlParameter("@Address",     customer.Address ?? (object)DBNull.Value),
                    new SqlParameter("@City",        customer.City ?? (object)DBNull.Value),
                    new SqlParameter("@TaxNum",      customer.TaxNumber ?? (object)DBNull.Value),
                    new SqlParameter("@CreditLimit", customer.CreditLimit),
                    new SqlParameter("@Notes",       customer.Notes ?? (object)DBNull.Value),
                    new SqlParameter("@IsActive",    customer.IsActive));
            }
            else
            {
                string sql = @"
                    UPDATE Customers SET CustomerCode=@Code, CustomerName=@Name, CustomerNameAr=@NameAr,
                        GroupID=@GroupID, Phone=@Phone, Mobile=@Mobile, Email=@Email,
                        Address=@Address, City=@City, TaxNumber=@TaxNum, CreditLimit=@CreditLimit,
                        Notes=@Notes, IsActive=@IsActive
                    WHERE CustomerID=@ID";

                DatabaseHelper.ExecuteNonQuery(sql,
                    new SqlParameter("@ID",          customer.CustomerID),
                    new SqlParameter("@Code",        customer.CustomerCode),
                    new SqlParameter("@Name",        customer.CustomerName),
                    new SqlParameter("@NameAr",      customer.CustomerNameAr ?? (object)DBNull.Value),
                    new SqlParameter("@GroupID",     customer.GroupID.HasValue ? (object)customer.GroupID.Value : DBNull.Value),
                    new SqlParameter("@Phone",       customer.Phone ?? (object)DBNull.Value),
                    new SqlParameter("@Mobile",      customer.Mobile ?? (object)DBNull.Value),
                    new SqlParameter("@Email",       customer.Email ?? (object)DBNull.Value),
                    new SqlParameter("@Address",     customer.Address ?? (object)DBNull.Value),
                    new SqlParameter("@City",        customer.City ?? (object)DBNull.Value),
                    new SqlParameter("@TaxNum",      customer.TaxNumber ?? (object)DBNull.Value),
                    new SqlParameter("@CreditLimit", customer.CreditLimit),
                    new SqlParameter("@Notes",       customer.Notes ?? (object)DBNull.Value),
                    new SqlParameter("@IsActive",    customer.IsActive));
                return customer.CustomerID;
            }
        }

        public static Customer GetByID(int id)
        {
            var dt = DatabaseHelper.ExecuteQuery("SELECT * FROM Customers WHERE CustomerID=@ID", new SqlParameter("@ID", id));
            if (dt.Rows.Count == 0) return null;
            var row = dt.Rows[0];
            return new Customer {
                CustomerID = (int)row["CustomerID"],
                CustomerCode = row["CustomerCode"]?.ToString(),
                CustomerName = row["CustomerName"]?.ToString(),
                CustomerNameAr = row["CustomerNameAr"]?.ToString(),
                GroupID = row["GroupID"] == DBNull.Value ? (int?)null : (int)row["GroupID"],
                Phone = row["Phone"]?.ToString(),
                Mobile = row["Mobile"]?.ToString(),
                Email = row["Email"]?.ToString(),
                Address = row["Address"]?.ToString(),
                City = row["City"]?.ToString(),
                TaxNumber = row["TaxNumber"]?.ToString(),
                CreditLimit = (decimal)row["CreditLimit"],
                CurrentBalance = (decimal)row["CurrentBalance"],
                Notes = row["Notes"]?.ToString(),
                IsActive = (bool)row["IsActive"]
            };
        }

        public static bool Delete(int id)
        {
            return DatabaseHelper.ExecuteNonQuery("UPDATE Customers SET IsActive=0 WHERE CustomerID=@ID", new SqlParameter("@ID", id)) > 0;
        }

        public static DataTable GetStatements(int customerID, DateTime? from = null, DateTime? to = null)
        {
            string sql = @"
                SELECT si.InvoiceDate AS [التاريخ], si.InvoiceNumber AS [رقم الفاتورة],
                       si.TotalAmount AS [المبلغ], si.PaidAmount AS [المدفوع],
                       si.RemainingAmount AS [المتبقي], si.Status AS [الحالة]
                FROM SalesInvoices si
                WHERE si.CustomerID = @CustomerID
                  AND (@From IS NULL OR CAST(si.InvoiceDate AS DATE) >= @From)
                  AND (@To IS NULL OR CAST(si.InvoiceDate AS DATE) <= @To)
                ORDER BY si.InvoiceDate DESC";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@CustomerID", customerID),
                new SqlParameter("@From", from.HasValue ? (object)from.Value.Date : DBNull.Value),
                new SqlParameter("@To",   to.HasValue ? (object)to.Value.Date : DBNull.Value));
        }

        public static DataTable GetGroups()
        {
            return DatabaseHelper.ExecuteQuery(
                "SELECT GroupID, GroupName FROM CustomerGroups WHERE IsActive=1 ORDER BY GroupName");
        }
    }

    // ============================================================
    //  إدارة الموردين
    // ============================================================
    public class SupplierDAL
    {
        public static DataTable GetAll(string search = "")
        {
            string sql = @"
                SELECT SupplierID, SupplierCode, SupplierName, Phone, Email,
                       Address, TaxNumber, CurrentBalance, IsActive
                FROM Suppliers
                WHERE IsActive = 1
                  AND (@Search = '' OR SupplierName LIKE @Like OR SupplierCode LIKE @Like)
                ORDER BY SupplierName";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@Search", search ?? ""),
                new SqlParameter("@Like",   $"%{search}%"));
        }

        public static int Save(Supplier supplier)
        {
            if (supplier.SupplierID == 0)
            {
                if (string.IsNullOrEmpty(supplier.SupplierCode))
                {
                    var seq = DatabaseHelper.ExecuteScalar(
                        "SELECT ISNULL(MAX(SupplierID),0)+1 FROM Suppliers");
                    supplier.SupplierCode = "SUPP-" + seq.ToString().PadLeft(4, '0');
                }

                return (int)DatabaseHelper.ExecuteScalar(@"
                    INSERT INTO Suppliers (SupplierCode, SupplierName, Phone, Email, Address, TaxNumber)
                    OUTPUT INSERTED.SupplierID
                    VALUES (@Code, @Name, @Phone, @Email, @Address, @TaxNum)",
                    new SqlParameter("@Code",    supplier.SupplierCode),
                    new SqlParameter("@Name",    supplier.SupplierName),
                    new SqlParameter("@Phone",   supplier.Phone ?? (object)DBNull.Value),
                    new SqlParameter("@Email",   supplier.Email ?? (object)DBNull.Value),
                    new SqlParameter("@Address", supplier.Address ?? (object)DBNull.Value),
                    new SqlParameter("@TaxNum",  supplier.TaxNumber ?? (object)DBNull.Value));
            }
            else
            {
                DatabaseHelper.ExecuteNonQuery(@"
                    UPDATE Suppliers SET SupplierName=@Name, Phone=@Phone, Email=@Email,
                    Address=@Address, TaxNumber=@TaxNum WHERE SupplierID=@ID",
                    new SqlParameter("@ID",      supplier.SupplierID),
                    new SqlParameter("@Name",    supplier.SupplierName),
                    new SqlParameter("@Phone",   supplier.Phone ?? (object)DBNull.Value),
                    new SqlParameter("@Email",   supplier.Email ?? (object)DBNull.Value),
                    new SqlParameter("@Address", supplier.Address ?? (object)DBNull.Value),
                    new SqlParameter("@TaxNum",  supplier.TaxNumber ?? (object)DBNull.Value));
                return supplier.SupplierID;
            }
        }

        public static Supplier GetByID(int id)
        {
            var dt = DatabaseHelper.ExecuteQuery("SELECT * FROM Suppliers WHERE SupplierID=@ID", new SqlParameter("@ID", id));
            if (dt.Rows.Count == 0) return null;
            var row = dt.Rows[0];
            return new Supplier {
                SupplierID = (int)row["SupplierID"],
                SupplierCode = row["SupplierCode"]?.ToString(),
                SupplierName = row["SupplierName"]?.ToString(),
                Phone = row["Phone"]?.ToString(),
                Email = row["Email"]?.ToString(),
                Address = row["Address"]?.ToString(),
                TaxNumber = row["TaxNumber"]?.ToString(),
                CurrentBalance = (decimal)row["CurrentBalance"],
                IsActive = (bool)row["IsActive"]
            };
        }

        public static bool Delete(int id)
        {
            return DatabaseHelper.ExecuteNonQuery("UPDATE Suppliers SET IsActive=0 WHERE SupplierID=@ID", new SqlParameter("@ID", id)) > 0;
        }
    }

    // ============================================================
    //  المصروفات
    // ============================================================
    public class ExpenseDAL
    {
        public static DataTable GetAll(DateTime? from = null, DateTime? to = null, int? categoryID = null)
        {
            string sql = @"
                SELECT e.ExpenseID, e.ExpenseDate, ec.CategoryName,
                       e.Amount, e.Description, e.PaymentMethod, u.FullName AS UserName
                FROM Expenses e
                INNER JOIN ExpenseCategories ec ON e.CategoryID = ec.CategoryID
                INNER JOIN Users u ON e.UserID = u.UserID
                WHERE (@From IS NULL OR CAST(e.ExpenseDate AS DATE) >= @From)
                  AND (@To IS NULL OR CAST(e.ExpenseDate AS DATE) <= @To)
                  AND (@CategoryID IS NULL OR e.CategoryID = @CategoryID)
                ORDER BY e.ExpenseDate DESC";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@From",       from.HasValue ? (object)from.Value.Date : DBNull.Value),
                new SqlParameter("@To",         to.HasValue ? (object)to.Value.Date : DBNull.Value),
                new SqlParameter("@CategoryID", categoryID.HasValue ? (object)categoryID.Value : DBNull.Value));
        }

        public static bool Save(Expense expense, int userID)
        {
            return DatabaseHelper.ExecuteNonQuery(@"
                INSERT INTO Expenses (ExpenseDate, CategoryID, Amount, Description, PaymentMethod, UserID, Notes)
                VALUES (@Date, @CategoryID, @Amount, @Desc, @PayMethod, @UserID, @Notes)",
                new SqlParameter("@Date",      expense.ExpenseDate),
                new SqlParameter("@CategoryID",expense.CategoryID),
                new SqlParameter("@Amount",    expense.Amount),
                new SqlParameter("@Desc",      expense.Description ?? (object)DBNull.Value),
                new SqlParameter("@PayMethod", expense.PaymentMethod),
                new SqlParameter("@UserID",    userID),
                new SqlParameter("@Notes",     expense.Notes ?? (object)DBNull.Value)) > 0;
        }

        public static Expense GetByID(int id)
        {
            var dt = DatabaseHelper.ExecuteQuery("SELECT * FROM Expenses WHERE ExpenseID=@ID", new SqlParameter("@ID", id));
            if (dt.Rows.Count == 0) return null;
            var row = dt.Rows[0];
            return new Expense {
                ExpenseID = (int)row["ExpenseID"],
                ExpenseDate = (DateTime)row["ExpenseDate"],
                CategoryID = (int)row["CategoryID"],
                Amount = (decimal)row["Amount"],
                Description = row["Description"]?.ToString(),
                PaymentMethod = row["PaymentMethod"]?.ToString(),
                Notes = row["Notes"]?.ToString()
            };
        }

        public static bool Delete(int id)
        {
            return DatabaseHelper.ExecuteNonQuery("DELETE FROM Expenses WHERE ExpenseID=@ID", new SqlParameter("@ID", id)) > 0;
        }

        public static DataTable GetCategories()
        {
            return DatabaseHelper.ExecuteQuery(
                "SELECT CategoryID, CategoryName FROM ExpenseCategories WHERE IsActive=1 ORDER BY CategoryName");
        }
    }

    // ============================================================
    //  التقارير
    // ============================================================
    public class ReportsDAL
    {
        public static DataTable GetProfitLoss(DateTime from, DateTime to, int? warehouseID = null)
        {
            return DatabaseHelper.ExecuteStoredProcedure("sp_ProfitLossReport",
                new SqlParameter("@StartDate",   from.Date),
                new SqlParameter("@EndDate",     to.Date),
                new SqlParameter("@WarehouseID", warehouseID.HasValue ? (object)warehouseID.Value : DBNull.Value));
        }

        public static DataTable GetSalesByPeriod(DateTime from, DateTime to, string groupBy = "DAY")
        {
            string dateFormat = groupBy == "MONTH" ? "yyyy-MM" : "yyyy-MM-dd";
            string sql = @"
                SELECT 
                    FORMAT(InvoiceDate, @DateFormat) AS Period,
                    COUNT(*) AS InvoiceCount,
                    SUM(TotalAmount) AS TotalSales,
                    SUM(TaxAmount) AS TotalVAT,
                    SUM(DiscountAmount) AS TotalDiscount
                FROM SalesInvoices
                WHERE CAST(InvoiceDate AS DATE) BETWEEN @From AND @To
                  AND Status != 'CANCELLED'
                GROUP BY FORMAT(InvoiceDate, @DateFormat)
                ORDER BY Period";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@DateFormat", dateFormat),
                new SqlParameter("@From",       from.Date),
                new SqlParameter("@To",         to.Date));
        }

        public static DataTable GetCustomerBalance()
        {
            string sql = @"
                SELECT CustomerCode, CustomerName, Phone, 
                       CurrentBalance AS [الرصيد المستحق],
                       CreditLimit AS [حد الائتمان]
                FROM Customers 
                WHERE CurrentBalance > 0 AND IsActive = 1
                ORDER BY CurrentBalance DESC";
            return DatabaseHelper.ExecuteQuery(sql);
        }

        public static DataTable GetSupplierBalance()
        {
            string sql = @"
                SELECT SupplierCode, SupplierName, Phone,
                       CurrentBalance AS [الرصيد المستحق]
                FROM Suppliers
                WHERE CurrentBalance > 0 AND IsActive = 1
                ORDER BY CurrentBalance DESC";
            return DatabaseHelper.ExecuteQuery(sql);
        }

        public static DataTable GetVATReport(DateTime from, DateTime to)
        {
            string sql = @"
                SELECT 
                    FORMAT(InvoiceDate,'yyyy-MM') AS [الشهر],
                    COUNT(*) AS [عدد الفواتير],
                    SUM(SubTotal) AS [المبيعات قبل الضريبة],
                    SUM(TaxAmount) AS [ضريبة القيمة المضافة],
                    SUM(TotalAmount) AS [الإجمالي شامل الضريبة]
                FROM SalesInvoices
                WHERE CAST(InvoiceDate AS DATE) BETWEEN @From AND @To
                  AND Status != 'CANCELLED'
                GROUP BY FORMAT(InvoiceDate,'yyyy-MM')
                ORDER BY [الشهر]";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@From", from.Date),
                new SqlParameter("@To",   to.Date));
        }

        public static DataTable GetRecentSales(int count = 10)
        {
            string sql = $@"
                SELECT TOP {count} si.InvoiceNumber, c.CustomerName, si.TotalAmount, si.InvoiceDate, si.Status
                FROM SalesInvoices si
                INNER JOIN Customers c ON si.CustomerID = c.CustomerID
                ORDER BY si.InvoiceDate DESC";
            return DatabaseHelper.ExecuteQuery(sql);
        }
    }
}
