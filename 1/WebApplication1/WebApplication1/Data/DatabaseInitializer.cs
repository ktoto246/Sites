using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;

namespace WebApplication1.Data;

public static class DatabaseInitializer
{
    public static void EnsureSchema(AppDbContext db)
    {
        AddColumnIfMissing(db, "Employees", "Login", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfMissing(db, "Employees", "Password", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfMissing(db, "Employees", "IsActive", "INTEGER NOT NULL DEFAULT 1");
        AddColumnIfMissing(db, "Equipment", "WriteOffDate", "TEXT NULL");
        AddColumnIfMissing(db, "Equipment", "WriteOffReason", "TEXT NULL");

        // Учебные пароли применяются только к локальной демонстрационной базе.
        db.Database.ExecuteSqlRaw("UPDATE Employees SET Login = CASE Role WHEN 'admin' THEN 'admin' WHEN 'dispatcher' THEN 'dispatcher' WHEN 'mechanic' THEN 'mechanic' ELSE '' END WHERE Login = ''");
        db.Database.ExecuteSqlRaw("UPDATE Employees SET Password = CASE Role WHEN 'admin' THEN 'admin123' WHEN 'dispatcher' THEN 'dispatcher123' WHEN 'mechanic' THEN 'mechanic123' ELSE '' END WHERE Password = ''");
        db.Database.ExecuteSqlRaw("UPDATE Employees SET Login = 'mechanic2' WHERE Role = 'mechanic' AND Id <> (SELECT MIN(Id) FROM Employees WHERE Role = 'mechanic') AND Login = 'mechanic'");
    }

    private static void AddColumnIfMissing(AppDbContext db, string table, string column, string definition)
    {
        using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = $"PRAGMA table_info({table})";
        db.Database.OpenConnection();
        using var reader = command.ExecuteReader();
        var exists = false;
        while (reader.Read())
        {
            if (string.Equals(reader.GetString(1), column, StringComparison.OrdinalIgnoreCase)) { exists = true; break; }
        }
        db.Database.CloseConnection();
        if (!exists)
        {
            using var alter = db.Database.GetDbConnection().CreateCommand();
            alter.CommandText = $"ALTER TABLE {table} ADD COLUMN {column} {definition}";
            db.Database.OpenConnection();
            alter.ExecuteNonQuery();
            db.Database.CloseConnection();
        }
    }
}



