<template>
  <!--  <div v-if="tasks != null">-->
  <loading :is-loading="loading">
    <v-container grid-list-sm v-if="tasks != null">
      <v-row v-if="projects != null">
        <v-col>
          <v-card>
            <v-row class="ma-0 pa-0">
              <v-col sm="12">Project selection
              </v-col>
              <v-col md="12" class="ma-0 pa-0">
                <v-chip-group class="mr-2 ml-2" v-model="annotationProjectFilter">
                  <v-chip filter :value="null" color="orange">All projects
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
          </v-card>
        </v-col>
      </v-row>
      <v-scale-transition>
        <v-row v-if="tasks.annotation_status != null">
          <v-col md="6">
            <task-status-overview
                :status="tasks.annotation_status"
                v-on:start-session="startTask">
              Slide Annotation Progress
            </task-status-overview>
          </v-col>
          <v-col md="6">
            <task-status-overview
                :status="tasks.review_status"
                v-on:start-session="startTask">
              Annotation Revision Progress
            </task-status-overview>
          </v-col>
        </v-row>
      </v-scale-transition>
      <v-row>
        <v-col>
          <v-card v-if="tasks.annotations != null && tasks.annotations.length > 0" outlined>
            <v-card-title>
              <span class="text-h4 grey--text text--darken-2">
                Segmentation and annotation tasks
              </span>
            </v-card-title>
            <v-row>
              <v-col>
                <v-data-table
                    :headers="annotationHeaders"
                    :items="tasks.annotations"
                    :search="annotationTaskFilter"
                    :custom-filter="annotationTaskFiltering">

                  <template v-slot:top>
                    <v-row class="ma-0 pa-0">
                      <v-col md="10" class="ma-0 pa-0">
                        <v-text-field
                            v-model="annotationTaskFilter"
                            label="Search for slide's name"
                            class="mx-4"
                        ></v-text-field>
                      </v-col>
                      <v-col md="2" class="ma-0 pa-0">
                        <v-checkbox label="Show slide's filename" v-model="showFileNames"/>
                      </v-col>
                    </v-row>

                  </template>

                  <template v-slot:item.slides="{ item }">
                    <div v-if="!showFileNames">{{ item.slides.length }} slide(s) task</div>
                    <v-chip-group v-else column show-arrows>
                      <v-chip style="pointer-events: none;"
                              outlined :readonly="true"
                              v-for="slide in item.slides"
                              :key="slide.id">
                        {{ slide.name }}
                      </v-chip>
                    </v-chip-group>
                  </template>
                  <template v-slot:item.assigned="{ item }">
                    <v-chip-group active-class="primary--text" column show-arrows>
                      <v-chip
                          style="pointer-events: none;" :readonly="true"
                          v-for="user in item.assigned" dark
                          :key="user.id">
                        {{ user.name }}
                      </v-chip>
                    </v-chip-group>
                  </template>
                  <template v-slot:item.completed="{ item }">
                    <div style="display: inline;">
                      <v-simple-checkbox
                          :ripple="false"
                          style="display: inline-block;"
                          :value="item.completed"/>
                      <v-chip style="display: inline-block;" outlined color="red" v-if="!item.completed">
                        Remaining!
                      </v-chip>
                    </div>
                  </template>
                  <template v-slot:item.actions="{ item }">
                    <v-btn text
                           :color="item.completed ? 'primary' : 'orange accent-4'"
                           @click="startTask(item)">
                      Open image
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="tasks.review != null && tasks.review.length > 0">
        <v-col>
          <v-card outlined>
            <v-card-title>
              <span class="text-h4 grey--text text--darken-2">
                Annotation revision tasks
              </span>
            </v-card-title>
            <v-data-table
                :headers="review_headers"
                :items="tasks.review">
              <template v-slot:item.slides="{ item }">
                <div v-if="!showFileNames">{{ item.task.task.slides.length }} slide(s) task</div>
                <v-chip-group v-else column show-arrows>
                  <v-chip style="pointer-events: none;"
                          outlined :readonly="true"
                          :key="slide.id"
                          v-for="slide in item.task.task.slides">
                    {{ slide.name }}
                  </v-chip>
                </v-chip-group>
              </template>
              <template v-slot:item.revisions="{ item }">
                <v-chip-group column show-arrows>
                  <v-chip style="pointer-events: none;"
                          outlined :readonly="true"
                          :key="revision.id"
                          v-for="revision in item.revisions">
                    {{ revision.user != null ? revision.user.name : revision.app.name }}
                  </v-chip>
                </v-chip-group>
              </template>
              <template v-slot:item.assigned="{ item }">
                <v-chip-group active-class="primary--text" column show-arrows>
                  <v-chip style="pointer-events: none;" :readonly="true" v-for="user in item.assigned" dark
                          :key="user.id">
                    {{ user.name }}
                  </v-chip>
                </v-chip-group>
              </template>
              <template v-slot:item.completed="{ item }">
                <div style="display: inline;">
                  <v-simple-checkbox
                      :ripple="false"
                      style="display: inline-block;"
                      :value="item.completed"/>
                  <v-chip
                      style="display: inline-block;"
                      outlined
                      color="red"
                      v-if="!item.completed">
                    Remaining!
                  </v-chip>
                </div>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                    text
                    :color="item.completed ? 'primary' : 'orange accent-4'"
                    @click="startTask(item)">
                  Open Revision
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </loading>
  <!--  <div v-else>-->
  <!--    <v-progress-circular class="loading" size="52" :indeterminate="true"/>-->
  <!--  </div>-->
