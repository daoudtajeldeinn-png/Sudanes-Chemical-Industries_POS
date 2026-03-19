using System;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.Models;

namespace POSSystem.Forms
{
    public class StockAdjustmentForm : Form
    {
        private Product _product;
        private Label lblProductName, lblCurrentStock;
        private TextBox txtNewQty, txtNotes;
        private ComboBox cbAdjustmentType;
        private Button btnSave, btnCancel;

        public StockAdjustmentForm(Product product = null)
        {
            _product = product;
            InitializeComponents();
            if (_product != null) LoadProductData();
        }

        private void InitializeComponents()
        {
            this.Text = "تسوية مخزون";
            this.Size = new Size(450, 400);
            this.StartPosition = FormStartPosition.CenterParent;
            this.RightToLeft = RightToLeft.Yes;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;

            int y = 20, xLabel = 300, xInput = 30, inputWidth = 250;

            AddLabel("المنتج:", y, xLabel);
            lblProductName = new Label { Text = _product?.ProductName ?? "اختر منتجاً...", Location = new Point(xInput, y), Width = inputWidth, ForeColor = Color.Yellow, Font = new Font("Segoe UI", 10, FontStyle.Bold) };
            this.Controls.Add(lblProductName);
            y += 45;

            AddLabel("المخزون الحالي:", y, xLabel);
            lblCurrentStock = new Label { Text = "0.00", Location = new Point(xInput, y), Width = inputWidth, ForeColor = Color.FromArgb(148, 163, 184) };
            this.Controls.Add(lblCurrentStock);
            y += 45;

            AddLabel("نوع العملية:", y, xLabel);
            cbAdjustmentType = new ComboBox { Location = new Point(xInput, y), Width = inputWidth, DropDownStyle = ComboBoxStyle.DropDownList };
            cbAdjustmentType.Items.AddRange(new string[] { "إضافة (Add)", "سحب (Withdraw)", "تسوية (Set Total)" });
            cbAdjustmentType.SelectedIndex = 0;
            this.Controls.Add(cbAdjustmentType);
            y += 45;

            AddLabel("الكمية:", y, xLabel);
            txtNewQty = new TextBox { Location = new Point(xInput, y), Width = inputWidth, BackColor = Color.FromArgb(30, 41, 59), ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle };
            this.Controls.Add(txtNewQty);
            y += 45;

            AddLabel("ملاحظات:", y, xLabel);
            txtNotes = new TextBox { Location = new Point(xInput, y), Width = inputWidth, Height = 60, Multiline = true, BackColor = Color.FromArgb(30, 41, 59), ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle };
            this.Controls.Add(txtNotes);
            y += 80;

            btnSave = new Button { Text = "💾 تنفيذ العملية", Location = new Point(xInput, y), Size = new Size(120, 40), BackColor = Color.FromArgb(16, 185, 129), FlatStyle = FlatStyle.Flat };
            btnSave.Click += BtnSave_Click;
            
            btnCancel = new Button { Text = "إلغاء", Location = new Point(xInput + 130, y), Size = new Size(100, 40), BackColor = Color.FromArgb(239, 68, 68), FlatStyle = FlatStyle.Flat };
            btnCancel.Click += (s, e) => this.Close();

            this.Controls.AddRange(new Control[] { btnSave, btnCancel });
        }

        private void AddLabel(string text, int y, int x)
        {
            this.Controls.Add(new Label { Text = text, Location = new Point(x, y), AutoSize = true, ForeColor = Color.FromArgb(148, 163, 184) });
        }

        private void LoadProductData()
        {
            lblProductName.Text = _product.ProductName;
            lblCurrentStock.Text = _product.AvailableStock.ToString("N2");
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (_product == null) { MessageBox.Show("يرجى اختيار منتج"); return; }
            if (!decimal.TryParse(txtNewQty.Text, out decimal qty)) { MessageBox.Show("يرجى إدخال كمية صحيحة"); return; }

            decimal finalQty = 0;
            string mode = cbAdjustmentType.Text;
            if (mode.Contains("إضافة")) finalQty = _product.AvailableStock + qty;
            else if (mode.Contains("سحب")) finalQty = _product.AvailableStock - qty;
            else finalQty = qty;

            try {
                ProductDAL.AdjustStock(_product.ProductID, AppSession.CurrentWarehouseID, finalQty, txtNotes.Text, AppSession.CurrentUser.UserID);
                MessageBox.Show("تم تحديث المخزون بنجاح");
                this.DialogResult = DialogResult.OK;
                this.Close();
            } catch (Exception ex) {
                MessageBox.Show("خطأ أثناء الحفظ: " + ex.Message);
            }
        }
    }
}
