using System;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.Models;

namespace POSSystem.Forms
{
    public class CustomerEditForm : Form
    {
        private Customer _customer;
        private TextBox txtName, txtNameAr, txtCode, txtPhone, txtMobile, txtEmail, txtAddress, txtCity, txtTaxNum, txtCreditLimit, txtNotes;
        private ComboBox cbGroup;
        private CheckBox chkActive;
        private Button btnSave, btnCancel;

        public CustomerEditForm(Customer customer = null)
        {
            _customer = customer ?? new Customer { IsActive = true };
            InitializeComponents();
            LoadData();
        }

        private void InitializeComponents()
        {
            this.Text = _customer.CustomerID == 0 ? "إضافة عميل جديد" : "تعديل عميل";
            this.Size = new Size(650, 650);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.StartPosition = FormStartPosition.CenterParent;
            this.RightToLeft = RightToLeft.Yes;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;

            int x1 = 340, x2 = 20, y = 20, labelWidth = 100, inputWidth = 200;

            // Row 1
            AddLabel("الاسم (EN):", y, x1 + inputWidth);
            txtName = AddTextBox(y, x1, inputWidth, _customer.CustomerName);
            AddLabel("الاسم (AR):", y, x2 + inputWidth);
            txtNameAr = AddTextBox(y, x2, inputWidth, _customer.CustomerNameAr);
            y += 50;

            // Row 2
            AddLabel("كود العميل:", y, x1 + inputWidth);
            txtCode = AddTextBox(y, x1, inputWidth, _customer.CustomerCode);
            AddLabel("المجموعة:", y, x2 + inputWidth);
            cbGroup = AddComboBox(y, x2, inputWidth);
            y += 50;

            // Row 3
            AddLabel("الهاتف:", y, x1 + inputWidth);
            txtPhone = AddTextBox(y, x1, inputWidth, _customer.Phone);
            AddLabel("الموبايل:", y, x2 + inputWidth);
            txtMobile = AddTextBox(y, x2, inputWidth, _customer.Mobile);
            y += 50;

            // Row 4
            AddLabel("البريد الإلكتروني:", y, x1 + inputWidth);
            txtEmail = AddTextBox(y, x1, inputWidth, _customer.Email);
            AddLabel("الرقم الضريبي:", y, x2 + inputWidth);
            txtTaxNum = AddTextBox(y, x2, inputWidth, _customer.TaxNumber);
            y += 50;

            // Row 5
            AddLabel("العنوان:", y, x1 + inputWidth);
            txtAddress = AddTextBox(y, x1, inputWidth, _customer.Address);
            AddLabel("المدينة:", y, x2 + inputWidth);
            txtCity = AddTextBox(y, x2, inputWidth, _customer.City);
            y += 50;

            // Row 6
            AddLabel("حد الائتمان:", y, x1 + inputWidth);
            txtCreditLimit = AddTextBox(y, x1, inputWidth, _customer.CreditLimit.ToString("N2"));
            chkActive = new CheckBox { Text = "نشط", Checked = _customer.IsActive, Location = new Point(x2, y), ForeColor = Color.White, AutoSize = true };
            this.Controls.Add(chkActive);
            y += 50;

            // Row 7 (Notes)
            AddLabel("ملاحظات:", y, x1 + inputWidth);
            txtNotes = AddTextBox(y, x2, x1 - x2 + inputWidth, _customer.Notes);
            txtNotes.Multiline = true;
            txtNotes.Height = 60;
            y += 80;

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

        private ComboBox AddComboBox(int y, int x, int w)
        {
            var c = new ComboBox { Location = new Point(x, y), Width = w, DropDownStyle = ComboBoxStyle.DropDownList, BackColor = Color.FromArgb(30, 41, 59), ForeColor = Color.White };
            this.Controls.Add(c); return c;
        }

        private void LoadData()
        {
            cbGroup.DataSource = CustomerDAL.GetGroups();
            cbGroup.DisplayMember = "GroupName";
            cbGroup.ValueMember = "GroupID";
            if (_customer.GroupID > 0) cbGroup.SelectedValue = _customer.GroupID;
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtName.Text)) { MessageBox.Show("يرجى إدخال اسم العميل"); return; }

            _customer.CustomerName = txtName.Text;
            _customer.CustomerNameAr = txtNameAr.Text;
            _customer.CustomerCode = txtCode.Text;
            _customer.GroupID = cbGroup.SelectedValue as int?;
            _customer.Phone = txtPhone.Text;
            _customer.Mobile = txtMobile.Text;
            _customer.Email = txtEmail.Text;
            _customer.Address = txtAddress.Text;
            _customer.City = txtCity.Text;
            _customer.TaxNumber = txtTaxNum.Text;
            _customer.CreditLimit = decimal.TryParse(txtCreditLimit.Text, out var l) ? l : 0;
            _customer.Notes = txtNotes.Text;
            _customer.IsActive = chkActive.Checked;

            try
            {
                CustomerDAL.Save(_customer);
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
