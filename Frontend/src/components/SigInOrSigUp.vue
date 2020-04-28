<template>
  <div class="SigInOrSigUp">
<h1><router-link to="/SigUp">Регистрация</router-link></h1>
<h2><router-link to="/SigIn">Вход</router-link></h2>
  </div>
</template>

<script>
export default {
  name: 'SigInOrSigUp'
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2{
    margin: auto;
    width: fit-content;
}
</style>
