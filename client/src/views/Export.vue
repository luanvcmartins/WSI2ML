<!--suppress JSUnresolvedVariable -->
<template>
  <v-container grid-list-md>
    <v-row>
      <v-col v-for="item in projects" :key="item.id" cols="12" sm="12" md="6">
        <v-card>
          <v-card-title v-text="item.name"/>
          <v-card-text v-text="item.description"/>
          <v-divider/>
          <v-card-actions>
            <v-spacer/>
            <v-btn text block @click="showExporting(item)">Export annotations</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <export-task-annotation v-model="dialog" :project="selected_project"/>
  </v-container>
</template>

<script>
import ExportTaskAnnotation from '../components/ExportTaskAnnotation';

export default {
  name: 'Export',
  components: { ExportTaskAnnotation },
  watch: {
    selected_users: {
      deep: true,
      handler(new_selected_users) {
        // new_selected_users.forEach(item => )
      },
    },
  },
  data() {
    return {
      dialog: false,
      projects: [],
      selected_project: null,
      selected_users: {},
      selected_user_tasks: {},
      exporting: {},
      annotation_counts: {},
    };
  },
  methods: {
    load() {
      this.$get('export/list').then((res) => this.projects = res).catch((err) => alert(err));
    },
    showExporting(project) {
      this.selected_project = project;
      this.dialog = true;
    },
  },
  mounted() {
    this.load();
  },
};
</script>

<style scoped>
  .slide-list {
    height: 100px;
    overflow-y: auto;
  }
</style>
