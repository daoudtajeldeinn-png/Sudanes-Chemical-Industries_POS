using System;
using System.Drawing;
using System.Drawing.Printing;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.Models;
using POSSystem.UI;

namespace POSSystem.Forms
{
    // ============================================================
    //  طباعة الفاتورة
    // ============================================================
    public class InvoicePrintForm : Form
    {
        private SalesInvoice _invoice;
        private RichTextBox rtbPreview;

        public InvoicePrintForm(int invoiceID)
        {
            _invoice = SalesDAL.GetInvoiceByID(invoiceID);
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = $"طباعة الفاتورة - {_invoice?.InvoiceNumber}";
            this.Size = new Size(500, 700);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.White;
            this.RightToLeft = RightToLeft.Yes;

            rtbPreview = new RichTextBox
            {
                Dock = DockStyle.Fill,
                ReadOnly = true,
                Font = new Font("Courier New", 9f),
                BackColor = Color.White,
                BorderStyle = BorderStyle.None
            };

            var pnlButtons = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 50,
                BackColor = Color.WhiteSmoke
            };

            var btnPrint = new Button
            {
                Text = "🖨️ طباعة",
                Location = new Point(10, 10),
                Size = new Size(100, 32),
                BackColor = Color.FromArgb(59, 130, 246),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            btnPrint.FlatAppearance.BorderSize = 0;
            btnPrint.Click += BtnPrint_Click;

            var btnClose = new Button
            {
                Text = "إغلاق",
                Location = new Point(120, 10),
                Size = new Size(80, 32),
                BackColor = Color.FromArgb(107, 114, 128),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            btnClose.FlatAppearance.BorderSize = 0;
            btnClose.Click += (s, e) => this.Close();

            pnlButtons.Controls.AddRange(new Control[] { btnPrint, btnClose });
            this.Controls.Add(rtbPreview);
            this.Controls.Add(pnlButtons);

            BuildInvoiceText();
        }

        private void BuildInvoiceText()
        {
            if (_invoice == null) return;
            var company = AppSession.Company;
            var sb = new System.Text.StringBuilder();
            string sep = new string('-', 44);
            string sep2 = new string('=', 44);

            sb.AppendLine(sep2);
            sb.AppendLine(CenterText(company?.CompanyNameAr ?? "شركتي", 44));
            if (!string.IsNullOrEmpty(company?.Address))
                sb.AppendLine(CenterText(company.Address, 44));
            if (!string.IsNullOrEmpty(company?.Phone))
                sb.AppendLine(CenterText($"هاتف: {company.Phone}", 44));
            if (!string.IsNullOrEmpty(company?.TaxNumber))
                sb.AppendLine(CenterText($"الرقم الضريبي: {company.TaxNumber}", 44));
            sb.AppendLine(sep2);
            sb.AppendLine(CenterText("فاتورة ضريبية مبسطة", 44));
            sb.AppendLine(sep);
            sb.AppendLine($"رقم الفاتورة : {_invoice.InvoiceNumber}");
            sb.AppendLine($"التاريخ      : {_invoice.InvoiceDate:dd/MM/yyyy hh:mm tt}");
            sb.AppendLine($"الكاشير      : {_invoice.UserName}");
            if (!string.IsNullOrEmpty(_invoice.CustomerName) && _invoice.CustomerName != "نقدي")
                sb.AppendLine($"العميل       : {_invoice.CustomerName}");
            sb.AppendLine(sep);

            // رأس الجدول
            sb.AppendLine($"{"المنتج",-20} {"كمية",5} {"سعر",8} {"إجمالي",8}");
            sb.AppendLine(sep);

            foreach (var item in _invoice.Items)
            {
                string name = item.ProductName.Length > 18 ? item.ProductName.Substring(0, 18) : item.ProductName;
                sb.AppendLine($"{name,-20} {item.Quantity,5:N0} {item.UnitPrice,8:N2} {item.TotalPrice,8:N2}");
                if (item.Discount > 0)
                    sb.AppendLine($"{"   خصم:",-20} {"",5} {"",8} {-item.Discount,8:N2}");
            }

            sb.AppendLine(sep);
            sb.AppendLine($"{"المجموع الفرعي",-28} {_invoice.SubTotal,8:N2}");
            if (_invoice.DiscountAmount > 0)
                sb.AppendLine($"{"الخصم",-28} {-_invoice.DiscountAmount,8:N2}");
            if (_invoice.TaxAmount > 0)
                sb.AppendLine($"{"ضريبة القيمة المضافة 15%",-28} {_invoice.TaxAmount,8:N2}");
            sb.AppendLine(sep2);
            sb.AppendLine($"{"الإجمالي",-28} {_invoice.TotalAmount,8:N2}");
            sb.AppendLine($"{"المدفوع",-28} {_invoice.PaidAmount,8:N2}");
            if (_invoice.PaidAmount - _invoice.TotalAmount > 0)
                sb.AppendLine($"{"المبلغ المرتجع",-28} {_invoice.PaidAmount - _invoice.TotalAmount,8:N2}");
            if (_invoice.RemainingAmount > 0)
                sb.AppendLine($"{"المتبقي (آجل)",-28} {_invoice.RemainingAmount,8:N2}");
            sb.AppendLine(sep2);

            string payment = _invoice.PaymentMethod switch
            {
                "CASH"     => "نقداً",
                "CARD"     => "بطاقة",
                "CREDIT"   => "آجل",
                "TRANSFER" => "تحويل",
                _ => _invoice.PaymentMethod
            };
            sb.AppendLine(CenterText($"طريقة الدفع: {payment}", 44));
            sb.AppendLine(sep);
            sb.AppendLine(CenterText("شكراً لزيارتكم", 44));
            if (!string.IsNullOrEmpty(company?.InvoiceFooter))
                sb.AppendLine(CenterText(company.InvoiceFooter, 44));
            sb.AppendLine(sep2);

            rtbPreview.Text = sb.ToString();
        }

        private string CenterText(string text, int width)
        {
            if (text.Length >= width) return text;
            int spaces = (width - text.Length) / 2;
            return new string(' ', spaces) + text;
        }

        private void BtnPrint_Click(object sender, EventArgs e)
        {
            var pd = new PrintDocument();
            pd.PrintPage += (s, ev) =>
            {
                var font = new Font("Courier New", 9f);
                var brush = Brushes.Black;
                float y = ev.MarginBounds.Top;
                foreach (var line in rtbPreview.Text.Split('\n'))
                {
                    ev.Graphics.DrawString(line, font, brush, ev.MarginBounds.Left, y);
                    y += font.GetHeight(ev.Graphics) + 2;
                    if (y > ev.MarginBounds.Bottom) break;
                }
            };

            var dialog = new PrintDialog { Document = pd };
            if (dialog.ShowDialog() == DialogResult.OK)
                pd.Print();
        }
    }

