using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.Models;

namespace POSSystem.Forms
{
    public class PurchaseEditForm : Form
    {
        private TextBox txtInvoiceNum, txtSupplierInv, txtNotes, txtExchangeRate;
        private Label lblExRate;
        private ComboBox cbSupplier, cbCurrency;
        private DataGridView dgvItems;
        private Label lblTotal, lblTax, lblSubTotal;
        private Button btnSave, btnAddItem, btnRemoveItem;
        private List<PurchaseItem> _items = new List<PurchaseItem>();

        private int _invoiceID;
        public PurchaseEditForm(int invoiceID = 0)
        {
            _invoiceID = invoiceID;
            InitializeComponents();
            LoadSuppliers();
            if (_invoiceID > 0) LoadInvoice();
        }

        private void LoadInvoice()
        {
            var inv = PurchaseDAL.GetInvoiceByID(_invoiceID);
            if (inv == null) return;

            this.Text = "تعديل فاتورة مشتريات: " + inv.InvoiceNumber;
            txtInvoiceNum.Text = inv.InvoiceNumber;
            txtSupplierInv.Text = inv.SupplierInvoice;
            txtNotes.Text = inv.Notes;
            cbSupplier.SelectedValue = inv.SupplierID;
            cbCurrency.Text = inv.Currency;
            txtExchangeRate.Text = inv.ExchangeRate.ToString();
            
            _items = inv.Items;
            RefreshGrid();
        }

