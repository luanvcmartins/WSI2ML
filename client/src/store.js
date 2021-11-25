import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        session: null,
        user: null,
        token: null,
    },
    mutations: {
        set_session(state, session) {
            state.session = session
        },

        login(state, login_data) {
            state.token = login_data.token
            state.user = login_data.user
        },
        logout(state) {
            state.token = null
            state.user = null
        }
    },
    actions: {}
})