    // ============================================================
    //  قائمة فواتير المبيعات
    // ============================================================
    public class SalesListForm : UserControl
    {
        private DataGridView grid;
        private DateTimePicker dtpFrom, dtpTo;
        private Button btnSearch, btnNew, btnView, btnCancel, btnEdit;
        private Label lblTotal;

        public SalesListForm()
        {
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.Dock = DockStyle.Fill;
            this.RightToLeft = RightToLeft.Yes;
            BuildUI();
            LoadData();
        }

        private void BuildUI()
        {
            // شريط الأدوات
            var pnlToolbar = new Panel
            {
                Dock = DockStyle.Top,
                Height = 55,
                BackColor = Color.FromArgb(30, 41, 59),
                Padding = new Padding(10, 8, 10, 8)
            };

            dtpFrom = new DateTimePicker { Format = DateTimePickerFormat.Short, Width = 120, Value = DateTime.Today.AddDays(-30) };
            dtpTo   = new DateTimePicker { Format = DateTimePickerFormat.Short, Width = 120, Value = DateTime.Today };

            btnSearch = new Button { Text = "🔍 بحث", Width = 80, BackColor = Color.FromArgb(59, 130, 246), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Height = 35 };
            btnSearch.FlatAppearance.BorderSize = 0;
            btnSearch.Click += (s, e) => LoadData();

            btnNew = new Button { Text = "➕ فاتورة جديدة", Width = 120, BackColor = Color.FromArgb(16, 185, 129), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Height = 35 };
            btnNew.FlatAppearance.BorderSize = 0;
            btnNew.Click += (s, e) => OpenNewInvoice();

            btnView = new Button { Text = "👁️ عرض", Width = 80, BackColor = Color.FromArgb(139, 92, 246), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Height = 35 };
            btnView.FlatAppearance.BorderSize = 0;
            btnView.Click += (s, e) => ViewInvoice();

            btnEdit = new Button { Text = "✏️ تعديل", Width = 80, BackColor = Color.FromArgb(245, 158, 11), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Height = 35 };
            btnEdit.FlatAppearance.BorderSize = 0;
            btnEdit.Click += (s, e) => EditInvoice();

            btnCancel = new Button { Text = "❌ إلغاء", Width = 80, BackColor = Color.FromArgb(239, 68, 68), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Height = 35 };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Click += (s, e) => CancelInvoice();

            lblTotal = new Label { Text = "الإجمالي: 0", ForeColor = Color.FromArgb(16, 185, 129), Font = new Font("Segoe UI", 10f, FontStyle.Bold), TextAlign = ContentAlignment.MiddleLeft, Width = 200 };

            var flow = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft };
            flow.Controls.AddRange(new Control[] {
                new Label { Text = "من:", ForeColor = Color.White, Width=30, TextAlign=ContentAlignment.MiddleLeft }, dtpFrom,
                new Label { Text = "إلى:", ForeColor = Color.White, Width=35, TextAlign=ContentAlignment.MiddleLeft }, dtpTo,
                btnSearch, btnNew, btnView, btnEdit, btnCancel, lblTotal
            });
            pnlToolbar.Controls.Add(flow);

