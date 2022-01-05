<template>
  <v-app-bar app color="primary" dark>

    <v-toolbar-title>WSI Annotation Tool</v-toolbar-title>

    <v-spacer></v-spacer>

    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-card class="user-card"
                dark
                flat
                outlined
                color="primary lighten-1"
                v-bind="attrs"
                v-on="on">
          <v-card-text>
            <v-icon class="mr-1">mdi-dots-vertical-circle</v-icon>
            {{user_name}}
          </v-card-text>
        </v-card>
      </template>
      <v-list>
        <v-list-item @click="logout">
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!--    <v-spacer></v-spacer>-->
    <template v-slot:extension>
      <v-tabs align-with-title>
        <v-tab to="/tasks">Tasks</v-tab>
        <v-tab v-if="can_export" to="/export">Export</v-tab>
        <v-tab v-if="is_admin" to="/admin">Management</v-tab>
      </v-tabs>
    </template>
  </v-app-bar>
</template>

<script>
    export default {
        name: "AppBar",
        computed: {
            is_admin: function () {
                const user = this.$store.state.user
                return user.manages_apps || user.manages_users || user.manages_tasks || user.manages_projects
            },
            can_export: function(){
                const user = this.$store.state.user
                return user.can_export
            },
            user_name: function () {
                return this.$store.state.user.name
            }
        },
        methods: {
            logout: function () {
                this.$store.commit("logout")
                this.$router.push("/login")
            }
        }
    }
</script>

<style scoped>
  .user-card {
    height: 100%;
    min-width: 200px;
  }
</style>