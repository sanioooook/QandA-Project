<template>
  <div id="SigIn">
    <form class="login" @submit.prevent="LogIn">
    <h1>Вход</h1>
    <div class="inputs">
      <input type="email" name="login" v-model="login" placeholder="Username" />
      <input type="password" name="password" v-model="password" placeholder="Password" />
      <button type="submit">Войти</button>
      <router-link to="/SigInOrSigUp">Назад</router-link>
    </div>
  </form>
  </div>
</template>

<script>
export default {
  name: 'SigIn',
  data () {
    return {
      login: '',
      password: ''
    };
  },
  methods: {
    LogIn: function () {
      let login = this.login;
      let password = this.password;
      this.$store.dispatch('login', { login, password })
        .then(() => this.$router.push('/StartQandA'))
        .catch(err => console.log(err));
    }
  }
}
</script>

<style scoped>
div.inputs {
  display: flex;
  width: fit-content;
  margin: auto;
  flex-direction: column;
  padding: 10px;
  border: 1px solid black;
  border-radius: 10px;
}
a{
  color: #000;
  margin: auto;
  text-decoration: none;
}
h1{
    margin-left: auto;
    margin-right: auto;
    width: fit-content;
}
</style>
