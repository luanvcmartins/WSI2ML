<template>
  <v-container fluid grid-list-md>
    <v-layout row wrap id="annotation-tab">
      <v-flex cols="12" sm="12" md="6"
              v-for="idx in maxPerPage"
              :key="idx">
        <AnnotationCard
            v-model="annotations[pageStart + idx]"
            v-on:save-annotation="saveAnnotation"
            v-on:edit-annotation="editRegion"
            v-on:cancel-edit="cancelEdit"
            v-on:annotation-feedback="annotationFeedback"
            v-on:import-annotation="importAnnotation"
            v-on:dismiss-annotation="dismissAnnotation"
            v-on:annotation-peep="annotationPeep"
            v-on:annotation-update="annotationUpdate"/>
      </v-flex>
      <v-flex>
        <v-pagination
            v-model="page"
            :length="10"
            :total-visible="3"
        ></v-pagination>
      </v-flex>
    </v-layout>

    <!--            <v-btn fab @click="stressTest"></v-btn>-->
  </v-container>
</template>

<script>

import AnnotationCard from './AnnotationCard.vue';

export default {
  name: 'AnnotationList',
  components: { AnnotationCard },
  computed: {
    annotations() {
      return this.value;
    },
    pageStart() {
      return this.page * this.maxPerPage;
    },
  },
  data() {
    return {
      page: 0,
      totalPages: 0,
      maxPerPage: 10,
    };
  },
  methods: {
    annotationUpdate() {
      this.$emit('annotation-update');
    },
    annotationPeep(annotation) {
      this.$emit('annotation-peep', annotation);
    },

    annotationFeedback(feedback, annotation) {
      this.$emit('annotation-feedback', feedback, annotation);
    },
    editRegion(annotation) {
      this.$emit('edit-annotation', annotation);
    },
    saveAnnotation(annotation) {
      this.$emit('save-annotation', annotation);
    },
    cancelEdit() {
      this.$emit('cancel-edit');
    },
    importAnnotation(annotation) {
      this.$emit('import-annotation', annotation);
    },
    dismissAnnotation(annotation) {
      this.$emit('dismiss-annotation', annotation);
    },
  },
  props: ['value'],
};
</script>

<style scoped>

</style>
