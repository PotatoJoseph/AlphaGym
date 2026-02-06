using System.Threading.Tasks;

namespace AlphaGymBackend.Services.Email
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        public Task SendEmailAsync(string to, string subject, string body)
        {
            // Implementation depends on SMTP provider (e.g. SendGrid, SMTP Client)
            // For now, valid/dummy.
            System.Console.WriteLine($"Sending email to {to}: {subject} - {body}");
            return Task.CompletedTask;
        }
    }
}
