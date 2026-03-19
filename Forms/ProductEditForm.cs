using System;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.Models;

namespace POSSystem.Forms
{
    public class ProductEditForm : Form
    {
        private Product _product;
        private TextBox txtName, txtCode, txtBarcode, txtCost, txtWholesale, txtRetail, txtTaxRate, txtMinStock, txtDesc;
        private ComboBox cbCategory, cbUnit;
        private CheckBox chkActive;
        private Button btnSave, btnCancel;

        public ProductEditForm(Product product = null)
        {
            _product = product ?? new Product { IsActive = true, TaxRate = 15 };
            InitializeComponents();
            LoadData();
        }

        private void InitializeComponents()
        {
            this.Text = _product.ProductID == 0 ? "إضافة منتج جديد" : "تعديل منتج";
            this.Size = new Size(500, 750);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.StartPosition = FormStartPosition.CenterParent;
            this.RightToLeft = RightToLeft.Yes;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;

            int labelX = 350, inputX = 20, y = 20, width = 320;

            // Name
            AddLabel("اسم المنتج:", y);
            txtName = AddTextBox(y, _product.ProductName); y += 45;

            // Code & Barcode
            AddLabel("كود المنتج:", y);
            txtCode = AddTextBox(y, _product.ProductCode); y += 45;
            AddLabel("الباركود:", y);
            txtBarcode = AddTextBox(y, _product.Barcode); y += 45;

            // Category & Unit
            AddLabel("التصنيف:", y);
            cbCategory = AddComboBox(y); y += 45;
            AddLabel("الوحدة:", y);
            cbUnit = AddComboBox(y); y += 45;

            // Prices
            AddLabel("سعر التكلفة:", y);
            txtCost = AddTextBox(y, _product.CostPrice.ToString("N2")); y += 45;
            AddLabel("سعر البيع (قطاعي):", y);
            txtRetail = AddTextBox(y, _product.RetailPrice.ToString("N2")); y += 45;
            AddLabel("سعر البيع (جملة):", y);
            txtWholesale = AddTextBox(y, _product.WholesalePrice.ToString("N2")); y += 45;

            // Tax & Min Stock
            AddLabel("نسبة الضريبة %:", y);
            txtTaxRate = AddTextBox(y, _product.TaxRate.ToString("N2")); y += 45;
            AddLabel("الحد الأدنى للمخزون:", y);
            txtMinStock = AddTextBox(y, _product.MinStock.ToString("N0")); y += 45;

            // Description
            AddLabel("الوصف:", y);
            txtDesc = AddTextBox(y, _product.Description); y += 45;

            chkActive = new CheckBox { Text = "نشط", Checked = _product.IsActive, Location = new Point(inputX, y), ForeColor = Color.White };
            this.Controls.Add(chkActive); y += 40;

            btnSave = new Button { Text = "💾 حفظ", Location = new Point(inputX, y), Size = new Size(150, 40), BackColor = Color.FromArgb(16, 185, 129), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.Click += BtnSave_Click;

            btnCancel = new Button { Text = "إلغاء", Location = new Point(inputX + 160, y), Size = new Size(150, 40), BackColor = Color.FromArgb(239, 68, 68), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnCancel.Click += (s, e) => this.Close();

            this.Controls.AddRange(new Control[] { btnSave, btnCancel });
        }

        private void AddLabel(string text, int y) 
        {
            this.Controls.Add(new Label { Text = text, Location = new Point(350, y + 5), AutoSize = true, ForeColor = Color.FromArgb(148, 163, 184) });
        }

        private TextBox AddTextBox(int y, string val) 
        {
            var t = new TextBox { Location = new Point(20, y), Width = 320, Text = val, BackColor = Color.FromArgb(30, 41, 59), ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle };
            this.Controls.Add(t); return t;
        }

        private ComboBox AddComboBox(int y)
        {
            var c = new ComboBox { Location = new Point(20, y), Width = 320, DropDownStyle = ComboBoxStyle.DropDownList, BackColor = Color.FromArgb(30, 41, 59), ForeColor = Color.White };
            this.Controls.Add(c); return c;
        }

        private void LoadData()
        {
            cbCategory.DataSource = ProductDAL.GetCategories();
            cbCategory.DisplayMember = "CategoryName";
            cbCategory.ValueMember = "CategoryID";
            if (_product.CategoryID > 0) cbCategory.SelectedValue = _product.CategoryID;

            cbUnit.DataSource = ProductDAL.GetUnits();
            cbUnit.DisplayMember = "UnitName";
            cbUnit.ValueMember = "UnitID";
            if (_product.UnitID > 0) cbUnit.SelectedValue = _product.UnitID;
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtName.Text)) { MessageBox.Show("يرجى إدخال اسم المنتج"); return; }

            _product.ProductName = txtName.Text;
            _product.ProductCode = txtCode.Text;
            _product.Barcode = txtBarcode.Text;
            _product.CategoryID = cbCategory.SelectedValue as int?;
            _product.UnitID = cbUnit.SelectedValue as int?;
            _product.CostPrice = decimal.TryParse(txtCost.Text, out var c) ? c : 0;
            _product.RetailPrice = decimal.TryParse(txtRetail.Text, out var r) ? r : 0;
            _product.WholesalePrice = decimal.TryParse(txtWholesale.Text, out var w) ? w : 0;
            _product.TaxRate = decimal.TryParse(txtTaxRate.Text, out var tax) ? tax : 15;
            _product.MinStock = decimal.TryParse(txtMinStock.Text, out var m) ? m : 0;
            _product.Description = txtDesc.Text;
            _product.IsActive = chkActive.Checked;

            try
            {
                ProductDAL.SaveProduct(_product);
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("خطأ في الحفظ: " + ex.Message);
            }
        }
    }
}
