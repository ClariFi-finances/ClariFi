using System.Text.Json.Serialization;

namespace API.Models;

public class Category : BaseEntity
{
    public string Name { get; private set; }
    public string? Icon { get; private set; }
    public string? Color { get; private set; }

    [JsonIgnore]
    public User? User { get; private set; }
    public int UserId { get; private set; }

    // EF Constructor
    protected Category()
    {
        Name = string.Empty;
    }

    public Category(string name, string? icon, string? color, int userId)
    {
        Name = name;
        Icon = icon;
        Color = color;
        UserId = userId;
    }

    public void UpdateDetails(string name, string? icon, string? color)
    {
        Name = name;
        Icon = icon;
        Color = color;
    }
}
