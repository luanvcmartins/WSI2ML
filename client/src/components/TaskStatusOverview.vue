<template>
  <v-card class="mx-auto">
    <v-card-text>
      <div>
        <slot></slot>
      </div>
      <div v-if="status.next != null && !taskCompleted">
        <p class="text-h4 text--primary">
          {{ status.total - status.done }} remaining! You completed
          {{ status.done }} of {{ status.total }}.
        </p>
        <p>
          <v-progress-linear readonly :value="progress"/>
        </p>
        <div v-if="!taskCompleted">
          <p>{{ status.next.project.name }}</p>
          <div class="text--primary">
            Up next:<br>
            {{ status.next.name }}
          </div>
        </div>
        <div class="text--primary" v-else>You have completed all the slides. You can continue to review them.
        </div>
      </div>
      <div v-else>
        <p class="text-h4 text--primary">
          <v-icon class="mr-2" color="orange accent-4" size="42">mdi-check-all</v-icon>
          All tasks completed!
        </p>
        <div class="text--primary" v-if="status.total > 0">You completed {{ status.done }} of {{ status.total }} tasks.</div>
        <div class="text--primary" v-else>No tasks available yet</div>
      </div>
    </v-card-text>
    <v-divider/>
    <v-card-actions v-if="status.next != null">
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
  name: 'TaskStatusOverview',
  methods: {
    startSession() {
      this.$emit('start-session', this.status.next);
    },
  },
  computed: {
    progress() {
      return (this.status.done / this.status.total) * 100;
    },
    taskCompleted() {
      return this.status.done === this.status.total;
    },
  },
  props: ['status'],
};
</script>

<style scoped>

</style>
