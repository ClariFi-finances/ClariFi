namespace API.Models;

public class Notification : BaseEntity
{
    public string Title { get; private set; }
    public string Message { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public int UserId { get; private set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public User? User { get; private set; }

    protected Notification() 
    {
        Title = null!;
        Message = null!;
    }

    public Notification(string title, string message, int userId)
    {
        Title = title;
        Message = message;
        IsRead = false;
        CreatedAt = DateTime.UtcNow;
        UserId = userId;
    }

    public void MarkAsRead()
    {
        IsRead = true;
    }
}
