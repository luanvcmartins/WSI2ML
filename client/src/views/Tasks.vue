<template>
  <v-container>
    <v-layout row wrap>
      <v-flex cols="12" sm="12" md="6" v-for="(task, idx) in tasks">
        <v-card class="ma-2">
          <v-card-text>
            <div>{{task.project.name}}</div>
            <p class="text-h5 text--primary">
              {{task.name}}
            </p>
            <div>
              <v-chip-group>
                <v-chip  style="pointer-events: none;" v-for="slide in task.slides">{{slide.id}}</v-chip>
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
                tasks: []
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