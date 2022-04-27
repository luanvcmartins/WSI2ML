<template>
  <v-card v-if="value != null" @click="peep" :id="`region-${value.id}`" min-width="200" outlined>
    <AnnotationIdleCard
        v-if="value.state === 'idle'"
        v-model="value"
        v-on:edit-annotation="editRegion"
        v-on:dismiss-annotation="dismissAnnotation"/>
    <AnnotationEditingCard
        v-else-if="value.state === 'editing'"
        v-model="value"
        v-on:cancel-edit="cancelEdit"
        v-on:annotation-update="updateRender"
        v-on:save-annotation="saveAnnotation"/>
    <AnnotationImportingCard
        v-else-if="value.state === 'importing'"
        v-model="value"
        v-on:dismiss-annotation="dismissAnnotation"
        v-on:annotation-update="updateRender"
        v-on:import-annotation="importAnnotation"/>
    <AnnotationFeedbackCard
        v-else-if="value.state === 'feedback'|| value.state === 'feedback-editing'"
        v-model="value"
        v-on:annotation-update="updateRender"
        v-on:annotation-feedback="annotationFeedback"/>
  </v-card>
</template>

<script>
import _ from 'lodash';
import { Annotation } from '@/SliceDrawer';
import AnnotationIdleCard from '@/components/AnnotationIdleCard';
import AnnotationEditingCard from '@/components/AnnotationEditingCard';
import AnnotationFeedbackCard from '@/components/AnnotationFeedbackCard';
import AnnotationImportingCard from '@/components/AnnotationImportingCard';

export default {
  name: 'AnnotationCard',
  components: {
    AnnotationFeedbackCard,
    AnnotationEditingCard,
    AnnotationImportingCard,
    AnnotationIdleCard,
  },
  computed: {
    task_type() {
      return this.$store.state.session.type;
    },
    project_labels() {
      const labels = {};
      const data = this.$store.state.session.task.project.labels;
      for (let i = 0; i < data.length; i += 1) {
        labels[data[i].id] = data[i];
      }
      return labels;
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        if (newValue == null) return;
        this.originalLabel = _.cloneDeep(newValue.label);
        if (newValue.currentlyImporting) {
          // If this annotation is imported, we immediately allow to update its label
          this.updating_label = true;
        }
      },
    },
    editing: {
      handler(newValue) {
        // if the editing value is null, then we know we can disable the label update
        if (newValue == null && this.value.currentlyImporting) {
          this.updating_label = false;
        }
      },
    },
  },
  data() {
    return {};
  },
  methods: {
    updateRender() {
      this.$emit('annotation-update');
    },
    peep() {
      this.$emit('annotation-peep', this.value);
    },
    undo() {
      if (this.drawing_swapped) {
        this.swapDrawings();
      }
      this.undoing_feedback = true;
    },

    annotationFeedback(feedback, annotation) {
      this.$emit('annotation-feedback', feedback, annotation);
    },

    swapDrawings() {
      if (!this.drawing_swapped) {
        this.originalRegion = this.value.geometry;
        this.value.geometry = this.value.feedback.geometry;
      } else {
        this.value.geometry = this.originalRegion;
      }
      this.drawing_swapped = !this.drawing_swapped;
      this.$emit('annotation-update');
    },
    genColor(color) {
      return `rgb(${color[0]},${color[1]},${color[2]})`;
    },
    feedbackWrongLabel() {
      this.undoing_feedback = false;
      this.$emit('annotation-feedback', 'wrong-label', this.value);
    },
    feedbackWrongRegion() {
      if (this.drawing_swapped) {
        // If the drawing was swapped, we swap them back
        this.value.geometry = this.originalRegion;
        this.drawing_swapped = false;
      }
      this.$emit('annotation-feedback', 'wrong-region', this.value);
      this.undoing_feedback = false;
    },
    feedbackCorrect() {
      this.$emit('annotation-feedback', 'correct', this.value);
      this.undoing_feedback = false;
    },

    editRegion(annotation) {
      this.updating_label = true;
      this.$emit('edit-annotation', annotation);
    },
    saveAnnotation(annotation) {
      this.updating_label = false;
      this.$emit('save-annotation', annotation);
    },
    cancelEdit() {
      this.updating_label = false;
      this.$emit('cancel-edit');
    },
    importAnnotation() {
      this.$emit('import-annotation', this.value);
    },
    dismissAnnotation() {
      this.updating_label = false;
      this.$emit('dismiss-annotation', this.value);
    },
  },
  props: {
    editing: { type: Boolean },
    value: { type: Annotation },
  },
};
</script>

<style scoped>
.importing-pending-warning {
  background-color: #ff6f00;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 12px;
}

.title-nowrap {
  display: block;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  white-space: nowrap;
}
</style>
