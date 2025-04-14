import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => {
    return {
      token: '',
      user: null
    }
  },
  actions: {
    setToken(token, user) {
      this.token = token
      this.user = user
    },
    logout(){
      this.token = ''
      this.user = null
    }
  },
})