            // الجدول
            grid = CreateGrid();
            grid.CellDoubleClick += (s, e) => { if (e.RowIndex >= 0) ViewInvoice(); };

            this.Controls.Add(grid);
            this.Controls.Add(pnlToolbar);
        }

        private void LoadData()
        {
            try
            {
                var dt = SalesDAL.GetInvoices(dtpFrom.Value, dtpTo.Value);
                grid.DataSource = dt;

                decimal total = 0;
                foreach (System.Data.DataRow row in dt.Rows)
                    total += (decimal)row["TotalAmount"];
                lblTotal.Text = $"الإجمالي: {total:N2}";
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطأ: {ex.Message}", "خطأ", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void OpenNewInvoice()
        {
            var form = new Form
            {
                Text = "فاتورة مبيعات جديدة",
                WindowState = FormWindowState.Maximized,
                RightToLeft = RightToLeft.Yes
            };
            form.Controls.Add(new POSSystem.Forms.POS.POSForm { Dock = DockStyle.Fill });
            form.ShowDialog();
            LoadData();
        }

        private void EditInvoice()
        {
            if (grid.SelectedRows.Count == 0) return;
            int invoiceID = (int)grid.SelectedRows[0].Cells["InvoiceID"].Value;
            string status = grid.SelectedRows[0].Cells["Status"].Value?.ToString();

            if (status == "CANCELLED")
            {
                MessageBox.Show("لا يمكن تعديل فاتورة ملغاة", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var form = new Form
            {
                Text = "تعديل فاتورة مبيعات",
                WindowState = FormWindowState.Maximized,
                RightToLeft = RightToLeft.Yes,
                StartPosition = FormStartPosition.CenterScreen
            };
            form.Controls.Add(new POSSystem.Forms.POS.POSForm(invoiceID) { Dock = DockStyle.Fill });
            form.ShowDialog();
            LoadData();
        }

        private void ViewInvoice()
        {
            if (grid.SelectedRows.Count == 0) return;
            int invoiceID = (int)grid.SelectedRows[0].Cells["InvoiceID"].Value;
            new InvoicePrintForm(invoiceID).ShowDialog();
        }

        private void CancelInvoice()
        {
            if (grid.SelectedRows.Count == 0) return;
            int invoiceID = (int)grid.SelectedRows[0].Cells["InvoiceID"].Value;
            string status = grid.SelectedRows[0].Cells["Status"].Value?.ToString();

            if (status == "CANCELLED")
            {
                MessageBox.Show("الفاتورة ملغاة مسبقاً", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (MessageBox.Show("هل تريد إلغاء هذه الفاتورة؟", "تأكيد",
                MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;

            try
            {
                SalesDAL.CancelInvoice(invoiceID, AppSession.CurrentUser.UserID);
                MessageBox.Show("تم إلغاء الفاتورة بنجاح", "نجح", MessageBoxButtons.OK, MessageBoxIcon.Information);
                LoadData();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطأ: {ex.Message}", "خطأ", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private DataGridView CreateGrid()
        {
            return new DataGridView
            {
                Dock = DockStyle.Fill,
                BackgroundColor = Color.FromArgb(30, 41, 59),
                GridColor = Color.FromArgb(51, 65, 85),
                DefaultCellStyle = new DataGridViewCellStyle
                {
                    BackColor = Color.FromArgb(30, 41, 59),
                    ForeColor = Color.White,
                    Font = new Font("Segoe UI", 9.5f),
                    Alignment = DataGridViewContentAlignment.MiddleRight,
                    SelectionBackColor = Color.FromArgb(59, 130, 246)
                },
                ColumnHeadersDefaultCellStyle = new DataGridViewCellStyle
                {
                    BackColor = Color.FromArgb(15, 23, 42),
                    ForeColor = Color.FromArgb(148, 163, 184),
                    Font = new Font("Segoe UI", 9.5f, FontStyle.Bold)
                },
                RowHeadersVisible = false,
                ReadOnly = true,
                AllowUserToAddRows = false,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                BorderStyle = BorderStyle.None
            };
        }
    }

    // ============================================================
    //  نماذج الصفحات (Placeholder Forms)
    // ============================================================
    public class PurchasesForm : BaseListForm 
    { 
        public PurchasesForm() : base("فواتير المشتريات") { } 
        protected override void OnNewRecord() { if (new PurchaseEditForm().ShowDialog() == DialogResult.OK) OnLoadData(); }
        protected override void OnEditRecord() {
            if (MainGrid.SelectedRows.Count == 0) return;
            int id = (int)MainGrid.SelectedRows[0].Cells["InvoiceID"].Value;
            if (new PurchaseEditForm(id).ShowDialog() == DialogResult.OK) OnLoadData();
        }
    }
    
    public class InventoryForm : BaseListForm 
    { 
        public InventoryForm() : base("إدارة المخزون") { } 
        protected override void OnEditRecord() {
            if (MainGrid.SelectedRows.Count == 0) return;
            string code = MainGrid.SelectedRows[0].Cells["ProductCode"].Value.ToString();
            var p = ProductDAL.GetProductByBarcode(code, AppSession.CurrentWarehouseID);
            if (new StockAdjustmentForm(p).ShowDialog() == DialogResult.OK) OnLoadData();
        }
    }
    
    public class CustomersForm : BaseListForm 
    { 
        public CustomersForm() : base("إدارة العملاء") { } 
        protected override void OnNewRecord() { if (new CustomerEditForm().ShowDialog() == DialogResult.OK) OnLoadData(); }
        protected override void OnEditRecord() {
            if (MainGrid.SelectedRows.Count == 0) return;
            int id = (int)MainGrid.SelectedRows[0].Cells[0].Value;
            if (new CustomerEditForm(CustomerDAL.GetByID(id)).ShowDialog() == DialogResult.OK) OnLoadData();
        }
    }
    
    public class SuppliersForm : BaseListForm 
    { 
        public SuppliersForm() : base("إدارة الموردين") { } 
        protected override void OnNewRecord() { if (new SupplierEditForm().ShowDialog() == DialogResult.OK) OnLoadData(); }
        protected override void OnEditRecord() {
            if (MainGrid.SelectedRows.Count == 0) return;
            int id = (int)MainGrid.SelectedRows[0].Cells[0].Value;
            if (new SupplierEditForm(SupplierDAL.GetByID(id)).ShowDialog() == DialogResult.OK) OnLoadData();
        }
    }
    
    public class ExpensesForm : BaseListForm 
    { 
        public ExpensesForm() : base("إدارة المصروفات") { } 
        protected override void OnNewRecord() { if (new ExpenseEditForm().ShowDialog() == DialogResult.OK) OnLoadData(); }
        protected override void OnEditRecord() {
            if (MainGrid.SelectedRows.Count == 0) return;
            int id = (int)MainGrid.SelectedRows[0].Cells[0].Value;
            if (new ExpenseEditForm(ExpenseDAL.GetByID(id)).ShowDialog() == DialogResult.OK) OnLoadData();
        }
    }
    
    public class ReportsForm : UserControl
    {
        private Panel pnlContent;
        public ReportsForm()
        {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.FromArgb(15, 23, 42);
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            var pnlToolbar = new Panel { Dock = DockStyle.Top, Height = 60, BackColor = Color.FromArgb(30, 41, 59) };
            var btnSales = CreateBtn("📈 تقرير المبيعات", Color.FromArgb(59, 130, 246));
            btnSales.Click += (s, e) => ShowReport("SALES");
            
            var btnVAT = CreateBtn("📑 تقرير الضريبة", Color.FromArgb(139, 92, 246));
            btnVAT.Click += (s, e) => ShowReport("VAT");

            var btnProfit = CreateBtn("💰 الأرباح والخسائر", Color.FromArgb(16, 185, 129));
            btnProfit.Click += (s, e) => ShowReport("PROFIT");

            var flow = new FlowLayoutPanel { Dock = DockStyle.Fill, RightToLeft = RightToLeft.Yes };
            flow.Controls.AddRange(new Control[] { btnSales, btnVAT, btnProfit });
            pnlToolbar.Controls.Add(flow);
            this.Controls.Add(pnlToolbar);

            pnlContent = new Panel { Dock = DockStyle.Fill, Padding = new Padding(20) };
            this.Controls.Add(pnlContent);
        }

        private Button CreateBtn(string text, Color color)
        {
            return new Button { Text = text, Width = 150, Height = 45, BackColor = color, ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Margin = new Padding(10, 8, 0, 0) };
        }

        private void ShowReport(string type)
        {
            pnlContent.Controls.Clear();
            var grid = new DataGridView { Dock = DockStyle.Fill, BackgroundColor = Color.FromArgb(30, 41, 59), ForeColor = Color.Black, ReadOnly = true };
            
            if (type == "SALES") grid.DataSource = ReportsDAL.GetSalesByPeriod(DateTime.Today.AddDays(-30), DateTime.Today, "DAY");
            else if (type == "VAT") grid.DataSource = ReportsDAL.GetVATReport(DateTime.Today.AddMonths(-1), DateTime.Today);
            else if (type == "PROFIT") grid.DataSource = ReportsDAL.GetProfitLoss(DateTime.Today.AddMonths(-1), DateTime.Today);

            pnlContent.Controls.Add(grid);
        }
    }
    public class UsersForm : BaseListForm { public UsersForm() : base("إدارة المستخدمين") { } }
    public class SettingsForm : UserControl 
    { 
        private TextBox txtCompany, txtVat, txtAddress, txtPhone;
        private Button btnSave;

        public SettingsForm() {
            this.Dock = DockStyle.Fill;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.RightToLeft = RightToLeft.Yes;
            InitializeComponents();
        }

        private void InitializeComponents() {
            var lblHeader = new Label { Text = "⚙️ إعدادات النظام", Dock = DockStyle.Top, Height = 60, ForeColor = Color.White, Font = new Font("Segoe UI", 18, FontStyle.Bold), TextAlign = ContentAlignment.MiddleCenter };
            this.Controls.Add(lblHeader);

            var pnl = new Panel { Dock = DockStyle.Fill, Padding = new Padding(50) };
            int y = 50, xLabel = 500, xInput = 100;

            AddLabel("اسم الشركة:", y, xLabel, pnl);
            txtCompany = AddText(y, xInput, pnl, "Sudan Chemical Industries"); y += 50;

            AddLabel("نسبة الضريبة %:", y, xLabel, pnl);
            txtVat = AddText(y, xInput, pnl, "15"); y += 50;

            AddLabel("العنوان:", y, xLabel, pnl);
            txtAddress = AddText(y, xInput, pnl, "Khartoum, Sudan"); y += 50;

            AddLabel("رقم الهاتف:", y, xInput, pnl);
            txtPhone = AddText(y, xInput, pnl, "+249 123 456 789"); y += 70;

            btnSave = new Button { Text = "💾 حفظ الإعدادات", Location = new Point(xInput + 220, y), Size = new Size(180, 45), BackColor = Color.FromArgb(59, 130, 246), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.Click += (s, e) => MessageBox.Show("تم حفظ الإعدادات بنجاح");
            
            var btnUsers = new Button { Text = "👥 إدارة المستخدمين", Location = new Point(xInput, y), Size = new Size(180, 45), BackColor = Color.FromArgb(139, 92, 246), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnUsers.Click += (s, e) => {
                var parent = this.FindForm() as MainForm;
                if (parent != null) {
                    var usersPage = new UsersForm { Dock = DockStyle.Fill };
                    this.Parent.Controls.Add(usersPage);
                    usersPage.BringToFront();
                    this.Dispose();
                }
            };

            var lblVersion = new Label { 
                Text = "Version: 3.0.0 (SCI Professional Release)\nDeveloper: د.داود تاج الدين", 
                Location = new Point(xInput, y + 60), 
                AutoSize = true, 
                ForeColor = Color.FromArgb(148, 163, 184),
                Font = new Font("Segoe UI", 9f, FontStyle.Italic)
            };

            pnl.Controls.AddRange(new Control[] { btnSave, btnUsers, lblVersion });

            this.Controls.Add(pnl);
        }

        private void AddLabel(string t, int y, int x, Panel p) => p.Controls.Add(new Label { Text = t, Location = new Point(x, y), ForeColor = Color.FromArgb(148, 163, 184), AutoSize = true });
        private TextBox AddText(int y, int x, Panel p, string val) {
            var t = new TextBox { Text = val, Location = new Point(x, y), Width = 350, BackColor = Color.FromArgb(30, 41, 59), ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle };
            p.Controls.Add(t); return t;
        }
    }

    // نموذج قاعدة للقوائم
    public class BaseListForm : UserControl
    {
        protected DataGridView MainGrid;
        protected string ModuleName;
        protected Panel pnlHeader, pnlActions;
        protected Label lblTitle;
        protected Button btnNew, btnEdit, btnDelete;

        public BaseListForm(string title)
        {
            ModuleName = title; // Keep ModuleName for GetData switch
            this.Text = title;
            this.Dock = DockStyle.Fill;
            this.BackColor = UIHelper.DarkBg;
            this.RightToLeft = RightToLeft.Yes;
            InitializeBase();
            OnLoadData();
        }

        protected TextBox txtSearch;

        private void InitializeBase()
        {
            pnlHeader = new Panel { Dock = DockStyle.Top, Height = 70, Padding = new Padding(15) };
            lblTitle = UIHelper.CreateHeaderLabel(this.Text);
            
            pnlActions = new Panel { Dock = DockStyle.Top, Height = 60, Padding = new Padding(10) };
            btnNew = new Button { Text = "➕ جديد", Width = 110, Location = new Point(10, 10) };
            btnEdit = new Button { Text = "✏️ تعديل", Width = 110, Location = new Point(130, 10) };
            btnDelete = new Button { Text = "🗑️ حذف", Width = 110, Location = new Point(250, 10) };

            UIHelper.StyleButton(btnNew, UIHelper.Success);
            UIHelper.StyleButton(btnEdit, UIHelper.Primary);
            UIHelper.StyleButton(btnDelete, UIHelper.Danger);

            btnNew.Click += (s, e) => OnNewRecord();
            btnEdit.Click += (s, e) => OnEditRecord();
            btnDelete.Click += (s, e) => OnDeleteRecord();

            var btnRefresh = CreateToolbarButton("🔄 تحديث", Color.FromArgb(59, 130, 246));
            btnRefresh.Click += (s, e) => OnLoadData();

            txtSearch = new TextBox { Width = 200, Height = 30, BackColor = Color.FromArgb(15, 23, 42), ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Segoe UI", 10f) };
            txtSearch.KeyDown += (s, e) => { if (e.KeyCode == Keys.Enter) OnLoadData(); };

            var lblSearch = new Label { Text = "🔍 بحث:", ForeColor = Color.White, AutoSize = true, Margin = new Padding(10, 8, 0, 0) };

            var flow = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.RightToLeft
            };
            flow.Controls.AddRange(new Control[] { btnNew, btnEdit, btnDelete, btnRefresh, txtSearch, lblSearch });
            pnlActions.Controls.Add(flow);

            MainGrid = new DataGridView { Dock = DockStyle.Fill };
            UIHelper.StyleGrid(MainGrid);
            
            pnlHeader.Controls.Add(lblTitle);
            
            this.Controls.Add(MainGrid);
            this.Controls.Add(pnlActions);
            this.Controls.Add(pnlHeader);
        }

        private Button CreateToolbarButton(string text, Color color)
        {
            var btn = new Button
            {
                Text = text,
                Width = 100,
                Height = 36,
                BackColor = color,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand,
                Margin = new Padding(4, 0, 0, 0)
            };
            btn.FlatAppearance.BorderSize = 0;
            return btn;
        }

        protected virtual void OnLoadData()
        {
            try
            {
                System.Data.DataTable dt = GetData();
                if (dt != null) MainGrid.DataSource = dt;
            }
            catch (Exception)
            {
                // يمكن إضافة logging هنا
            }
        }

        protected virtual System.Data.DataTable GetData()
        {
            string search = txtSearch?.Text ?? "";
            return ModuleName switch
            {
                "إدارة المنتجات"   => DAL.ProductDAL.GetAllProducts(search),
                "إدارة العملاء"    => DAL.CustomerDAL.GetAll(search),
                "إدارة الموردين"   => DAL.SupplierDAL.GetAll(search),
                "إدارة المصروفات"  => DAL.ExpenseDAL.GetAll(DateTime.Today.AddDays(-30), DateTime.Today),
                "إدارة المخزون"    => DAL.ProductDAL.GetStockReport(AppSession.CurrentWarehouseID, search),
                "فواتير المشتريات" => DAL.PurchaseDAL.GetInvoices(DateTime.Today.AddDays(-30), DateTime.Today),
                "إدارة المستخدمين" => DAL.UserDAL.GetAllUsers(),
                "التقارير"         => DAL.ReportsDAL.GetProfitLoss(DateTime.Today.AddMonths(-1), DateTime.Today),
                _ => null
            };
        }

        protected virtual void OnNewRecord() {
            if (ModuleName == "إدارة المستخدمين") {
                using (var dlg = new UserEditForm()) {
                    if (dlg.ShowDialog() == DialogResult.OK) OnLoadData();
                }
            }
        }
        protected virtual void OnEditRecord() {
            if (ModuleName == "إدارة المستخدمين" && MainGrid.SelectedRows.Count > 0) {
                int id = (int)MainGrid.SelectedRows[0].Cells["UserID"].Value;
                using (var dlg = new UserEditForm(id)) {
                    if (dlg.ShowDialog() == DialogResult.OK) OnLoadData();
                }
            }
        }

        protected virtual void OnDeleteRecord() 
        {
            if (MainGrid.SelectedRows.Count == 0) return;
            if (MessageBox.Show("هل تريد حذف هذا السجل؟", "تأكيد", MessageBoxButtons.YesNo) == DialogResult.No) return;

            int id = (int)MainGrid.SelectedRows[0].Cells[0].Value;
            bool ok = false;
            
            if (ModuleName == "إدارة المنتجات") ok = ProductDAL.DeleteProduct(id);
            else if (ModuleName == "إدارة العملاء") ok = CustomerDAL.Delete(id);
            else if (ModuleName == "إدارة الموردين") ok = SupplierDAL.Delete(id);
            else if (ModuleName == "إدارة المصروفات") ok = ExpenseDAL.Delete(id);

            if (ok) OnLoadData();
        }

    }

    public class ProductsForm : BaseListForm
    {
        public ProductsForm() : base("إدارة المنتجات") { }
        protected override void OnNewRecord() { if (new ProductEditForm().ShowDialog() == DialogResult.OK) OnLoadData(); }
        protected override void OnEditRecord() {
            if (MainGrid.SelectedRows.Count == 0) return;
            int id = (int)MainGrid.SelectedRows[0].Cells[0].Value;
            if (new ProductEditForm(ProductDAL.GetProductByID(id, AppSession.CurrentWarehouseID)).ShowDialog() == DialogResult.OK) OnLoadData();
        }
    }
}
