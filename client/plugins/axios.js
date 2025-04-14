import axios from "axios";
import {defineNuxtPlugin, useRuntimeConfig} from "nuxt/app";
// import {useAuthStore} from "/stores/auth.js";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  // const store = useAuthStore()

  const defaultUrl = config.public.BASE_URL;

  let axiosInstance = axios.create({
    baseURL: defaultUrl
  });
  return {
    provide: {
      axios: axiosInstance,
    },
  };
});
