using System;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.DAL;

namespace POSSystem
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // التحقق من الاتصال بقاعدة البيانات
            if (!DatabaseHelper.TestConnection())
            {
                var result = MessageBox.Show(
                    "لا يمكن الاتصال بقاعدة البيانات.\n\n" +
                    "تأكد من:\n" +
                    "1. تشغيل SQL Server\n" +
                    "2. إعدادات الاتصال في App.config\n\n" +
                    "هل تريد تغيير إعدادات الاتصال؟",
                    "خطأ في الاتصال",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Error);

                if (result == DialogResult.Yes)
                {
                    using (var dlg = new ConnectionForm())
                    {
                        dlg.ShowDialog();
                        if (!DatabaseHelper.TestConnection())
                        {
                            MessageBox.Show("لا يزال الاتصال فاشلاً. جاري الإغلاق.", "خطأ",
                                MessageBoxButtons.OK, MessageBoxIcon.Error);
                            return;
                        }
                    }
                }
                else return;
            }

            Application.Run(new Forms.LoginForm());
        }
    }

    // نموذج إعدادات الاتصال
    public class ConnectionForm : Form
    {
        private TextBox txtServer, txtDatabase, txtUsername, txtPassword;
        private CheckBox chkWindowsAuth;
        private Button btnTest, btnSave;

        public ConnectionForm()
        {
            this.Text = "إعدادات قاعدة البيانات";
            this.Size = new Size(420, 320);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.RightToLeft = RightToLeft.Yes;
            this.BackColor = Color.FromArgb(30, 41, 59);
            this.ForeColor = Color.White;

            int y = 20;
            Controls.Add(CreateLabel("اسم الخادم (Server):", y));
            txtServer = CreateTxt(y + 25, "localhost"); y += 65;

            Controls.Add(CreateLabel("اسم قاعدة البيانات:", y));
            txtDatabase = CreateTxt(y + 25, "POSSystem"); y += 65;

            chkWindowsAuth = new CheckBox { Text = "مصادقة Windows", Location = new Point(20, y), ForeColor = Color.White, Checked = true };
            chkWindowsAuth.CheckedChanged += (s, e) =>
            {
                txtUsername.Enabled = !chkWindowsAuth.Checked;
                txtPassword.Enabled  = !chkWindowsAuth.Checked;
            };
            Controls.Add(chkWindowsAuth); y += 30;

            Controls.Add(CreateLabel("اسم المستخدم (SQL Auth):", y));
            txtUsername = CreateTxt(y + 25, "sa"); txtUsername.Enabled = false; y += 65;
            Controls.Add(CreateLabel("كلمة المرور:", y));
            txtPassword = CreateTxt(y + 25, ""); txtPassword.PasswordChar = '●'; txtPassword.Enabled = false; y += 65;

            btnTest = new Button { Text = "اختبار الاتصال", Location = new Point(20, y), Size = new Size(150, 36), BackColor = Color.FromArgb(59, 130, 246), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnTest.FlatAppearance.BorderSize = 0;
            btnTest.Click += BtnTest_Click;

            btnSave = new Button { Text = "حفظ والاتصال", Location = new Point(185, y), Size = new Size(150, 36), BackColor = Color.FromArgb(16, 185, 129), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;

            Controls.AddRange(new Control[] { btnTest, btnSave });
        }

        private Label CreateLabel(string text, int y)
        {
            return new Label { Text = text, Location = new Point(20, y), Size = new Size(380, 20), ForeColor = Color.FromArgb(148, 163, 184) };
        }

        private TextBox CreateTxt(int y, string def)
        {
            var t = new TextBox { Location = new Point(20, y), Size = new Size(360, 28), BackColor = Color.FromArgb(51, 65, 85), ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle, Text = def };
            Controls.Add(t);
            return t;
        }

        private string BuildConnectionString()
        {
            if (chkWindowsAuth.Checked)
return "Server=" + txtServer.Text + ";Database=" + txtDatabase.Text + ";Integrated Security=True;";
            else
return "Server=" + txtServer.Text + ";Database=" + txtDatabase.Text + ";User Id=" + txtUsername.Text + ";Password=" + txtPassword.Text + ";";
        }

        private void BtnTest_Click(object sender, EventArgs e)
        {
            DatabaseHelper.ConnectionString = BuildConnectionString();
            bool ok = DatabaseHelper.TestConnection();
            MessageBox.Show(ok ? "✅ الاتصال ناجح!" : "❌ فشل الاتصال. تحقق من الإعدادات.",
                "نتيجة الاختبار", MessageBoxButtons.OK,
                ok ? MessageBoxIcon.Information : MessageBoxIcon.Error);
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            DatabaseHelper.ConnectionString = BuildConnectionString();
            if (DatabaseHelper.TestConnection())
            {
                // حفظ في App.config
                var config = System.Configuration.ConfigurationManager.OpenExeConfiguration(
                    System.Configuration.ConfigurationUserLevel.None);
                if (config.ConnectionStrings.ConnectionStrings["POSSystem"] != null)
                    config.ConnectionStrings.ConnectionStrings["POSSystem"].ConnectionString = BuildConnectionString();
                config.Save();
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            else
                MessageBox.Show("فشل الاتصال!", "خطأ", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
