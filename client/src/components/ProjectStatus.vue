<template>
  <v-card outlined>
    <v-card-text>
      <div>General progress</div>
      <p class="text-h4 text--primary">
        {{ status.general.completed }} of {{ status.general.total }} fully completed tasks.
      </p>
      <v-progress-linear class="mb-2" :height="20"
                         :value="(status.general.completed / status.general.total)*100"
                         :readonly="true"/>
      <p>There are {{ status.general.total }} unique annotation tasks in total, from which,
        {{ status.general.completed }}
        were completed by all the users assigned.</p>
      <v-divider/>
      <p class="text-h6 text--primary mt-2">
        {{ status.user.completed }} of {{ status.user.total }} user tasks completed.
      </p>
      <v-progress-linear class="mb-2" :height="14" :value="(status.user.completed / status.user.total)*100"
                         :readonly="true"/>
      <p>The {{ status.general.total }} unique tasks were assigned to
        {{ status.individual.length }} users, for a total of
        {{ status.user.total }} individual user tasks.
        A total of {{ status.user.completed }} tasks assigned to users
        were completed.</p>
      <v-divider/>
      <div class="mt-3">
        <p v-for="individual in status.individual" :key="individual.name">
          <span style="font-weight: 500">{{ individual.name }}</span> has completed
          {{ individual.completed }} out of
          {{ individual.total }} tasks.
          <v-progress-linear :value="(individual.completed / individual.total)*100"
                             :readonly="true"/>
        </p>
      </div>
      <v-divider v-if="stats != null"/>
      <p class="text-h4 text--primary" v-if="stats != null">
        Annotation stats
      </p>
      <div class="link-container">
        <a :class="`link ${stat === 'area' ? 'selected' : ''}`" @click="switchMode('area', 'area_perc')">Area (all)</a>
        <a :class="`link ${stat === 'count' ? 'selected' : ''}`" @click="switchMode('count', 'count_perc')">Count
          (all)</a>
        <a :class="`link ${stat === 'desc' ? 'selected' : ''}`" @click="switchMode('desc', 'desc_perc')">Count
          (comments)</a>
        <a :class="`link ${stat === 'certain_area' ? 'selected' : ''}`"
           @click="switchMode('certain_area', 'certain_area_perc')">Area (not including comments)</a>
      </div>
      <div v-if="stats != null" v-for="item in Object.keys(stats)">
        <span>{{ item }} ({{ stats[item][stat] }})</span>
        <v-progress-linear :value="stats[item][statPerc]*100" :color="genColor(stats[item].color)" :readonly="true"/>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'ProjectStatus',
  data() {
    return {
      stat: 'count',
      statPerc: 'count'
    };
  },
  methods: {
    switchMode(stat, statPerc) {
      this.stat = stat;
      this.statPerc = statPerc;
    },

    genColor(rgb) {
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
  },
  props: ['status', 'stats'],
};
</script>

<style scoped>
.link {
  text-decoration: underline;
}

.link.selected {
  text-decoration: none;
  font-weight: bolder;
}

.link-container {
  display: inline-flex;
  justify-content: center;
  flex-wrap: wrap;
  column-gap: 10px;
}
</style>
