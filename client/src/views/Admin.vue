<template>
  <v-container>
    <v-expansion-panels multiple>
      <v-row>
        <v-col sm="12">
          <v-expansion-panel>
            <v-expansion-panel-header>
              <v-toolbar-title class="title">Tasks</v-toolbar-title>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-data-table
                      :headers="config.task_headers"
                      :items="tasks"
                      :items-per-page="5">
                 <template v-slot:item.slides="{ item }">
                  <v-chip-group >
                    <v-chip style="pointer-events: none;"
                            outlined :readonly="true"
                            v-for="slide in item.slides">
                      {{ slide.id }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.assigned="{ item }">
                  <v-chip-group active-class="primary--text">
                    <v-chip style="pointer-events: none;" :readonly="true" v-for="user in item.assigned" dark>
                      {{ user.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
              </v-data-table>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="new_task">New task</v-btn>
              </v-card-actions>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-col>
        <v-col sm="12">
          <v-expansion-panel>
            <v-expansion-panel-header>
              <v-toolbar-title class="title">Users</v-toolbar-title>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-data-table
                      :headers="config.user_headers"
                      :items="users"
                      :items-per-page="5"/>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="new_user">New user</v-btn>
              </v-card-actions>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-col>
        <v-col sm="12">
          <v-expansion-panel>
            <v-expansion-panel-header>
              <v-toolbar-title class="title">Projects</v-toolbar-title>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-data-table
                      :headers="config.project_header"
                      :items="projects"
                      :items-per-page="5">
                <template v-slot:item.labels="{ item }">
                  <v-chip-group>
                    <v-chip style="pointer-events: none;"
                            outlined
                            :color="`rgb(${label.color[0]}, ${label.color[1]},${label.color[2]})`" :readonly="true"
                            v-for="label in item.labels" dark>
                      {{ label.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
              </v-data-table>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="new_project">New project</v-btn>
              </v-card-actions>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-col>
      </v-row>
    </v-expansion-panels>
    <v-navigation-drawer v-model="drawer" app temporary right width="500px">
      <v-toolbar>
        <v-toolbar-title>Information editor</v-toolbar-title>
      </v-toolbar>
      <v-container>
        <user-editor v-if="mode === 'user'" v-model="editing"/>
        <project-editor v-else-if="mode === 'project'" v-model="editing"/>
        <task-editor v-else-if="mode === 'task'" v-model="editing"/>
      </v-container>
    </v-navigation-drawer>
  </v-container>
</template>

<script>

    import UserEditor from "../components/UserEditor";
    import ProjectEditor from "../components/ProjectEditor";
    import TaskEditor from "../components/TaskEditor";

    export default {
        name: "Admin",
        components: {TaskEditor, ProjectEditor, UserEditor},
        watch: {
            editing: function (new_value, old_value) {
                if (old_value != null && old_value.id == null) {
                    if (new_value != null && new_value.id != null) {
                        if (this.mode === "user")
                            this.users.push(new_value)
                        else if (this.mode === "project")
                            this.projects.push(new_value)
                        else if (this.mode === "task")
                            this.tasks.push(new_value)
                        this.drawer = false
                    }
                    // this.drawer = false
                }
            }
        },
        data: () => {
            return {
                drawer: false,
                mode: 'user',
                editing: {},
                users: [],
                projects: [],
                tasks: [],
                config: {
                    task_headers: [
                        {
                            text: 'id',
                            align: 'start',
                            sortable: false,
                            value: 'id',
                        },
                        {text: 'Slides', value: 'slides'},
                        {text: 'Project', value: 'project.name'},
                        {text: 'Users', value: 'assigned'}
                    ],
                    user_headers: [
                        {
                            text: 'id',
                            align: 'start',
                            sortable: false,
                            value: 'id',
                        },
                        {text: 'Name', value: 'name'},
                        {text: 'Username (login)', value: 'username'},
                        {text: 'Is admin?', value: 'is_admin'},
                    ],
                    project_header: [
                        {
                            text: 'Project name',
                            align: 'start',
                            sortable: false,
                            value: 'name',
                        },
                        {text: 'Description', value: 'description'},
                        {text: "Labels", value: 'labels'}
                    ]
                }
            }
        },
        methods: {
            new_user() {
                this.editing = {
                    username: "",
                    is_admin: false,
                }
                this.mode = "user"
                this.drawer = true
            },

            edit_user(id) {
                this.editing = this.users[id]
                this.mode = "user"
                this.drawer = true
            },

            new_project() {
                this.editing = {
                    name: "",
                    description: "",
                    folder: "",
                    labels: []
                }
                this.mode = "project"
                this.drawer = true
            },

            new_task() {
                this.editing = {
                    name: "",
                    slides: [],
                    assigned: []
                }
                this.mode = "task"
                this.drawer = true
            },

            load_users() {
                this.$get("user/list")
                    .then(resp => {
                        console.log(resp)
                        this.users = resp
                    })
                    .catch(err => {
                        alert(err)
                    })
            },

            load_projects() {
                this.$get("project/list")
                    .then(resp => {
                        console.log(resp)
                        this.projects = resp
                    })
                    .catch(err => {
                        alert(err)
                    })
            },

            load_tasks() {
                this.$get("task/list")
                    .then(resp => {
                        console.log(resp)
                        this.tasks = resp
                    })
                    .catch(err => alert(err))
            }
        },
        mounted() {
            // todo improve this to only load if the panel is opened
            this.load_users()
            this.load_projects()
            this.load_tasks()
        }
    }
</script>

<style scoped>

</style>