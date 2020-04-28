<template>
  <div id="app">
        <div id="nav" v-if="isLoggedIn">
            <router-link to="/SigInOrSigUp" v-on:click.native="logout" replace>Logout</router-link>
            <router-link to="/StartQandA">Home</router-link>
        </div>
        <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    isLoggedIn: function () {
      return this.$store.getters.isLoggedIn
    }
  },
  methods: {
    logout: function () {
      this.$store.dispatch('logout')
    }
  },
  created: function () {
    this.$http.interceptors.response.use(undefined, function (err) {
      return new Promise(function (resolve, reject) {
        if (err.status === 401 && err.config && !err.config.__isRetryRequest) {
          this.$store.dispatch('logout')
        }
        throw err
      })
    })
  }
}
</script>

<style>
    body {
        background-color: #F0F0F0;
    }
    h1 {
        padding: 0;
        margin-top: 0;
    }
    #app {
        width: 98vw;
        margin: auto;
    }
    a{
    color: #000;
    text-decoration: none;
}
</style>
