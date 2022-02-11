<template>
  <!--  <div v-if="tasks != null">-->
  <loading :is-loading="loading">
    <v-container grid-list-sm v-if="tasks != null">
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
      <v-row v-if="tasks.annotations != null && tasks.annotations.length > 0">
        <v-subheader class="text-h4 mt-2">Segmentation and annotation tasks</v-subheader>
      </v-row>
      <v-row v-if="tasks.annotations != null && tasks.annotations.length > 0">
        <v-col>
          <v-data-table
                  :headers="annotation_headers"
                  :items="tasks.annotations">
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
            <template v-slot:item.completed="{ item }">
              <div style="display: inline;">
                <v-simple-checkbox :ripple="false" style="display: inline-block;" :value="item.completed"/>
                <v-chip style="display: inline-block;" outlined color="red" v-if="!item.completed">Remaining!</v-chip>
              </div>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn text :color="item.completed ? 'primary' : 'orange accent-4'" @click="startTask(item)">Open image
              </v-btn>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
      <v-row v-if="tasks.review != null && tasks.review.length > 0">
        <v-subheader class="text-h4 mt-2">Annotation revision tasks</v-subheader>
      </v-row>
      <v-row v-if="tasks.review != null && tasks.review.length > 0">
        <v-col>
          <v-data-table
                  :headers="review_headers"
                  :items="tasks.review">
            <template v-slot:item.slides="{ item }">
              <v-chip-group column show-arrows>
                <v-chip style="pointer-events: none;"
                        outlined :readonly="true"
                        v-for="slide in item.task.slides">
                  {{ slide.name }}
                </v-chip>
              </v-chip-group>
            </template>
            <template v-slot:item.revisions="{ item }">
              <v-chip-group column show-arrows>
                <v-chip style="pointer-events: none;"
                        outlined :readonly="true"
                        v-for="revision in item.revisions">
                  {{ revision.user.name }}
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
            <template v-slot:item.completed="{ item }">
              <div style="display: inline;">
                <v-simple-checkbox :ripple="false" style="display: inline-block;" :value="item.completed"/>
                <v-chip style="display: inline-block;" outlined color="red" v-if="!item.completed">Remaining!</v-chip>
              </div>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn text :color="item.completed ? 'primary' : 'orange accent-4'" @click="startTask(item)">Open
                Revision
              </v-btn>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
  </loading>
  <!--  <div v-else>-->
  <!--    <v-progress-circular class="loading" size="52" :indeterminate="true"/>-->
  <!--  </div>-->
</template>

<script>
    import TaskStatusOverview from "../components/TaskStatusOverview";
    import Loading from "../components/Loading";

    export default {
        name: "Tasks",
        components: {Loading, TaskStatusOverview},
        data: () => {
            return {
                loading: true,
                tasks: null,
                task_types: [
                    "Annotate images",
                    "Review annotations"
                ],
                annotation_headers: [
                    {
                        text: 'Slides',
                        align: 'start',
                        sortable: false,
                        value: 'slides',
                    },
                    {text: "Completed?", value: 'completed'},
                    // {text: 'Slides', value: 'slides'},
                    {text: 'Project', value: 'project.name'},
                    // {text: 'Users', value: 'assigned'},
                    {text: "Actions", value: 'actions'}
                ],
                review_headers: [
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
                    {text: "Completed?", value: 'completed'},
                    {text: 'Project', value: 'project.name'},
                    {text: "Actions", value: 'actions'}
                ]
            }
        },
        methods: {
            startTask(task) {
                this.$post("session/create", task)
                    .then(resp => {
                        this.$store.commit("set_session", resp)
                        this.$router.push("/session/" + resp.id)
                    })
                    .catch(err => alert(err))
            },

            loadTasks() {
                this.loading = true
                this.$get("task/list")
                    .then(resp => {
                        this.tasks = resp
                        this.loading = false
                    })
                    .catch(err => {
                        alert(err)
                        this.loading = false
                    })
            }
        },
        mounted() {
            this.loadTasks()
        }
    }
</script>

<style scoped>
</style>