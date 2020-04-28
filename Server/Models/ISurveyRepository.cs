using System.Collections.Generic;

namespace Server2.Models
{
	public interface ISurveyRepository
	{
		string Create(string token, Survey survey);
		Survey Get(string token, int id);
		List<Survey> Get(string token, User God);
		List<Survey> Get(string token, string Question);
		List<Survey> GetSurveys(string token);
	}
}
