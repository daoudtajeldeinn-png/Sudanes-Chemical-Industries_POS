using System;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.UI;

namespace POSSystem.Forms
{
    public class DashboardControl : UserControl
    {
        private FlowLayoutPanel pnlStats;
        private Label lblTodaySales, lblTodayInvoices, lblMonthSales, lblLowStock;
        private Label lblPendingQC, lblExpiringBatches;
        private DataGridView dgvRecentSales, dgvLowStock;

        public DashboardControl()
        {
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.Dock = DockStyle.Fill;
            this.RightToLeft = RightToLeft.Yes;
            InitializeComponents();
            this.HandleCreated += (s, e) => LoadDashboardData();
        }

        private Panel pnlChart;
        private System.Data.DataTable dtChartData;

        private void InitializeComponents()
        {
            var lblTitle = new Label {
                Text = "📊 لوحة التحكم - Sudan Chemical Industries",
                Dock = DockStyle.Top,
                Height = 60,
                Font = new Font("Segoe UI", 18f, FontStyle.Bold),
                ForeColor = Color.White,
                TextAlign = ContentAlignment.MiddleLeft,
                Padding = new Padding(10)
            };
            this.Controls.Add(lblTitle);

            pnlStats = new FlowLayoutPanel {
                Dock = DockStyle.Top,
                Height = 120,
                Padding = new Padding(10)
            };

            lblTodaySales = CreateStatCard("مبيعات اليوم", "0.00", Color.FromArgb(16, 185, 129));
            lblTodayInvoices = CreateStatCard("فواتير اليوم", "0", Color.FromArgb(59, 130, 246));
            lblMonthSales = CreateStatCard("مبيعات الشهر", "0.00", Color.FromArgb(139, 92, 246));
            lblLowStock = CreateStatCard("نواقص المخزون", "0", Color.FromArgb(239, 68, 68));
            lblPendingQC = CreateStatCard("قيد فحص الجودة", "0", Color.FromArgb(245, 158, 11));
            lblExpiringBatches = CreateStatCard("دفعات قاربت الانتهاء", "0", Color.FromArgb(217, 70, 239));

            pnlChart = new Panel {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(30, 41, 59),
                Margin = new Padding(10)
            };
            pnlChart.Paint += PnlChart_Paint;

            var pnlGridsContainer = new TableLayoutPanel {
                Dock = DockStyle.Bottom,
                Height = 350,
                ColumnCount = 2,
                RowCount = 1,
                Padding = new Padding(10)
            };
            pnlGridsContainer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 60f));
            pnlGridsContainer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 40f));

            var pnlSales = new Panel { Dock = DockStyle.Fill, BackColor = UIHelper.PanelBg, Padding = new Padding(10), Margin = new Padding(0, 0, 10, 0) };
            var lblSales = new Label { Text = "📄 آخر المبيعات / Recent Sales", Dock = DockStyle.Top, Height = 40, ForeColor = UIHelper.Primary, Font = new Font("Segoe UI", 11, FontStyle.Bold) };
            dgvRecentSales = new DataGridView { Dock = DockStyle.Fill };
            UIHelper.StyleGrid(dgvRecentSales);
            pnlSales.Controls.Add(dgvRecentSales);
            pnlSales.Controls.Add(lblSales);

            var pnlLow = new Panel { Dock = DockStyle.Fill, BackColor = UIHelper.PanelBg, Padding = new Padding(10), Margin = new Padding(10, 0, 0, 0) };
            var lblLow = new Label { Text = "⚠️ منتجات قاربت على النفاد / Low Stock", Dock = DockStyle.Top, Height = 40, ForeColor = UIHelper.Danger, Font = new Font("Segoe UI", 11, FontStyle.Bold) };
            dgvLowStock = new DataGridView { Dock = DockStyle.Fill };
            UIHelper.StyleGrid(dgvLowStock);
            pnlLow.Controls.Add(dgvLowStock);
            pnlLow.Controls.Add(lblLow);

            pnlGridsContainer.Controls.Add(pnlSales, 0, 0);
            pnlGridsContainer.Controls.Add(pnlLow, 1, 0);

            this.Controls.Add(pnlChart);
            this.Controls.Add(pnlGridsContainer);
            this.Controls.Add(pnlStats);
            this.Controls.Add(lblTitle);
        }

        // The CreateGrid method is no longer needed as grids are styled directly
        // private DataGridView CreateGrid(string title)
        // {
        //     var g = new DataGridView {
        //         Dock = DockStyle.Fill,
        //         BackgroundColor = Color.FromArgb(30, 41, 59),
        //         ForeColor = Color.Black,
        //         BorderStyle = BorderStyle.None,
        //         AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
        //         SelectionMode = DataGridViewSelectionMode.FullRowSelect,
        //         ReadOnly = true,
        //         AllowUserToAddRows = false,
        //         RowHeadersVisible = false
        //     };
        //     return g;
        // }

        private void PnlChart_Paint(object sender, PaintEventArgs e)
        {
            if (dtChartData == null || dtChartData.Rows.Count == 0) return;

            var g = e.Graphics;
            g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;

            int margin = 40;
            int h = pnlChart.Height - margin * 2;
            int w = pnlChart.Width - margin * 2;
            int barCount = dtChartData.Rows.Count;
            int barWidth = (w / barCount) - 10;

            decimal maxSales = 1;
            foreach (System.Data.DataRow row in dtChartData.Rows)
                maxSales = Math.Max(maxSales, Convert.ToDecimal(row["TotalSales"]));

            for (int i = 0; i < barCount; i++)
            {
                var row = dtChartData.Rows[i];
                decimal val = Convert.ToDecimal(row["TotalSales"]);
                float barHeight = (float)(val / maxSales) * h;

                RectangleF rect = new RectangleF(
                    margin + i * (barWidth + 10),
                    margin + h - barHeight,
                    barWidth,
                    barHeight
                );

                var brush = new System.Drawing.Drawing2D.LinearGradientBrush(rect, Color.FromArgb(59, 130, 246), Color.FromArgb(37, 99, 235), 90);
                g.FillRoundedRectangle(brush, rect, 5);

                string label = row["Period"].ToString();
                g.DrawString(label, new Font("Segoe UI", 8f), Brushes.Gray, margin + i * (barWidth + 10), margin + h + 5);
                g.DrawString(val.ToString("N0"), new Font("Segoe UI", 8f, FontStyle.Bold), Brushes.White, margin + i * (barWidth + 10), margin + h - barHeight - 15);
            }
        }

        private Label CreateStatCard(string title, string value, Color color)
        {
            var pnl = new Panel {
                Width = 220,
                Height = 100,
                BackColor = Color.FromArgb(30, 41, 59),
                Margin = new Padding(10)
            };

            var lblTitle = new Label {
                Text = title,
                ForeColor = Color.FromArgb(148, 163, 184),
                Font = new Font("Segoe UI", 10f),
                Location = new Point(10, 10),
                AutoSize = true
            };

            var lblValue = new Label {
                Text = value,
                ForeColor = color,
                Font = new Font("Segoe UI", 16f, FontStyle.Bold),
                Location = new Point(10, 40),
                AutoSize = true
            };

            pnl.Controls.AddRange(new Control[] { lblTitle, lblValue });
            pnlStats.Controls.Add(pnl);
            return lblValue;
        }

        private void LoadDashboardData()
        {
            try {
                var dtSales = ReportsDAL.GetSalesByPeriod(DateTime.Today, DateTime.Today, "DAY");
                if (dtSales.Rows.Count > 0) {
                    lblTodaySales.Text = Convert.ToDecimal(dtSales.Rows[0]["TotalSales"]).ToString("N2");
                    lblTodayInvoices.Text = dtSales.Rows[0]["InvoiceCount"].ToString();
                }

                var dtMonth = ReportsDAL.GetSalesByPeriod(new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1), DateTime.Today, "MONTH");
                if (dtMonth.Rows.Count > 0) {
                    lblMonthSales.Text = Convert.ToDecimal(dtMonth.Rows[0]["TotalSales"]).ToString("N2");
                }

                dtChartData = ReportsDAL.GetSalesByPeriod(DateTime.Today.AddDays(-6), DateTime.Today, "DAY");
                pnlChart.Invalidate();

                dgvRecentSales.DataSource = ReportsDAL.GetRecentSales(10);
                dgvLowStock.DataSource = ProductDAL.GetLowStockProducts(AppSession.CurrentWarehouseID);

                // Load Supply Chain Stats
                var dtSC = POSSystem.SupplyChain.DAL.SCDAL.GetDashboard();
                if (dtSC.Rows.Count > 0)
                {
                    lblPendingQC.Text = dtSC.Rows[0]["QCUnderTest"].ToString();
                    lblExpiringBatches.Text = dtSC.Rows[0]["Expiring"].ToString();
                }
            }
            catch { }
        }
    }

    public static class GraphicsExtensions
    {
        public static void FillRoundedRectangle(this Graphics g, Brush brush, RectangleF rect, float radius)
        {
            using (var path = GetRoundedRect(rect, radius))
            {
                g.FillPath(brush, path);
            }
        }

        private static System.Drawing.Drawing2D.GraphicsPath GetRoundedRect(RectangleF baseRect, float radius)
        {
            var path = new System.Drawing.Drawing2D.GraphicsPath();
            float d = radius * 2;
            path.AddArc(baseRect.X, baseRect.Y, d, d, 180, 90);
            path.AddArc(baseRect.Right - d, baseRect.Y, d, d, 270, 90);
            path.AddArc(baseRect.Right - d, baseRect.Bottom - d, d, d, 0, 90);
            path.AddArc(baseRect.X, baseRect.Bottom - d, d, d, 90, 90);
            path.CloseFigure();
            return path;
        }
    }
}
