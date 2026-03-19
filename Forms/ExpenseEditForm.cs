using System;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.Models;

namespace POSSystem.Forms
{
    public class ExpenseEditForm : Form
    {
        private Expense _expense;
        private DateTimePicker dtpDate;
        private ComboBox cbCategory, cbPaymentMethod;
        private TextBox txtAmount, txtDesc, txtNotes;
        private Button btnSave, btnCancel;

        public ExpenseEditForm(Expense expense = null)
        {
            _expense = expense ?? new Expense { ExpenseDate = DateTime.Now, PaymentMethod = "CASH" };
            InitializeComponents();
            LoadData();
        }

        private void InitializeComponents()
        {
            this.Text = _expense.ExpenseID == 0 ? "تسجيل مصروف جديد" : "تعديل مصروف";
            this.Size = new Size(600, 500);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.StartPosition = FormStartPosition.CenterParent;
            this.RightToLeft = RightToLeft.Yes;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;

            int x1 = 300, x2 = 20, y = 20, inputWidth = 240;

            // Row 1
            AddLabel("التاريخ:", y, x1 + inputWidth);
            dtpDate = new DateTimePicker { Location = new Point(x1, y), Width = inputWidth, Value = _expense.ExpenseDate, CustomFormat = "dd/MM/yyyy", Format = DateTimePickerFormat.Custom };
            this.Controls.Add(dtpDate);
            AddLabel("التصنيف:", y, x2 + inputWidth);
            cbCategory = AddComboBox(y, x2, inputWidth);
            y += 50;

            // Row 2
            AddLabel("المبلغ:", y, x1 + inputWidth);
            txtAmount = AddTextBox(y, x1, inputWidth, _expense.Amount.ToString("N2"));
            AddLabel("طريقة الدفع:", y, x2 + inputWidth);
            cbPaymentMethod = AddComboBox(y, x2, inputWidth);
            cbPaymentMethod.Items.AddRange(new string[] { "CASH", "CARD", "TRANSFER" });
            cbPaymentMethod.SelectedItem = _expense.PaymentMethod;
            y += 50;

            // Row 3
            AddLabel("البيان:", y, x1 + inputWidth);
            txtDesc = AddTextBox(y, x1, inputWidth, _expense.Description);
            AddLabel("ملاحظات:", y, x2 + inputWidth);
            txtNotes = AddTextBox(y, x2, inputWidth, _expense.Notes);
            y += 70;

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
            cbCategory.DataSource = ExpenseDAL.GetCategories();
            cbCategory.DisplayMember = "CategoryName";
            cbCategory.ValueMember = "CategoryID";
            if (_expense.CategoryID > 0) cbCategory.SelectedValue = _expense.CategoryID;
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (cbCategory.SelectedValue == null) { MessageBox.Show("يرجى اختيار التصنيف"); return; }
            if (!decimal.TryParse(txtAmount.Text, out decimal amt) || amt <= 0) { MessageBox.Show("يرجى إدخال مبلغ صحيح"); return; }

            _expense.ExpenseDate = dtpDate.Value;
            _expense.CategoryID = (int)cbCategory.SelectedValue;
            _expense.Amount = amt;
            _expense.Description = txtDesc.Text;
            _expense.PaymentMethod = cbPaymentMethod.SelectedItem?.ToString() ?? "CASH";
            _expense.Notes = txtNotes.Text;

            try
            {
                ExpenseDAL.Save(_expense, AppSession.CurrentUser?.UserID ?? 1);
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
