import 'vuetify/dist/vuetify.min.css';
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import axios from './plugins/axios';
import split from './plugins/split';
import toast from './plugins/toast';

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  axios,
  split,
  toast,
  render: (h) => h(App),
}).$mount('#app');
