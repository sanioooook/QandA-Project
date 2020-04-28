using System.Collections.Generic;

namespace Server2.Models
{
	public interface IUserRepository
	{
		string Create(User user);
		//void Delete(int id);
		User Get(int id);
		User Get(string login);
		//User Get(string login, string password);
		User Login(User user);
		void Logout(string token);
		User GetUser(string token);
		List<User> GetUsers();
		//void Update(User user);
	}
}
