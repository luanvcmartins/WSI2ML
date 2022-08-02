<template>
  <div>
    <v-card-title class="title-nowrap">
      <v-avatar size="18" class="mr-2" :color="labelColor"/>
      <span>{{ cardTitle }}</span>
    </v-card-title>
    <v-card-text v-if="value.description != null">
      {{ value.description }}
    </v-card-text>
    <v-card-text v-else>
      <a href="javascript:void(0)" @click="editProperties">Edit properties</a>
    </v-card-text>
    <v-divider/>
    <v-card-actions>
      <v-btn icon @click="peep">
        <v-icon>mdi-eye</v-icon>
      </v-btn>
      <v-spacer/>
      <v-btn text @click="dismissAnnotation">Remove</v-btn>
      <v-btn text @click="editRegion(value)">Edit</v-btn>
    </v-card-actions>
  </div>
</template>

<script>
import { Annotation, EventManager } from '@/SliceDrawer';

export default {
  name: 'AnnotationIdleCard',
  computed: {
    cardTitle() {
      if (this.value.title != null && this.value.title !== '') {
        return this.value.title;
      }
      return this.value.label.name;
    },
    labelColor() {
      const { color } = this.value.label;
      return `rgb(${color[0]},${color[1]},${color[2]})`;
    },
  },
  methods: {
    editRegion(annotation) {
      this.updating_label = true;
      // this.$emit('edit-annotation', region);
      EventManager.getInstance()
        .editAnnotation(annotation);
    },
    dismissAnnotation() {
      this.updating_label = false;
      this.$emit('dismiss-annotation', this.value);
    },
    peep() {
      // this.$emit('peep', this.value);
      EventManager.getInstance()
        .peepAnnotation(this.value);
    },
    editProperties() {

    },
  },
  props: { value: { type: Annotation } },
};
</script>

<style scoped>

</style>
