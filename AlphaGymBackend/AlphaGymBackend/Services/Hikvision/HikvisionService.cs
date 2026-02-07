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
        private Int32 _userId = -1;
        private Int32 _alarmHandle = -1;
        private CHCNetSDK.MSGCallBack_V31? _messageCallback;

        public event Action<string>? CardSwiped;

        private string? _capturedCardNo;
        private TaskCompletionSource<string>? _cardWaitTask;

        public HikvisionService(IConfiguration configuration, ILogger<HikvisionService> logger) // Reverted constructor parameter to IConfiguration to maintain compilation
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

            // Ensure SDK is initialized
            if (!CHCNetSDK.NET_DVR_Init())
            {
                _logger.LogError("Hikvision SDK Initialization failed.");
                return false;
            }

            _logger.LogInformation("Hikvision SDK Initialized.");

            string ip = _configuration["Hikvision:IpAddress"] ?? "127.0.0.1";
            if (!int.TryParse(_configuration["Hikvision:Port"], out int port)) port = 8000;
            string user = _configuration["Hikvision:Username"] ?? "admin";
            string pass = _configuration["Hikvision:Password"] ?? string.Empty;

            CHCNetSDK.NET_DVR_DEVICEINFO_V30 deviceInfo = new CHCNetSDK.NET_DVR_DEVICEINFO_V30();
            _userId = CHCNetSDK.NET_DVR_Login_V30(ip, port, user, pass, ref deviceInfo);

            if (_userId < 0)
            {
                uint err = CHCNetSDK.NET_DVR_GetLastError();
                _logger.LogError($"Hikvision Login failed. Error code: {err}");
                return false;
            }

            _logger.LogInformation($"Hikvision Login successful. User ID: {_userId}");
            
            // Auto-arm for events
            InitializeEvents();
            Arm();
            
            return true;
        }

        private void InitializeEvents()
        {
            _messageCallback = new CHCNetSDK.MSGCallBack_V31(processCallback);
            if (!CHCNetSDK.NET_DVR_SetDVRMessageCallBack_V31(_messageCallback, IntPtr.Zero))
            {
                _logger.LogError("Failed to set Hikvision message callback.");
            }
        }

        private bool processCallback(int lCommand, ref CHCNetSDK.NET_DVR_ALARMER pAlarmer, IntPtr pAlarmInfo, uint dwBufLen, IntPtr pUser)
        {
            if (lCommand == CHCNetSDK.COMM_ALARM_ACS)
            {
                var alarmInfo = (CHCNetSDK.NET_DVR_ACS_ALARM_INFO)Marshal.PtrToStructure(pAlarmInfo, typeof(CHCNetSDK.NET_DVR_ACS_ALARM_INFO))!;
                string cardNo = System.Text.Encoding.ASCII.GetString(alarmInfo.struAcsEventInfo.byCardNo).TrimEnd('\0');
                
                if (!string.IsNullOrEmpty(cardNo))
                {
                    _logger.LogInformation($"Card Swiped Event: {cardNo} (Major: {alarmInfo.dwMajor}, Minor: {alarmInfo.dwMinor})");
                    CardSwiped?.Invoke(cardNo);

                    if (_cardWaitTask != null && !_cardWaitTask.Task.IsCompleted)
                    {
                        _cardWaitTask.SetResult(cardNo);
                    }
                }
            }
            return true;
        }

        public async Task<string> GetNextCardSwipe(int timeoutMs = 30000)
        {
            _cardWaitTask = new TaskCompletionSource<string>();
            var cts = new System.Threading.CancellationTokenSource(timeoutMs);
            
            using (cts.Token.Register(() => _cardWaitTask.TrySetCanceled()))
            {
                try
                {
                    return await _cardWaitTask.Task;
                }
                catch (TaskCanceledException)
                {
                    throw new TimeoutException("Card read timed out.");
                }
                finally
                {
                    _cardWaitTask = null;
                }
            }
        }

        public void Arm()
        {
            if (_userId < 0 || _alarmHandle >= 0) return;

            CHCNetSDK.NET_DVR_SETUPALARM_PARAM setupParam = new CHCNetSDK.NET_DVR_SETUPALARM_PARAM();
            setupParam.dwSize = (uint)Marshal.SizeOf(setupParam);
            setupParam.byLevel = 1; // High priority
            setupParam.byAlarmInfoType = 1; // Smart alarm

            _alarmHandle = CHCNetSDK.NET_DVR_SetupAlarmChan_V41(_userId, ref setupParam);
            if (_alarmHandle < 0)
            {
                _logger.LogError($"Failed to setup Hikvision alarm channel. Error: {CHCNetSDK.NET_DVR_GetLastError()}");
            }
            else
            {
                _logger.LogInformation("Hikvision alarm channel armed.");
            }
        }

        public void Disarm()
        {
            if (_alarmHandle >= 0)
            {
                CHCNetSDK.NET_DVR_CloseAlarmChan_V30(_alarmHandle);
                _alarmHandle = -1;
                _logger.LogInformation("Hikvision alarm channel disarmed.");
            }
        }

        public bool ControlDoor(int doorIndex, uint command)
        {
            if (!Login()) return false;

            if (CHCNetSDK.NET_DVR_ControlGateway(_userId, doorIndex, command))
            {
                _logger.LogInformation($"NET_DVR_ControlGateway command {command} for door {doorIndex} succeeded.");
                return true;
            }

            uint err = CHCNetSDK.NET_DVR_GetLastError();
            _logger.LogError($"NET_DVR_ControlGateway command {command} for door {doorIndex} failed. Error code: {err}");
            return false;
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
