<template>
  <div id="SurveyUserVote">
    <h1>Опросы в которых вы голосовали</h1>
    <div v-for="(survey) in surveys" :key="survey.index">
      <div v-if="survey.loginvote" class="Survey" :data-title="survey.god.login">
        <p>{{survey.question}}</p>
        <div class="Answer" v-for="(answer) in survey.answers" :key="answer.indextwo">
            <input type="checkbox" @change="Vote(survey, answer)" v-model="answer.vote" :disabled = !MultiVote(survey)>{{answer.textAnswer}}
            <p v-if="survey.allvotes!==0">{{Math.round((answer.votes !== null ? answer.votes.length : 0)*100/survey.allvotes)}}%</p>
            <p v-else>0%</p>
        </div>
        <p v-if="survey.addResponse || $store.getters.getUser.login == survey.god.login" class="Line" >
        <input type="text" name="answers" v-model="survey.newanswer" placeholder="Вариант ответа" />
        <button v-on:click="AddResponse(survey); survey.newanswer = ''">Добавить</button>
      </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreatedSurveys',
  data () {
    return {
      surveys: [
        {
          question: '',
          answers: [{
            id: 0,
            textAnswer: '',
            votes: [{ voter: { login: '' }, dateVote: '' }],
            vote: false
          }],
          severalAnswer: false,
          addResponse: false,
          god: { login: '' },
          newanswer: '',
          allvotes: 0,
          loginvote: false,
          voters: ['']
        }
      ]
    }
  },
  methods: {
    start () {
      this.$store.dispatch('AppendSurveys')
        .then(resp => { this.surveys = resp.data })
        .catch(error => { console.error('Error:', error) })
    },
    AddResponse (survey) {
      this.$store.dispatch('AddResponse', { textAnswer: survey.newanswer,  survey: { question: survey.question } })
        .then(this.start())
        .catch(err => console.log(err));
    },
    Vote (survey, answer) {
      if (answer.vote) {
        survey.loginvote = true
        this.$store.dispatch('Vote', {voter: this.$store.getters.user, idAnswer: answer.id })
          .then(data => {
            console.log(data)
            this.start()
          })
          .catch(error => { console.error('Error:', error) })
      }
    },
    MultiVote (survey) {
      if (!survey.severalAnswer) { // если запрещенно голосовать дважды
        if (!survey.loginvote) { // но клиент еще не голосовал
          return true// можно голосовать
        }
        return false// иначе голосовать нельзя
      } else { // иначе несколько раз голосовать можно
        return true// можно голосовать
      }
    }
  },
  mounted () {
      this.start()
  }
}
</script>

<style scoped>
#SurveyUserVote {
  display: flex;
  flex-direction: column;
  align-items: center;
}
h1 {
  margin: auto;
  width: fit-content;
}
.Answer {
  background-color: #d1c7c7;
  margin-bottom: 5px;
  width: 230px;
  margin-left: 20px;
}
/* .Answer:hover::after {
  content: "Проголосовали: " attr(data-title);
    position: absolute; 
    right: 0%;
    z-index: 1; 
    background: rgba(255,255,230,0.9);
    font-family: Arial, sans-serif; 
    font-size: 11px; 
    padding: 5px 10px; 
    border: 1px solid #333; 
} */
.Survey {
  border: 1px solid;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  padding: 0px 20px;
  align-items: center;
  width: min-content;
  margin: 5px 0px;
  text-align: center;
}
.Survey:hover::after {
  content: "Created survey: " attr(data-title);
    position: absolute; /* Абсолютное позиционирование */
    right: 0%;/*  top: 30%; Положение подсказки */
    z-index: 1; /* Отображаем подсказку поверх других элементов */
    background: rgba(255,255,230,0.9); /* Полупрозрачный цвет фона */
    font-family: Arial, sans-serif; /* Гарнитура шрифта */
    font-size: 11px; /* Размер текста подсказки */
    padding: 5px 10px; /* Поля */
    border: 1px solid #333; /* Параметры рамки */
}
p.Line {
  flex-direction: row;
  display: flex;
}
p {
  display: contents;
}
</style>
