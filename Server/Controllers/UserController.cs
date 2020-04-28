using System.Collections.Generic;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server2.Models;

namespace Server2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        public UserController(IUserRepository userRepository) => UserRepository = userRepository;

        public IUserRepository UserRepository{get; private set;}
        // GET: api/User
        [HttpGet]
        public IEnumerable<User> Get() => UserRepository.GetUsers();

        // GET: api/User/5
        [HttpGet("id/{id}")]
        public string Get(int id) => UserRepository.Get(id) != null ? "Success" : "Fail";

		//[HttpGet("login/{login}")]
		//public string Get(string login)
		//{
		//	var user = UserRepository.Get(login);
		//	return user != null ? "Success" : "Fail";
		//}

		//[HttpGet("password/{login} {password}")]
		//public string Get(string login, string password) => UserRepository.Get(login, password);
		// POST: api/User/register
		[HttpPost("register")]
        public string Post([FromBody] User user)
        {
            if(user.Login != "" && user.Password != "" || user.Login != null && user.Password != null)
				if(user.Login.Length <= 30 && user.Password.Length <= 40 && UserRepository.Get(user.Login) == null)
				{
					UserRepository.Create(user);
					return Login(user);
				}
			return "";
		}

		// POST: api/User/login
		[HttpPost("login")]
        public string Login([FromBody] User user)
        {
            if(user.Login != "" && user.Password != "" && user.Login != null && user.Password != null)
                return UserRepository.Login(user).Autorization;
            return "";
        }

        [HttpPost("logout")]
        public void Logout()
        {
            if(Request.Headers["Authorization"] != "")
                UserRepository.Logout(Request.Headers["Authorization"]);
        }
        //// PUT: api/User/5
        //[HttpPut("{id}")]//update
        //public void Put(int id, [FromBody] string value)
        //{
        //}

        //// DELETE: api/ApiWithActions/5
        //[HttpDelete("{id}")]
        //public void Delete(int id)
        //{
        //}
    }
}
