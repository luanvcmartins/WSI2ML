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
            {{ user_name }}
          </v-card-text>
        </v-card>
      </template>
      <v-list>
        <v-list-item @click="changePassword = true">
          <v-list-item-title>Change password</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="logout">
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!--    <v-spacer></v-spacer>-->
    <template v-slot:extension>
      <v-tabs align-with-title>
        <v-tab v-if="access_overview" to="/overview">
          <span style="font-weight: 300">Overview</span>
        </v-tab>
        <v-tab to="/tasks">Tasks</v-tab>
        <v-tab v-if="manage_apps" to="/apps">Apps</v-tab>
        <v-tab v-if="can_export" to="/export">Export</v-tab>
        <v-tab v-if="is_admin" to="/admin">Management</v-tab>
      </v-tabs>
    </template>
    <ChangePassword v-if="changePassword" v-model="changePassword"/>
  </v-app-bar>
</template>

<script>
import ChangePassword from '@/components/ChangePassword';

export default {
  name: 'AppBar',
  components: { ChangePassword },
  data() {
    return { changePassword: false };
  },
  computed: {
    is_admin() {
      const { user } = this.$store.state;
      return user.manages_apps || user.manages_users || user.manages_tasks || user.manages_projects;
    },
    can_export() {
      const { user } = this.$store.state;
      return user.can_export;
    },
    access_overview() {
      const { user } = this.$store.state;
      return user.access_overview;
    },
    manage_apps() {
      const { user } = this.$store.state;
      return user.manages_apps;
    },
    user_name() {
      return this.$store.state.user.name;
    },
  },
  methods: {
    logout() {
      this.$store.commit('logout');
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
.user-card {
  height: 100%;
  min-width: 200px;
}
</style>
