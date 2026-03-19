using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using POSSystem.Models;

namespace POSSystem.DAL
{
    public class ProductDAL
    {
        private static Product MapProduct(DataRow row)
        {
            return new Product
            {
                ProductID      = (int)row["ProductID"],
                ProductCode    = row["ProductCode"].ToString(),
                Barcode        = row["Barcode"]?.ToString(),
                ProductName    = row["ProductName"].ToString(),
                CategoryID     = row["CategoryID"] == DBNull.Value ? (int?)null : (int)row["CategoryID"],
                CategoryName   = row["CategoryName"]?.ToString(),
                UnitID         = row["UnitID"] == DBNull.Value ? (int?)null : (int)row["UnitID"],
                UnitName       = row["UnitName"]?.ToString(),
                CostPrice      = (decimal)row["CostPrice"],
                WholesalePrice = (decimal)row["WholesalePrice"],
                RetailPrice    = (decimal)row["RetailPrice"],
                TaxRate        = (decimal)row["TaxRate"],
                MinStock       = (decimal)row["MinStock"],
                AvailableStock = row.Table.Columns.Contains("AvailableStock")
                    ? (row["AvailableStock"] == DBNull.Value ? 0 : (decimal)row["AvailableStock"])
                    : 0,
                IsActive  = (bool)row["IsActive"],
                Description = row["Description"]?.ToString(),
                ProductImage = row.Table.Columns.Contains("ProductImage") && row["ProductImage"] != DBNull.Value
                    ? (byte[])row["ProductImage"] : null
            };
        }

        public static DataTable GetAllProducts(string search = "", int? categoryID = null, bool activeOnly = true)
        {
            string sql = @"
                SELECT p.ProductID, p.ProductCode, p.Barcode, p.ProductName,
                       p.CategoryID, c.CategoryName, p.UnitID, u.UnitName,
                       p.CostPrice, p.WholesalePrice, p.RetailPrice,
                       p.TaxRate, p.MinStock, p.IsActive, p.Description,
                       ISNULL(SUM(ps.Quantity), 0) AS AvailableStock
                FROM Products p
                LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
                LEFT JOIN Units u ON p.UnitID = u.UnitID
                LEFT JOIN ProductStock ps ON p.ProductID = ps.ProductID
                WHERE (@ActiveOnly = 0 OR p.IsActive = 1)
                  AND (@CategoryID IS NULL OR p.CategoryID = @CategoryID)
                  AND (@Search = '' OR p.ProductName LIKE @SearchLike 
                       OR p.ProductCode LIKE @SearchLike 
                       OR p.Barcode LIKE @SearchLike)
                GROUP BY p.ProductID, p.ProductCode, p.Barcode, p.ProductName,
                         p.CategoryID, c.CategoryName, p.UnitID, u.UnitName,
                         p.CostPrice, p.WholesalePrice, p.RetailPrice,
                         p.TaxRate, p.MinStock, p.IsActive, p.Description
                ORDER BY p.ProductName";

            return DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@Search",     search ?? ""),
new SqlParameter("@SearchLike", "%" + search + "%"),
                new SqlParameter("@CategoryID", categoryID.HasValue ? (object)categoryID.Value : DBNull.Value),
                new SqlParameter("@ActiveOnly", activeOnly ? 1 : 0));
        }

        public static Product GetProductByBarcode(string barcode, int warehouseID)
        {
            string sql = @"
                SELECT p.ProductID, p.ProductCode, p.Barcode, p.ProductName,
                       p.CategoryID, c.CategoryName, p.UnitID, u.UnitName,
                       p.CostPrice, p.WholesalePrice, p.RetailPrice,
                       p.TaxRate, p.MinStock, p.IsActive, p.Description, p.ProductImage,
                       ISNULL(ps.Quantity, 0) AS AvailableStock
                FROM Products p
                LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
                LEFT JOIN Units u ON p.UnitID = u.UnitID
                LEFT JOIN ProductStock ps ON p.ProductID = ps.ProductID AND ps.WarehouseID = @WarehouseID
                WHERE p.IsActive = 1 AND (p.Barcode = @Barcode OR p.ProductCode = @Barcode)";

            var dt = DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@Barcode",     barcode),
                new SqlParameter("@WarehouseID", warehouseID));

