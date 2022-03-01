<template>
  <div>
    <v-card-title class="title-nowrap">
      <v-avatar size="18" class="mr-2" :color="genColor(value.label.color)"/>
      <v-text-field v-model="value.title" label="Annotation title"/>
    </v-card-title>
    <v-card-text @click.stop>
      <v-text-field v-model="value.description" label="Description"/>
      <v-chip-group v-model="selectedLabel" mandatory column>
        <v-chip :color="genColor(label.color)" outlined
                v-for="label in projectLabels" filter :value="label"
                :key="label.id">
          {{ label.name }}
        </v-chip>
      </v-chip-group>
    </v-card-text>
    <v-divider/>
    <v-card-actions>
      <v-spacer/>
      <v-btn text @click="cancelEdit">Cancel</v-btn>
      <v-btn text @click="saveRegion">Save</v-btn>
    </v-card-actions>
  </div>
</template>

<script>
import { Annotation } from '@/SliceDrawer';

export default {
  name: 'AnnotationEditingCard',
  watch: {
    'value.label': {
      immediate: true,
      handler(newValue) {
        this.selectedLabel = newValue;
      }
    },
    selectedLabel(newValue) {
      this.value.label = newValue;
      this.updateRender();
    }
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
    }
  },
  data() {
    return {
      selectedLabel: null
    };
  },
  methods: {
    genColor(color) {
      return `rgb(${color[0]},${color[1]},${color[2]})`;
    },
    editRegion() {
      this.$emit('edit-annotation', this.value);
    },
    saveRegion() {
      this.$emit('save-annotation', this.value);
    },
    cancelEdit() {
      this.$emit('cancel-edit');
    },
    dismissAnnotation() {
      this.$emit('dismiss-annotation', this.value);
    },

    updateRender() {
      this.$emit('annotation-update');
    },
  },
  mounted() {
  },
  props: { value: { type: Annotation } }
};
</script>

<style scoped>

</style>
