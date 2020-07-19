import StartQandA from '@/components/StartQandA.vue';
import SigIn from '@/components/SigIn';
import SigInOrSigUp from '@/components/SigInOrSigUp';
import CreateSurvey from '@/components/CreateSurvey';
import CreatedSurveys from '@/components/CreatedSurveys';
import SigUp from '@/components/SigUp';
import UserSurveys from '@/components/UserSurveys';
import Secure from '@/components/Secure';
import SurveyUserVote from '@/components/SurveyUserVote';
import Vue from 'vue';
import Router from 'vue-router';
import store from '@/store/index.js'

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/SigInOrSigUp',
      name: 'SigInOrSigUp',
      component: SigInOrSigUp,
      // beforeEnter: ifNotAuthenticated
    },
    {
      path: '/SigIn',
      name: 'SigIn',
      component: SigIn,
      // beforeEnter: ifNotAuthenticated
    },
    {
      path: '/SigUp',
      name: 'SigUp',
      component: SigUp,
      // beforeEnter: ifNotAuthenticated
    },
    {
      path: '/StartQandA',
      name: 'StartQandA',
      component: StartQandA,
      // beforeEnter: ifAuthenticated// ,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/CreateSurvey',
      name: 'CreateSurvey',
      component: CreateSurvey,
      // beforeEnter: ifAuthenticated// ,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/CreatedSurveys',
      name: 'CreatedSurveys',
      component: CreatedSurveys,
      // beforeEnter: ifAuthenticated// ,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/UserSurveys',
      name: 'UserSurveys',
      component: UserSurveys,
      // beforeEnter: ifAuthenticated// ,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/SurveyUserVote',
      name: 'SurveyUserVote',
      component: SurveyUserVote,
      // beforeEnter: ifAuthenticated// ,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/secure',
      name: 'secure',
      component: Secure,
      // beforeEnter: ifAuthenticated// ,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/',
      redirect: '/StartQandA'
    } 
  ],
  mode: 'history'
});

router.beforeEach((to, from, next) => {
  try {
    if (to.matched.some(record => record.meta.requiresAuth)) 
    {
      if (store.getters.isLoggedIn&&store.getters.getUser) { next(); }
      else { next('/SigInOrSigUp'); }
    } 
    else { next(); }
  } catch(e) {console.log('router exception', e.message);}
});
export default router;