            return dt.Rows.Count > 0 ? MapProduct(dt.Rows[0]) : null;
        }

        public static Product GetProductByID(int productID, int warehouseID = 1)
        {
            string sql = @"
                SELECT p.ProductID, p.ProductCode, p.Barcode, p.ProductName,
                       p.CategoryID, c.CategoryName, p.UnitID, u.UnitName,
                       p.CostPrice, p.WholesalePrice, p.RetailPrice,
                       p.TaxRate, p.MinStock, p.IsActive, p.Description, p.ProductImage,
                       ISNULL(ps.Quantity, 0) AS AvailableStock
                FROM Products p
                LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
                LEFT JOIN Units u ON p.UnitID = u.UnitID
                LEFT JOIN ProductStock ps ON p.ProductID = ps.ProductID AND ps.WarehouseID = @WarehouseID
                WHERE p.ProductID = @ProductID";

            var dt = DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@ProductID",   productID),
                new SqlParameter("@WarehouseID", warehouseID));

            return dt.Rows.Count > 0 ? MapProduct(dt.Rows[0]) : null;
        }

        public static int SaveProduct(Product product)
        {
            if (product.ProductID == 0)
            {
                string sql = @"
                    INSERT INTO Products (ProductCode, Barcode, ProductName, CategoryID, UnitID,
                        CostPrice, WholesalePrice, RetailPrice, TaxRate, MinStock, Description, ProductImage)
                    OUTPUT INSERTED.ProductID
                    VALUES (@ProductCode, @Barcode, @ProductName, @CategoryID, @UnitID,
                        @CostPrice, @WholesalePrice, @RetailPrice, @TaxRate, @MinStock, @Description, @ProductImage)";

                return (int)DatabaseHelper.ExecuteScalar(sql, GetProductParams(product));
            }
            else
            {
                string sql = @"
                    UPDATE Products SET 
                        ProductCode=@ProductCode, Barcode=@Barcode, ProductName=@ProductName,
                        CategoryID=@CategoryID, UnitID=@UnitID, CostPrice=@CostPrice,
                        WholesalePrice=@WholesalePrice, RetailPrice=@RetailPrice,
                        TaxRate=@TaxRate, MinStock=@MinStock, Description=@Description,
                        ProductImage=@ProductImage, UpdatedAt=GETDATE()
                    WHERE ProductID=@ProductID";

                var parms = GetProductParams(product);
                Array.Resize(ref parms, parms.Length + 1);
                parms[parms.Length - 1] = new SqlParameter("@ProductID", product.ProductID);
                DatabaseHelper.ExecuteNonQuery(sql, parms);
                return product.ProductID;
            }
        }

        private static SqlParameter[] GetProductParams(Product p)
        {
            return new[]
            {
                new SqlParameter("@ProductCode",    p.ProductCode),
                new SqlParameter("@Barcode",        p.Barcode ?? (object)DBNull.Value),
                new SqlParameter("@ProductName",    p.ProductName),
                new SqlParameter("@CategoryID",     p.CategoryID.HasValue ? (object)p.CategoryID.Value : DBNull.Value),
                new SqlParameter("@UnitID",         p.UnitID.HasValue ? (object)p.UnitID.Value : DBNull.Value),
                new SqlParameter("@CostPrice",      p.CostPrice),
                new SqlParameter("@WholesalePrice", p.WholesalePrice),
                new SqlParameter("@RetailPrice",    p.RetailPrice),
                new SqlParameter("@TaxRate",        p.TaxRate),
                new SqlParameter("@MinStock",       p.MinStock),
                new SqlParameter("@Description",    p.Description ?? (object)DBNull.Value),
                new SqlParameter("@ProductImage",   SqlDbType.VarBinary) { Value = p.ProductImage ?? (object)DBNull.Value }
            };
        }

        public static bool DeleteProduct(int productID)
        {
            // حذف ناعم - تعطيل فقط
            return DatabaseHelper.ExecuteNonQuery(
                "UPDATE Products SET IsActive=0 WHERE ProductID=@ProductID",
                new SqlParameter("@ProductID", productID)) > 0;
        }

        public static decimal GetStock(int productID, int warehouseID)
        {
            var result = DatabaseHelper.ExecuteScalar(
                "SELECT ISNULL(Quantity,0) FROM ProductStock WHERE ProductID=@PID AND WarehouseID=@WID",
                new SqlParameter("@PID", productID),
                new SqlParameter("@WID", warehouseID));
            return result == null ? 0 : (decimal)result;
        }

        public static DataTable GetLowStockProducts(int warehouseID)
        {
            string sql = @"
                SELECT p.ProductID, p.ProductCode, p.ProductName, 
                       u.UnitName, p.MinStock,
                       ISNULL(ps.Quantity, 0) AS CurrentStock,
                       p.MinStock - ISNULL(ps.Quantity, 0) AS Shortage
                FROM Products p
                LEFT JOIN Units u ON p.UnitID = u.UnitID
                LEFT JOIN ProductStock ps ON p.ProductID = ps.ProductID AND ps.WarehouseID = @WID
                WHERE p.IsActive = 1 AND ISNULL(ps.Quantity, 0) <= p.MinStock AND p.MinStock > 0
                ORDER BY Shortage DESC";
            return DatabaseHelper.ExecuteQuery(sql, new SqlParameter("@WID", warehouseID));
        }

        public static bool AdjustStock(int productID, int warehouseID, decimal newQty, string notes, int userID)
        {
            decimal currentQty = GetStock(productID, warehouseID);
            decimal diff = newQty - currentQty;

            DatabaseHelper.ExecuteStoredProcedure("sp_UpdateStock",
                new SqlParameter("@ProductID",     productID),
                new SqlParameter("@WarehouseID",   warehouseID),
                new SqlParameter("@Quantity",      diff),
                new SqlParameter("@MovementType",  "ADJUST"),
                new SqlParameter("@ReferenceType", DBNull.Value),
                new SqlParameter("@ReferenceID",   DBNull.Value),
                new SqlParameter("@UnitCost",      DBNull.Value),
                new SqlParameter("@Notes",         notes ?? (object)DBNull.Value),
                new SqlParameter("@UserID",        userID));

            return true;
        }

        public static DataTable GetCategories()
        {
            return DatabaseHelper.ExecuteQuery(
                "SELECT CategoryID, CategoryName FROM Categories WHERE IsActive=1 ORDER BY CategoryName");
        }

        public static DataTable GetUnits()
        {
            return DatabaseHelper.ExecuteQuery(
                "SELECT UnitID, UnitName FROM Units WHERE IsActive=1 ORDER BY UnitName");
        }

        public static DataTable GetStockReport(int warehouseID, string search = "")
        {
            string sql = @"
                SELECT p.ProductCode, p.ProductName, c.CategoryName, u.UnitName,
                       p.CostPrice, p.RetailPrice,
                       ISNULL(ps.Quantity,0) AS Stock,
                       ISNULL(ps.Quantity,0) * p.CostPrice AS StockValue
                FROM Products p
                LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
                LEFT JOIN Units u ON p.UnitID = u.UnitID
                LEFT JOIN ProductStock ps ON p.ProductID = ps.ProductID AND ps.WarehouseID = @WID
                WHERE p.IsActive = 1
                  AND (@Search = '' OR p.ProductName LIKE @Like OR p.ProductCode LIKE @Like)
                ORDER BY p.ProductName";
            return DatabaseHelper.ExecuteQuery(sql, 
                new SqlParameter("@WID",    warehouseID),
                new SqlParameter("@Search", search ?? ""),
                new SqlParameter("@Like",   $"%{search}%"));
        }
    }
}
