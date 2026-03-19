using System;
using System.Data;
using System.Data.SqlClient;
using System.Collections.Generic;
using POSSystem.DAL;
using POSSystem.SupplyChain.Models;

namespace POSSystem.SupplyChain.DAL
{
    public static class SCDAL
    {
        public static DataTable GetRawMaterials(string filter = "", string type = "")
        {
            string sql = @"
                SELECT TOP 50 rm.RawMaterialID, rm.RMCode, rm.RMName, rm.RMNameAr, rm.RMType,
                       rm.CurrentStock, rm.ReorderPoint, rm.MinStockLevel, u.UnitName,
                       s.SupplierName, rm.LeadTimeDays, rm.HazardLevel,
                       CASE 
                           WHEN rm.CurrentStock <= 0 THEN N'نفذ المخزون'
                           WHEN rm.CurrentStock <= rm.MinStockLevel THEN N'أقل من الحد الأدنى'
                           WHEN rm.CurrentStock <= rm.ReorderPoint THEN N'يحتاج طلب شراء'
                           ELSE N'جيد'
                       END AS StockStatus
                FROM RawMaterials rm
                LEFT JOIN Units u ON rm.UnitID = u.UnitID
                LEFT JOIN Suppliers s ON rm.PreferredSupplierID = s.SupplierID
                WHERE rm.IsActive = 1";
            
            if (!string.IsNullOrEmpty(filter))
                sql += " AND (rm.RMCode LIKE @F OR rm.RMName LIKE @F OR rm.RMNameAr LIKE @F)";
            if (!string.IsNullOrEmpty(type))
                sql += " AND rm.RMType = @T";
                
            sql += " ORDER BY rm.RMName";

            var parms = new List<SqlParameter>();
            if (!string.IsNullOrEmpty(filter))
                parms.Add(new SqlParameter("@F", "%" + filter + "%"));
            if (!string.IsNullOrEmpty(type))
                parms.Add(new SqlParameter("@T", type));

            return DatabaseHelper.ExecuteQuery(sql, parms.ToArray());
        }

        public static DataTable GetBatches()
        {
            string sql = @"
                SELECT TOP 50 b.BatchID, b.BatchNumber, b.BatchType, b.ManufactureDate, b.ExpiryDate,
                       b.CurrentQty, u.UnitName, b.QCStatus, b.Status,
                       rm.RMName AS ItemName, s.SupplierName
                FROM Batches b
                LEFT JOIN RawMaterials rm ON b.RawMaterialID = rm.RawMaterialID
                LEFT JOIN Units u ON rm.UnitID = u.UnitID
                LEFT JOIN Suppliers s ON b.SupplierID = s.SupplierID
                WHERE b.Status = 'Active'
                ORDER BY b.ExpiryDate ASC";

            return DatabaseHelper.ExecuteQuery(sql);
        }

        public static DataTable GetQCBatches()
        {
            string sql = @"
                SELECT b.BatchID, b.BatchNumber, rm.RMName AS ItemName, b.ManufactureDate,
                       b.QCStatus, b.QCOperation, b.QCNotes
                FROM Batches b
                INNER JOIN RawMaterials rm ON b.RawMaterialID = rm.RawMaterialID
                WHERE b.QCStatus != 'Released'
                ORDER BY b.ManufactureDate DESC";
            return DatabaseHelper.ExecuteQuery(sql);
        }

        public static DataTable GetDashboard()
        {
            return DatabaseHelper.ExecuteQuery(@"
                SELECT 
                    (SELECT COUNT(*) FROM SCPurchaseOrders WHERE Status = 'Pending') AS PendingPOs,
                    (SELECT COUNT(*) FROM Batches WHERE QCStatus = 'Under Test') AS QCUnderTest,
                    (SELECT COUNT(*) FROM RawMaterials WHERE CurrentStock <= ReorderPoint) AS LowStock,
                    (SELECT COUNT(*) FROM Batches WHERE DATEDIFF(day, GETDATE(), ExpiryDate) <= 90) AS Expiring");
        }

        public static int SaveRawMaterial(RawMaterial rm)
        {
            string sql;
            var parms = new List<SqlParameter> {
                new SqlParameter("@C", rm.RMCode),
                new SqlParameter("@N", rm.RMName),
                new SqlParameter("@NA", rm.RMNameAr ?? (object)DBNull.Value),
                new SqlParameter("@T", rm.RMType),
                new SqlParameter("@U", rm.UnitID),
                new SqlParameter("@RP", rm.ReorderPoint),
                new SqlParameter("@MS", rm.MinStockLevel),
                new SqlParameter("@S", rm.PreferredSupplierID),
                new SqlParameter("@H", rm.HazardLevel ?? (object)DBNull.Value),
                new SqlParameter("@A", rm.IsActive)
            };

            if (rm.RawMaterialID == 0) {
                sql = @"INSERT INTO RawMaterials (RMCode, RMName, RMNameAr, RMType, UnitID, ReorderPoint, MinStockLevel, PreferredSupplierID, HazardLevel, IsActive, CurrentStock) 
                        VALUES (@C, @N, @NA, @T, @U, @RP, @MS, @S, @H, @A, 0); SELECT SCOPE_IDENTITY();";
                return Convert.ToInt32(DatabaseHelper.ExecuteScalar(sql, parms.ToArray()));
            } else {
                parms.Add(new SqlParameter("@ID", rm.RawMaterialID));
                sql = @"UPDATE RawMaterials SET RMCode=@C, RMName=@N, RMNameAr=@NA, RMType=@T, UnitID=@U, ReorderPoint=@RP, MinStockLevel=@MS, 
                        PreferredSupplierID=@S, HazardLevel=@H, IsActive=@A WHERE RawMaterialID=@ID";
                DatabaseHelper.ExecuteNonQuery(sql, parms.ToArray());
                return rm.RawMaterialID;
            }
        }

        public static RawMaterial GetRawMaterialByID(int id)
        {
            var dt = DatabaseHelper.ExecuteQuery("SELECT * FROM RawMaterials WHERE RawMaterialID=@ID", new SqlParameter("@ID", id));
            if (dt.Rows.Count == 0) return null;
            var row = dt.Rows[0];
            return new RawMaterial {
                RawMaterialID = (int)row["RawMaterialID"],
                RMCode = row["RMCode"].ToString(),
                RMName = row["RMName"].ToString(),
                RMNameAr = row["RMNameAr"]?.ToString(),
                RMType = row["RMType"].ToString(),
                UnitID = (int)row["UnitID"],
                ReorderPoint = (decimal)row["ReorderPoint"],
                MinStockLevel = (decimal)row["MinStockLevel"],
                PreferredSupplierID = (int)row["PreferredSupplierID"],
                HazardLevel = row["HazardLevel"]?.ToString(),
                IsActive = (bool)row["IsActive"],
                CurrentStock = (decimal)row["CurrentStock"]
            };
        }
        public static bool UpdateQCStatus(int batchID, string status, string notes, int userID)
        {
            string sql = @"UPDATE Batches SET QCStatus=@S, QCNotes=@N, QCOperator=@U, QCDate=GETDATE() WHERE BatchID=@ID";
            return DatabaseHelper.ExecuteNonQuery(sql,
                new SqlParameter("@S",  status),
                new SqlParameter("@N",  notes ?? (object)DBNull.Value),
                new SqlParameter("@U",  userID),
                new SqlParameter("@ID", batchID)) > 0;
        }
    }
}

