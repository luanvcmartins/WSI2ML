import Vue from 'vue'
import VueAxios from 'vue-plugin-axios'
import axios from 'axios'
import store from '@/store'
console.log(process.env)
Vue.use(VueAxios, {
    axios,
    config: {
        // baseURL: '/api',
        // baseURL: 'http://192.168.0.2:2000/api',
        baseURL: process.env.VUE_APP_BASE_URL,
    },
    interceptors: {
        beforeRequest(config, axiosInstance) {
            // Adding the jwt token, if we have one
            if (store.state.token != null) {
                const token = store.state.token

                if (token)
                    config.headers.Authorization = `Bearer ${token}`
            }

            return config
        },
        beforeResponse(config, axiosInstance) {
            // console.log("beforeResponse: ", config)
        },

        beforeResponseError(config, axiosInstance){
            if (config.statusCode === 401){
            }
        }
    }
})
export default axios