using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.Models;
using POSSystem.UI;

namespace POSSystem.Forms.POS
{
    public class POSForm : UserControl
    {
        private TextBox txtSearch;
        private DataGridView gridItems;
        private Label lblSubTotal, lblTax, lblDiscount, lblTotal;
        private Label lblInvNumber, lblInvDate, lblInvUser, lblInvWarehouse;
        private ComboBox cmbCustomer;
        private Button btnPay, btnClear, btnNew;
        private List<SaleItem> _items = new List<SaleItem>();
        private decimal _taxRate = 15;

        private int _invoiceID;
        public POSForm(int invoiceID = 0)
        {
            _invoiceID = invoiceID;
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.RightToLeft = RightToLeft.Yes;
            InitializeComponents();
            this.Load += (s, e) => {
                txtSearch.Focus();
                var form = this.FindForm();
                if (form != null) form.AcceptButton = null;
            };
            ResetPOS();
            if (_invoiceID > 0) LoadInvoice();
        }

        private void LoadInvoice()
        {
            var inv = SalesDAL.GetInvoiceByID(_invoiceID);
            if (inv == null) return;

            _items = inv.Items;
            lblInvNumber.Text = "رقم الفاتورة: " + inv.InvoiceNumber;
            lblInvDate.Text = "التاريخ: " + inv.InvoiceDate.ToShortDateString();
            cmbCustomer.SelectedValue = inv.CustomerID;
            
            RefreshGrid();
            btnPay.Text = "📝 تحديث الفاتورة";
        }

