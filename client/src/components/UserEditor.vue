<template>
  <div>
    <!--  <v-form v-if="user != null">-->
    <v-text-field label="Name" v-model="user.name"></v-text-field>
    <v-text-field label="Username" v-model="user.username"></v-text-field>
    <v-text-field label="Password" type="password" v-model="user.password"></v-text-field>
    <v-checkbox v-model="user.is_admin" label="Is user admin?"></v-checkbox>

    <v-card-actions>
      <v-spacer></v-spacer>
    <v-btn @click="save" outlined>Save</v-btn>
    </v-card-actions>
    <!--  </v-form>-->
  </div>
</template>

<script>
    import _ from "lodash";

    export default {
        name: "UserEditor",
        watch: {
            value: {
                immediate: true,
                handler: function (new_value) {
                    this.user = _.cloneDeep(new_value)
                }
            },
            user: {
                deep: true,
                handler: function (new_value) {
                    this.$emit("input", new_value)
                }
            },
        },
        data: () => {
            return {user: null}
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

</style>