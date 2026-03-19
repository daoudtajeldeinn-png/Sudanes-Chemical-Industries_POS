using System;
using System.Data;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.Linq;
using POSSystem.Models;

namespace POSSystem.DAL
{
    public class SalesDAL
    {
        // حفظ فاتورة مبيعات كاملة
        public static string GetNextInvoiceNumber()
        {
            string prefix = "INV-" + DateTime.Now.ToString("yyyyMMdd") + "-";
            string sql = "SELECT TOP 1 InvoiceNumber FROM SalesInvoices WHERE InvoiceNumber LIKE @P + '%' ORDER BY InvoiceNumber DESC";
            var dt = DatabaseHelper.ExecuteQuery(sql, new SqlParameter("@P", prefix));
            
            int next = 1;
            if (dt.Rows.Count > 0)
            {
                string last = dt.Rows[0]["InvoiceNumber"].ToString();
                int.TryParse(last.Split('-').Last(), out next);
                next++;
            }
            return prefix + next.ToString("D4");
        }

        public static int SaveInvoice(SalesInvoice invoice)
        {
            int invoiceID = invoice.InvoiceID;

            DatabaseHelper.ExecuteTransaction((conn, tran) =>
            {
                if (invoiceID == 0)
                {
                    // الحصول على رقم الفاتورة
                    if (string.IsNullOrEmpty(invoice.InvoiceNumber))
                        invoice.InvoiceNumber = DatabaseHelper.GetNextNumber("SALE");

                    // إدراج الفاتورة الرئيسية
                    string sqlHeader = @"
                        INSERT INTO SalesInvoices 
                            (InvoiceNumber, InvoiceType, InvoiceDate, CustomerID, WarehouseID, UserID,
                             SubTotal, DiscountType, DiscountValue, DiscountAmount, TaxAmount, TotalAmount,
                             PaidAmount, RemainingAmount, PaymentMethod, Status, Notes)
                        OUTPUT INSERTED.InvoiceID
                        VALUES 
                            (@InvoiceNumber, @InvoiceType, @InvoiceDate, @CustomerID, @WarehouseID, @UserID,
                             @SubTotal, @DiscountType, @DiscountValue, @DiscountAmount, @TaxAmount, @TotalAmount,
                             @PaidAmount, @RemainingAmount, @PaymentMethod, @Status, @Notes)";


                    using (var cmd = new SqlCommand(sqlHeader, conn, tran))
                    {
                        cmd.Parameters.AddWithValue("@InvoiceNumber",  invoice.InvoiceNumber);
                        cmd.Parameters.AddWithValue("@InvoiceType",    invoice.InvoiceType);
                        cmd.Parameters.AddWithValue("@InvoiceDate",    invoice.InvoiceDate);
                        cmd.Parameters.AddWithValue("@CustomerID",     invoice.CustomerID.HasValue ? (object)invoice.CustomerID.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@WarehouseID",    invoice.WarehouseID);
                        cmd.Parameters.AddWithValue("@UserID",         invoice.UserID);
                        cmd.Parameters.AddWithValue("@SubTotal",       invoice.SubTotal);
                        cmd.Parameters.AddWithValue("@DiscountType",   invoice.DiscountType);
                        cmd.Parameters.AddWithValue("@DiscountValue",  invoice.DiscountValue);
                        cmd.Parameters.AddWithValue("@DiscountAmount", invoice.DiscountAmount);
                        cmd.Parameters.AddWithValue("@TaxAmount",      invoice.TaxAmount);
                        cmd.Parameters.AddWithValue("@TotalAmount",    invoice.TotalAmount);
                        cmd.Parameters.AddWithValue("@PaidAmount",     invoice.PaidAmount);
                        cmd.Parameters.AddWithValue("@RemainingAmount",invoice.RemainingAmount);
                        cmd.Parameters.AddWithValue("@PaymentMethod",  invoice.PaymentMethod);
                        cmd.Parameters.AddWithValue("@Status",         invoice.Status);
                        cmd.Parameters.AddWithValue("@Notes",          invoice.Notes ?? (object)DBNull.Value);

                        invoiceID = (int)cmd.ExecuteScalar();
                    }
                }
                else
                {
                    // Reverse old stock and balance
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
                                cmd.Parameters.AddWithValue("@Quantity",    item.Quantity); // Reverse OUT with IN (positive)
                                cmd.Parameters.AddWithValue("@MovementType", "UPDATE_REVERSE");
                                cmd.Parameters.AddWithValue("@ReferenceType","SALE");
                                cmd.Parameters.AddWithValue("@ReferenceID",  invoiceID);
                                cmd.Parameters.AddWithValue("@UserID",       invoice.UserID);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        if (oldInv.CustomerID.HasValue && oldInv.RemainingAmount > 0)
                        {
                            using (var cmd = new SqlCommand("UPDATE Customers SET CurrentBalance = CurrentBalance - @Amt WHERE CustomerID = @CID", conn, tran))
                            {
                                cmd.Parameters.AddWithValue("@Amt", oldInv.RemainingAmount);
                                cmd.Parameters.AddWithValue("@CID", oldInv.CustomerID.Value);
                                cmd.ExecuteNonQuery();
                            }
                        }

                        using (var cmd = new SqlCommand("DELETE FROM SalesInvoiceDetails WHERE InvoiceID = @ID", conn, tran))
                        {
                            cmd.Parameters.AddWithValue("@ID", invoiceID);
                            cmd.ExecuteNonQuery();
                        }

                        string sqlUpdate = @"
                            UPDATE SalesInvoices SET
                                CustomerID=@CustomerID, SubTotal=@SubTotal, DiscountAmount=@DiscountAmount,
                                TaxAmount=@TaxAmount, TotalAmount=@TotalAmount, PaidAmount=@PaidAmount,
                                RemainingAmount=@RemainingAmount, Status=@Status, Notes=@Notes, UpdatedAt=GETDATE()
                            WHERE InvoiceID=@ID";
                        
                        using (var cmd = new SqlCommand(sqlUpdate, conn, tran))
                        {
                            cmd.Parameters.AddWithValue("@ID", invoiceID);
                            cmd.Parameters.AddWithValue("@CustomerID", invoice.CustomerID.HasValue ? (object)invoice.CustomerID.Value : DBNull.Value);
                            cmd.Parameters.AddWithValue("@SubTotal", invoice.SubTotal);
                            cmd.Parameters.AddWithValue("@DiscountAmount", invoice.DiscountAmount);
                            cmd.Parameters.AddWithValue("@TaxAmount", invoice.TaxAmount);
                            cmd.Parameters.AddWithValue("@TotalAmount", invoice.TotalAmount);
                            cmd.Parameters.AddWithValue("@PaidAmount", invoice.PaidAmount);
                            cmd.Parameters.AddWithValue("@RemainingAmount", invoice.RemainingAmount);
                            cmd.Parameters.AddWithValue("@Status", invoice.Status);
                            cmd.Parameters.AddWithValue("@Notes", invoice.Notes ?? (object)DBNull.Value);
                            cmd.ExecuteNonQuery();
                        }
                    }
                }

                invoice.InvoiceID = invoiceID;

                // إدراج تفاصيل الفاتورة وتحديث المخزون
                string sqlDetail = @"
                    INSERT INTO SalesInvoiceDetails
                        (InvoiceID, ProductID, Quantity, UnitPrice, CostPrice, Discount, TaxRate, TaxAmount, TotalPrice, BatchID)
                    VALUES (@InvoiceID, @ProductID, @Quantity, @UnitPrice, @CostPrice, @Discount, @TaxRate, @TaxAmount, @TotalPrice, @BatchID)";

// string sqlStock = @"
//     EXEC sp_UpdateStock @ProductID, @WarehouseID, @Quantity, 'OUT', 'SALE', @RefID, @UnitCost, @Notes, @UserID";

                foreach (var item in invoice.Items)
                {
                    using (var cmd = new SqlCommand(sqlDetail, conn, tran))
                    {
                        cmd.Parameters.AddWithValue("@InvoiceID",  invoiceID);
                        cmd.Parameters.AddWithValue("@ProductID",  item.ProductID);
                        cmd.Parameters.AddWithValue("@Quantity",   item.Quantity);
                        cmd.Parameters.AddWithValue("@UnitPrice",  item.UnitPrice);
                        cmd.Parameters.AddWithValue("@CostPrice",  item.CostPrice);
                        cmd.Parameters.AddWithValue("@Discount",   item.Discount);
                        cmd.Parameters.AddWithValue("@TaxRate",    item.TaxRate);
                        cmd.Parameters.AddWithValue("@TaxAmount",  item.TaxAmount);
                        cmd.Parameters.AddWithValue("@TotalPrice", item.TotalPrice);
                        cmd.Parameters.AddWithValue("@BatchID",    (object)item.BatchID ?? DBNull.Value);
                        cmd.ExecuteNonQuery();
                    }

                    // تحديث المخزون (خصم)
                    using (var cmd = new SqlCommand("sp_UpdateStock", conn, tran))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@ProductID",     item.ProductID);
                        cmd.Parameters.AddWithValue("@WarehouseID",   invoice.WarehouseID);
                        cmd.Parameters.AddWithValue("@Quantity",      -item.Quantity);
                        cmd.Parameters.AddWithValue("@MovementType",  "OUT");
                        cmd.Parameters.AddWithValue("@ReferenceType", "SALE");
                        cmd.Parameters.AddWithValue("@ReferenceID",   invoiceID);
                        cmd.Parameters.AddWithValue("@UnitCost",      item.CostPrice);
                        cmd.Parameters.AddWithValue("@Notes",         DBNull.Value);
                        cmd.Parameters.AddWithValue("@UserID",        invoice.UserID);
                        cmd.ExecuteNonQuery();
                    }
                }

                // تحديث رصيد العميل إذا كانت آجل
                if (invoice.CustomerID.HasValue && invoice.RemainingAmount > 0)
                {
                    string sqlBalance = @"
                        UPDATE Customers SET CurrentBalance = CurrentBalance + @Amount 
                        WHERE CustomerID = @CustomerID";
                    using (var cmd = new SqlCommand(sqlBalance, conn, tran))
                    {
                        cmd.Parameters.AddWithValue("@Amount",     invoice.RemainingAmount);
                        cmd.Parameters.AddWithValue("@CustomerID", invoice.CustomerID.Value);
                        cmd.ExecuteNonQuery();
                    }
                }
            });

