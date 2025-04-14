<template>
  <v-container>
    <v-card>
      <v-toolbar density="compact">
        <v-spacer/>
        <v-toolbar-items>
          <v-btn prepend-icon="mdi-user" @click="newUser">New user</v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-data-table
          :headers="table"
          density="compact" :items="users">

        <template v-slot:item.actions="{ item }">
          <v-btn :disabled="item.email === 'admin'" icon="mdi-pencil" size="small" class="me-2" @click="editUser(item)"
                 variant="plain"/>

          <v-btn :disabled="item.email === 'admin'" :icon="item.enabled ? 'mdi-delete' : 'mdi-check'" size="small"
                 @click="switchAccess(item._id, item.enabled)"
                 variant="plain"/>
        </template>
      </v-data-table>
    </v-card>
    <v-dialog
        v-model="dialog"
        max-width="500px"
        :close-on-back="false"
        :close-on-content-click="false"
    >
      <v-card>
        <v-card-title>User editor</v-card-title>
        <v-card-text>
          <v-form
              id="user-form" v-model="isValid" fast-fail>
            <v-text-field
                :rules="fieldRequired" label="Name" v-model="user.name"></v-text-field>
            <v-text-field
                :rules="fieldRequired" label="Username" v-model="user.email"></v-text-field>
            <v-text-field
                :rules="fieldRequired" label="Password" type="password" v-model="user.password"></v-text-field>
            <!--            <v-checkbox v-model="user.is_admin" label="Is user admin?"></v-checkbox>-->
            <span class="title">User permissions</span>
            <div class="chip-group">
              <!--      <v-chip-group multiple column>-->
              <v-checkbox-btn v-model="user.manages_apps" label="Manage apps"></v-checkbox-btn>
              <v-checkbox-btn v-model="user.manages_users" label="Manage users"></v-checkbox-btn>
              <v-checkbox-btn v-model="user.manages_tasks" label="Manage tasks"></v-checkbox-btn>
              <v-checkbox-btn v-model="user.manages_projects" label="Manage projects"></v-checkbox-btn>
              <v-checkbox-btn v-model="user.can_export" label="Can export annotations"></v-checkbox-btn>
              <v-checkbox-btn v-model="user.access_overview" label="Access overview"></v-checkbox-btn>
            </div>
            <!--    </v-chip-group>-->
          </v-form>
          <!--          <user-editor ref="userEditor" v-show="tab === 'users'" @done="done" @edit="edit" :editing="editingData"/>-->
        </v-card-text>
        <!--      <question-editor ref="questionEditor" v-show="tab === 'questions'" />-->
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="dialog=false" :disabled="isLoading"
                 :loading="isLoading">
            Cancel
          </v-btn>
          <v-btn :text="'_id' in user ? 'Update user' : 'Create user'"
                 @click="submit" :disabled="isLoading || !isValid"
                 :loading="isLoading"/>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup lang="ts">
const {$axios} = useNuxtApp()
import Swal from "sweetalert2"

const store = useAuthStore()
const isLoading = ref(false)
const users = ref([])
const isValid = ref(false)
const dialog = ref(false)
const user = ref({
  _id: null,
  name: '',
  email: '',
  password: '',
  manages_apps: false,
  manages_users: false,
  manages_tasks: false,
  manages_projects: false,
  can_export: false,
  access_overview: false,
})


const fieldRequired = [
  value => {
    if (value !== '') {
      return true
    } else {
      return "Field required"
    }
  }
]
const table = [
  {title: 'Name', value: 'name'},
  {title: 'E-mail', value: 'email'},
  {title: 'Actions', key: 'actions', sortable: false},
]
const isAdmin = computed(() => {
  return store.user.email === 'admin'
})

function newUser() {
  user.value = {
    _id: null,
    name: '',
    email: '',
    password: '',
    manages_apps: false,
    manages_users: false,
    manages_tasks: false,
    manages_projects: false,
    can_export: false,
    access_overview: false,
  }
  dialog.value = true
}

function editUser(item: object) {
  user.value = item
  dialog.value = true
}

function loadUsers() {
  $axios.get('/user/list')
      .then((response) => {
        users.value = response.data
      })
      .catch(error => {
        Swal.fire({
          icon: 'error',
          title: 'Oops, something went wrong',
          text: 'Reload the page and try again. If the problem persist, contact administrator'
        })
      })
}

function switchAccess(userId: string, isEnabled: boolean) {
  Swal.fire({
    title: isEnabled ? "Delete user" : 'Enable user',
    text: "Are you sure you want to delete this user?",
    showCancelButton: true,
    confirmButtonText: isEnabled ? "Delete user" : "Enable user",
  }).then((willDelete) => {
        if (willDelete) {
          $axios.post("user/switch_access", {"_id": userId}).then((response) => {
            loadUsers()
          }).catch(error => {
            Swal.fire({
              icon: 'error',
              title: 'Oops, something went wrong'
            })
          })
        }
      }
  )
}

function submit() {
  if (!isValid.value) {
    return
  }
  if (user.value._id != null) {
    // update user profile information
    $axios.post('user/edit', user.value)
        .then((resp) => {
          loadUsers()
          dialog.value = false
        })
        .catch((err) => {
          Swal.fire({
            icon: 'error',
            title: 'Oops, something went wrong',
            text: 'Try again later',
          })
        });
  } else {
    // create new user profile
    $axios.post('user/new', user.value)
        .then((resp) => {
          loadUsers()
          dialog.value = false
        })
        .catch((err) => {
          Swal.fire({
            icon: 'error',
            title: 'Oops, something went wrong',
            text: 'Try again later',
          })
        });
  }
}

loadUsers()


definePageMeta({
  middleware: 'auth',
  name: "users",
  layout: "default"
})
</script>

<style scoped>

.swal2-container {
  z-index: 5000 !important;
}
</style>