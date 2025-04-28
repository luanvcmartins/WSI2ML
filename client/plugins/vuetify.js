// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css';
import { VTreeview } from 'vuetify/labs/VTreeview';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';

export default defineNuxtPlugin((app) => {
  const lightTheme = {
    dark: true,
    colors: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
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

  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'lightTheme',
      themes: {
        lightTheme,
      },
    },
    components: {
      VTreeview,
    },
  });
  app.vueApp.use(vuetify);
});
