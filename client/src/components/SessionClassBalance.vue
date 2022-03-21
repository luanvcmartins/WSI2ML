<template>
  <v-card>
    <v-card-title>Annotation stats</v-card-title>
    <v-card-text v-if="stats != null">
      <div class="link-container">
        <a :class="`link ${stat === 'count' ? 'selected' : ''}`" @click="switchMode('count', 'count_perc')">Count (all)</a>
        <a :class="`link ${stat === 'area' ? 'selected' : ''}`" @click="switchMode('area', 'area')">Area (all)</a>
        <a :class="`link ${stat === 'desc' ? 'selected' : ''}`" @click="switchMode('desc', 'desc_perc')">Count (comments)</a>
        <a :class="`link ${stat === 'certain_area' ? 'selected' : ''}`"
           @click="switchMode('certain_area', 'certain_area')">Area (not including comments)</a>
      </div>
      <div v-for="item in Object.keys(stats)">
        <span>{{ item }} ({{ stats[item][stat] }})</span>
        <v-progress-linear :value="stats[item][statPerc]*100" :color="genColor(stats[item].color)" :readonly="true"/>
      </div>
    </v-card-text>
    <v-card-text v-else>
      Stats currently unavailable.
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'SessionClassBalance',
  watch: {
    sessionId() {
      this.refresh();
    },
    slideId() {
      this.refresh();
    }
  },
  data() {
    return {
      stats: null,
      stat: 'count',
      statPerc: 'count_perc'
    };
  },
  methods: {
    genColor(color) {
      return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    },
    switchMode(stat, statPerc) {
      this.stat = stat;
      this.statPerc = statPerc;
    },
    refresh() {
      this.$post(`session/${this.sessionId}/${this.slideId}/class_balance`)
          .then(res => {
            this.stats = res;
          })
          .catch(err => alert(err));
    }
  },
  mounted() {
    this.refresh();
  },
  props: ['sessionId', 'slideId']
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