        private void InitializeComponents()
        {
            // Main Layout
            var mainLayout = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 2 };
            mainLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 75));
            mainLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25));
            mainLayout.RowStyles.Add(new RowStyle(SizeType.Absolute, 100f));
            mainLayout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));

            // Header Panel
            var pnlHeader = new Panel { Dock = DockStyle.Fill, BackColor = Color.FromArgb(30, 41, 59), Padding = new Padding(10) };
            
            // Logo
            try {
                var picLogo = new PictureBox { Dock = DockStyle.Left, Width = 80, SizeMode = PictureBoxSizeMode.Zoom, Image = Image.FromFile("Logo.png") };
                pnlHeader.Controls.Add(picLogo);
            } catch { }

            var flowHeader = new FlowLayoutPanel { Dock = DockStyle.Fill, RightToLeft = RightToLeft.Yes };
            lblInvNumber = CreateHeaderLabel("رقم الفاتورة:", "---");
            lblInvDate = CreateHeaderLabel("التاريخ:", DateTime.Now.ToShortDateString());
            lblInvUser = CreateHeaderLabel("المستخدم:", AppSession.CurrentUser?.FullName ?? "Admin");
            lblInvWarehouse = CreateHeaderLabel("المخزن:", "المخزن الرئيسي");
            
            var lblCust = new Label { Text = "العميل:", ForeColor = Color.White, AutoSize = true, Font = new Font("Segoe UI", 10f, FontStyle.Bold), Margin = new Padding(10, 5, 0, 0) };
            cmbCustomer = new ComboBox { Width = 200, DropDownStyle = ComboBoxStyle.DropDownList };
            LoadCustomers();

            btnNew = new Button { 
                Text = "➕ فاتورة جديدة", 
                Width = 140, Height = 45, 
                BackColor = Color.FromArgb(16, 185, 129), 
                ForeColor = Color.White, 
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                Margin = new Padding(20, 0, 0, 0)
            };
            btnNew.Click += (s, e) => ResetPOS();

            flowHeader.Controls.AddRange(new Control[] { lblInvNumber, lblInvDate, lblInvUser, lblInvWarehouse, lblCust, cmbCustomer, btnNew });
            pnlHeader.Controls.Add(flowHeader);

            // Left Side: Search and Grid
            var leftPnl = new Panel { Dock = DockStyle.Fill, Padding = new Padding(10) };
            
            var pnlSearch = new Panel { Dock = DockStyle.Top, Height = 45, Margin = new Padding(0,0,0,10) };
            
            txtSearch = new TextBox { 
                Dock = DockStyle.Fill, 
                Font = new Font("Segoe UI", 18f),
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.White
            };
            txtSearch.KeyDown += TxtSearch_KeyDown;

            var btnSearch = new Button { 
                Text = "🔍", Width = 60, Dock = DockStyle.Left, 
                BackColor = Color.FromArgb(59, 130, 246), ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 12f)
            };
            btnSearch.Click += (s, e) => PerformSearch();
            
            pnlSearch.Controls.Add(txtSearch);
            pnlSearch.Controls.Add(btnSearch);


            gridItems = new DataGridView {
                Dock = DockStyle.Fill, Margin = new Padding(0, 10, 0, 0)
            };
            gridItems.Columns.Add("ProductID", "ID");
            gridItems.Columns["ProductID"].Visible = false;
            gridItems.Columns.Add("ProductName", "المنتج");
            gridItems.Columns.Add("Batch", "الدفعة / الصلاحية");
            gridItems.Columns.Add("Quantity", "الكمية");
            gridItems.Columns.Add("UnitPrice", "السعر");
            gridItems.Columns.Add("TotalPrice", "الإجمالي");
            
            UIHelper.StyleGrid(gridItems);
            gridItems.Columns["Quantity"].Width = 80;
            gridItems.Columns["UnitPrice"].Width = 100;

            gridItems.CellValueChanged += GridItems_CellValueChanged;
            gridItems.KeyDown += GridItems_KeyDown;

            leftPnl.Controls.Add(gridItems);
            leftPnl.Controls.Add(pnlSearch);

            // Right Side: Summary and Actions
            var rightPnl = new Panel { Dock = DockStyle.Fill, BackColor = Color.FromArgb(30, 41, 59), Padding = new Padding(15) };
            
            var lblTitle = new Label { Text = "ملخص الفاتورة", Dock = DockStyle.Top, Height = 40, ForeColor = Color.White, Font = new Font("Segoe UI", 14f, FontStyle.Bold), TextAlign = ContentAlignment.MiddleCenter };
            
            var pnlSummary = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 250, FlowDirection = FlowDirection.TopDown };
            lblSubTotal = CreateSummaryLabel("المجموع الفرعي:", "0.00");
            lblTax = CreateSummaryLabel("الضريبة (15%):", "0.00");
            lblDiscount = CreateSummaryLabel("الخصم:", "0.00");
            lblTotal = CreateSummaryLabel("الإجمالي النهائي:", "0.00", Color.FromArgb(16, 185, 129), 22);
            
            pnlSummary.Controls.AddRange(new Control[] { lblSubTotal, lblTax, lblDiscount, lblTotal });

            btnPay = new Button { Text = "💳 دفع وأرشفة (F12)", Dock = DockStyle.Bottom, Height = 60, BackColor = Color.FromArgb(59, 130, 246), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Font = new Font("Segoe UI", 14f, FontStyle.Bold) };
            btnPay.Click += BtnPay_Click;

            btnClear = new Button { Text = "🗑️ مسح الكل", Dock = DockStyle.Bottom, Height = 45, BackColor = Color.FromArgb(239, 68, 68), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Margin = new Padding(0, 5, 0, 5) };
            btnClear.Click += (s, e) => ResetPOS();

            rightPnl.Controls.Add(pnlSummary);
            rightPnl.Controls.Add(lblTitle);
            rightPnl.Controls.Add(btnClear);
            rightPnl.Controls.Add(btnPay);

            mainLayout.Controls.Add(pnlHeader, 0, 0);
            mainLayout.SetColumnSpan(pnlHeader, 2);
            mainLayout.Controls.Add(leftPnl, 0, 1);
            mainLayout.Controls.Add(rightPnl, 1, 1);
            this.Controls.Add(mainLayout);
        }

        private Label CreateHeaderLabel(string title, string val)
        {
            return new Label { 
                Text = $"{title} {val}", 
                ForeColor = Color.White, 
                AutoSize = true, 
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                Margin = new Padding(20, 5, 0, 0)
            };
        }

        private void LoadCustomers()
        {
            try {
                var dt = DatabaseHelper.ExecuteQuery("SELECT CustomerID, CustomerName FROM Customers WHERE IsActive=1");
                cmbCustomer.DataSource = dt;
                cmbCustomer.DisplayMember = "CustomerName";
                cmbCustomer.ValueMember = "CustomerID";
            } catch { }
        }

        private Label CreateSummaryLabel(string title, string val, Color? color = null, float fontSize = 12)
        {
            var lbl = new Label { 
                Text = $"{title} {val}", 
                Width = 250, Height = 40,
                ForeColor = color ?? Color.FromArgb(148, 163, 184),
                Font = new Font("Segoe UI", fontSize, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleLeft,
                Tag = title
            };
            return lbl;
        }

        private void TxtSearch_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                e.SuppressKeyPress = true;
                PerformSearch();
            }
        }

        private void PerformSearch()
        {
            string query = txtSearch.Text.Trim();
            if (string.IsNullOrEmpty(query)) return;

            var product = ProductDAL.GetProductByBarcode(query, AppSession.CurrentWarehouseID);
            if (product != null)
            {
                var batch = GetBestBatch(product.ProductID);
                if (batch != null) {
                    product.BatchID = batch.BatchID;
                    product.BatchNumber = batch.BatchNumber;
                }
                AddItem(product);
                txtSearch.Clear();
            }
            else
            {
                // Search by name if barcode not found
                var dt = ProductDAL.GetAllProducts(query);
                if (dt.Rows.Count == 1)
                {
                    var p = ProductDAL.GetProductByID((int)dt.Rows[0]["ProductID"], AppSession.CurrentWarehouseID);
                    var batch = GetBestBatch(p.ProductID);
                    if (batch != null) {
                        p.BatchID = batch.BatchID;
                        p.BatchNumber = batch.BatchNumber;
                    }
                    AddItem(p);
                    txtSearch.Clear();
                }
                else if (dt.Rows.Count > 1)
                {
                    MessageBox.Show("وجد أكثر من منتج، يرجى تحديد الباركود بدقة");
                }
                else
                {
                    MessageBox.Show("المنتج غير موجود");
                }
            }
        }


        private SaleItem GetBestBatch(int productID)
        {
             // This would normally call a DAL method. Stubbing for now.
             string sql = "SELECT TOP 1 BatchID, BatchNumber, ExpiryDate FROM Batches WHERE ProductID=@PID AND Status='Active' AND CurrentQty > 0 ORDER BY ExpiryDate ASC";
             var dt = DatabaseHelper.ExecuteQuery(sql, new System.Data.SqlClient.SqlParameter("@PID", productID));
             if (dt.Rows.Count > 0) {
                 return new SaleItem { 
                     BatchID = (int)dt.Rows[0]["BatchID"], 
                     BatchNumber = dt.Rows[0]["BatchNumber"].ToString() 
                 };
             }
             return null;
        }

        private void AddItem(Product p)
        {
            var existing = _items.FirstOrDefault(i => i.ProductID == p.ProductID);
            if (existing != null)
            {
                existing.Quantity++;
            }
            else
            {
                _items.Add(new SaleItem {
                    ProductID = p.ProductID,
                    ProductCode = p.ProductCode,
                    ProductName = p.ProductName,
                    Quantity = 1,
                    UnitPrice = p.RetailPrice,
                    CostPrice = p.CostPrice,
                    TaxRate = p.TaxRate,
                    Discount = 0,
                    BatchID = p.BatchID,
                    BatchNumber = p.BatchNumber
                });
            }
            RefreshGrid();
        }

        private void RefreshGrid()
        {
            gridItems.Rows.Clear();
            decimal subtotal = 0, tax = 0;

            foreach (var item in _items)
            {
                gridItems.Rows.Add(item.ProductID, item.ProductName, item.BatchNumber ?? "N/A", item.Quantity, item.UnitPrice, item.TotalPrice);
                subtotal += item.SubTotal;
                tax += item.TaxAmount;
            }

            decimal total = subtotal + tax;

            lblSubTotal.Text = $"المجموع الفرعي: {subtotal:N2}";
            lblTax.Text = $"الضريبة ({_taxRate}%): {tax:N2}";
            lblTotal.Text = $"الإجمالي النهائي: {total:N2}";
        }

        private void BtnPay_Click(object sender, EventArgs e)
        {
            if (_items.Count == 0) return;

            decimal total = _items.Sum(i => i.TotalPrice);
            
            // Simple Pay Dialog logic
            var invoice = new SalesInvoice {
                InvoiceID = _invoiceID,
                InvoiceNumber = _invoiceID > 0 ? lblInvNumber.Text.Replace("رقم الفاتورة: ", "") : null,
                InvoiceDate = DateTime.Now,
                UserID = AppSession.CurrentUser?.UserID ?? 1,
                WarehouseID = AppSession.CurrentWarehouseID,
                CustomerID = cmbCustomer.SelectedValue == null ? (int?)null : (int)cmbCustomer.SelectedValue,
                InvoiceType = "RETAIL",
                Status = "PAID",
                PaymentMethod = "CASH",
                DiscountType = "AMOUNT", // Default
                DiscountValue = 0,
                DiscountAmount = 0,
                SubTotal = _items.Sum(i => i.SubTotal),
                TaxAmount = _items.Sum(i => i.TaxAmount),
                TotalAmount = total,
                PaidAmount = total,
                RemainingAmount = 0,
                Items = _items
            };

            try
            {
                int id = SalesDAL.SaveInvoice(invoice);
                MessageBox.Show($"تم حفظ الفاتورة بنجاح. رقم الفاتورة: {id}");
                
                // Print option
                if (MessageBox.Show("هل تريد طباعة الفاتورة؟", "طباعة", MessageBoxButtons.YesNo) == DialogResult.Yes)
                {
                    new InvoicePrintForm(id).ShowDialog();
                }

                ResetPOS();
            }
            catch (Exception ex)
            {
                MessageBox.Show("خطأ في حفظ الفاتورة: " + ex.Message);
            }
        }

        private void GridItems_CellValueChanged(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0 || e.RowIndex >= _items.Count) return;
            var row = gridItems.Rows[e.RowIndex];
            var item = _items[e.RowIndex];

            if (e.ColumnIndex == 2) // Quantity
            {
                if (decimal.TryParse(row.Cells[2].Value?.ToString(), out var q))
                    item.Quantity = q;
            }
            else if (e.ColumnIndex == 3) // UnitPrice
            {
                if (decimal.TryParse(row.Cells[3].Value?.ToString(), out var p))
                    item.UnitPrice = p;
            }

            RefreshGrid();
        }

        private void GridItems_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Delete && gridItems.SelectedRows.Count > 0)
            {
                int idx = gridItems.SelectedRows[0].Index;
                if (idx >= 0 && idx < _items.Count)
                {
                    _items.RemoveAt(idx);
                    RefreshGrid();
                }
            }
        }

        private void ResetPOS()
        {
            _items.Clear();
            _invoiceID = 0;
            txtSearch.Clear();
            RefreshGrid();
            txtSearch.Focus();
            btnPay.Text = "💳 دفع وأرشفة (F12)";
            
            lblInvNumber.Text = "رقم الفاتورة: ---";
            lblInvDate.Text = "التاريخ: " + DateTime.Now.ToShortDateString();
            if (cmbCustomer.Items.Count > 0) cmbCustomer.SelectedIndex = 0;
        }
        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            if (keyData == Keys.F12)
            {
                BtnPay_Click(null, null);
                return true;
            }
            return base.ProcessCmdKey(ref msg, keyData);
        }
    }
}

