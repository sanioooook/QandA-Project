<template>
<div id="SigUp">
        <h1>Регистрация</h1>
        <div class="inputs">
          <input type="text" name="username" v-model="username" placeholder="Username" />
        <input type="password" name="password" v-model="password" placeholder="Password" />
        <button type="button" v-on:click="Registration()">Регистрация</button>
        <router-link to="/SigInOrSigUp">Назад</router-link>
        </div>
    </div>
</template>

<script>
export default {
  name: 'SigUp',
  data () {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    register: function () {
      let data = {
        username: this.username,
        password: this.password
      }
      this.$store.dispatch('register', data)
        .then(() => this.$router.push('/StartQandA'))
        .catch(err => console.log(err))
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
