using System;
using System.Drawing;
using System.Windows.Forms;

namespace POSSystem.UI
{
    public static class UIHelper
    {
        public static Color DarkBg = Color.FromArgb(15, 23, 42); // slate-900
        public static Color PanelBg = Color.FromArgb(30, 41, 59); // slate-800
        public static Color Primary = Color.FromArgb(59, 130, 246); // blue-500
        public static Color Success = Color.FromArgb(16, 185, 129); // emerald-500
        public static Color Danger = Color.FromArgb(239, 68, 68); // red-500
        public static Color Secondary = Color.FromArgb(148, 163, 184); // slate-400
        public static Color TextWhite = Color.White;

        public static void StyleGrid(DataGridView grid)
        {
            grid.BackgroundColor = PanelBg;
            grid.ForeColor = Color.Black;
            grid.BorderStyle = BorderStyle.None;
            grid.CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal;
            grid.GridColor = Color.FromArgb(51, 65, 85);
            grid.RowHeadersVisible = false;
            grid.AllowUserToAddRows = false;
            grid.SelectionMode = DataGridViewSelectionMode.RowHeaderSelect;
            grid.EditMode = DataGridViewEditMode.EditOnKeystrokeOrF2;
            grid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            grid.RowTemplate.Height = 40;

            grid.DefaultCellStyle = new DataGridViewCellStyle
            {
                BackColor = Color.FromArgb(24, 33, 52), // Lighter than PanelBg (30,41,59) to see borders
                ForeColor = TextWhite,
                Font = new Font("Segoe UI", 10.5f),
                SelectionBackColor = Primary,
                SelectionForeColor = Color.White,
                Padding = new Padding(10, 0, 10, 0),
                Alignment = DataGridViewContentAlignment.MiddleLeft
            };

            grid.ColumnHeadersDefaultCellStyle = new DataGridViewCellStyle
            {
                BackColor = DarkBg,
                ForeColor = Secondary,
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                Padding = new Padding(10, 0, 10, 0)
            };

            grid.ColumnHeadersHeight = 45;
            grid.EnableHeadersVisualStyles = false;
        }

        public static void StyleButton(Button btn, Color color)
        {
            btn.FlatStyle = FlatStyle.Flat;
            btn.FlatAppearance.BorderSize = 0;
            btn.BackColor = color;
            btn.ForeColor = Color.White;
            btn.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            btn.Cursor = Cursors.Hand;
            btn.Height = 42;
        }

        public static void StyleSidebarButton(Button btn)
        {
            StyleButton(btn, DarkBg);
            btn.TextAlign = ContentAlignment.MiddleLeft;
            btn.Padding = new Padding(20, 0, 10, 0);
            btn.ForeColor = Color.FromArgb(148, 163, 184);
            btn.Font = new Font("Segoe UI Semibold", 10.5f);
        }

        public static Label CreateHeaderLabel(string text)
        {
            return new Label
            {
                Text = text,
                ForeColor = TextWhite,
                Font = new Font("Segoe UI", 16f, FontStyle.Bold),
                Dock = DockStyle.Top,
                Height = 60,
                TextAlign = ContentAlignment.MiddleLeft,
                Padding = new Padding(15, 0, 0, 0)
            };
        }
    }
}
