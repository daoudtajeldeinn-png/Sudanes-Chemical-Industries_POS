using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;
using POSSystem.SupplyChain.DAL;
using POSSystem.SupplyChain.Models;
using POSSystem.DAL;

namespace POSSystem.SupplyChain.Forms
{
    public class SCEditForm : Form
    {
        private RawMaterial _rm;
        private TextBox txtName, txtNameAr, txtCode, txtMinStock, txtReorder;
        private ComboBox cbType, cbUnit, cbSupplier, cbHazard;
        private Label lblSpecificField;
        private TextBox txtSpecificValue;
        private Button btnSave, btnCancel;

        public SCEditForm(RawMaterial rm = null)
        {
            _rm = rm ?? new RawMaterial { IsActive = true, RMType = "Medicine" };
            InitializeComponents();
            LoadData();
        }

        private void InitializeComponents()
        {
            this.Text = _rm.RawMaterialID == 0 ? "إضافة صنف جديد - سلاسل الإمداد" : "تعديل صنف";
            this.Size = new Size(550, 600);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.StartPosition = FormStartPosition.CenterParent;
            this.RightToLeft = RightToLeft.Yes;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;

            int xLabel = 380, xInput = 20, y = 20, inputWidth = 340;

            AddLabel("نوع الصنف:", y, xLabel);
            cbType = AddComboBox(y, xInput, inputWidth);
            cbType.Items.AddRange(new string[] { "Medicine (دواء)", "Additive (مضافات)", "Packaging (تغليف)", "Maintenance (صيانة)", "Cleaning (منظفات)" });
            cbType.SelectedIndexChanged += (s, e) => UpdateTypeSpecificFields();
            y += 45;

            AddLabel("اسم الصنف (EN):", y, xLabel);
            txtName = AddTextBox(y, xInput, inputWidth, _rm.RMName); y += 45;

            AddLabel("اسم الصنف (AR):", y, xLabel);
            txtNameAr = AddTextBox(y, xInput, inputWidth, _rm.RMNameAr); y += 45;

            AddLabel("كود الصنف:", y, xLabel);
            txtCode = AddTextBox(y, xInput, inputWidth, _rm.RMCode); y += 45;

            AddLabel("الوحدة:", y, xLabel);
            cbUnit = AddComboBox(y, xInput, inputWidth); y += 45;

            AddLabel("المورد المفضل:", y, xLabel);
            cbSupplier = AddComboBox(y, xInput, inputWidth); y += 45;

            AddLabel("مستوى الخطورة:", y, xLabel);
            cbHazard = AddComboBox(y, xInput, inputWidth);
            cbHazard.Items.AddRange(new string[] { "None", "Low", "Medium", "High", "Critical" });
            y += 45;

            AddLabel("حد الأمان:", y, xLabel);
            txtMinStock = AddTextBox(y, xInput, inputWidth / 2 - 10, _rm.MinStockLevel.ToString("N2"));
            
            AddLabel("نقطة الطلب:", y, xInput + inputWidth / 2 + 10, 80);
            txtReorder = AddTextBox(y, xInput + inputWidth / 2 + 80, inputWidth / 2 - 80, _rm.ReorderPoint.ToString("N2"));
            y += 50;

            lblSpecificField = new Label { Text = "بيانات إضافية:", Location = new Point(xLabel, y), AutoSize = true, ForeColor = Color.Yellow };
            txtSpecificValue = AddTextBox(y, xInput, inputWidth, "");
            this.Controls.Add(lblSpecificField);
            y += 60;

            btnSave = new Button { Text = "💾 حفظ البيانات", Location = new Point(xInput, y), Size = new Size(160, 45), BackColor = Color.FromArgb(16, 185, 129), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.Click += BtnSave_Click;

            btnCancel = new Button { Text = "إلغاء", Location = new Point(xInput + 180, y), Size = new Size(160, 45), BackColor = Color.FromArgb(239, 68, 68), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnCancel.Click += (s, e) => this.Close();

            this.Controls.AddRange(new Control[] { btnSave, btnCancel });
            
            cbType.Text = _rm.RMType;
            UpdateTypeSpecificFields();
        }

        private void AddLabel(string text, int y, int x, int width = 120) 
        {
            this.Controls.Add(new Label { Text = text, Location = new Point(x, y + 5), Width = width, ForeColor = Color.FromArgb(148, 163, 184) });
        }

        private TextBox AddTextBox(int y, int x, int w, string val) 
        {
            var t = new TextBox { Location = new Point(x, y), Width = w, Text = val, BackColor = Color.FromArgb(30, 41, 59), ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle };
            this.Controls.Add(t); return t;
        }

        private ComboBox AddComboBox(int y, int x, int w)
        {
            var c = new ComboBox { Location = new Point(x, y), Width = w, DropDownStyle = ComboBoxStyle.DropDownList, BackColor = Color.FromArgb(30, 41, 59), ForeColor = Color.White };
            this.Controls.Add(c); return c;
        }

        private void UpdateTypeSpecificFields()
        {
            string type = cbType.Text;
            if (type.Contains("Medicine")) {
                lblSpecificField.Text = "رقم التسجيل الصحي:";
                txtSpecificValue.Text = "";
            } else if (type.Contains("Maintenance")) {
                lblSpecificField.Text = "رقم القطعة (Part No):";
                txtSpecificValue.Text = "";
            } else if (type.Contains("Packaging")) {
                lblSpecificField.Text = "الأبعاد/السعة:";
                txtSpecificValue.Text = "";
            } else {
                lblSpecificField.Text = "ملاحظات إضافية:";
                txtSpecificValue.Text = "";
            }
        }

        private void LoadData()
        {
            cbUnit.DataSource = ProductDAL.GetUnits(); 
            cbUnit.DisplayMember = "UnitName";
            cbUnit.ValueMember = "UnitID";
            if (_rm.UnitID > 0) cbUnit.SelectedValue = _rm.UnitID;

            cbSupplier.DataSource = SupplierDAL.GetAll(); // Returns DataTable of suppliers
            cbSupplier.DisplayMember = "SupplierName";
            cbSupplier.ValueMember = "SupplierID";
            if (_rm.PreferredSupplierID > 0) cbSupplier.SelectedValue = _rm.PreferredSupplierID;

            cbHazard.Text = _rm.HazardLevel ?? "None";
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtName.Text)) { MessageBox.Show("يرجى إدخال اسم الصنف"); return; }
            
            _rm.RMName = txtName.Text;
            _rm.RMNameAr = txtNameAr.Text;
            _rm.RMCode = txtCode.Text;
            _rm.RMType = cbType.Text;
            _rm.UnitID = (int)cbUnit.SelectedValue;
            _rm.PreferredSupplierID = (int)cbSupplier.SelectedValue;
            _rm.HazardLevel = cbHazard.Text;
            _rm.MinStockLevel = decimal.TryParse(txtMinStock.Text, out var m) ? m : 0;
            _rm.ReorderPoint = decimal.TryParse(txtReorder.Text, out var r) ? r : 0;

            try {
                SCDAL.SaveRawMaterial(_rm);
                this.DialogResult = DialogResult.OK;
                this.Close();
            } catch (Exception ex) {
                MessageBox.Show("خطأ أثناء الحفظ: " + ex.Message);
            }
        }
    }
}
