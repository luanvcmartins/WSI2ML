import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store'
import Home from './views/Home.vue'
import Tasks from './views/Tasks.vue'
import Session from './views/Session.vue'
import Admin from './views/Admin.vue'
import AppBar from "./components/AppBar.vue"
import AdminAppBar from "./components/AdminAppBar.vue"

Vue.use(Router)

const new_router = new Router({
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import("./views/Login.vue")
        },
        {
            path: "/main",
            name: "main",
            components: {
                default: Tasks,
                app_bar: AdminAppBar
            },
            meta: {
                auth: true
            }
        },
        {
            path: '/tasks',
            name: 'tasks',
            components: {
                default: Tasks,
                app_bar: AdminAppBar
            },
            meta: {
                auth: true
            }
        },

        {
            path: '/session/:session_id',
            name: 'session',
            components: {
                default: Session,
                app_bar: AppBar
            },
            meta: {
                auth: true,
            }
        },
        {
            path: '/admin',
            name: 'admin',
            components: {
                default: Admin,
                app_bar: AdminAppBar
            },
            meta: {
                auth: true,
                is_admin: false
            }
        },
        {
            path: "/export",
            name: "export",
            components: {
                default: () => import("./views/Export.vue"),
                app_bar: AdminAppBar
            },
            meta: {
                auth: true,
                is_admin: false
            }
        },
        {
            path: '/login',
            name: 'login',
            component: () => import("./views/Login.vue")
        },
        {
            path: '/about',
            name: 'about',
            component: () => import("./views/About.vue")
        }
    ],
})
new_router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.auth)) {
        if (store.state.token == null) {
            next({
                path: '/login',
                params: {nextUrl: to.fullPath}
            })
        } else {
            if (to.matched.some(record => record.meta.is_admin)) {
                if (store.state.user.is_admin) {
                    next()
                } else {
                    next({name: 'login'})
                }
            } else {
                next()
            }
        }
    } else {
        next()
    }
})
export default new_router