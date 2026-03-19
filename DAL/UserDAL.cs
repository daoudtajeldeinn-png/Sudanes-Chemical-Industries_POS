using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using POSSystem.Models;

namespace POSSystem.DAL
{
    public class UserDAL
    {
        // تسجيل الدخول
        public static User Login(string username, string password)
        {
            string hashedPwd = DatabaseHelper.HashPassword(password);
            string sql = @"
                SELECT u.UserID, u.Username, u.FullName, u.Email, u.Phone,
                       u.RoleID, r.RoleName, u.IsActive
                FROM Users u
                INNER JOIN Roles r ON u.RoleID = r.RoleID
                WHERE u.Username = @Username 
                  AND u.PasswordHash = @PasswordHash 
                  AND u.IsActive = 1";

            var dt = DatabaseHelper.ExecuteQuery(sql,
                new SqlParameter("@Username", username),
                new SqlParameter("@PasswordHash", hashedPwd));

            if (dt.Rows.Count == 0) return null;

            var row = dt.Rows[0];
            var user = new User
            {
                UserID   = (int)row["UserID"],
                Username = row["Username"].ToString(),
                FullName = row["FullName"].ToString(),
                Email    = row["Email"]?.ToString(),
                Phone    = row["Phone"]?.ToString(),
                RoleID   = (int)row["RoleID"],
                RoleName = row["RoleName"].ToString(),
                IsActive = (bool)row["IsActive"]
            };

            // تحميل الصلاحيات
            user.Permissions = GetUserPermissions(user.RoleID);

            // تحديث آخر تسجيل دخول
            DatabaseHelper.ExecuteNonQuery(
                "UPDATE Users SET LastLogin = GETDATE() WHERE UserID = @UserID",
                new SqlParameter("@UserID", user.UserID));

            return user;
        }

        public static List<string> GetUserPermissions(int roleID)
        {
            var permissions = new List<string>();
            string sql = @"
                SELECT p.PermissionName 
                FROM RolePermissions rp
                INNER JOIN Permissions p ON rp.PermissionID = p.PermissionID
                WHERE rp.RoleID = @RoleID";

            var dt = DatabaseHelper.ExecuteQuery(sql, new SqlParameter("@RoleID", roleID));
            foreach (DataRow row in dt.Rows)
                permissions.Add(row["PermissionName"].ToString());

            return permissions;
        }

        public static DataTable GetAllUsers()
        {
            string sql = @"
                SELECT u.UserID, u.Username, u.FullName, u.Email, u.Phone,
                       r.RoleName, u.IsActive, u.LastLogin, u.CreatedAt
                FROM Users u
                INNER JOIN Roles r ON u.RoleID = r.RoleID
                ORDER BY u.FullName";
            return DatabaseHelper.ExecuteQuery(sql);
        }

        public static bool CreateUser(string username, string password, string fullName,
                                      string email, string phone, int roleID)
        {
            string sql = @"
                INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone, RoleID)
                VALUES (@Username, @PasswordHash, @FullName, @Email, @Phone, @RoleID)";
            int rows = DatabaseHelper.ExecuteNonQuery(sql,
                new SqlParameter("@Username",     username),
                new SqlParameter("@PasswordHash", DatabaseHelper.HashPassword(password)),
                new SqlParameter("@FullName",     fullName),
                new SqlParameter("@Email",        email ?? (object)DBNull.Value),
                new SqlParameter("@Phone",        phone ?? (object)DBNull.Value),
                new SqlParameter("@RoleID",       roleID));
            return rows > 0;
        }

        public static bool UpdateUser(int userID, string fullName, string email, string phone, int roleID, bool isActive)
        {
            string sql = @"
                UPDATE Users SET FullName=@FullName, Email=@Email, 
                Phone=@Phone, RoleID=@RoleID, IsActive=@IsActive 
                WHERE UserID=@UserID";
            return DatabaseHelper.ExecuteNonQuery(sql,
                new SqlParameter("@UserID",   userID),
                new SqlParameter("@FullName", fullName),
                new SqlParameter("@Email",    email ?? (object)DBNull.Value),
                new SqlParameter("@Phone",    phone ?? (object)DBNull.Value),
                new SqlParameter("@RoleID",   roleID),
                new SqlParameter("@IsActive", isActive)) > 0;
        }

        public static bool ChangePassword(int userID, string newPassword)
        {
            string sql = "UPDATE Users SET PasswordHash=@Hash WHERE UserID=@UserID";
            return DatabaseHelper.ExecuteNonQuery(sql,
                new SqlParameter("@Hash",   DatabaseHelper.HashPassword(newPassword)),
                new SqlParameter("@UserID", userID)) > 0;
        }

        public static DataTable GetRoles()
        {
            return DatabaseHelper.ExecuteQuery(
                "SELECT RoleID, RoleName FROM Roles WHERE IsActive=1 ORDER BY RoleName");
        }
    }
}
