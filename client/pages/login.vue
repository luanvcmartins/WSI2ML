<template>

  <v-container class="fill-height pa-0" fluid>
    <v-row class="fill-height">
      <v-col class="hidden-sm-and-down"
             style="position: relative; background-color: #37474f" md="6" lg="8">
        <v-img>

        </v-img>
        <span class="funded">This work was carried out at the Center for Artificial Intelligence (C4AI-USP), with support by the São Paulo Research Foundation (FAPESP grant #2019/07665-4 and #2020/15129-2) and by the IBM Corporation.</span>
      </v-col>
      <v-col class="fill-height text-xs-center" style="position: relative;" md="6" lg="4">
        <v-card class="centered-card">
          <v-card-title style="user-select: none;">WSI2ML</v-card-title>
          <v-card-text>
            <!--            <v-form>-->
            <v-text-field v-model="user.email" label="E-mail"></v-text-field>
            <v-text-field
                v-model="user.password"
                label="Password"
                @keydown.enter.prevent="login"
                type="password"></v-text-field>
            <!--            </v-form>-->
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="createAdmin">First access?</v-btn>
            <v-btn text @click="login" color="orange">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import Swal from 'sweetalert2'
const { $axios } = useNuxtApp()
const store = useAuthStore()
const router = useRouter()
const isLoading = ref(false)

const user = reactive({
  email: '',
  password: ''
})

function login() {
  if (user.email !== '' && user.password !== '') {
    isLoading.value = true
    $axios.post('user/login', user)
        .then(resp => {
          console.log(resp.data)
          store.token = resp.data.token
          store.user = resp.data.user

          if (store.token !== '') {
            $axios.defaults.headers.common = {
              'Authorization': `Bearer ${store.token}`
            }
            router.push("/")
          }
          isLoading.value = false
        }).catch(err => {
          console.log(err)
          isLoading.value = false
        })
  }
}

function createAdmin() {
  $axios.post('/user/create_admin').then((resp) => {
    Swal.fire({
      title: 'Admin created successfully!',
      icon: 'success',
      confirmButtonText: 'OK'
    });
  })
}

definePageMeta({
  name: 'login',
  layout: 'empty'
});
</script>

<style scoped>

.funded {
  position: absolute;
  bottom: 32px;
  left: 0;
  right: 0;
  width: 500px;
  margin: auto;
  user-select: none;
  color: grey;
  font-weight: lighter;
  font-size: 18px;
  text-align: center;
}

.centered-card {
  margin: 0;
  position: absolute;
  top: 50%;
  -ms-transform: translateY(-50%) translateX(-50%);
  transform: translateY(-50%) translateX(-50%); /*translateX(-50%);*/

  width: 400px;
  left: 50%;
  right: 50%;

}
</style>