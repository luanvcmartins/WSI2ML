// import {useAuthStore} from "/stores/auth.js";

export default defineNuxtRouteMiddleware((to, from) => {
  const store = useAuthStore()

  if (store.token === "") {
    return navigateTo('/login')
  }
})
