using System;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.DAL;
using POSSystem.UI;

namespace POSSystem.Forms
{
    public class UserEditForm : Form
    {
        private int? _userId;
        private TextBox txtUsername, txtPassword, txtFullName, txtEmail, txtPhone;
        private ComboBox cbRole;
        private CheckBox chkActive, chkChangePassword;
        private Button btnSave, btnCancel;

        public UserEditForm(int? userId = null)
        {
            _userId = userId;
            InitializeComponents();
            LoadRoles();
            if (_userId.HasValue) LoadUserData();
        }

        private void InitializeComponents()
        {
            this.Text = _userId.HasValue ? "تعديل مستخدم" : "إضافة مستخدم جديد";
            this.Size = new Size(450, 520);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.RightToLeft = RightToLeft.Yes;
            this.BackColor = UIHelper.DarkBg;
            this.ForeColor = Color.White;

            int y = 20;
            txtUsername = CreateField("اسم المستخدم:", ref y, !_userId.HasValue);
            txtFullName = CreateField("الاسم الكامل:", ref y);
            txtEmail = CreateField("البريد الإلكتروني:", ref y);
            txtPhone = CreateField("رقم الهاتف:", ref y);

            AddLabel("الصلاحية:", y, 20);
            cbRole = new ComboBox { Location = new Point(140, y), Width = 250, DropDownStyle = ComboBoxStyle.DropDownList };
            this.Controls.Add(cbRole);
            y += 40;

            if (_userId.HasValue)
            {
                chkChangePassword = new CheckBox { Text = "تغيير كلمة المرور", Location = new Point(140, y), AutoSize = true };
                chkChangePassword.CheckedChanged += (s, e) => txtPassword.Enabled = chkChangePassword.Checked;
                this.Controls.Add(chkChangePassword);
                y += 30;
                txtPassword = CreateField("كلمة المرور الجديدة:", ref y, false);
                txtPassword.PasswordChar = '*';
            }
            else
            {
                txtPassword = CreateField("كلمة المرور:", ref y);
                txtPassword.PasswordChar = '*';
            }

            chkActive = new CheckBox { Text = "نشط", Location = new Point(140, y), Checked = true, AutoSize = true };
            this.Controls.Add(chkActive);
            y += 40;

            btnSave = new Button { Text = "💾 حفظ", Location = new Point(140, y), Size = new Size(120, 40), BackColor = UIHelper.Success, FlatStyle = FlatStyle.Flat };
            btnSave.Click += BtnSave_Click;
            btnCancel = new Button { Text = "✖️ إلغاء", Location = new Point(270, y), Size = new Size(120, 40), BackColor = UIHelper.Secondary, FlatStyle = FlatStyle.Flat };
            btnCancel.Click += (s, e) => this.Close();

            this.Controls.AddRange(new Control[] { btnSave, btnCancel });
        }

        private TextBox CreateField(string label, ref int y, bool enabled = true)
        {
            AddLabel(label, y, 20);
            var txt = new TextBox { Location = new Point(140, y), Width = 250, Enabled = enabled, BackColor = Color.FromArgb(15, 23, 42), ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle };
            this.Controls.Add(txt);
            y += 40;
            return txt;
        }

        private void AddLabel(string text, int y, int x)
        {
            this.Controls.Add(new Label { Text = text, Location = new Point(x, y), AutoSize = true });
        }

        private void LoadRoles()
        {
            cbRole.DataSource = UserDAL.GetRoles();
            cbRole.DisplayMember = "RoleName";
            cbRole.ValueMember = "RoleID";
        }

        private void LoadUserData()
        {
            // Assuming we have a GetUserByID method or just query table
            string sql = "SELECT * FROM Users WHERE UserID = @ID";
            var dt = DatabaseHelper.ExecuteQuery(sql, new System.Data.SqlClient.SqlParameter("@ID", _userId));
            if (dt.Rows.Count > 0)
            {
                var row = dt.Rows[0];
                txtUsername.Text = row["Username"].ToString();
                txtFullName.Text = row["FullName"].ToString();
                txtEmail.Text = row["Email"].ToString();
                txtPhone.Text = row["Phone"].ToString();
                cbRole.SelectedValue = row["RoleID"];
                chkActive.Checked = (bool)row["IsActive"];
            }
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtUsername.Text) || string.IsNullOrWhiteSpace(txtFullName.Text))
            {
                MessageBox.Show("يرجى إكمال البيانات الأساسية");
                return;
            }

            try {
                if (!_userId.HasValue) {
                    UserDAL.CreateUser(txtUsername.Text, txtPassword.Text, txtFullName.Text, txtEmail.Text, txtPhone.Text, (int)cbRole.SelectedValue);
                } else {
                    UserDAL.UpdateUser(_userId.Value, txtFullName.Text, txtEmail.Text, txtPhone.Text, (int)cbRole.SelectedValue, chkActive.Checked);
                    if (chkChangePassword != null && chkChangePassword.Checked && !string.IsNullOrWhiteSpace(txtPassword.Text))
                        UserDAL.ChangePassword(_userId.Value, txtPassword.Text);
                }
                this.DialogResult = DialogResult.OK;
                this.Close();
            } catch (Exception ex) {
                MessageBox.Show("خطأ: " + ex.Message);
            }
        }
    }
}
