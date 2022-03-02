<template>
  <v-container>
    <v-expansion-panels multiple>
      <v-row>
        <v-col sm="12" v-if="user.manages_tasks">
          <v-expansion-panel>
            <v-expansion-panel-header>
              <v-toolbar-title class="title">Tasks</v-toolbar-title>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-tabs v-model="task_type">
                <v-tab>Annotations</v-tab>
                <v-tab>Revisions</v-tab>
              </v-tabs>
              <v-data-table
                  :headers="config.task_headers[task_type]"
                  :items="tasks[task_type]"
                  :items-per-page="5">
                <template v-slot:item.slides="{ item }">
                  <v-chip-group column show-arrows>
                    <v-chip style="pointer-events: none;"
                            outlined :readonly="true"
                            v-for="slide in item.slides">
                      {{ slide.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.assigned="{ item }">
                  <v-chip-group active-class="primary--text" column show-arrows>
                    <v-chip style="pointer-events: none;" :readonly="true" v-for="user in item.assigned" dark>
                      {{ user.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.revisions="{ item }">
                  <v-chip-group active-class="primary--text" column show-arrows>
                    <v-chip style="pointer-events: none;" :readonly="true" v-for="user_task in item.revisions" dark>
                      {{ user_task.user.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-icon small class="mr-2" @click="edit_task(item)"> mdi-pencil</v-icon>
                  <v-icon small @click="remove_task(item)"> mdi-delete</v-icon>
                </template>
              </v-data-table>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="new_task">New task</v-btn>
                <v-btn text @click="new_batch">New batch</v-btn>
              </v-card-actions>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-col>
        <v-col sm="12" v-if="user.manages_users">
          <v-expansion-panel>
            <v-expansion-panel-header>
              <v-toolbar-title class="title">Users</v-toolbar-title>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-data-table
                  :headers="config.user_headers"
                  :items="users"
                  :items-per-page="5">
                <template v-slot:item.actions="{ item }">
                  <v-icon small class="mr-2" @click="edit_user(item)">
                    mdi-pencil
                  </v-icon>
                  <v-icon small @click="remove_user(item)">mdi-delete</v-icon>
                </template>
              </v-data-table>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="new_user">New user</v-btn>
              </v-card-actions>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-col>
        <v-col sm="12" v-if="user.manages_projects">
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
                  <v-chip-group show-arrows column>
                    <v-chip style="pointer-events: none;"
                            outlined
                            :color="`rgb(${label.color[0]}, ${label.color[1]},${label.color[2]})`" :readonly="true"
                            v-for="label in item.labels" dark>
                      {{ label.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-icon small class="mr-2" @click="edit_project(item)">
                    mdi-pencil
                  </v-icon>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon small v-bind="attrs" v-on="on" @click> mdi-delete</v-icon>
                    </template>
                    <span>Not implemented</span>
                  </v-tooltip>
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
    <v-navigation-drawer v-if="drawer" v-model="drawer" app temporary stateless right width="500px">
      <v-toolbar>
        <v-toolbar-title>
          <v-icon @click="drawer = false" large class="mr-1">mdi-close</v-icon>
          Information editor
        </v-toolbar-title>
      </v-toolbar>
      <v-container>
        <user-editor v-if="mode === 'user'" v-model="editing" v-on:done="done"/>
        <task-batch v-else-if="mode === 'batch'" v-model="editing" v-on:done="done"/>
        <project-editor v-else-if="mode === 'project'" v-model="editing" v-on:done="done"/>
        <task-editor v-else-if="mode === 'task'" v-model="editing" v-on:done="done"/>
      </v-container>
    </v-navigation-drawer>
  </v-container>
</template>

<script>

import UserEditor from '../components/UserEditor';
import ProjectEditor from '../components/ProjectEditor';
import TaskEditor from '../components/TaskEditor';
import TaskBatch from '../components/TaskBatch';

export default {
  name: 'Admin',
  components: {
    TaskBatch,
    TaskEditor,
    ProjectEditor,
    UserEditor
  },
  watch: {
    editing: function (new_value, old_value) {
      // if (old_value != null && old_value.id == null) {
      //     if (new_value != null && new_value.id != null && !this.is_editing) {
      //         if (this.mode === "user")
      //             this.users.push(new_value)
      //         else if (this.mode === "project")
      //             this.projects.push(new_value)
      //         else if (this.mode === "task")
      //             this.tasks.push(new_value)
      //         this.drawer = false
      //     }
      // this.drawer = false
      // }
    }
  },
  computed: {
    user: function () {
      return this.$store.state.user;
    }
  },
  data: () => {
    return {
      drawer: false,
      mode: 'user',
      is_editing: false,
      editing: null,
      users: [],
      projects: [],
      tasks: [],
      task_type: 'annotations',
      config: {
        task_headers: {
          0: [
            {
              text: 'id',
              align: 'start',
              sortable: false,
              value: 'id',
            },
            {
              text: 'Slides',
              value: 'slides'
            },
            {
              text: 'Project',
              value: 'project.name'
            },
            {
              text: 'Users',
              value: 'assigned'
            },
            {
              text: 'Actions',
              value: 'actions'
            }
          ],
          1: [
            {
              text: 'id',
              align: 'start',
              sortable: false,
              value: 'id',
            },
            {
              text: 'Project',
              value: 'project.name'
            },
            {
              text: 'To review',
              value: 'revisions'
            },
            {
              text: 'Users',
              value: 'assigned'
            },
            {
              text: 'Actions',
              value: 'actions'
            }
          ]
        },
        user_headers: [
          {
            text: 'id',
            align: 'start',
            sortable: false,
            value: 'id',
          },
          {
            text: 'Name',
            value: 'name'
          },
          {
            text: 'Username (login)',
            value: 'username'
          },
          {
            text: 'Is admin?',
            value: 'is_admin'
          },
          {
            text: 'Actions',
            value: 'actions'
          },
        ],
        project_header: [
          {
            text: 'Project name',
            align: 'start',
            sortable: false,
            value: 'name',
          },
          {
            text: 'Description',
            value: 'description'
          },
          {
            text: 'Labels',
            value: 'labels'
          },
          {
            text: 'Actions',
            value: 'actions'
          }
        ]
      }
    };
  },
  methods: {
    done(which) {
      this.drawer = false;
      this.editing = null;
      switch (which) {
        case 'user':
          this.load_users();
          break;
        case 'project':
          this.load_projects();
          break;
        case 'task':
          this.load_tasks();
          break;
      }
    },
    new_user() {
      this.editing = {
        username: '',
        is_admin: false,
        manages_apps: false,
        manages_users: false,
        manages_tasks: false,
        manages_projects: false
      };
      this.mode = 'user';
      this.drawer = true;
    },

    new_batch() {
      this.mode = 'batch';
      this.drawer = true;
    },

    edit_user(user) {
      this.is_editing = true;
      this.editing = user;
      this.mode = 'user';
      this.drawer = true;
    },

    remove_user(user) {
      if (confirm('Are sure you want to remove this user?')) {
        this.$get('user/remove?user_id=' + user.id)
            .then(res => {
              this.load_users();
            })
            .catch(err => alert(err));
      }
    },

    new_project() {
      this.editing = {
        name: '',
        description: '',
        folder: '',
        labels: []
      };
      this.mode = 'project';
      this.drawer = true;
    },

    edit_project(project) {
      this.is_editing = true;
      this.editing = project;
      this.mode = 'project';
      this.drawer = true;
    },

    new_task() {
      this.editing = {
        name: '',
        type: 0,
        slides: [],
        assigned: []
      };
      this.mode = 'task';
      this.drawer = true;
    },

    edit_task(task) {
      this.is_editing = true;
      this.editing = task;
      this.mode = 'task';
      this.drawer = true;
    },

    remove_task(task) {
      if (confirm('Are you sure you want to remove this task? Annotations may be lost.')) {
        this.$post('task/remove', task)
            .then(resp => {
              console.log(resp);
              this.load_tasks();
            })
            .catch(err => {
              alert(err);
            });
      }
    },

    load_users() {
      if (this.user.manages_users) {
        this.$get('user/list')
            .then(resp => {
              console.log(resp);
              this.users = resp;
            })
            .catch(err => {
              alert(err);
            });
      }
    },

    load_projects() {
      if (this.user.manages_projects) {
        this.$get('project/list')
            .then(resp => {
              console.log(resp);
              this.projects = resp;
            })
            .catch(err => {
              alert(err);
            });
      }
    },

    load_tasks() {
      if (this.user.manages_tasks) {
        this.$get('task/management_list')
            .then(resp => {
              console.log(resp);
              this.tasks = resp;
            })
            .catch(err => alert(err));
      }
    }
  },
  mounted() {
    // todo improve this to only load if the panel is opened
    this.load_users();
    this.load_projects();
    this.load_tasks()
  }
}
</script>

<style scoped>

</style>