</template>

<script>
import TaskStatusOverview from '../components/TaskStatusOverview.vue';
import Loading from '../components/LoadingContent.vue';

export default {
  name: 'Tasks',
  components: {
    Loading,
    TaskStatusOverview,
  },
  computed: {
    projects() {
      if (this.tasks != null) {
        const items = {};
        for (const annotation in Object.values(this.tasks.annotations)) {
          const { project } = this.tasks.annotations[annotation];
          if (!(project.id in items)) {
            items[project.id] = {
              name: project.name,
              id: project.id,
            };
          }
        }
        return Object.values(items);
      }
      return [];
    },

    annotationHeaders() {
      return [
        {
          text: 'Slides',
          align: 'start',
          sortable: false,
          value: 'slides',
        },
        {
          text: 'Completed?',
          value: 'completed',
        },
        // {text: 'Slides', value: 'slides'},
        {
          text: 'Project',
          value: 'project.name',
          filter: (value) => {
            if (this.annotationProjectFilter == null
                || this.annotationProjectFilter === 0) {
              return true;
            }

            return value === this.annotationProjectFilter;
          },
        },
        // {text: 'Users', value: 'assigned'},
        {
          text: 'Actions',
          value: 'actions',
        },
      ];
    },
    review_headers() {
      return [
        {
          text: 'Slides associated',
          align: 'start',
          sortable: false,
          value: 'slides',
        },
        {
          text: 'Annotations by to review',
          align: 'start',
          sortable: false,
          value: 'revisions',
        },
        {
          text: 'Completed?',
          value: 'completed',
        },
        {
          text: 'Project',
          value: 'project.name',
          filter: (value) => {
            if (this.annotationProjectFilter == null
                || this.annotationProjectFilter === 0) {
              return true;
            }

            return value === this.annotationProjectFilter;
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
    loading: true,
    tasks: null,
    showFileNames: true,
    annotationTaskFilter: '',
    annotationProjectFilter: 0,
    task_types: [
      'Annotate images',
      'Review annotations',
    ],

  }),
  methods: {
    startTask(task) {
      this.$post('session/create', task)
        .then((resp) => {
          this.$store.commit('set_session', resp);
          this.$router.push(`/session/${resp.id}`);
        })
        .catch((err) => this.$toast.error(`Oops, something went wrong:\n${err.response.data.msg}`));
    },

    loadTasks() {
      this.loading = true;
      this.$get('task/list')
        .then((resp) => {
          this.tasks = resp;
          this.loading = false;
        })
        .catch((err) => {
          alert(err);
          this.loading = false;
        });
    },

    annotationTaskFiltering(value, search) {
      // const projectFilter =
      return value != null && search != null && Array.isArray(value)
          && value.some((slideName) => slideName.name.includes(search));
    },
  },
  mounted() {
    this.loadTasks();
  },
};
</script>

<style scoped>
</style>
