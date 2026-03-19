using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace POSSystem.DAL
{
    public class DatabaseHelper
    {
        private static string _connectionString;

        public static string ConnectionString
        {
            get
            {
                if (string.IsNullOrEmpty(_connectionString))
                {
                    _connectionString = ConfigurationManager.ConnectionStrings["POSSystem"]?.ConnectionString
                        ?? "Server=.;Database=POSSystem;Integrated Security=True;";
                }
                return _connectionString;
            }
            set { _connectionString = value; }
        }

        public static SqlConnection GetConnection()
        {
            return new SqlConnection(ConnectionString);
        }

        public static bool TestConnection()
        {
            try
            {
                using (var conn = GetConnection())
                {
                    conn.Open();
                    return true;
                }
            }
            catch { return false; }
        }

        // تنفيذ استعلام لا يُرجع نتائج
        public static int ExecuteNonQuery(string sql, params SqlParameter[] parameters)
        {
            using (var conn = GetConnection())
            {
                conn.Open();
                using (var cmd = new SqlCommand(sql, conn))
                {
                    cmd.CommandTimeout = 60;
                    if (parameters != null)
                        cmd.Parameters.AddRange(parameters);
                    return cmd.ExecuteNonQuery();
                }
            }
        }

        // تنفيذ استعلام يُرجع قيمة واحدة
        public static object ExecuteScalar(string sql, params SqlParameter[] parameters)
        {
            using (var conn = GetConnection())
            {
                conn.Open();
                using (var cmd = new SqlCommand(sql, conn))
                {
                    cmd.CommandTimeout = 60;
                    if (parameters != null)
                        cmd.Parameters.AddRange(parameters);
                    return cmd.ExecuteScalar();
                }
            }
        }

        // تنفيذ استعلام يُرجع DataTable
        public static DataTable ExecuteQuery(string sql, params SqlParameter[] parameters)
        {
            using (var conn = GetConnection())
            {
                conn.Open();
                using (var cmd = new SqlCommand(sql, conn))
                {
                    cmd.CommandTimeout = 60;
                    if (parameters != null)
                        cmd.Parameters.AddRange(parameters);
                    var dt = new DataTable();
                    using (var adapter = new SqlDataAdapter(cmd))
                        adapter.Fill(dt);
                    return dt;
                }
            }
        }

        // تنفيذ إجراء مخزن
        public static DataTable ExecuteStoredProcedure(string procName, params SqlParameter[] parameters)
        {
            using (var conn = GetConnection())
            {
                conn.Open();
                using (var cmd = new SqlCommand(procName, conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.CommandTimeout = 60;
                    if (parameters != null)
                        cmd.Parameters.AddRange(parameters);
                    var dt = new DataTable();
                    using (var adapter = new SqlDataAdapter(cmd))
                        adapter.Fill(dt);
                    return dt;
                }
            }
        }

        // تنفيذ معاملة (Transaction)
        public static bool ExecuteTransaction(Action<SqlConnection, SqlTransaction> actions)
        {
            using (var conn = GetConnection())
            {
                conn.Open();
                using (var transaction = conn.BeginTransaction())
                {
                    try
                    {
                        actions(conn, transaction);
                        transaction.Commit();
                        return true;
                    }
                    catch
                    {
                        transaction.Rollback();
                        throw;
                    }
                }
            }
        }

        // الحصول على الرقم التالي للفاتورة
        public static string GetNextNumber(string sequenceType)
        {
            using (var conn = GetConnection())
            {
                conn.Open();
                using (var cmd = new SqlCommand("sp_GetNextNumber", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@SequenceType", sequenceType);
                    var outParam = new SqlParameter("@NextNumber", SqlDbType.NVarChar, 50)
                    {
                        Direction = ParameterDirection.Output
                    };
                    cmd.Parameters.Add(outParam);
                    cmd.ExecuteNonQuery();
                    return outParam.Value?.ToString() ?? "";
                }
            }
        }

        // تشفير كلمة المرور
        public static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                var sb = new StringBuilder();
                foreach (var b in bytes)
                    sb.Append(b.ToString("x2"));
                return sb.ToString();
            }
        }

        public static void SeedDatabase()
        {
            try {
                PatchDatabase(); // NEW
                using (var conn = GetConnection()) {
                    conn.Open();
                    // 1. Ensure Roles
                    string sqlRoles = @"
                        IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Admin')
                            INSERT INTO Roles (RoleName, IsActive) VALUES ('Admin', 1);
                        IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Cashier')
                            INSERT INTO Roles (RoleName, IsActive) VALUES ('Cashier', 1);";
                    using (var cmd = new SqlCommand(sqlRoles, conn)) cmd.ExecuteNonQuery();

                    // 2. Ensure Admin User
                    string adminHash = HashPassword("admin");
                    string sqlUser = @"
                        IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'admin')
                        BEGIN
                            DECLARE @RoleID INT = (SELECT TOP 1 RoleID FROM Roles WHERE RoleName = 'Admin');
                            INSERT INTO Users (Username, PasswordHash, FullName, RoleID, IsActive)
                            VALUES ('admin', @Hash, 'System Administrator', @RoleID, 1);
                            IF NOT COLUMN_EXISTS('SalesInvoiceDetails', 'BatchID')
                                ALTER TABLE SalesInvoiceDetails ADD BatchID INT;
                        END";
                    using (var cmd = new SqlCommand(sqlUser, conn)) {
                        cmd.Parameters.AddWithValue("@Hash", adminHash);
                        cmd.ExecuteNonQuery();
                    }

                    // 3. Optional: Sample Data if empty
                    string sqlCheckProducts = "SELECT COUNT(*) FROM Products";
                    int productCount = 0;
                    using (var cmd = new SqlCommand(sqlCheckProducts, conn)) productCount = (int)cmd.ExecuteScalar();

                    if (productCount == 0)
                    {
                        string sqlSeedData = @"
                            INSERT INTO Categories (CategoryName, IsActive) VALUES (N'أدوية صيدلانية', 1);
                            DECLARE @CatID INT = SCOPE_IDENTITY();
                            INSERT INTO Products (ProductCode, ProductName, CategoryID, CostPrice, RetailPrice, MinStock, IsActive)
                            VALUES ('PH-001', N'أسبيرين 100ملجم', @CatID, 5.0, 12.0, 50, 1),
                                   ('PH-002', N'باراسيتامول 500ملجم', @CatID, 3.0, 8.0, 100, 1),
                                   ('PH-003', N'فيتامين سي 1000ملجم', @CatID, 15.0, 25.0, 30, 1);
                            
                            INSERT INTO ProductStock (ProductID, WarehouseID, Quantity)
                            SELECT ProductID, 1, 100 FROM Products;

                            -- Seed Pharmaceutical Batches
                            INSERT INTO Batches (BatchNumber, BatchType, ProductID, ManufactureDate, ExpiryDate, ReceivedQty, CurrentQty, WarehouseID, Status, QCStatus)
                            SELECT 'B' + CAST(ProductID AS VARCHAR), 'FinishedProduct', ProductID, '2024-01-01', '2026-01-01', 100, 100, 1, 'Active', 'Released' FROM Products;

                            INSERT INTO Customers (CustomerCode, CustomerName, Phone, IsActive)
                            VALUES ('C001', N'عميل نقدي', '000000', 1);";


                        using (var cmd = new SqlCommand(sqlSeedData, conn)) cmd.ExecuteNonQuery();
                    }
                }
            } catch { /* Suppress seeding errors */ }
        }

        public static void LogAction(int userID, string action, string details)
        {
            try {
                string sql = "INSERT INTO AuditLogs (UserID, Action, Details) VALUES (@U, @A, @D)";
                ExecuteNonQuery(sql, 
                    new SqlParameter("@U", userID),
                    new SqlParameter("@A", action),
                    new SqlParameter("@D", details));
            } catch { } // Stealth logging
        }
        public static void PatchDatabase()
        {
            string sql = @"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Batches') AND name = 'QCOperator')
                    ALTER TABLE Batches ADD QCOperator INT;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Batches') AND name = 'QCNotes')
                    ALTER TABLE Batches ADD QCNotes NVARCHAR(MAX);
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Batches') AND name = 'QCDate')
                    ALTER TABLE Batches ADD QCDate DATETIME;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Purchases') AND name = 'Currency')
                    ALTER TABLE Purchases ADD Currency NVARCHAR(10) DEFAULT 'SDG';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Purchases') AND name = 'ExchangeRate')
                    ALTER TABLE Purchases ADD ExchangeRate DECIMAL(18,4) DEFAULT 1.0;

                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('AuditLogs') AND type = 'U')
                BEGIN
                    CREATE TABLE AuditLogs (
                        LogID INT PRIMARY KEY IDENTITY,
                        UserID INT,
                        Action NVARCHAR(100),
                        Details NVARCHAR(MAX),
                        LogDate DATETIME DEFAULT GETDATE()
                    );
                END";
            ExecuteNonQuery(sql);
        }
    }
}