            return invoiceID;
        }

        public static DataTable GetInvoices(DateTime? fromDate = null, DateTime? toDate = null,
                                             int? customerID = null, string status = null,
                                             int? warehouseID = null)
        {
            string sql = @"
                SELECT si.InvoiceID, si.InvoiceNumber, si.InvoiceType, si.InvoiceDate,
                       ISNULL(c.CustomerName, N'نقدي') AS CustomerName,
                       si.SubTotal, si.DiscountAmount, si.TaxAmount, si.TotalAmount,
                       si.PaidAmount, si.RemainingAmount, si.PaymentMethod,
                       si.Status, u.FullName AS CashierName, si.Notes
                FROM SalesInvoices si
                LEFT JOIN Customers c ON si.CustomerID = c.CustomerID
                INNER JOIN Users u ON si.UserID = u.UserID
                WHERE (@FromDate IS NULL OR CAST(si.InvoiceDate AS DATE) >= @FromDate)
                  AND (@ToDate IS NULL OR CAST(si.InvoiceDate AS DATE) <= @ToDate)
                  AND (@CustomerID IS NULL OR si.CustomerID = @CustomerID)
                  AND (@Status IS NULL OR si.Status = @Status)
                  AND (@WarehouseID IS NULL OR si.WarehouseID = @WarehouseID)
                ORDER BY si.InvoiceDate DESC";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@FromDate",    fromDate.HasValue ? (object)fromDate.Value.Date : DBNull.Value),
                new SqlParameter("@ToDate",      toDate.HasValue ? (object)toDate.Value.Date : DBNull.Value),
                new SqlParameter("@CustomerID",  customerID.HasValue ? (object)customerID.Value : DBNull.Value),
                new SqlParameter("@Status",      status ?? (object)DBNull.Value),
                new SqlParameter("@WarehouseID", warehouseID.HasValue ? (object)warehouseID.Value : DBNull.Value));
        }

        public static SalesInvoice GetInvoiceByID(int invoiceID)
        {
            string sql = @"
                SELECT si.*, ISNULL(c.CustomerName,'') AS CustomerName, u.FullName AS UserName
                FROM SalesInvoices si
                LEFT JOIN Customers c ON si.CustomerID = c.CustomerID
                INNER JOIN Users u ON si.UserID = u.UserID
                WHERE si.InvoiceID = @InvoiceID";

            var dt = DatabaseHelper.ExecuteQuery(sql, new SqlParameter("@InvoiceID", invoiceID));
            if (dt.Rows.Count == 0) return null;

            var row = dt.Rows[0];
            var invoice = new SalesInvoice
            {
                Items = new List<SaleItem>(),
                InvoiceID       = (int)row["InvoiceID"],
                InvoiceNumber   = row["InvoiceNumber"].ToString(),
                InvoiceType     = row["InvoiceType"].ToString(),
                InvoiceDate     = (DateTime)row["InvoiceDate"],
                CustomerID      = row["CustomerID"] == DBNull.Value ? (int?)null : (int)row["CustomerID"],
                CustomerName    = row["CustomerName"].ToString(),
                SubTotal        = (decimal)row["SubTotal"],
                DiscountAmount  = (decimal)row["DiscountAmount"],
                TaxAmount       = (decimal)row["TaxAmount"],
                TotalAmount     = (decimal)row["TotalAmount"],
                PaidAmount      = (decimal)row["PaidAmount"],
                RemainingAmount = (decimal)row["RemainingAmount"],
                PaymentMethod   = row["PaymentMethod"].ToString(),
                Status          = row["Status"].ToString(),
                Notes           = row["Notes"]?.ToString(),
                UserName        = row["UserName"].ToString()
            };

            // تحميل التفاصيل
            string sqlDetails = @"
                SELECT sid.*, p.ProductName, p.ProductCode, b.BatchNumber
                FROM SalesInvoiceDetails sid
                INNER JOIN Products p ON sid.ProductID = p.ProductID
                LEFT JOIN Batches b ON sid.BatchID = b.BatchID
                WHERE sid.InvoiceID = @InvoiceID";

            var dtDetails = DatabaseHelper.ExecuteQuery(sqlDetails, new SqlParameter("@InvoiceID", invoiceID));
            foreach (DataRow dRow in dtDetails.Rows)
            {
                invoice.Items.Add(new SaleItem
                {
                    ProductID   = (int)dRow["ProductID"],
                    ProductCode = dRow["ProductCode"].ToString(),
                    ProductName = dRow["ProductName"].ToString(),
                    Quantity    = (decimal)dRow["Quantity"],
                    UnitPrice   = (decimal)dRow["UnitPrice"],
                    CostPrice   = (decimal)dRow["CostPrice"],
                    Discount    = (decimal)dRow["Discount"],
                    TaxRate     = (decimal)dRow["TaxRate"],
                    BatchID     = dRow["BatchID"] == DBNull.Value ? (int?)null : (int)dRow["BatchID"],
                    BatchNumber = dRow["BatchNumber"]?.ToString()
                });
            }

            return invoice;
        }

        public static bool CancelInvoice(int invoiceID, int userID)
        {
            DatabaseHelper.ExecuteTransaction((conn, tran) =>
            {
                // جلب تفاصيل الفاتورة
                string sqlDetails = @"
                    SELECT sid.ProductID, sid.Quantity, si.WarehouseID
                    FROM SalesInvoiceDetails sid
                    INNER JOIN SalesInvoices si ON sid.InvoiceID = si.InvoiceID
                    WHERE sid.InvoiceID = @InvoiceID AND si.Status != 'CANCELLED'";

                var dt = new DataTable();
                using (var cmd = new SqlCommand(sqlDetails, conn, tran))
                {
                    cmd.Parameters.AddWithValue("@InvoiceID", invoiceID);
                    using (var adapter = new SqlDataAdapter(cmd))
                        adapter.Fill(dt);
                }

                if (dt.Rows.Count == 0)
                    throw new Exception("الفاتورة غير موجودة أو ملغاة مسبقاً");

                int warehouseID = (int)dt.Rows[0]["WarehouseID"];

                // إعادة المخزون
                foreach (DataRow row in dt.Rows)
                {
                    using (var cmd = new SqlCommand("sp_UpdateStock", conn, tran))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@ProductID",     (int)row["ProductID"]);
                        cmd.Parameters.AddWithValue("@WarehouseID",   warehouseID);
                        cmd.Parameters.AddWithValue("@Quantity",      (decimal)row["Quantity"]);
                        cmd.Parameters.AddWithValue("@MovementType",  "IN");
                        cmd.Parameters.AddWithValue("@ReferenceType", "CANCEL");
                        cmd.Parameters.AddWithValue("@ReferenceID",   invoiceID);
                        cmd.Parameters.AddWithValue("@UnitCost",      DBNull.Value);
                        cmd.Parameters.AddWithValue("@Notes",         "إلغاء فاتورة");
                        cmd.Parameters.AddWithValue("@UserID",        userID);
                        cmd.ExecuteNonQuery();
                    }
                }

                // تحديث حالة الفاتورة
                using (var cmd = new SqlCommand(
                    "UPDATE SalesInvoices SET Status='CANCELLED' WHERE InvoiceID=@InvoiceID", conn, tran))
                {
                    cmd.Parameters.AddWithValue("@InvoiceID", invoiceID);
                    cmd.ExecuteNonQuery();
                }
            });

            return true;
        }

        public static DataTable GetDailySummary(DateTime date, int? warehouseID = null)
        {
            return DatabaseHelper.ExecuteStoredProcedure("sp_GetDailySummary",
                new SqlParameter("@Date",        date.Date),
                new SqlParameter("@WarehouseID", warehouseID.HasValue ? (object)warehouseID.Value : DBNull.Value));
        }

        public static DataTable GetTopProducts(DateTime fromDate, DateTime toDate, int top = 10)
        {
            string sql = @"
                SELECT TOP (@Top) p.ProductName,
                       SUM(sid.Quantity) AS TotalQty,
                       SUM(sid.TotalPrice) AS TotalRevenue,
                       SUM(sid.Quantity * sid.CostPrice) AS TotalCost,
                       SUM(sid.TotalPrice) - SUM(sid.Quantity * sid.CostPrice) AS GrossProfit
                FROM SalesInvoiceDetails sid
                INNER JOIN SalesInvoices si ON sid.InvoiceID = si.InvoiceID
                INNER JOIN Products p ON sid.ProductID = p.ProductID
                WHERE CAST(si.InvoiceDate AS DATE) BETWEEN @From AND @To
                  AND si.Status != 'CANCELLED'
                GROUP BY p.ProductID, p.ProductName
                ORDER BY TotalRevenue DESC";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@Top",  top),
                new SqlParameter("@From", fromDate.Date),
                new SqlParameter("@To",   toDate.Date));
        }
    }
}
