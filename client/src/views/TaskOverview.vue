<template>
  <loading :is-loading="progress ==null">
    <v-container v-if="progress != null">
      <v-expansion-panels multiple>
        <v-expansion-panel v-for="project in progress" :key="project.id" @change="panelChanged(project.id)">
          <v-expansion-panel-header>
            <v-toolbar-title class="title">{{ project.name }}</v-toolbar-title>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <project-status :status="project" :stats="stats[project.id]"/>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>
  </loading>
</template>

<script>
import Loading from '../components/LoadingContent';
import ProjectStatus from '../components/ProjectStatus';

export default {
  name: 'TaskOverview',
  data: () => ({
    progress: null,
    stats: {}
  }),
  methods: {
    loadOverview() {
      this.$get('project/progress')
          .then((res) => this.progress = res)
          .catch((err) => alert(err));
    },

    panelChanged(projectId) {
      if (!(projectId in this.stats)) {
        this.loadAnnotationStats(projectId);
      }
    },

    loadAnnotationStats(projectId) {
      this.$get(`project/${projectId}/annotation_stats`)
          .then(res => {
            this.$set(this.stats, projectId, res);
          })
          .catch(err => alert(err));
    }
  },
  mounted() {
    this.loadOverview();
  },
  components: {
    ProjectStatus,
    Loading
  },
};
</script>

<style scoped>

</style>
