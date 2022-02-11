<template>
  <v-card class="mx-auto">
    <v-card-text>
      <div><slot></slot></div>
      <p class="text-h4 text--primary">
        {{status.total-status.done}} remaining! You completed
        {{status.done}} of {{status.total}}.
      </p>
      <p>
        <v-progress-linear readonly :value="progress"/>
      </p>
      <div v-if="!status.next.completed">
        <p>{{status.next.project.name}}</p>
        <div class="text--primary">
          Up next:<br>
          {{status.next.name}}
        </div>
      </div>
      <div class="text--primary" v-else>You have completed all the slides. You can continue to review them.
      </div>
    </v-card-text>
    <v-divider/>
    <v-card-actions>
      <v-btn block text color="orange accent-4"
             v-if="status.next != null"
             :disabled="status.next.completed"
             @click="startSession">
        Continue
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
    export default {
        name: "TaskStatusOverview",
        methods: {
            startSession() {
                this.$emit("start-session", this.status.next)
            }
        },
        computed: {
            progress: function () {
                return (this.status.done / this.status.total) * 100
            }
        },
        props: ["status"]
    }
</script>

<style scoped>

</style>