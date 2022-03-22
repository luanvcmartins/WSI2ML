<template>
  <v-container class="fill-height pa-0" fluid>
    <v-row class="fill-height">
      <v-col class="hidden-sm-and-down" style="position: relative; background-color: #37474f" md="6" lg="8">
        <v-img>

        </v-img>
        <span class="funded">This software was funded by FAPESP grant ?/?</span>
      </v-col>
      <v-col class="fill-height text-xs-center" style="position: relative;" md="6" lg="4">
        <v-card class="centered-card">
          <v-card-title>Login</v-card-title>
          <v-card-text>
            <!--            <v-form>-->
            <v-text-field v-model="login_info.username" label="Username"></v-text-field>
            <v-text-field v-model="login_info.password" label="Password" @keydown.enter.prevent="login"
                          type="password"></v-text-field>
            <!--            </v-form>-->
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="login">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
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
        .catch((err) => {
          this.login_info.password = null;
          alert('Check login information and try again.');
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
