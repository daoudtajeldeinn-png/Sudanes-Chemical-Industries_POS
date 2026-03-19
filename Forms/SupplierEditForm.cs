using System;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.Models;

namespace POSSystem.Forms
{
    public class SupplierEditForm : Form
    {
        private Supplier _supplier;
        private TextBox txtName, txtCode, txtPhone, txtEmail, txtAddress, txtTaxNum;
        private CheckBox chkActive;
        private Button btnSave, btnCancel;

        public SupplierEditForm(Supplier supplier = null)
        {
            _supplier = supplier ?? new Supplier { IsActive = true };
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = _supplier.SupplierID == 0 ? "إضافة مورد جديد" : "تعديل مورد";
            this.Size = new Size(600, 500);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.StartPosition = FormStartPosition.CenterParent;
            this.RightToLeft = RightToLeft.Yes;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;

            int x1 = 300, x2 = 20, y = 20, inputWidth = 240;

            // Row 1
            AddLabel("اسم المورد:", y, x1 + inputWidth);
            txtName = AddTextBox(y, x1, inputWidth, _supplier.SupplierName);
            AddLabel("كود المورد:", y, x2 + inputWidth);
            txtCode = AddTextBox(y, x2, inputWidth, _supplier.SupplierCode);
            y += 50;

            // Row 2
            AddLabel("الهاتف:", y, x1 + inputWidth);
            txtPhone = AddTextBox(y, x1, inputWidth, _supplier.Phone);
            AddLabel("البريد الإلكتروني:", y, x2 + inputWidth);
            txtEmail = AddTextBox(y, x2, inputWidth, _supplier.Email);
            y += 50;

            // Row 3
            AddLabel("العنوان:", y, x1 + inputWidth);
            txtAddress = AddTextBox(y, x1, inputWidth, _supplier.Address);
            AddLabel("الرقم الضريبي:", y, x2 + inputWidth);
            txtTaxNum = AddTextBox(y, x2, inputWidth, _supplier.TaxNumber);
            y += 50;

            chkActive = new CheckBox { Text = "نشط", Checked = _supplier.IsActive, Location = new Point(x2, y), ForeColor = Color.White, AutoSize = true };
            this.Controls.Add(chkActive); 
            y += 60;

            btnSave = new Button { Text = "💾 حفظ البيانات", Location = new Point(x2, y), Size = new Size(180, 45), BackColor = Color.FromArgb(16, 185, 129), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.Click += BtnSave_Click;

            btnCancel = new Button { Text = "إلغاء", Location = new Point(x2 + 200, y), Size = new Size(180, 45), BackColor = Color.FromArgb(239, 68, 68), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnCancel.Click += (s, e) => this.Close();

            this.Controls.AddRange(new Control[] { btnSave, btnCancel });
        }

        private void AddLabel(string text, int y, int x) 
        {
            this.Controls.Add(new Label { Text = text, Location = new Point(x, y + 5), AutoSize = true, ForeColor = Color.FromArgb(148, 163, 184) });
        }

        private TextBox AddTextBox(int y, int x, int w, string val) 
        {
            var t = new TextBox { Location = new Point(x, y), Width = w, Text = val, BackColor = Color.FromArgb(30, 41, 59), ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle };
            this.Controls.Add(t); return t;
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtName.Text)) { MessageBox.Show("يرجى إدخال اسم المورد"); return; }

            _supplier.SupplierName = txtName.Text;
            _supplier.SupplierCode = txtCode.Text;
            _supplier.Phone = txtPhone.Text;
            _supplier.Email = txtEmail.Text;
            _supplier.Address = txtAddress.Text;
            _supplier.TaxNumber = txtTaxNum.Text;
            _supplier.IsActive = chkActive.Checked;

            try
            {
                SupplierDAL.Save(_supplier);
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
