<template>
  <loading-content :is-loading="isLoading">
    <v-container>
      <v-row>
        <v-col>
          <v-card>
            <v-toolbar dark color="orange accent-4" dense outlined elevation="0">
              <v-toolbar-title>
                App classification tasks
              </v-toolbar-title>
              <v-spacer/>
              <v-toolbar-items>
                <v-btn @click="newApp" text>Create task</v-btn>
              </v-toolbar-items>
            </v-toolbar>
            <v-card-text v-if="apps_tasks.projects.length > 0">
              <v-data-table
                  v-if="config.task_id != null"
                  :headers="config.app_task"
                  :items="apps_tasks.tasks[config.task_id]"
                  :items-per-page="5">

              </v-data-table>
            </v-card-text>
            <v-card-text>
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
            <v-data-table
                :headers="config.app_table_header"
                :items="apps"
                :items-per-page="5">

            </v-data-table>
            <v-card-actions>
              <v-btn @click="newApp">New app</v-btn>
            </v-card-actions>
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
        </v-container>
      </v-navigation-drawer>
    </v-container>
  </loading-content>
</template>

<script>
import LoadingContent from '@/components/LoadingContent';
import AppEditor from '@/components/AppEditor';

export default {
  name: 'Apps',
  data() {
    return {
      isLoading: true,
      mode: 'new-app',
      drawer: false,
      current: null,
      apps: null,
      apps_tasks: {
        projects: [],
        tasks: {}
      },
      config: {
        task_id: null,
        app_table_header: [
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
            text: 'Description',
            value: 'Description'
          },
          {
            text: 'Actions',
            value: 'actions'
          }
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
            value: 'name'
          },
          {
            text: 'slides',
            value: 'Slides'
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
    newApp() {
      this.mode = 'app';
      this.current = {
        name: '',
        description: ''
      };
      this.drawer = true;
    },
    newAppTask() {

    },
    loadApps() {
      this.isLoading = true;
      this.$get('app/list')
          .then(resp => {
            this.apps = resp;
            this.isLoading = false;
          })
          .catch(err => alert(err));
    },
    loadTasks() {
      this.isLoading = true;
      this.$get('task/app_task_list')
          .then(resp => {
            this.apps_tasks = resp;
            if (resp.projects.length > 0) {
              this.config.app_task = resp.projects[0].id;
            }
            this.isLoading = false;
          })
          .catch(err => alert(err));
    },
    done() {
      this.current = null;
      this.drawer = false;
      if (this.mode === 'app') {
        this.loadApps();
      } else if (this.mode === 'task') {
        this.loadTasks();
      }
      this.mode = '';
    }
  },
  mounted() {
    this.loadApps();
    this.loadTasks();
  },
  components: {
    AppEditor,
    LoadingContent
  }
};
</script>

<style scoped>

</style>
