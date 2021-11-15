<template>
  <v-container>
    <h4>Annotations</h4>
    <v-layout row wrap>
      <v-flex cols="12" sm="12" md="6" v-for="(task, idx) in tasks.annotations">
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
    <h4>Revisions</h4>
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