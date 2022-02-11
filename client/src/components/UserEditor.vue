<template>
  <div>
    <!--  <v-form v-if="user != null">-->
    <v-text-field label="Name" v-model="user.name"></v-text-field>
    <v-text-field label="Username" v-model="user.username"></v-text-field>
    <v-text-field label="Password" type="password" v-model="user.password"></v-text-field>
    <v-checkbox v-model="user.is_admin" label="Is user admin?"></v-checkbox>
    <span class="title">User permissions</span>
    <div class="chip-group">
      <!--      <v-chip-group multiple column>-->
      <v-check-chip v-model="user.manages_apps">Manage apps</v-check-chip>
      <v-check-chip v-model="user.manages_users">Manage users</v-check-chip>
      <v-check-chip v-model="user.manages_tasks">Manage tasks</v-check-chip>
      <v-check-chip v-model="user.manages_projects">Manage projects</v-check-chip>
      <v-check-chip v-model="user.can_export">Can export annotations</v-check-chip>
      <v-check-chip v-model="user.access_overview">Access overview</v-check-chip>
    </div>
    <!--    </v-chip-group>-->
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="save" outlined>Save</v-btn>
    </v-card-actions>
    <!--  </v-form>-->
  </div>
</template>

<script>
    import _ from "lodash";
    import VCheckChip from "./VCheckChip";

    export default {
        name: "UserEditor",
        components: {VCheckChip},
        watch: {
            value: {
                immediate: true,
                handler: function (new_value) {
                    this.user = _.cloneDeep(new_value)
                }
            },
        },
        data: () => {
            return {user: null, test: []}
        },
        methods: {
            save() {
                if (this.user.id != null) {
                    // update user profile information
                    this.$post("user/edit", this.user)
                        .then(resp => {
                            this.user = resp
                            this.$emit("input", this.user)
                            this.$emit("done", "user")
                        })
                        .catch(err => {
                            alert(err)
                        })
                } else {
                    // create new user profile
                    this.$post("user/new", this.user)
                        .then(resp => {
                            this.user = resp
                            this.$emit("input", this.user)
                            this.$emit("done", "user")
                        })
                        .catch(err => {
                            alert(err)
                        })
                }
            }
        },
        props: ["value"]
    }
</script>

<style scoped>
  .chip-group {
    white-space: normal;
    flex-wrap: wrap;
    max-width: 100%;
  }

  .chip-group * {
    margin: 2px;
  }
</style>