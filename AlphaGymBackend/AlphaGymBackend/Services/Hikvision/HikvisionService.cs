using System;
using System.Runtime.InteropServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AlphaGymBackend.Services.Hikvision
{
    public class HikvisionService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<HikvisionService> _logger;
        private int _userId = -1;

        public HikvisionService(IConfiguration configuration, ILogger<HikvisionService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public bool Initialize()
        {
            if (CHCNetSDK.NET_DVR_Init())
            {
                _logger.LogInformation("Hikvision SDK initialized successfully.");
                return true;
            }
            _logger.LogError("Failed to initialize Hikvision SDK.");
            return false;
        }

        public bool Login()
        {
            if (_userId >= 0) return true;

            string ip = _configuration["Hikvision:IpAddress"] ?? "127.0.0.1";
            if (!int.TryParse(_configuration["Hikvision:Port"], out int port)) port = 8000;
            string user = _configuration["Hikvision:Username"] ?? "admin";
            string pass = _configuration["Hikvision:Password"] ?? string.Empty;

            CHCNetSDK.NET_DVR_DEVICEINFO_V30 DeviceInfo = new CHCNetSDK.NET_DVR_DEVICEINFO_V30();

            _userId = CHCNetSDK.NET_DVR_Login_V30(ip, port, user, pass, ref DeviceInfo);

            if (_userId < 0)
            {
                uint err = CHCNetSDK.NET_DVR_GetLastError();
                _logger.LogError($"Hikvision Login failed. Error code: {err}");
                return false;
            }

            _logger.LogInformation($"Hikvision Login successful. User ID: {_userId}");
            return true;
        }

        public void Logout()
        {
            if (_userId >= 0)
            {
                CHCNetSDK.NET_DVR_Logout(_userId);
                _userId = -1;
            }
            CHCNetSDK.NET_DVR_Cleanup();
        }

        // Methods for Card Management will go here
        // Example: CreateCard, DeleteCard, etc.
        // Need to check specific SDK calls for Card management (NET_DVR_SET_CARD_CFG_V50 etc.)
    }
}
