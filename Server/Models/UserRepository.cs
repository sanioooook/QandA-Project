using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using Dapper;

namespace Server2.Models
{
	public class UserRepository : IUserRepository
	{
		string connectionString = null;
		public UserRepository(string conn) => connectionString = conn;
		public static string GenRandomString(string Alphabet, int Length)
		{
			//string Ret = "";
			System.Random rnd = new System.Random();
			System.Text.StringBuilder sb = new System.Text.StringBuilder(Length - 1);
			for(int i = 0; i < Length; i++)
			{
				int Position = rnd.Next(0, Alphabet.Length - 1);
				sb.Append(Alphabet[Position]);
				//Ret = Ret + Alphabet[Position]; //- так делать не стоит, в данном случае StringBuilder дает явный выигрыш в скорости
			}
			//return Ret;
			return sb.ToString();
		}
		public bool GetAuthorization(string token)
		{
			IDbConnection db = new SqlConnection(connectionString);
			return db.Query<User>("SELECT * FROM Customer WHERE Autorization = @token", new {token}).FirstOrDefault() != null ? true : false;
		}
		public List<User> GetUsers()
		{
			IDbConnection db = new SqlConnection(connectionString);
			return db.Query<User>("SELECT * FROM Customer").ToList();
		}

		public User Get(int id)
		{
			IDbConnection db = new SqlConnection(connectionString);
			return db.Query<User>("SELECT * FROM Customer WHERE Id = @id", new { id }).FirstOrDefault();
		}
		public User Get(string login)
		{
			if(login.Length <= 30)
			{
				IDbConnection db = new SqlConnection(connectionString);
				return db.Query<User>("SELECT * FROM Customer WHERE Login = @login", new { login }).FirstOrDefault();
			}
			return null;
		}
		public User GetUser(string token)
		{
			IDbConnection db = new SqlConnection(connectionString);
			return db.Query<User>("SELECT * FROM Customer WHERE Customer.Autorization = @token", new { token }).FirstOrDefault();
		}
		public string Create(User user)
		{
			if(user.Login.Length <= 30 && user.Password.Length <= 40)
			{
				IDbConnection db = new SqlConnection(connectionString);
				db.Execute("INSERT INTO Customer (Login, Password) VALUES(@Login, @Password)", user);
				return "Success";
			}
			return "Fail";
		}

		//public void Update(User user)
		//{
		//	if(user.Login.Length <= 30&& user.Password.Length <= 40)
		//	{
		//		IDbConnection db = new SqlConnection(connectionString);
		//		var sqlQuery = "UPDATE Customer SET Login = @Login, Password = @Password WHERE Id = @Id";
		//		db.Execute(sqlQuery, user);
		//	}
		//}

		//public void Delete(int id)
		//{
		//	using IDbConnection db = new SqlConnection(connectionString);
		//	var sqlQuery = "DELETE FROM Customer WHERE Id = @id";
		//	db.Execute(sqlQuery, new { id });
		//}

		public User Login(string login, string password)
		{
			IDbConnection db = new SqlConnection(connectionString);
			var ResultSelect = db.Query<User>("SELECT * FROM Customer WHERE Login = @login AND Password = @password", new { login, password }).FirstOrDefault();
				ResultSelect.Autorization = GenRandomString("QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm", 10);
				db.Execute("UPDATE Customer SET Autorization = @Autorization WHERE Customer.Id = @Id", ResultSelect);
			return ResultSelect ?? null;
		}
		public User Login(User user) => Login(user.Login, user.Password);
		public void Logout(string token)
		{
			IDbConnection db = new SqlConnection(connectionString);
			db.Execute("UPDATE Customer SET Autorization = NULL WHERE Customer.Autorization = @token", new { token});
		}

	}
}
