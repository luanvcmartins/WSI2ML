<template>
  <v-container>
    <v-subheader>Segmentation and annotation tasks</v-subheader>
    <v-container grid-list-sm>
      <v-row>
        <v-col cols="12" sm="12" md="6" :key="task.id" v-for="(task, idx) in tasks.annotations">
          <v-card>
            <v-card-text>
              <div>{{task.project.name}}</div>
              <div v-if="task.name != null && task.name !== ''">
                <p class="text-h5 text--primary ma-0">
                  <v-icon v-if="task.completed">mdi-check</v-icon>
                  {{task.name}}
                </p>
                <p>{{task_types[task.type]}}</p>
              </div>
              <div v-else>
                <p class="text-h5 text--primary">
                  <v-icon v-if="task.completed">mdi-check</v-icon>
                  {{task_types[task.type]}}
                </p>
              </div>
              <div>
                <v-chip-group>
                  <v-chip style="pointer-events: none;" v-for="slide in task.slides">{{slide.name}}</v-chip>
                </v-chip-group>
              </div>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text block color="primary accent-3" @click="start_task(task)">
                Continue
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <v-subheader v-if="tasks.review != null && tasks.review.length > 0">Revisions</v-subheader>
    <v-container>
      <v-layout row wrap>
        <v-flex cols="12" sm="12" md="6" v-for="(task, idx) in tasks.review">
          <v-card class="ma-2">
            <v-card-text>
              <div>{{task.project.name}}</div>
              <div v-if="task.name != null && task.name !== ''">
                <p class="text-h5 text--primary ma-0">
                  <v-icon v-if="task.completed">mdi-check</v-icon>
                  {{task.name}}
                </p>
                <p>{{task_types[task.type]}}</p>
              </div>
              <div v-else>
                <p class="text-h5 text--primary">
                  <v-icon v-if="task.completed">mdi-check</v-icon>
                  {{task_types[task.type]}}
                </p>
              </div>
              <div>
                <v-chip-group>
                  <v-chip style="pointer-events: none;" v-for="slide in task.slides">{{slide.id}}</v-chip>
                </v-chip-group>
              </div>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text block color="primary accent-3" @click="start_task(task)">
                Continue
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-container>
</template>

<script>
    export default {
        name: "Tasks",
        data: () => {
            return {
                tasks: {},
                task_types: [
                    "Annotate images",
                    "Review annotations"
                ]
            }
        },
        methods: {
            start_task(task) {
                this.$post("session/create", task)
                    .then(resp => {
                        this.$store.commit("set_session", resp)
                        this.$router.push("/session/" + resp.id)
                    })
                    .catch(err => alert(err))
            },

            loadTasks() {
                this.$get("task/list")
                    .then(resp => this.tasks = resp)
                    .catch(err => alert(err))
            }
        },
        mounted() {
            this.loadTasks()
        }
    }
</script>

<style scoped>

</style>