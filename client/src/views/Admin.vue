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
              <v-data-table
                  :headers="tasksHeader"
                  :items="tasks[task_type]"
                  :items-per-page="5"
                  :search="taskFilter.name"
                  :custom-filter="annotationTaskFiltering">

                <template v-slot:top>
                  <v-row class="ma-0 pa-0">
                    <v-col md="4" class="ma-0 pa-0">
                      <v-text-field
                          v-model="taskFilter.name"
                          label="Search for slide's name"
                          class="mx-4"
                      ></v-text-field>
                    </v-col>
                    <v-col v-if="projects != null" md="8" class="ma-0">
                      <v-chip-group class="mr-2 ml-2" v-model="taskFilter.project">
                        <v-chip filter :value="null" color="orange">
                          All projects
                        </v-chip>
                        <v-chip
                            filter
                            v-for="project in projects"
                            :key="project.id"
                            :value="project.name">
                          {{ project.name }}
                        </v-chip>
                      </v-chip-group>
                    </v-col>
                  </v-row>
                  <v-row class="mt-0">
                    <v-col md="12" class="pt-0 pb-0">
                      <v-chip-group class="mr-2 ml-2 mb-2" v-model="taskFilter.user">
                        <v-chip filter :value="null" color="orange">
                          Anyone
                        </v-chip>
                        <v-chip
                            filter
                            v-for="user in users"
                            :key="user.id"
                            :value="user.name">
                          {{ user.name }}
                        </v-chip>
                      </v-chip-group>
                    </v-col>
                  </v-row>

                  <v-tabs v-model="task_type">
                    <v-tab>Annotations</v-tab>
                    <v-tab>Revisions</v-tab>
                  </v-tabs>
                </template>

                <template v-slot:item.slides="{ item }">
                  <v-chip-group column show-arrows>
                    <v-chip style="pointer-events: none;"
                            outlined :readonly="true"
                            v-for="slide in item.slides">
                      {{ slide.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.task="{ item }">
                  <v-chip-group column show-arrows>
                    <v-chip style="pointer-events: none;"
                            outlined :readonly="true"
                            v-for="slide in item.task.slides">
                      {{ slide.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.user_tasks="{ item }">
                  <v-chip-group column show-arrows>
                    <v-chip :readonly="true"
                            v-for="task in item.user_tasks"
                            :outlined="task.user == null"
                            color="primary"
                            @click="openTask(task)">
                      <v-icon v-if="task.completed">mdi-check</v-icon>
                      {{ task.user != null ? task.user.name : task.app.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.revisions="{ item }">
                  <v-chip-group active-class="primary--text" column show-arrows>
                    <v-chip :readonly="true"
                            v-for="user_task in item.revisions" dark
                            @click="openTask(user_task)">
                      {{ user_task.user != null ? user_task.user.name : user_task.app.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-icon small class="mr-2" @click="editTask(item)">mdi-pencil</v-icon>
                  <v-icon small @click="removeTask(item)" :disabled="item.completed">
                    mdi-delete
                  </v-icon>
                </template>
              </v-data-table>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="newTask">New task</v-btn>
                <v-btn text @click="newBatch">New batch</v-btn>
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
                  <v-icon small class="mr-2" @click="editUser(item)">
                    mdi-pencil
                  </v-icon>
                  <v-icon small @click="removeUser(item)">mdi-delete</v-icon>
                </template>
              </v-data-table>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="newUser">New user</v-btn>
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
                            :color="`rgb(${label.color[0]}, ${label.color[1]},${label.color[2]})`"
                            :readonly="true"
                            v-for="label in item.labels" dark>
                      {{ label.name }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon small class="mr-2" v-bind="attrs" v-on="on" @click="showLabelData(item)">
                        mdi-label
                      </v-icon>
                    </template>
                    <span>Copy label data to clipboard</span>
                  </v-tooltip>
                  <v-icon small class="mr-2" @click="editProject(item)">
                    mdi-pencil
                  </v-icon>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon small v-bind="attrs" v-on="on">mdi-delete</v-icon>
                    </template>
                    <span>Not implemented</span>
                  </v-tooltip>
                </template>
              </v-data-table>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="newProject">New project</v-btn>
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

import UserEditor from '../components/UserEditor.vue';
import ProjectEditor from '../components/ProjectEditor.vue';
import TaskEditor from '../components/TaskEditor.vue';
import TaskBatch from '../components/TaskBatch.vue';
import { showErrorModal } from '@/utils';

export default {
  name: 'Admin',
  components: {
    TaskBatch,
    TaskEditor,
    ProjectEditor,
    UserEditor,
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    tasksHeader() {
      return [
        {
          text: 'id',
          align: 'start',
          sortable: false,
          value: 'id',
        },
        {
          text: 'Slides',
          value: 'slides',
        },
        {
          text: 'Project',
          value: 'project.name',
          filter: (value) => {
            if (this.taskFilter.project == null
                || this.taskFilter.project === 0) {
              return true;
            }
            return value === this.taskFilter.project;
          },
        },
        {
          text: 'Annotators',
          value: 'user_tasks',
          filter: (value) => {
            if (this.taskFilter.user == null
                || this.taskFilter.user === 0) {
              return true;
            }
            // for (const userTask in Object.values(value)){
            //   if (userTask)
            // }
            return value.reduce(
              (acc, userTask) => {
                if (userTask.user != null) {
                  return acc || userTask.user.name === this.taskFilter.user;
                }
                return acc || false;
              },
              false,
            );
          },
        },
        {
          text: 'Actions',
          value: 'actions',
        },
      ];
    },
  },
  data: () => ({
    drawer: false,
    mode: 'user',
    is_editing: false,
    editing: null,
    users: [],
    projects: [],
    tasks: [],
    taskFilter: {
      name: '',
      project: null,
      user: null,
    },
    task_type: 'annotations',
    config: {
      task_headers: {
        1: [
          {
            text: 'id',
            align: 'start',
            sortable: false,
            value: 'id',
          },
          {
            text: 'Original task',
            value: 'task',
          },
          {
            text: 'To review',
            value: 'revisions',
          },
          {
            text: 'Users',
            value: 'usertasks',
          },
          {
            text: 'Actions',
            value: 'actions',
          },
        ],
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
      project_header: [
        {
          text: 'Project name',
          align: 'start',
          sortable: false,
          value: 'name',
        },
        {
          text: 'Description',
          value: 'description',
        },
        {
          text: 'Labels',
          value: 'labels',
        },
        {
          text: 'Actions',
          value: 'actions',
        },
      ],
    },
  }),
  methods: {
    done(which) {
      this.drawer = false;
      this.editing = null;
      switch (which) {
        case 'user':
          this.loadUsers();
          break;
        case 'project':
          this.loadProjects();
          break;
        case 'task':
          this.loadTasks();
          break;
        default:
          break;
      }
    },
    openTask(task) {
      this.$post('session/create', task)
        .then((resp) => {
          this.$store.commit('set_session', resp);
          this.$router.push(`/session/${resp.id}`);
        })
        .catch((err) => {
          this.$toast.error(`Oops, something went wrong:\n${err.response.data.msg}`);
          // showErrorModal(this, err);
        });
    },
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

    newBatch() {
      this.mode = 'batch';
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

    newProject() {
      this.editing = {
        name: '',
        description: '',
        folder: '',
        labels: [],
      };
      this.mode = 'project';
      this.drawer = true;
    },

    editProject(project) {
      this.is_editing = true;
      this.editing = project;
      this.mode = 'project';
      this.drawer = true;
    },

    showLabelData(item) {
      navigator.clipboard.writeText(
        JSON.stringify(item.labels),
      );
    },

    newTask() {
      this.editing = {
        name: '',
        type: 0,
        slides: [],
        assigned: [],
      };
      this.mode = 'task';
      this.drawer = true;
    },

    editTask(task) {
      this.is_editing = true;
      this.editing = task;
      this.mode = 'task';
      this.drawer = true;
    },

    removeTask(task) {
      if (confirm('Are you sure you want to remove this task? Annotations may be lost.')) {
        this.$post('task/remove', task)
          .then((resp) => {
            console.log(resp);
            this.loadTasks();
          })
          .catch((err) => {
            alert(err);
          });
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

    loadProjects() {
      if (this.user.manages_projects) {
        this.$get('project/list')
          .then((resp) => {
            console.log(resp);
            this.projects = resp;
          })
          .catch((err) => {
            alert(err);
          });
      }
    },

    loadTasks() {
      if (this.user.manages_tasks) {
        this.$get('task/management_list')
          .then((resp) => {
            this.tasks = resp;
          })
          .catch((err) => alert(err));
      }
    },

    annotationTaskFiltering(value, search) {
      return value != null && search != null && Array.isArray(value)
          && value.some((slideName) => slideName.name.includes(search));
    },
  },
  mounted() {
    this.loadUsers();
    this.loadProjects();
    this.loadTasks();
  },
};
</script>

<style scoped>

</style>
