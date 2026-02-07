using AlphaGymBackend.Services.Hikvision;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlphaGymBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DoorsController : ControllerBase
    {
        private readonly HikvisionService _hikvisionService;

        public DoorsController(HikvisionService hikvisionService)
        {
            _hikvisionService = hikvisionService;
        }

        [HttpPost("open")]
        public IActionResult Open()
        {
            // GateWayIndex 1 is usually the first door
            if (_hikvisionService.ControlDoor(1, CHCNetSDK.NET_DVR_OPEN_DOOR))
            {
                return Ok(new { Message = "Door opened" });
            }
            return StatusCode(500, new { Message = "Failed to open door" });
        }

        [HttpPost("lock")]
        public IActionResult Lock()
        {
            if (_hikvisionService.ControlDoor(1, CHCNetSDK.NET_DVR_CLOSE_DOOR))
            {
                return Ok(new { Message = "Door locked" });
            }
            return StatusCode(500, new { Message = "Failed to lock door" });
        }
    }
}
