using System;
using System.Text.Json;

public class Category {
    public int UserId { get; private set; }
    public Category(int userId) { UserId = userId; }
}

public class Program {
    public static void Main() {
        var cat = new Category(42);
        Console.WriteLine(JsonSerializer.Serialize(cat));
    }
}
