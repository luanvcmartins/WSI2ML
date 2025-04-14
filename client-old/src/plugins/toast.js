import Vue from 'vue';
import Toast, { POSITION } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

const options = {
  position: POSITION.BOTTOM_LEFT,
};

Vue.use(Toast, options);
