using API.Data;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Features.Notifications;

public static class NotificationEndpoints
{
    public static RouteGroupBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("");

        group.MapGet("/", async ([FromQuery] int userId, AppDbContext context, CancellationToken ct) =>
        {
            var notifications = await context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync(ct);
                
            return Results.Ok(notifications);
        });

        group.MapPut("/{id}/read", async (int id, AppDbContext context, CancellationToken ct) =>
        {
            var notification = await context.Notifications.FindAsync(new object[] { id }, ct);
            if (notification is null)
                return Results.NotFound();

            notification.MarkAsRead();
            await context.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return group;
    }
}
