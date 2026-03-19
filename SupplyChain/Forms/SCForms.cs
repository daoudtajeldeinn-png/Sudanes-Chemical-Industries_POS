using System;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.SupplyChain.DAL;
using POSSystem.Forms;
using POSSystem.UI;

namespace POSSystem.SupplyChain.Forms
{
    public class SCMainForm : UserControl
    {
        private Panel pnlSidebar, pnlContent;
        private Label lblHeader;

        public SCMainForm()
        {
            this.Dock = DockStyle.Fill;
            InitializeComponents();
            ShowDashboard();
        }

        private void InitializeComponents()
        {
            // Removed WindowState and Title since it's now a UserControl
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.RightToLeft = RightToLeft.Yes;

            pnlSidebar = new Panel { Dock = DockStyle.Right, Width = 240, BackColor = UIHelper.DarkBg };
            pnlContent = new Panel { Dock = DockStyle.Fill, BackColor = UIHelper.DarkBg, Padding = new Padding(30) };

            var lblTitle = new Label {
                Text = "🔗 SCI Supply Chain",
                Height = 80, Dock = DockStyle.Top,
                ForeColor = UIHelper.Primary,
                Font = new Font("Segoe UI", 16f, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter
            };
            pnlSidebar.Controls.Add(lblTitle);

            string[] menuItems = { "لوحة التحكم", "المواد الخام (APIs)", "الدفعات (Batches)", "مراقبة الجودة (QC)", "الموردين", "التقارير" };
            int y = 90;
            foreach (var item in menuItems)
            {
                var btn = new Button {
                    Text = item,
                    Top = y, Left = 15, Width = 210, Height = 50,
                    Tag = item
                };
                UIHelper.StyleSidebarButton(btn);
                btn.Click += MenuButton_Click;
                pnlSidebar.Controls.Add(btn);
                y += 55;
            }

            this.Controls.Add(pnlContent);
            this.Controls.Add(pnlSidebar);
        }

        private void MenuButton_Click(object sender, EventArgs e)
        {
            string text = ((Button)sender).Text;
            pnlContent.Controls.Clear();
            
            if (text == "لوحة التحكم") ShowDashboard();
            else if (text.Contains("المواد الخام")) ShowMaterialsGrid();
            else if (text == "الدفعات (Batches)") ShowGrid("إدارة الدفعات والتشغيلات", SCDAL.GetBatches());
            else if (text == "مراقبة الجودة (QC)") ShowQCGrid();
            else if (text == "الموردين") ShowSuppliersGrid();
            else if (text == "التقارير") ShowReports();
            else ShowPlaceholder(text);
        }

        private void ShowMaterialsGrid()
        {
            pnlContent.Controls.Clear();
            var lbl = UIHelper.CreateHeaderLabel("إدارة المواد الخام (Raw Materials / APIs)");
            
            var pnlActions = new Panel { Dock = DockStyle.Top, Height = 60 };
            var btnAdd = new Button { Text = "➕ إضافة صنف جديد", Width = 180, Height = 40, Location = new Point(10, 10) };
            UIHelper.StyleButton(btnAdd, UIHelper.Success);
            btnAdd.Click += (s, e) => {
                if (new SCEditForm().ShowDialog() == DialogResult.OK) ShowMaterialsGrid();
            };
            pnlActions.Controls.Add(btnAdd);

            var grid = new DataGridView { 
                Dock = DockStyle.Fill, 
                DataSource = SCDAL.GetRawMaterials()
            };
            UIHelper.StyleGrid(grid);
            
            grid.CellDoubleClick += (s, e) => {
                if (grid.SelectedRows.Count > 0 && e.RowIndex >= 0) {
                    int id = (int)grid.SelectedRows[0].Cells["RawMaterialID"].Value;
                    if (new SCEditForm(SCDAL.GetRawMaterialByID(id)).ShowDialog() == DialogResult.OK) ShowMaterialsGrid();
                }
            };

            pnlContent.Controls.Add(grid);
            pnlContent.Controls.Add(pnlActions);
            pnlContent.Controls.Add(lbl);
        }

        private void ShowDashboard()
        {
            pnlContent.Controls.Clear();
            var dt = SCDAL.GetDashboard();
            if (dt.Rows.Count == 0) return;
            var row = dt.Rows[0];

            FlowLayoutPanel flow = new FlowLayoutPanel { Dock = DockStyle.Fill };
            flow.Controls.Add(CreateStatCard("طلبات شراء معلقة", row["PendingPOs"].ToString(), Color.Orange));
            flow.Controls.Add(CreateStatCard("بانتظار الفحص (QC)", row["QCUnderTest"].ToString(), Color.LightBlue));
            flow.Controls.Add(CreateStatCard("مواد ناقصة", row["LowStock"].ToString(), Color.Red));
            flow.Controls.Add(CreateStatCard("دفعات تقترب من الانتهاء", row["Expiring"].ToString(), Color.Yellow));
            
            pnlContent.Controls.Add(flow);
        }

        private void ShowGrid(string title, System.Data.DataTable dt)
        {
            pnlContent.Controls.Clear();
            var lbl = UIHelper.CreateHeaderLabel(title);
            var grid = new DataGridView { 
                Dock = DockStyle.Fill, DataSource = dt
            };
            UIHelper.StyleGrid(grid);
            pnlContent.Controls.Add(grid);
            pnlContent.Controls.Add(lbl);
        }

        private void ShowPlaceholder(string title)
        {
            var lbl = new Label { Text = title + "\n(قيد التطوير)", Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleCenter, ForeColor = Color.Gray, Font = new Font("Segoe UI", 20f) };
            pnlContent.Controls.Add(lbl);
        }

        private void ShowQCGrid()
        {
            pnlContent.Controls.Clear();
            var lbl = UIHelper.CreateHeaderLabel("مراقبة الجودة والإفراج عن الدفعات (QC & Release)");
            
            var pnlActions = new Panel { Dock = DockStyle.Top, Height = 60 };
            var btnRelease = new Button { Text = "📋 إجراء الفحص / إفراج", Width = 180, Height = 40, Location = new Point(10, 10) };
            UIHelper.StyleButton(btnRelease, UIHelper.Primary);
            btnRelease.Click += (s, e) => {
                if (gridQC.SelectedRows.Count > 0) {
                    var row = gridQC.SelectedRows[0];
                    int id = (int)row.Cells["BatchID"].Value;
                    string num = row.Cells["BatchNumber"].Value.ToString();
                    string item = row.Cells["ItemName"].Value.ToString();
                    if (new QCManagementForm(id, num, item).ShowDialog() == DialogResult.OK) ShowQCGrid();
                } else {
                    MessageBox.Show("يرجى اختيار دفعة من الجدول أولاً");
                }
            };
            pnlActions.Controls.Add(btnRelease);

            gridQC = new DataGridView { 
                Dock = DockStyle.Fill, 
                DataSource = SCDAL.GetQCBatches()
            };
            UIHelper.StyleGrid(gridQC);
            
            pnlContent.Controls.Add(gridQC);
            pnlContent.Controls.Add(pnlActions);
            pnlContent.Controls.Add(lbl);
        }
        private DataGridView gridQC;

        private void ShowSuppliersGrid()
        {
            pnlContent.Controls.Clear();
            var lbl = new Label { Text = "إدارة الموردين", Dock = DockStyle.Top, Height = 40, ForeColor = Color.White, Font = new Font("Segoe UI", 14f, FontStyle.Bold) };
            
            var grid = new DataGridView { 
                Dock = DockStyle.Fill, 
                DataSource = POSSystem.DAL.SupplierDAL.GetAll(), 
                BackgroundColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.Black,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                ReadOnly = true
            };
            
            pnlContent.Controls.Add(grid);
            pnlContent.Controls.Add(lbl);
        }

        private void ShowReports()
        {
            pnlContent.Controls.Clear();
            var lbl = new Label { Text = "تقارير سلاسل الإمداد", Dock = DockStyle.Top, Height = 40, ForeColor = Color.White, Font = new Font("Segoe UI", 14f, FontStyle.Bold) };
            
            FlowLayoutPanel flow = new FlowLayoutPanel { Dock = DockStyle.Fill };
            string[] reports = { "تقرير أصناف تحت الحد الأدنى", "تقرير الدفعات المنتهية", "تقرير المشتريات المعلقة" };
            foreach (var r in reports) {
                var btn = new Button { Text = r, Size = new Size(200, 120), BackColor = Color.FromArgb(51, 65, 85), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Margin = new Padding(10) };
                flow.Controls.Add(btn);
            }
            
            pnlContent.Controls.Add(flow);
            pnlContent.Controls.Add(lbl);
        }

        private Panel CreateStatCard(string title, string val, Color color)
        {
            var p = new Panel { Width = 200, Height = 100, BackColor = Color.FromArgb(30, 41, 59), Margin = new Padding(10) };
            p.Controls.Add(new Label { Text = title, Top = 10, Left = 10, ForeColor = Color.White, AutoSize = true });
            p.Controls.Add(new Label { Text = val, Top = 40, Left = 10, ForeColor = color, Font = new Font("Segoe UI", 18f, FontStyle.Bold), AutoSize = true });
            return p;
        }

        private void ShowPage(UserControl page)
        {
            page.Dock = DockStyle.Fill;
            pnlContent.Controls.Add(page);
        }
    }
}
