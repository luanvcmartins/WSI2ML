// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css';
import { VTreeview } from 'vuetify/labs/VTreeview';
import 'vuetify/styles';
import {md3} from 'vuetify/blueprints'
import { createVuetify } from 'vuetify';

export default defineNuxtPlugin((app) => {
  const light = {
    dark: false,
    colors: {
      background: '#FEF7FF',
      surface: '#FEF7FF',
      primary: '#673ab7',
      'primary-darken-1': '#5423ae',
      secondary: '#03DAC6',
      'secondary-darken-1': '#018786',
      error: '#B00020',
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#ffa234',
    },
  };
  const dark = {
    dark: true,
    colors: {
      background: '#151218',
      'on-background': '#E7E0E8',
      surface: '#141218',
      primary: '#D3BCFD',
      'primary-darken-1': '#5423ae',
      secondary: '#CDC2DB',
      'secondary-darken-1': '#018786',
      error: '#FFB4AB',
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#ffa234',
    },
  };

  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'light',
      themes: {
        light,dark
      },
    },
    blueprint: md3,
    components: {
      VTreeview,
    },
  });
  app.vueApp.use(vuetify);
});
