using System;
using System.Collections.Generic;

namespace POSSystem.Models
{
    // ============================================================
    //  نماذج البيانات
    // ============================================================

    public class User
    {
        public int UserID { get; set; }
        public string Username { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public int RoleID { get; set; }
        public string RoleName { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastLogin { get; set; }
public List<string> Permissions { get; set; }

        public bool HasPermission(string permission)
        {
            return Permissions.Contains(permission);
        }
    }

    public class Product
    {
        public int ProductID { get; set; }
        public string ProductCode { get; set; }
        public string Barcode { get; set; }
        public string ProductName { get; set; }
        public int? CategoryID { get; set; }
        public string CategoryName { get; set; }
        public int? UnitID { get; set; }
        public string UnitName { get; set; }
        public decimal CostPrice { get; set; }
        public decimal WholesalePrice { get; set; }
        public decimal RetailPrice { get; set; }
        public decimal TaxRate { get; set; }
        public decimal MinStock { get; set; }
        public decimal AvailableStock { get; set; }
        public bool IsActive { get; set; }
        public byte[] ProductImage { get; set; }
        public string Description { get; set; }
        public int? BatchID { get; set; }
        public string BatchNumber { get; set; }

public decimal GetPrice(string saleType)
            {
                if (saleType == "WHOLESALE") 
                    return WholesalePrice;
                else 
                    return RetailPrice;
            }
    }

    public class Customer
    {
        public int CustomerID { get; set; }
        public string CustomerCode { get; set; }
        public string CustomerName { get; set; }
        public string CustomerNameAr { get; set; }
        public int? GroupID { get; set; }
        public string GroupName { get; set; }
        public string Phone { get; set; }
        public string Mobile { get; set; }
        public string Email { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string TaxNumber { get; set; }
        public decimal CreditLimit { get; set; }
        public decimal CurrentBalance { get; set; }
        public string Notes { get; set; }
        public bool IsActive { get; set; }
    }

    public class Supplier
    {
        public int SupplierID { get; set; }
        public string SupplierCode { get; set; }
        public string SupplierName { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Address { get; set; }
        public string TaxNumber { get; set; }
        public decimal CurrentBalance { get; set; }
        public bool IsActive { get; set; }
    }

    public class SaleItem
    {
        public int ProductID { get; set; }
        public string ProductCode { get; set; }
        public string ProductName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal CostPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal TaxRate { get; set; }
        public int? BatchID { get; set; }
        public string BatchNumber { get; set; }

        public decimal TaxAmount {
            get { return (SubTotal - Discount) * TaxRate / 100; }
        }
        public decimal SubTotal {
            get { return Quantity * UnitPrice; }
        }
        public decimal TotalPrice {
            get { return SubTotal - Discount + TaxAmount; }
        }
    }


    public class SalesInvoice
    {
        public int InvoiceID { get; set; }
        public string InvoiceNumber { get; set; }
public string InvoiceType { get; set; }
        public DateTime InvoiceDate { get; set; }
        public int? CustomerID { get; set; }
        public string CustomerName { get; set; }
        public int WarehouseID { get; set; }
        public int UserID { get; set; }
        public string UserName { get; set; }
        public decimal SubTotal { get; set; }
        public string DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string PaymentMethod { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public List<SaleItem> Items { get; set; } = new List<SaleItem>();
    }

    public class PurchaseItem
    {
        public int ProductID { get; set; }
        public string ProductCode { get; set; }
        public string ProductName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal TaxRate { get; set; }
public decimal TaxAmount {
            get { return Quantity * UnitCost * TaxRate / 100; }
        }
        public decimal TotalCost {
            get { return Quantity * UnitCost + TaxAmount; }
        }
    }

    public class PurchaseInvoice
    {
        public int InvoiceID { get; set; }
        public string InvoiceNumber { get; set; }
        public string SupplierInvoice { get; set; }
        public DateTime InvoiceDate { get; set; } = DateTime.Now;
        public int SupplierID { get; set; }
        public string SupplierName { get; set; }
        public int WarehouseID { get; set; }
        public int UserID { get; set; }
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string PaymentMethod { get; set; } = "CASH";
        public string Status { get; set; } = "PAID";
        public string Notes { get; set; }
        public string Currency { get; set; } = "SDG";
        public decimal ExchangeRate { get; set; } = 1.0m;
        public List<PurchaseItem> Items { get; set; } = new List<PurchaseItem>();
    }

    public class Expense
    {
        public int ExpenseID { get; set; }
public DateTime ExpenseDate { get; set; }
        public int CategoryID { get; set; }
        public string CategoryName { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string PaymentMethod { get; set; } = "CASH";
        public string Notes { get; set; }
    }

    public class StockMovement
    {
        public int MovementID { get; set; }
        public int ProductID { get; set; }
        public string ProductName { get; set; }
        public int WarehouseID { get; set; }
        public string WarehouseName { get; set; }
        public string MovementType { get; set; }
        public string ReferenceType { get; set; }
        public int? ReferenceID { get; set; }
        public decimal Quantity { get; set; }
        public decimal? UnitCost { get; set; }
        public DateTime MovementDate { get; set; }
    }

    public class DashboardSummary
    {
        public decimal TodaySales { get; set; }
        public int TodayInvoices { get; set; }
        public decimal TodayProfit { get; set; }
        public decimal MonthSales { get; set; }
        public int LowStockCount { get; set; }
        public decimal TotalReceivables { get; set; }
        public decimal TotalPayables { get; set; }
public List<TopProduct> TopProducts { get; set; }
        public List<DailySales> WeeklySales { get; set; }
    }

    public class TopProduct
    {
        public string ProductName { get; set; }
        public decimal TotalQty { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class DailySales
    {
        public string Day { get; set; }
        public decimal Amount { get; set; }
    }

    public class CompanySettings
    {
        public int SettingID { get; set; }
        public string CompanyName { get; set; }
        public string CompanyNameAr { get; set; }
        public string Address { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string TaxNumber { get; set; }
        public decimal TaxRate { get; set; }
        public string Currency { get; set; }
        public string CurrencyCode { get; set; }
        public byte[] Logo { get; set; }
        public string InvoiceHeader { get; set; }
        public string InvoiceFooter { get; set; }
    }

    public class Category
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; }
        public int? ParentID { get; set; }
        public bool IsActive { get; set; }
    }

    public class Unit
    {
        public int UnitID { get; set; }
        public string UnitName { get; set; }
        public string UnitCode { get; set; }
        public bool IsActive { get; set; }
    }

    public class Warehouse
    {
        public int WarehouseID { get; set; }
        public string WarehouseName { get; set; }
        public string Location { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
    }
}
