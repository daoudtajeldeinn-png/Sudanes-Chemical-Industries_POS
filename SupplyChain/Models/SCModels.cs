using System;

namespace POSSystem.SupplyChain.Models
{
    public class RawMaterial
    {
        public int RawMaterialID { get; set; }
        public string RMCode { get; set; }
        public string RMName { get; set; }
        public string RMNameAr { get; set; }
        public string RMType { get; set; }
        public decimal CurrentStock { get; set; }
        public decimal ReorderPoint { get; set; }
        public decimal MinStockLevel { get; set; }
        public int UnitID { get; set; }
        public string UnitName { get; set; }
        public int PreferredSupplierID { get; set; }
        public string SupplierName { get; set; }
        public string HazardLevel { get; set; } // Pharmaceutical safety
        public bool IsActive { get; set; }
    }
    
    public class Batch
    {
        public int BatchID { get; set; }
        public string BatchNumber { get; set; }
        public string BatchType { get; set; } // Raw Material Batch or Finished Product Batch
        public DateTime ManufactureDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public decimal CurrentQty { get; set; }
        public string QCStatus { get; set; } // Under Test, Released, Rejected
        public string Status { get; set; } // Active, Finished, Expired
        public int? RawMaterialID { get; set; }
        public string ItemName { get; set; }
    }
}
