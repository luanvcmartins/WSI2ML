<template>
  <div>
    <span v-if="value.currentlyImporting" class="importing-pending-warning">
      Pending import

    </span>
    <v-card-title class="title-nowrap">
      <v-avatar size="18" class="mr-2" :color="genColor(value.label.color)"/>
      <v-text-field v-model="value.title" label="Annotation title"/>
    </v-card-title>
    <v-card-text @click.stop>
      <v-text-field v-model="value.description" label="Description"/>

      <v-chip-group v-model="selectedLabel" mandatory column @change="annotationUpdate">
        <v-chip :color="genColor(label.color)" outlined
                v-for="label in projectLabels" filter :value="label.id"
                :key="label.id">
          {{ label.name }}
        </v-chip>
      </v-chip-group>
    </v-card-text>
    <v-divider/>
    <v-card-actions>
      <v-btn icon @click="peep"><v-icon>mdi-eye</v-icon></v-btn>
      <v-spacer/>
      <v-btn text @click.prevent="dismissAnnotation">Dismiss</v-btn>
      <v-btn text @click.prevent="importAnnotation">Import</v-btn>
    </v-card-actions>
  </div>
</template>

<script>
import { Annotation } from '@/SliceDrawer';

export default {
  name: 'AnnotationIdleCard',
  watch: {
    'value.label': {
      immediate: true,
      handler(newValue) {
        this.selectedLabel = newValue.id;
      },
    },
    selectedLabel(newLabelId) {
      this.value.label = this.projectLabels[newLabelId];
      this.annotationUpdate();
    },
  },
  computed: {
    cardTitle() {
      if (this.value.title != null && this.value.title !== '') {
        return this.value.title;
      }
      return this.value.label.name;
    },
    projectLabels() {
      const labels = {};
      const data = this.$store.state.session.task.project.labels;
      for (let i = 0; i < data.length; i += 1) {
        labels[data[i].id] = data[i];
      }
      return labels;
    },
  },
  data() {
    return {
      selectedLabel: null,
    };
  },
  methods: {
    genColor(color) {
      return `rgb(${color[0]},${color[1]},${color[2]})`;
    },

    importAnnotation() {
      this.$emit('import-annotation', this.value);
    },
    dismissAnnotation() {
      this.$emit('dismiss-annotation', this.value);
    },
    annotationUpdate() {
      this.$nextTick(() => {
        this.$emit('annotation-update');
      });
    },
    peep() {
      this.$emit('peep', this.value);
    },
  },
  props: { value: { type: Annotation } },
};
</script>

<style scoped>

</style>