        private void InitializeComponents()
        {
            this.Text = "فاتورة مشتريات جديدة";
            this.Size = new Size(950, 700);
            this.StartPosition = FormStartPosition.CenterParent;
            this.RightToLeft = RightToLeft.Yes;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;

            var pnlHeader = new Panel { Dock = DockStyle.Top, Height = 130, Padding = new Padding(10) };
            
            AddLabel("المورد:", 10, 780, pnlHeader);
            cbSupplier = new ComboBox { Location = new Point(550, 10), Width = 220, DropDownStyle = ComboBoxStyle.DropDownList };
            
            AddLabel("رقم الفاتورة (داخلي):", 10, 350, pnlHeader);
            txtInvoiceNum = new TextBox { Location = new Point(120, 10), Width = 220, ReadOnly = true };

            AddLabel("رقم فاتورة المورد:", 50, 780, pnlHeader);
            txtSupplierInv = new TextBox { Location = new Point(550, 50), Width = 220 };

            AddLabel("ملاحظات:", 50, 350, pnlHeader);
            txtNotes = new TextBox { Location = new Point(120, 50), Width = 220, Multiline = true, Height = 50 };

            AddLabel("العملة:", 90, 780, pnlHeader);
            cbCurrency = new ComboBox { Location = new Point(550, 90), Width = 100, DropDownStyle = ComboBoxStyle.DropDownList };
            cbCurrency.Items.AddRange(new string[] { "SDG", "USD" });
            cbCurrency.SelectedIndex = 0;
            cbCurrency.SelectedIndexChanged += (s, e) => {
                txtExchangeRate.Visible = cbCurrency.Text == "USD";
                lblExRate.Visible = cbCurrency.Text == "USD";
            };

            lblExRate = new Label { Text = "سعر التحويل:", Location = new Point(450, 90), AutoSize = true, ForeColor = Color.FromArgb(148, 163, 184), Visible = false };
            txtExchangeRate = new TextBox { Location = new Point(350, 90), Width = 80, Text = "1.0", Visible = false };
            pnlHeader.Controls.Add(lblExRate);

            pnlHeader.Controls.AddRange(new Control[] { cbSupplier, txtInvoiceNum, txtSupplierInv, txtNotes, cbCurrency, txtExchangeRate });

            var pnlGridToolbar = new Panel { Dock = DockStyle.Top, Height = 45 };
            btnAddItem = new Button { Text = "➕ إضافة صنف", Location = new Point(810, 5), Size = new Size(120, 35), BackColor = Color.FromArgb(16, 185, 129), FlatStyle = FlatStyle.Flat };
            btnAddItem.Click += BtnAddItem_Click;
            btnRemoveItem = new Button { Text = "🗑️ حذف", Location = new Point(680, 5), Size = new Size(120, 35), BackColor = Color.FromArgb(239, 68, 68), FlatStyle = FlatStyle.Flat };
            btnRemoveItem.Click += BtnRemoveItem_Click;
            pnlGridToolbar.Controls.AddRange(new Control[] { btnAddItem, btnRemoveItem });

            dgvItems = new DataGridView {
                Dock = DockStyle.Fill,
                BackgroundColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.Black,
                RowHeadersVisible = false,
                AllowUserToAddRows = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
            };
            dgvItems.Columns.Add("ProductID", "ID"); dgvItems.Columns[0].Visible = false;
            dgvItems.Columns.Add("ProductName", "المنتج");
            dgvItems.Columns.Add("Quantity", "الكمية");
            dgvItems.Columns.Add("UnitCost", "سعر التكلفة");
            dgvItems.Columns.Add("TaxRate", "الضريبة %");
            dgvItems.Columns.Add("TotalCost", "الإجمالي");
            dgvItems.CellValueChanged += DgvItems_CellValueChanged;

            var pnlFooter = new Panel { Dock = DockStyle.Bottom, Height = 100, BackColor = Color.FromArgb(30, 41, 59) };
            lblSubTotal = new Label { Text = "المجموع: 0.00", Location = new Point(700, 10), Font = new Font("Segoe UI", 12, FontStyle.Bold), AutoSize = true };
            lblTax = new Label { Text = "الضريبة: 0.00", Location = new Point(700, 40), Font = new Font("Segoe UI", 12, FontStyle.Bold), AutoSize = true };
            lblTotal = new Label { Text = "الإجمالي: 0.00", Location = new Point(700, 70), Font = new Font("Segoe UI", 14, FontStyle.Bold), ForeColor = Color.FromArgb(16, 185, 129), AutoSize = true };
            
            btnSave = new Button { Text = "💾 حفظ الفاتورة", Location = new Point(20, 30), Size = new Size(200, 50), BackColor = Color.FromArgb(59, 130, 246), Font = new Font("Segoe UI", 12, FontStyle.Bold), FlatStyle = FlatStyle.Flat };
            btnSave.Click += BtnSave_Click;
            pnlFooter.Controls.AddRange(new Control[] { lblSubTotal, lblTax, lblTotal, btnSave });

            this.Controls.Add(dgvItems);
            this.Controls.Add(pnlGridToolbar);
            this.Controls.Add(pnlHeader);
            this.Controls.Add(pnlFooter);
        }

        private void AddLabel(string text, int y, int x, Control parent)
        {
            var lbl = new Label { Text = text, Location = new Point(x, y), AutoSize = true, ForeColor = Color.FromArgb(148, 163, 184) };
            parent.Controls.Add(lbl);
        }

        private void LoadSuppliers()
        {
            try {
                var dt = SupplierDAL.GetAll();
                cbSupplier.DataSource = dt;
                cbSupplier.DisplayMember = "SupplierName";
                cbSupplier.ValueMember = "SupplierID";
            } catch { }
        }

        private void BtnAddItem_Click(object sender, EventArgs e)
        {
            // Simple product picker or just show product list
            using (var dlg = new Form { Text = "اختر منتج", Size = new Size(500, 500), StartPosition = FormStartPosition.CenterParent, RightToLeft = RightToLeft.Yes })
            {
                var grid = new DataGridView { Dock = DockStyle.Fill, ReadOnly = true, SelectionMode = DataGridViewSelectionMode.FullRowSelect, RowHeadersVisible = false };
                grid.DataSource = ProductDAL.GetAllProducts();
                grid.Columns[0].Visible = false;
                grid.CellDoubleClick += (s, args) => { if (args.RowIndex >= 0) dlg.DialogResult = DialogResult.OK; };
                dlg.Controls.Add(grid);
                if (dlg.ShowDialog() == DialogResult.OK)
                {
                    var row = grid.SelectedRows[0];
                    _items.Add(new PurchaseItem {
                        ProductID = (int)row.Cells["ProductID"].Value,
                        ProductName = row.Cells["ProductName"].Value.ToString(),
                        Quantity = 1,
                        UnitCost = (decimal)row.Cells["CostPrice"].Value,
                        TaxRate = 15 // Default VAT
                    });
                    RefreshGrid();
                }
            }
        }

