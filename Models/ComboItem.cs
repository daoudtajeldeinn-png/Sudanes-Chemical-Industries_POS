using System;

namespace POSSystem.Models
{
    public class ComboItem
    {
        public int ID { get; set; }
        public string Name { get; set; }
public string Value { get; set; }

        public override string ToString() 
        {
            if (Name == null) return "";
            return Name;
        }
    }
}

