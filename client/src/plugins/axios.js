import Vue from 'vue'
import VueAxios from 'vue-plugin-axios'
import axios from 'axios'
import store from '@/store'

Vue.use(VueAxios, {
    axios,
    config: {
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