import vuetify, {transformAssetUrls} from 'vite-plugin-vuetify'
import path  from 'path';


// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    ssr: false,
    target: 'static',

    devtools: {enabled: false},

    css: [
        'vuetify/lib/styles/main.sass',
        '@mdi/font/css/materialdesignicons.min.css',
    ],
    build: {
        transpile: ['vuetify'],
    },
    modules: [
        (_options, nuxt) => {
            nuxt.hooks.hook('vite:extendConfig', (config) => {
                // @ts-expect-error
                config.plugins.push(vuetify({autoImport: true}))
            })
        },
        '@pinia/nuxt',
    ],

    vite: {
        vue: {
            template: {
                transformAssetUrls,
            },
        },
    },

    runtimeConfig: {
        public: {
            BASE_URL: process.env.BASE_URL
        }
    },


    app: {
        pageTransition: {name: 'page', mode: 'out-in'},
        layoutTransition: {name: 'page', mode: 'out-in'}
    },

})
