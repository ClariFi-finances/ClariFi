using API.Models;
using Microsoft.EntityFrameworkCore;
using Bogus;

namespace API.Data;

public static class DataSeeder
{
    public static async Task SeedDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await context.Database.MigrateAsync();

        if (!context.Users.Any())
        {
            var testUser = new User("admin@clarifi.com", "Admin User", "admin@clarifi.com", "00000000000"); // Standard Cognito sub
            context.Users.Add(testUser);
            await context.SaveChangesAsync();

            // Set a random seed to consistently generate the same dummy data
            Randomizer.Seed = new Random(8675309);

            // 1. Generate Fake Users
            var userFaker = new Faker<User>()
                .CustomInstantiator(f => new User(
                    f.Random.Guid().ToString(), // Fake CognitoId
                    f.Name.FullName(),
                    f.Internet.Email(),
                    "00000000000"
                ));

            var fakeUsers = userFaker.Generate(5);
            context.Set<User>().AddRange(fakeUsers);
            await context.SaveChangesAsync();
            
            var faker = new Faker();

            // 2. Generate Fake Payment Methods for each User
            var paymentMethods = new List<PaymentMethod>();
            foreach (var user in fakeUsers)
            {
                var pmFaker = new Faker<PaymentMethod>()
                    .CustomInstantiator(f => new PaymentMethod(
                        f.Finance.AccountName(),
                        f.PickRandom<PaymentMethodType>(),
                        user.Id
                    ));
    
                // Fix: Evaluate the random integer BEFORE passing it to Generate
                int numberOfPaymentMethods = faker.Random.Int(1, 3);
                paymentMethods.AddRange(pmFaker.Generate(numberOfPaymentMethods));
            }
            context.Set<PaymentMethod>().AddRange(paymentMethods);
            await context.SaveChangesAsync();

            // 3. Generate Fake Categories for each User
            var categories = new List<Category>();
            var categoryNames = new[] { "Health", "Tasks", "Taxes", "Leisure", "Food", "Reserve", "Fixed", "Bills" };
            
            foreach (var user in fakeUsers)
            {
                var categoryFaker = new Faker<Category>()
                    .CustomInstantiator(f => new Category(
                        f.PickRandom(categoryNames),
                        f.Random.Word(), // icon
                        f.Internet.Color(), // color
                        user.Id
                    ));
                
                categories.AddRange(categoryFaker.Generate(faker.Random.Int(3, 8)));
            }
            context.Set<Category>().AddRange(categories);
            await context.SaveChangesAsync();

            // 4. Generate Fake Transactions matching Users to their own PaymentMethods and Categories
            var transactions = new List<Transaction>();
            
            foreach (var user in fakeUsers)
            {
                var userPaymentMethods = paymentMethods.Where(pm => pm.UserId == user.Id).ToList();
                var userCategories = categories.Where(c => c.UserId == user.Id).ToList();
                
                var transactionFaker = new Faker<Transaction>()
                    .CustomInstantiator(f => new Transaction(
                        f.Commerce.ProductName(),
                        f.Lorem.Sentence(),
                        Math.Round(f.Random.Decimal(10, 1000), 2),
                        f.Date.Past(1).ToUniversalTime(), // Transactions over the last year
                        f.PickRandom<TransactionType>(),
                        f.PickRandom(userCategories).Id,
                        user.Id,
                        f.PickRandom(userPaymentMethods).Id,
                        f.Random.Bool(0.2f) ? $"{f.Random.Int(2,12)}x" : null
                    ));

                transactions.AddRange(transactionFaker.Generate(faker.Random.Int(10, 30)));
            }
            
            context.Set<Transaction>().AddRange(transactions);
            await context.SaveChangesAsync();

            // 5. Generate Fake Goals for each User
            var goalNames = new[] { "Vacation", "Emergency Fund", "New Car", "iPhone", "Investment", "Retirement", "Education", "Home Down Payment" };
            var goalIcons = new[] { "✈️", "🛡️", "🚗", "📱", "📈", "🏖️", "📚", "🏠" };
            var goalColors = new[] { "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F43F5E", "#6366F1" };
            var goals = new List<Goal>();

            foreach (var user in fakeUsers)
            {
                int numberOfGoals = faker.Random.Int(2, 5);
                var usedIndexes = new HashSet<int>();
                
                for (int i = 0; i < numberOfGoals; i++)
                {
                    int idx;
                    do { idx = faker.Random.Int(0, goalNames.Length - 1); } while (usedIndexes.Contains(idx));
                    usedIndexes.Add(idx);

                    var target = Math.Round(faker.Random.Decimal(500, 15000), 2);
                    var current = Math.Round(faker.Random.Decimal(0, target), 2);
                    var deadline = faker.Random.Bool(0.7f) ? faker.Date.Future(2).ToUniversalTime() : (DateTime?)null;

                    goals.Add(new Goal(goalNames[idx], goalIcons[idx], goalColors[idx], target, current, deadline, user.Id));
                }
            }

            context.Set<Goal>().AddRange(goals);
            await context.SaveChangesAsync();
        }
    }
}
