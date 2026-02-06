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
            if (_hikvisionService.Login())
            {
                // In a real implementation:
                // _hikvisionService.ControlDoor("OPEN");
                return Ok(new { Message = "Door opened" });
            }
            return StatusCode(500, new { Message = "Failed to connect to door controller" });
        }

        [HttpPost("lock")]
        public IActionResult Lock()
        {
            if (_hikvisionService.Login())
            {
                // In a real implementation:
                // _hikvisionService.ControlDoor("CLOSE");
                return Ok(new { Message = "Door locked" });
            }
            return StatusCode(500, new { Message = "Failed to connect to door controller" });
        }
    }
}
