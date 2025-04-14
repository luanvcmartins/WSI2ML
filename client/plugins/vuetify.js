// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css';
import { VTreeview } from 'vuetify/labs/VTreeview';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    components: {
      VTreeview,
    },
  });
  app.vueApp.use(vuetify);
});
