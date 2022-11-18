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
          <v-card-title style="user-select: none;">WSI Annotation Tool</v-card-title>
          <v-card-text>
            <!--            <v-form>-->
            <v-text-field v-model="login_info.username" label="Username"></v-text-field>
            <v-text-field v-model="login_info.password"
                          label="Password"
                          @keydown.enter.prevent="login"
                          type="password"></v-text-field>
            <!--            </v-form>-->
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="login" color="orange">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { POSITION } from 'vue-toastification';

export default {
  name: 'Login',
  data: () => ({
    login_info: {
      username: null,
      password: null,
    },
  }),
  methods: {
    login() {
      this.$post('/user/login', this.login_info)
        .then((resp) => {
          if (resp.token != null) {
            // Successfully login, we have a JWT token
            this.$store.commit('login', resp);
            this.$router.push('/tasks');
          }
        })
        .catch(() => {
          this.login_info.password = null;
          this.$toast.error('Failed to login, please check your login information and try again.', {
            timeout: 10000,
            position: POSITION.BOTTOM_CENTER,
          });
        });
    },
  },
};
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
