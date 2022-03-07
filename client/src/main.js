import 'vuetify/dist/vuetify.min.css';
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import axios from './plugins/axios';
import split from './plugins/split';

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  axios,
  split,
  render: (h) => h(App),
}).$mount('#app');
