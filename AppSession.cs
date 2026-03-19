using System;
using POSSystem.Models;

namespace POSSystem
{
    /// <summary>
    /// يحتفظ بمعلومات الجلسة الحالية للمستخدم
    /// </summary>
    public static class AppSession
    {
        public static User CurrentUser { get; private set; }
private static int _currentWarehouseID = 1;
        public static int CurrentWarehouseID { 
            get { return _currentWarehouseID; } 
            set { _currentWarehouseID = value; } 
        }
        private static string _currentWarehouseName = "المخزن الرئيسي";
        public static string CurrentWarehouseName { 
            get { return _currentWarehouseName; } 
            set { _currentWarehouseName = value; } 
        }
        public static CompanySettings Company { get; set; }
        public static bool IsLoggedIn { 
            get { return CurrentUser != null; }
        }

        public static void Login(User user)
        {
            CurrentUser = user;
        }

        public static void Logout()
        {
            CurrentUser = null;
        }

public static bool HasPermission(string permission)
        {
            if (CurrentUser == null) return false;
            return CurrentUser.HasPermission(permission);
        }

        public static void LoadCompanySettings()
        {
            var dt = DAL.DatabaseHelper.ExecuteQuery(
                "SELECT TOP 1 * FROM CompanySettings ORDER BY SettingID DESC");

            if (dt.Rows.Count > 0)
            {
                var row = dt.Rows[0];
                Company = new CompanySettings
                {
                    SettingID     = (int)row["SettingID"],
                    CompanyName   = row["CompanyName"]?.ToString(),
                    CompanyNameAr = row["CompanyNameAr"]?.ToString(),
                    Address       = row["Address"]?.ToString(),
                    Phone         = row["Phone"]?.ToString(),
                    Email         = row["Email"]?.ToString(),
                    TaxNumber     = row["TaxNumber"]?.ToString(),
                    TaxRate       = row["TaxRate"] == DBNull.Value ? 15 : (decimal)row["TaxRate"],
                    Currency      = row["Currency"]?.ToString() ?? "ريال",
                    CurrencyCode  = row["CurrencyCode"]?.ToString() ?? "SAR",
                    InvoiceHeader = row["InvoiceHeader"]?.ToString(),
                    InvoiceFooter = row["InvoiceFooter"]?.ToString(),
                    Logo          = row["Logo"] == DBNull.Value ? null : (byte[])row["Logo"]
                };
            }
            else
            {
                Company = new CompanySettings
                {
                    CompanyName = "شركتي",
                    TaxRate     = 15,
                    Currency    = "ريال"
                };
            }
        }
    }
}
