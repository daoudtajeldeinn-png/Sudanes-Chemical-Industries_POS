using System;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.DAL;

namespace POSSystem.Forms
{
    public class LoginForm : Form
    {
        private Panel pnlMain;
        private Panel pnlCard;
        private Label lblTitle;
        private Label lblSubtitle;
        private Label lblUsername;
        private Label lblPassword;
        private TextBox txtUsername;
        private TextBox txtPassword;
        private Button btnLogin;
        private Label lblVersion;
        private PictureBox picLogo;
        private CheckBox chkShowPassword;

        public LoginForm()
        {
            InitializeComponents();
            this.Load += (s, e) => {
                System.Threading.Tasks.Task.Run(() => DatabaseHelper.SeedDatabase());
            };
        }

        private void InitializeComponents()
        {
            this.Text = "تسجيل الدخول - نظام نقاط البيع";
            this.Size = new Size(480, 580);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.RightToLeft = RightToLeft.Yes;
            this.RightToLeftLayout = true;
            this.Font = new Font("Segoe UI", 10f);

            // الخلفية الرئيسية
            pnlMain = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(15, 23, 42)
            };

            // البطاقة المركزية
            pnlCard = new Panel
            {
                Size = new Size(380, 460),
                BackColor = Color.FromArgb(30, 41, 59),
                Location = new Point(50, 60)
            };
            pnlCard.Paint += (s, e) =>
            {
                var g = e.Graphics;
                g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                var rect = new Rectangle(0, 0, pnlCard.Width - 1, pnlCard.Height - 1);
                using (var pen = new Pen(Color.FromArgb(59, 130, 246), 2))
                    g.DrawRectangle(pen, rect);
            };

            // الشعار
            picLogo = new PictureBox
            {
                Size = new Size(120, 120),
                Location = new Point(130, 10),
                BackColor = Color.Transparent,
                SizeMode = PictureBoxSizeMode.Zoom,
                Image = Image.FromFile(System.IO.Path.Combine(Application.StartupPath, "Logo.png"))
            };


            // العنوان
            lblTitle = new Label
            {
                Text = "نظام نقاط البيع",
                Font = new Font("Segoe UI", 18f, FontStyle.Bold),
                ForeColor = Color.White,
                Location = new Point(30, 120),
                Size = new Size(320, 40),
                TextAlign = ContentAlignment.MiddleCenter
            };

            lblSubtitle = new Label
            {
                Text = "Sales & Inventory Management",
                Font = new Font("Segoe UI", 9f),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(30, 155),
                Size = new Size(320, 25),
                TextAlign = ContentAlignment.MiddleCenter
            };

            // حقل اسم المستخدم
            lblUsername = new Label
            {
                Text = "اسم المستخدم",
                Font = new Font("Segoe UI", 10f),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(30, 205),
                Size = new Size(150, 25)
            };

            txtUsername = CreateTextBox(30, 230, 320, "admin");

            // حقل كلمة المرور
            lblPassword = new Label
            {
                Text = "كلمة المرور",
                Font = new Font("Segoe UI", 10f),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(30, 285),
                Size = new Size(150, 25)
            };

            txtPassword = CreateTextBox(30, 310, 320, "");
            txtPassword.PasswordChar = '●';
            txtPassword.KeyDown += (s, e) => { if (e.KeyCode == Keys.Enter) btnLogin_Click(null, null); };

            // إظهار كلمة المرور
            chkShowPassword = new CheckBox
            {
                Text = "إظهار كلمة المرور",
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(30, 345),
                Size = new Size(200, 25),
                CheckAlign = ContentAlignment.MiddleRight
            };
            chkShowPassword.CheckedChanged += (s, e) =>
            {
                txtPassword.PasswordChar = chkShowPassword.Checked ? '\0' : '●';
            };

            // زر تسجيل الدخول
            btnLogin = new Button
            {
                Text = "تسجيل الدخول",
                Size = new Size(320, 48),
                Location = new Point(30, 385),
                FlatStyle = FlatStyle.Flat,
                BackColor = Color.FromArgb(59, 130, 246),
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 12f, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnLogin.FlatAppearance.BorderSize = 0;
            btnLogin.Click += btnLogin_Click;
            btnLogin.MouseEnter += (s, e) => btnLogin.BackColor = Color.FromArgb(37, 99, 235);
            btnLogin.MouseLeave += (s, e) => btnLogin.BackColor = Color.FromArgb(59, 130, 246);

            // الإصدار
            lblVersion = new Label
            {
                Text = "v2.0 | نظام إدارة المبيعات والمخازن",
                ForeColor = Color.FromArgb(71, 85, 105),
                Location = new Point(0, 530),
                Size = new Size(480, 25),
                TextAlign = ContentAlignment.MiddleCenter,
                Font = new Font("Segoe UI", 8f)
            };

            pnlCard.Controls.AddRange(new Control[]
            {
                picLogo, lblTitle, lblSubtitle,
                lblUsername, txtUsername,
                lblPassword, txtPassword, chkShowPassword,
                btnLogin
            });

            pnlMain.Controls.Add(pnlCard);
            var lblDeveloper = new Label {
                Text = "Developed by: Dr. Daoud Taj Eldinn",
                Dock = DockStyle.Bottom, Height = 30,
                ForeColor = Color.FromArgb(148, 163, 184), // Assuming UIHelper.Secondary maps to this color
                TextAlign = ContentAlignment.MiddleCenter,
                Font = new Font("Segoe UI", 9f, FontStyle.Italic)
            };
            this.Controls.Add(lblDeveloper);
            this.Controls.Add(pnlMain);
            this.Controls.Add(lblVersion);
        }

        private TextBox CreateTextBox(int x, int y, int width, string hint)
        {
            var txt = new TextBox
            {
                Location = new Point(x, y),
                Size = new Size(width, 40),
                BackColor = Color.FromArgb(51, 65, 85),
                ForeColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                Font = new Font("Segoe UI", 11f),
                Text = hint
            };
            return txt;
        }

        private void btnLogin_Click(object sender, EventArgs e)
        {
            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text.Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                MessageBox.Show("يرجى إدخال اسم المستخدم وكلمة المرور", "تنبيه",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnLogin.Enabled = false;
            btnLogin.Text = "جاري التحقق...";

            try
            {
                var user = UserDAL.Login(username, password);
                if (user != null)
                {
                    AppSession.Login(user);
                    AppSession.LoadCompanySettings();
                    this.Hide();
                    var mainForm = new MainForm();
                    mainForm.FormClosed += (s2, e2) => this.Close();
                    mainForm.Show();
                }
                else
                {
                    MessageBox.Show("اسم المستخدم أو كلمة المرور غير صحيحة", "خطأ في تسجيل الدخول",
                        MessageBoxButtons.OK, MessageBoxIcon.Error);
                    txtPassword.Clear();
                    txtPassword.Focus();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطأ في الاتصال بقاعدة البيانات:\n{ex.Message}",
                    "خطأ", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                btnLogin.Enabled = true;
                btnLogin.Text = "تسجيل الدخول";
            }
        }
    }
}
