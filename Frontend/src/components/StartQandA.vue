<template>
  <div id="StartQandA">
    <p>
      <router-link to="/CreateSurvey">Создать опрос</router-link>
    </p>
    <p>
      <router-link to="/CreatedSurveys">Все опросы</router-link>
    </p>
    <p>
      <router-link to ="/UserSurveys">Все созданные вами опросы</router-link>
    </p>
    <p>
      <router-link to ="/SurveyUserVote">Опросы в которых вы голосовали</router-link>
    </p>
  </div>
</template>

<style scoped>
#StartQandA {
  border: 1px solid #000;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: fit-content;
  margin: auto;
  padding: 0px 10px;
}
a {
  color: #000;
}
</style>
