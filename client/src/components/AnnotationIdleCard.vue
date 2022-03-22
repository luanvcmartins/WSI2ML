<template>
  <div>
    <v-card-title class="title-nowrap">
      <v-avatar size="18" class="mr-2" :color="labelColor"/>
      <span>{{ cardTitle }}</span>
    </v-card-title>
    <v-card-text v-if="value.description != null">
      {{ value.description }}
    </v-card-text>
    <v-divider/>
    <v-card-actions>
      <v-spacer/>
      <v-btn text @click="dismissAnnotation">Remove</v-btn>
      <v-btn text @click="editRegion(value)">Edit</v-btn>
    </v-card-actions>
  </div>
</template>

<script>
import { Annotation } from '@/SliceDrawer';

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
    editRegion(region) {
      this.updating_label = true;
      this.$emit('edit-annotation', region);
    },
    dismissAnnotation() {
      this.updating_label = false;
      this.$emit('dismiss-annotation', this.value);
    },
  },
  props: { value: { type: Annotation } },
};
</script>

<style scoped>

</style>
