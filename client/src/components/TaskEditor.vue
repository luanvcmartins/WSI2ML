<template>
  <div>
    <!--  <v-form  v-if="task != null">-->
    <v-text-field label="Task name" v-model="task.name"/>
    <v-select label="Project" chips :items="projects" item-text="name" item-value="id" v-model="task.project_id"/>
    <v-select :label="`File to analyze ${current_folder != null ? `(from ${current_folder})` : '' }`"
              v-model="task.slides"
              :items="files" :readonly="task.project_id == null"
              item-text="id"
              multiple
              chips
              deletable-chips
              return-object/>
    <v-select label="Users assigned" chips multiple :items="users" item-text="username" v-model="task.assigned"
              return-object/>
    <v-btn  @click="save" outlined style="position: absolute; right:16px">Create task</v-btn>
    <!--    -->
    <!--  </v-form>-->

  </div>
</template>

<script>
    export default {
        name: "TaskEditor",
        watch: {
            value: {
                immediate: true,
                handler: function (new_value) {
                    this.task = new_value
                }
            },

            color_picked: function (new_value) {
                // this.editing_label.color = `${new_value.rgba.r};${new_value.rgba.g};${new_value.rgba.b}`
                this.editing_label.color = [new_value.rgba.r, new_value.rgba.g, new_value.rgba.b]
            },
            "task.project_id": function (new_value) {
                if (new_value != null)
                    this.load_files(new_value)
            }
        },
        computed: {
            current_folder: function () {
                if (this.task != null && this.task.project_id != null) {
                    const project_id = this.task.project_id
                    return this.projects.filter(item => item.id === project_id)[0].folder
                }
            }
        },
        data: () => {
            return {
                task: null,
                editing_label: null,
                new_label: null,
                users: [],
                projects: [],
                files: []
            }
        },
        methods: {
            load_users() {
                this.$get("user/list")
                    .then(resp => this.users = resp)
                    .catch(err => alert(err))
            },

            load_projects() {
                this.$get("project/list")
                    .then(resp => this.projects = resp)
                    .catch(err => alert(err))
            },

            save() {
                if (this.task.id == null) {
                    this.$post("task/new", this.task)
                        .then(resp => {
                            this.task = resp
                            this.$emit("input", this.task)
                        })
                        .catch(err => {
                            alert(err)
                        })
                }
            },
            load_files(project_id) {
                this.$get("task/files?project_id=" + project_id)
                    .then(resp => {
                        this.files = resp
                    })
                    .catch(err => {
                        alert(err)
                    })
            }
        },
        mounted() {
            this.load_users()
            this.load_projects()
        },
        props: ['value']
    }
</script>

<style scoped>
  .color-box {
    height: 30px;
    width: 60px;
    border: black 1px solid;
  }
</style>