        private void BtnRemoveItem_Click(object sender, EventArgs e)
        {
            if (dgvItems.SelectedRows.Count > 0)
            {
                int idx = dgvItems.SelectedRows[0].Index;
                _items.RemoveAt(idx);
                RefreshGrid();
            }
        }

        private void RefreshGrid()
        {
            dgvItems.Rows.Clear();
            decimal subtotal = 0, tax = 0;
            foreach (var item in _items)
            {
                dgvItems.Rows.Add(item.ProductID, item.ProductName, item.Quantity, item.UnitCost, item.TaxRate, item.TotalCost);
                subtotal += item.Quantity * item.UnitCost;
                tax += item.TaxAmount;
            }
            lblSubTotal.Text = $"المجموع: {subtotal:N2}";
            lblTax.Text = $"الضريبة: {tax:N2}";
            lblTotal.Text = $"الإجمالي: {subtotal + tax:N2}";
        }

        private void DgvItems_CellValueChanged(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0 || e.RowIndex >= _items.Count) return;
            var row = dgvItems.Rows[e.RowIndex];
            var item = _items[e.RowIndex];
            
            if (e.ColumnIndex == 2) item.Quantity = decimal.TryParse(row.Cells[2].Value?.ToString(), out var q) ? q : 0;
            if (e.ColumnIndex == 3) item.UnitCost = decimal.TryParse(row.Cells[3].Value?.ToString(), out var c) ? c : 0;
            if (e.ColumnIndex == 4) item.TaxRate = decimal.TryParse(row.Cells[4].Value?.ToString(), out var t) ? t : 0;
            
            RefreshGrid();
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (cbSupplier.SelectedValue == null) { MessageBox.Show("يرجى اختيار مورد"); return; }
            if (_items.Count == 0) { MessageBox.Show("يرجى إضافة أصناف للفاتورة"); return; }

            var invoice = new PurchaseInvoice
            {
                InvoiceID = _invoiceID,
                InvoiceNumber = txtInvoiceNum.Text,
                InvoiceDate = DateTime.Now,
                SupplierID = (int)cbSupplier.SelectedValue,
                SupplierInvoice = txtSupplierInv.Text,
                WarehouseID = AppSession.CurrentWarehouseID,
                UserID = AppSession.CurrentUser.UserID,
                SubTotal = _items.Sum(i => i.Quantity * i.UnitCost),
                TaxAmount = _items.Sum(i => i.TaxAmount),
                TotalAmount = _items.Sum(i => i.TotalCost),
                PaidAmount = _items.Sum(i => i.TotalCost),
                RemainingAmount = 0,
                PaymentMethod = "CASH",
                Status = "COMPLETED",
                Notes = txtNotes.Text,
                Currency = cbCurrency.Text,
                ExchangeRate = decimal.TryParse(txtExchangeRate.Text, out var ex) ? ex : 1.0m,
                Items = _items
            };

            try {
                PurchaseDAL.SaveInvoice(invoice);
                MessageBox.Show("تم حفظ فاتورة المشتريات وتحديث المخزون بنجاح");
                this.DialogResult = DialogResult.OK;
                this.Close();
            } catch (Exception exx)
            {
                MessageBox.Show("خطأ في حفظ الفاتورة: " + exx.Message);
            }
        }
    }
}
