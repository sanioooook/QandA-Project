using Server2.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Server2
{
	public class Startup
	{
		readonly string VueCorsPolicy = "_vueCorsPolicy";
		public void ConfigureServices(IServiceCollection services)
		{
			string connectionString = "Data Source=DELLVOSTRO3560;" + "Initial Catalog=QandA;" + "Integrated Security=True;";
			services.AddTransient<IUserRepository, UserRepository>(provider => new UserRepository(connectionString));
			services.AddTransient<ISurveyRepository, SurveyRepository>(provider => new SurveyRepository(connectionString));
			services.AddTransient<IAnswerRepository, AnswerRepository>(provider => new AnswerRepository(connectionString));
			services.AddTransient<IVoteRepository, VoteRepository>(provider => new VoteRepository(connectionString));
			services.AddCors(options =>
			{
				options.AddPolicy(name: VueCorsPolicy, builder =>
				{ builder.WithOrigins("http://localhost:8080").AllowAnyHeader(); });
			});

			services.AddControllersWithViews();
		}

		public void Configure(IApplicationBuilder app)
		{
			app.UseDeveloperExceptionPage();

			app.UseHttpsRedirection();

			app.UseRouting();

			app.UseCors(VueCorsPolicy);

			app.UseEndpoints(endpoints =>
			{
				endpoints.MapControllers();
			});
		}
	}
}