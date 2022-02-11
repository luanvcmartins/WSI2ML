<template>
  <loading :is-loading="progress ==null">
    <v-container v-if="progress != null">
      <v-expansion-panels multiple>
        <v-expansion-panel v-for="project in progress" :key="project.id">
          <v-expansion-panel-header>
            <v-toolbar-title class="title">{{project.name}}</v-toolbar-title>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <project-status :status="project"/>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>
  </loading>
</template>

<script>
    import Loading from "../components/Loading";
    import ProjectStatus from "../components/ProjectStatus";

    export default {
        name: "TaskOverview",
        data: () => {
            return {
                progress: null,
            }
        },
        methods: {
            loadOverview: function () {
                this.$get("project/progress")
                    .then(res => this.progress = res)
                    .catch(err => alert(err))
            }
        },
        mounted() {
            this.loadOverview()
        },
        components: {ProjectStatus, Loading}
    }
</script>

<style scoped>

</style>