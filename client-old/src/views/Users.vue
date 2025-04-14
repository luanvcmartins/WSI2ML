<template>
  <v-container>

    <v-data-table
        :headers="config.user_headers"
        :items="users"
        :items-per-page="5">
      <template v-slot:item.actions="{ item }">
        <v-icon small class="mr-2" @click="editUser(item)">
          mdi-pencil
        </v-icon>
        <v-icon small @click="removeUser(item)">mdi-delete</v-icon>
      </template>
    </v-data-table>
    <user-editor v-if="mode === 'user'" v-model="editing" v-on:done="done"/>
  </v-container>
</template>

<script>
import UserEditor from '@/components/UserEditor.vue';

export default {
  name: 'Users',
  components: { UserEditor },
  data() {
    return {
      user_headers: [
        {
          text: 'id',
          align: 'start',
          sortable: false,
          value: 'id',
        },
        {
          text: 'Name',
          value: 'name',
        },
        {
          text: 'Username (login)',
          value: 'username',
        },
        {
          text: 'Is admin?',
          value: 'is_admin',
        },
        {
          text: 'Actions',
          value: 'actions',
        },
      ],
    };
  },
  methods: {
    newUser() {
      this.editing = {
        username: '',
        is_admin: false,
        manages_apps: false,
        manages_users: false,
        manages_tasks: false,
        manages_projects: false,
        can_export: false,
        access_overview: false,
      };
      this.mode = 'user';
      this.drawer = true;
    },

    editUser(user) {
      this.is_editing = true;
      this.editing = user;
      this.mode = 'user';
      this.drawer = true;
    },

    removeUser(user) {
      if (confirm('Are sure you want to remove this user?')) {
        this.$get(`user/remove?user_id=${user.id}`)
          .then(() => {
            this.loadUsers();
          })
          .catch((err) => alert(err));
      }
    },

    loadUsers() {
      if (this.user.manages_users) {
        this.$get('user/list')
          .then((resp) => {
            console.log(resp);
            this.users = resp;
          })
          .catch((err) => {
            alert(err);
          });
      }
    },
  },
  mounted() {
    this.loadUsers();
  },
};
</script>

<style scoped>

</style>
