<template>
  <loading-content :is-loading="isLoading">
    <v-container>
      <v-row>
        <v-col>
          <v-card>
            <v-toolbar dense outlined elevation="0" extended>
              <v-toolbar-title>
                App classification tasks
              </v-toolbar-title>
              <v-spacer/>
              <v-toolbar-items>
                <v-btn @click="newTask" text>Create task</v-btn>
              </v-toolbar-items>

              <template v-slot:extension>
                <v-tabs v-model="config.selected_tab">
                  <v-tab v-for="project in apps_tasks.projects" :key="project.id">
                    {{ project.name }}
                  </v-tab>
                </v-tabs>
              </template>
            </v-toolbar>


            <v-card-text v-if="apps_tasks.projects.length > 0">

              <v-data-table
                  :headers="config.app_task"
                  :items="apps_tasks.tasks[projectId]"
                  :items-per-page="10"
                  :expanded.sync="config.extended_tasks"
                  show-expand>


                <template v-slot:item.slides="{ item }">
                  <v-chip-group column show-arrows>
                    <v-chip style="pointer-events: none;"
                            outlined :readonly="true"
                            v-for="slide in item.slides">
                      {{ slide.name }}
                    </v-chip>
                  </v-chip-group>
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn rounded @click="newAppTask(item)" elevation="0" color="orange accent-4" dark>
                    <v-icon>mdi-plus</v-icon>
                    New app task
                  </v-btn>
                </template>

                <template v-slot:expanded-item="{ headers, item }">
                  <td :colspan="headers.length">
                    <v-row>
                      <v-chip-group>
                        <v-chip v-for="app_task in item.app_tasks" :key="app_task.user_task_id"
                                :color="!app_task.completed ? 'orange' : 'gray'"
                                @click="openSession(item, app_task)">
                          <v-icon left>
                            mdi-play
                          </v-icon>
                          {{ app_task.app_name }} ({{ app_task.created }})
                        </v-chip>
                      </v-chip-group>
                    </v-row>
                  </td>
                </template>

              </v-data-table>
            </v-card-text>
            <v-card-text v-else>
              No task registered yet.
            </v-card-text>
            <v-card-actions>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-card>
            <v-toolbar dense outlined elevation="0">
              <v-toolbar-title>Your apps</v-toolbar-title>
              <v-spacer/>
              <v-toolbar-items>

                <v-btn text @click="newApp">New app</v-btn>
              </v-toolbar-items>
            </v-toolbar>
            <v-card-text>
              <v-data-table
                  :headers="config.app_table_header"
                  :items="apps"
                  :items-per-page="5"
                  :expanded.sync="config.extended_apps">

                <template v-slot:item.actions="{ item }">
                  <v-btn rounded @click="newAppToken(item)" elevation="0" color="orange accent-4" dark>
                    <v-icon>mdi-plus</v-icon>
                    Access token
                  </v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-navigation-drawer v-if="drawer" v-model="drawer" app temporary stateless right width="500px">
        <v-toolbar>
          <v-toolbar-title>
            <v-icon @click="drawer = false" large class="mr-1">mdi-close</v-icon>
            Information editor
          </v-toolbar-title>
        </v-toolbar>
        <v-container>
          <app-editor v-if="mode==='app'" v-model="current" v-on:done="done"/>
          <task-editor v-else-if="mode==='task'" v-model="current" v-on:done="done"/>
          <app-task-editor v-else-if="mode==='app-task'" v-model="current" v-on:done="done"/>
        </v-container>
      </v-navigation-drawer>
      <v-dialog max-width="500" v-model="config.dialog">
        <v-card>
          <v-card-title>Temporary app token</v-card-title>
          <v-card-text>
            <v-textarea readonly v-model="config.dialog_token" label="App token"/>
          </v-card-text>
          <v-divider/>
          <v-card-actions>
            <v-spacer/>
            <v-btn @click="config.dialog=false" text>Continue</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </loading-content>
</template>

<script>
import LoadingContent from '@/components/LoadingContent';
import AppEditor from '@/components/AppEditor';
import TaskEditor from '@/components/TaskEditor';
import AppTaskEditor from '@/components/AppTaskEditor';

export default {
  name: 'Apps',
  computed: {
    projectId() {
      return this.apps_tasks.projects[this.config.selected_tab].id;
    },
  },
  data() {
    return {
      isLoading: true,
      mode: 'new-app',
      drawer: false,
      current: null,
      apps: null,
      apps_tasks: {
        projects: [],
        tasks: {},
      },
      config: {
        extended_tasks: [],
        extended_apps: [],
        selected_tab: 0,
        dialog: false,
        dialog_token: null,
        app_table_header: [
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
            text: 'Description',
            value: 'Description',
          },
          {
            text: 'Actions',
            value: 'actions',
          },
        ],
        app_task: [
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
            text: 'Slides',
            value: 'slides',
          },
          {
            text: 'Registered tasks',
            value: 'app_tasks',
          },
          {
            text: 'Actions',
            value: 'actions',
          },
        ],
      },
    };
  },
  methods: {
    openSession(task, appTask) {
      this.$post('session/create', appTask)
          .then((resp) => {
            this.$store.commit('set_session', resp);
            this.$router.push(`/session/${resp.id}`);
          })
          .catch((err) => alert(err));
    },
    newApp() {
      this.mode = 'app';
      this.current = {
        name: '',
        description: '',
      };
      this.drawer = true;
    },
    newTask() {
      this.mode = 'task';
      this.current = {
        name: '',
        type: 2,
        slides: [],
        assigned: [],
      };
      this.drawer = true;
    },
    newAppTask(task) {
      this.mode = 'app-task';
      this.current = task;
      this.drawer = true;
    },
    newAppToken(app) {
      this.$post('app/token', app)
          .then(res => {
            this.config.dialog_token = res.token;
            this.config.dialog = true;
          })
          .catch(err => alert(err));
    },
    loadApps() {
      this.isLoading = true;
      this.$get('app/list')
          .then((resp) => {
            this.apps = resp;
            this.isLoading = false;
          })
          .catch((err) => alert(err));
    },
    loadTasks() {
      this.isLoading = true;
      this.$get('task/app_task_list')
          .then((resp) => {
            this.apps_tasks = resp;
            if (resp.projects.length > 0) {
              this.config.project_id = resp.projects[0].id;
            }
            this.isLoading = false;
          })
          .catch((err) => alert(err));
    },
    done() {
      this.current = null;
      this.drawer = false;
      if (this.mode === 'app') {
        this.loadApps();
      } else if (this.mode === 'task' || this.mode === 'app-task') {
        this.loadTasks();
      }
      this.mode = '';
    },
  },
  mounted() {
    this.loadApps();
    this.loadTasks();
  },
  components: {
    AppTaskEditor,
    TaskEditor,
    AppEditor,
    LoadingContent,
  },
};
</script>

<style scoped>

</style>
