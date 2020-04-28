<template>
<div id="CreateSurvey">
  <h1>Создать опрос</h1>
  <div class="Inputs">
      <input type="text" name="question" v-model="input.question" placeholder="Вопрос к опросу"/>
      <ul>
        <li v-for="(answer, index) in input.answers" :key="answer.index">
      <p class="Line">{{ answer }} <button v-on:click="input.answers.splice(index, 1)">Удалить</button></p></li>
    </ul>
      <p class="Line"><input type="text" name="answers" v-model="input.newanswer" placeholder="Вариант ответа"/>
      <button v-on:click="input.answers.push(input.newanswer); input.newanswer = ''">Добавить</button></p>
  </div>
  <div class="Inputs">
    <p class="Line"><input type="checkbox" id="checkboxMultiVote" v-model="input.checkboxMultiVote">
    <label for="checkboxMultiVote">Голосовать за несколько ответов</label></p>
    <p class="Line"><input type="checkbox" id="checkboxAddAnswer" v-model="input.checkboxAddAnswer">
    <label for="checkboxAddAnswer">Можно добавить свой вариант ответа</label></p>
  </div>
    <router-link to="/StartQandA">Назад</router-link>
    <button v-on:click="Send()">Создать опрос</button>
  </div>
</template>

<script>
/* eslint-disable */
export default {
  name: 'CreateSurvey',
  data () {
    return {
      input: {
        question: '',
        answers: ['Да', 'Нет'],
        newanswer: '',
        checkboxMultiVote: false,
        checkboxAddAnswer: false
      }
    }
  },
  methods: {
    Send () {
      if (this.input.question !== '' && this.input.answers.length >= 1) {
        let answers = []
        for (const answer of this.input.answers) {
          answers.push({textanswer: answer})
        }
        let survey = {
          question: this.input.question,
          god: this.$store.getters.getUser,
          severalAnswer: this.input.checkboxMultiVote,
          addResponse: this.input.checkboxAddAnswer,
          answers: answers}
          this.$store.dispatch('CreateSurvey', survey)
         .then( this.$router.push('/StartQandA'))
        .catch(err => console.log(err));
      }
    }
  }
}
</script>

<style scoped>
h1{
    margin: auto;
    width: fit-content;
}
.Inputs{
  display: flex;
  width: fit-content;
  margin: auto;
  flex-direction: column;
  width: fit-content;
}
.Line{
  flex-direction: row;
}
li{
  list-style-type: none;
}
</style>
