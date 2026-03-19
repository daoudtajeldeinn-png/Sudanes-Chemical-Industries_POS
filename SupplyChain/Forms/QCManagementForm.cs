using System;
using System.Drawing;
using System.Windows.Forms;
using POSSystem.SupplyChain.DAL;
using POSSystem.UI;

namespace POSSystem.SupplyChain.Forms
{
    public class QCManagementForm : Form
    {
        private int _batchID;
        private string _batchNumber, _itemName;
        private ComboBox cbStatus;
        private TextBox txtNotes, txtOperator;
        private Button btnSave, btnCancel;

        public QCManagementForm(int batchID, string batchNumber, string itemName)
        {
            _batchID = batchID;
            _batchNumber = batchNumber;
            _itemName = itemName;
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = "📝 اعتماد مراقبة الجودة (QC Release)";
            this.Size = new Size(500, 450);
            this.StartPosition = FormStartPosition.CenterParent;
            this.BackColor = UIHelper.DarkBg;
            this.ForeColor = Color.White;
            this.RightToLeft = RightToLeft.Yes;

            var lblTitle = new Label { 
                Text = $"الدفة: {_batchNumber}\nالمادة: {_itemName}", 
                Dock = DockStyle.Top, Height = 80, 
                Font = new Font("Segoe UI", 12f, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter,
                ForeColor = Color.Yellow
            };
            this.Controls.Add(lblTitle);

            var pnl = new Panel { Dock = DockStyle.Fill, Padding = new Padding(30) };
            int y = 20, xLabel = 320, xInput = 30, inputWidth = 280;

            AddLabel("القرار النهائي:", y, xLabel, pnl);
            cbStatus = new ComboBox { Location = new Point(xInput, y), Width = inputWidth, DropDownStyle = ComboBoxStyle.DropDownList };
            cbStatus.Items.AddRange(new string[] { "Released (مطابق)", "Rejected (غير مطابق)", "Under Test (تحت الاختبار)" });
            cbStatus.SelectedIndex = 0;
            pnl.Controls.Add(cbStatus);
            y += 50;

            AddLabel("اسم الفاحص:", y, xLabel, pnl);
            txtOperator = new TextBox { Location = new Point(xInput, y), Width = inputWidth, Text = AppSession.CurrentUser?.FullName };
            pnl.Controls.Add(txtOperator);
            y += 50;

            AddLabel("ملاحظات المختبر:", y, xLabel, pnl);
            txtNotes = new TextBox { Location = new Point(xInput, y), Width = inputWidth, Height = 80, Multiline = true };
            pnl.Controls.Add(txtNotes);
            y += 100;

            btnSave = new Button { Text = "✅ اعتماد النتيجة", Location = new Point(xInput, y), Size = new Size(130, 45), BackColor = UIHelper.Success, ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.Click += BtnSave_Click;
            
            btnCancel = new Button { Text = "إلغاء", Location = new Point(xInput + 150, y), Size = new Size(130, 45), BackColor = UIHelper.Danger, ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnCancel.Click += (s, e) => this.Close();

            pnl.Controls.AddRange(new Control[] { btnSave, btnCancel });
            this.Controls.Add(pnl);
        }

        private void AddLabel(string t, int y, int x, Panel p) => p.Controls.Add(new Label { Text = t, Location = new Point(x, y), ForeColor = UIHelper.Secondary, AutoSize = true });

        private void BtnSave_Click(object sender, EventArgs e)
        {
            string status = cbStatus.Text.Split(' ')[0]; // Take "Released" or "Rejected"
            try {
                SCDAL.UpdateQCStatus(_batchID, status, txtNotes.Text, AppSession.CurrentUser.UserID);
                MessageBox.Show("تم اعتماد نتيجة الفحص وتحديث حالة الدفعة بنجاح");
                this.DialogResult = DialogResult.OK;
                this.Close();
            } catch (Exception ex) {
                MessageBox.Show("خطأ: " + ex.Message);
            }
        }
    }
}
