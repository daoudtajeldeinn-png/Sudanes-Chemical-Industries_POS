using System;
using System.Drawing;
using System.Windows.Forms;

namespace POSSystem.Forms
{
    public class MainForm : Form
    {
        private Panel pnlSidebar;
        private Panel pnlContent;
        private Panel pnlHeader;
        private Label lblCurrentPage;
        private Timer tmrClock;
        private Label lblClock;

        public MainForm()
        {
            InitializeComponents();
            this.Load += (s, e) => LoadDashboard();
        }

        private void InitializeComponents()
        {
            this.Text = "نظام نقاط البيع";
            this.WindowState = FormWindowState.Maximized;
            this.MinimumSize = new Size(1200, 700);
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.RightToLeft = RightToLeft.Yes;
            this.RightToLeftLayout = true;
            this.Font = new Font("Segoe UI", 9.5f);

            // Sidebar
            pnlSidebar = new Panel
            {
                Dock = DockStyle.Right,
                Width = 240,
                BackColor = Color.FromArgb(15, 23, 42)
            };

            // Header
            pnlHeader = new Panel
            {
                Dock = DockStyle.Top,
                Height = 55,
                BackColor = Color.FromArgb(30, 41, 59)
            };

            lblCurrentPage = new Label
            {
                Text = "لوحة التحكم",
                Font = new Font("Segoe UI", 14f, FontStyle.Bold),
                ForeColor = Color.White,
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleRight
            };

            lblClock = new Label
            {
                Text = DateTime.Now.ToString("hh:mm:ss tt  |  dd/MM/yyyy"),
                Font = new Font("Segoe UI", 10f),
                ForeColor = Color.FromArgb(148, 163, 184),
                Dock = DockStyle.Left,
                Width = 250,
                TextAlign = ContentAlignment.MiddleLeft
            };

            pnlHeader.Controls.AddRange(new Control[] { lblCurrentPage, lblClock });

            // Content
            pnlContent = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(15, 23, 42),
                Padding = new Padding(15)
            };

            // Menu buttons (simplified)
            var menuItems = new (string icon, string title, string key)[]
            {
                ("🏠", "لوحة التحكم", "DASHBOARD"),
                ("🛒", "POS", "POS"),
                ("📄", "المبيعات", "SALES"),
                ("📦", "المشتريات", "PURCHASES"),
                ("🏪", "المخزون", "INVENTORY"),
                ("📋", "المنتجات", "PRODUCTS"),
                ("👥", "العملاء", "CUSTOMERS"),
                ("🚚", "الموردون", "SUPPLIERS"),
                ("💰", "المصروفات", "EXPENSES"),
                ("📊", "التقارير", "REPORTS"),
                ("🔗", "سلاسل الإمداد", "SUPPLY_CHAIN"),
                ("⚙️", "الإعدادات", "SETTINGS")
            };

            var pnlMenu = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.TopDown,
                Padding = new Padding(10),
                AutoScroll = true
            };

            foreach (var item in menuItems)
            {
                var btn = new Button
                {
                    Text = $"{item.icon} {item.title}",
                    Height = 50,
                    Margin = new Padding(5),
                    BackColor = Color.FromArgb(30, 41, 59),
                    ForeColor = Color.White,
                    FlatStyle = FlatStyle.Flat,
                    Tag = item.key
                };
                btn.Click += MenuButton_Click;
                pnlMenu.Controls.Add(btn);
            }

            pnlSidebar.Controls.Add(pnlMenu);

            // Developer branding
            var lblDeveloper = new Label { 
                Text = "Developer: د.داود تاج الدين", 
                Dock = DockStyle.Bottom, Height = 40, 
                ForeColor = Color.FromArgb(148, 163, 184), 
                TextAlign = ContentAlignment.MiddleCenter,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold)
            };
            pnlSidebar.Controls.Add(lblDeveloper);
            
            tmrClock = new Timer { Interval = 1000 };
            tmrClock.Tick += (s, e) => lblClock.Text = DateTime.Now.ToString("hh:mm:ss tt  |  dd/MM/yyyy");
            tmrClock.Start();

            this.Controls.AddRange(new Control[] { pnlContent, pnlHeader, pnlSidebar });
        }

        private void MenuButton_Click(object sender, EventArgs e)
        {
            var btn = (Button)sender;
            string key = btn.Tag.ToString();

            // Update active button
            foreach (Control c in pnlSidebar.Controls[0].Controls)
                if (c is Button b) { b.BackColor = Color.FromArgb(30, 41, 59); b.ForeColor = Color.White; }
            btn.BackColor = Color.FromArgb(59, 130, 246);
            btn.ForeColor = Color.Black;

            ShowPage(key);
        }

        private void ShowPage(string key)
        {
            pnlContent.Controls.Clear();

            UserControl page = key switch
            {
                "DASHBOARD" => new Forms.DashboardControl(),
                "POS" => new POSSystem.Forms.POS.POSForm(),
                "SALES" => new Forms.SalesListForm(),
                "PURCHASES" => new Forms.PurchasesForm(),
                "INVENTORY" => new Forms.InventoryForm(),
                "PRODUCTS" => new Forms.ProductsForm(),
                "CUSTOMERS" => new Forms.CustomersForm(),
                "SUPPLIERS" => new Forms.SuppliersForm(),
                "EXPENSES" => new Forms.ExpensesForm(),
                "REPORTS" => new Forms.ReportsForm(),
                "SETTINGS" => new Forms.SettingsForm(),
                "SUPPLY_CHAIN" => new SupplyChain.Forms.SCMainForm(),
                _ => new Forms.DashboardControl()
            };

            lblCurrentPage.Text = key;
            page.Dock = DockStyle.Fill;
            pnlContent.Controls.Add(page);
        }

        private UserControl CreateStubPage(string title)
        {
            var page = new UserControl { BackColor = Color.FromArgb(15, 23, 42) };
            var lbl = new Label 
            { 
                Dock = DockStyle.Fill, 
                Text = title + "\n(قريباً)",
                ForeColor = Color.White, 
                Font = new Font("Segoe UI", 24), 
                TextAlign = ContentAlignment.MiddleCenter 
            };
            page.Controls.Add(lbl);
            return page;
        }

        private void LoadDashboard()
        {
            ShowPage("DASHBOARD");
        }
    }
}

