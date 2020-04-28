import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    status: '',
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user')) || {}
  },
  getters: {
    isLoggedIn: state => !!state.token,
    authStatus: state => state.status,
    getToken: state => state.token,
    getUser: state => state.user
  },
  mutations: {
    auth_request(state) {
      state.status = 'loading';
    },
    auth_success(state, payload) {
      state.status = 'success';
      state.token = payload.token;
      state.user = payload.user;
    },
    auth_error(state) {
      state.status = 'error';
    },
    logout(state) {
      state.status = '';
      state.token = '';
    }
  },
  actions: {
    login({ commit }, user) {
      return new Promise((resolve, reject) => {
        commit('auth_request');
        axios({ url: 'https://localhost:5001/api/User/login', data: user, method: 'POST' })
          .then(resp => {
            if (resp.data !== '') {
              const token = resp.data;
              localStorage.setItem('user', JSON.stringify(user));
              localStorage.setItem('token', token);
              axios.defaults.headers.common['Authorization'] = token;
              commit('auth_success', {token, user});
              resolve(resp);
            }
          })
          .catch(err => {
            commit('auth_error');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            reject(err);
          });
      });
    },
    register({ commit }, user) {
      return new Promise((resolve, reject) => {
        commit('auth_request');
        axios({ url: 'https://localhost:5001/api/User', data: user, method: 'POST' })
          .then(resp => {
            if (resp.data !== '') {
              const token = resp.data;
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
              axios.defaults.headers.common['Authorization'] = token;
              commit('auth_success', {token, user});
              resolve(resp);
            }
          })
          .catch(err => {
            commit('auth_error', err);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            reject(err);
          });
      });
    },
    logout({ commit }) {
      return new Promise((resolve, reject) => {
        axios({ url: 'https://localhost:5001/api/User/logout', method: 'POST' });
        commit('logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        resolve();
      });
    },
    CreateSurvey({ commit, state }, survey) {
      return new Promise((resolve, reject) => {
        axios({ url: 'https://localhost:5001/api/Survey', data: survey, method: 'POST' })
          .then(resp => {
            if (resp.data !== 'Fail') {
              resolve(resp);
            }
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
      });
    },
    AddResponse({commit}, survey){
      return new Promise((resolve, reject) => {
      axios({ url: 'https://localhost:5001/api/Answer', data: survey, method: 'POST' })
        .then(resp => {
          if (resp.data !== 'Fail') {
            resolve(resp);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
    },
    AppendSurveys({commit, state}){
      return new Promise((resolve, reject) => {
        axios({url: 'https://localhost:5001/api/Survey'})
        .then(resp => {
          for (const survey of resp.data) {
          survey.loginvote = false
          let allvotes = 0
          for (const answer of survey.answers) {
            allvotes += answer.votes !== null ? answer.votes.length : 0
            if (answer.votes != null) {
              survey.voters = ['']
              for (const vote of answer.votes) {
                if(survey.voters.length < 5) {
                  survey.voters.push(vote.voter.login)
                }
                if (vote.voter.login === state.user.login) {
                  answer.vote = true
                  survey.loginvote = true
                }
              }
            }
          }
          survey.allvotes = allvotes
        }
          resolve(resp);
          })
        .catch(err => {
          console.log(err);
          reject(err);
        });
      })
    },
    Vote({commit}, vote){
      return new Promise((resolve, reject) => {
        axios({url: 'https://localhost:5001/api/Vote', data: vote, method: 'POST'})
        .then(resp => {
          resolve(resp);
          })
        .catch(err => {
          console.log(err);
          reject(err);
        });
      })
    }
  }
});
