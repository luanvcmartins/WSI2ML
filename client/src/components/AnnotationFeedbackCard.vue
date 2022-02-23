<template>
  <div>
    <v-card-title class="title-nowrap">
      <v-avatar size="18" class="mr-2" :color="genColor(value.label.color)"/>
      <span>{{ cardTitle }}</span>
    </v-card-title>
    <v-card-text v-if="updatingLabel" @click.stop>
      <v-chip-group v-model="feedbackLabelId" mandatory column>
        <v-chip :color="genColor(label.color)" outlined
                v-for="label in projectLabels" filter :value="label.id"
                :key="label.id">
          {{ label.name }}
        </v-chip>
      </v-chip-group>
    </v-card-text>
    <v-card-text v-if="value.feedback.id != null">
      <div v-if="value.feedback.feedback === 0">
        <v-icon>mdi-check</v-icon>
        Correct annotation
      </div>
      <div v-else>
        <p class="ma-0">
          {{ feedback[value.feedback.feedback] }}
        </p>
        <p class="ma-0">Correct label:
          <v-avatar size="16" class="ml-2 mr-1"
                    :color="genColor(feedbackLabel.color)"/>
          {{ feedbackLabel.name }}
        </p>
        <p class="ma-0" v-if="value.feedback.geometry != null">
          <v-checkbox v-model="value.drawFeedback" class="ma-0" label="Show geometry correction"
                      @change="annotationUpdate" hide-details/>
        </p>
      </div>
    </v-card-text>
    <!--    <v-card-text v-if="value.description != null && !updatingLabel">-->
    <!--      {{ value.description }}-->
    <!--    </v-card-text>-->
    <v-divider/>
    <v-card-actions>
      <v-spacer/>
      <div v-if="updatingLabel">
        <v-btn text @click="cancelEdit">Cancel</v-btn>
        <v-btn text @click="saveFeedback">Save</v-btn>
      </div>
      <div v-else-if="value.feedback.id == null || undoing">
        <v-menu>
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on">Incorrect</v-btn>
          </template>
          <v-list>
            <v-list-item v-for="(item, index) in incorrectOptions" :key="index" @click="item.func">
              <v-list-item-title>{{ item.text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn text @click="feedbackCorrect">Correct</v-btn>
      </div>
      <div v-else-if="value.feedback.id != null">
        <v-btn text @click="undoing = true">Undo</v-btn>
      </div>
    </v-card-actions>
  </div>
</template>

<script>
import { Annotation } from '@/SliceDrawer';

export default {
  name: 'AnnotationFeedbackCard',
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        if (newValue.feedback.label_id != null) {
          this.feedbackLabelId = newValue.feedback.label_id;
        } else {
          this.feedbackLabelId = newValue.label.id;
        }
      },

    },
    'value.state': function (newState, oldState) {
      if (oldState === 'feedback-editing' && newState === 'feedback') {
        this.updatingLabel = false;
      }
    },
    'value.feedback.label_id': function () {
      this.annotationUpdate();
    },
    feedbackLabelId(newFeedbackLabelId) {
      this.value.feedback.label_id = newFeedbackLabelId;
      this.annotationUpdate();
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
    },
    feedbackLabel() {
      if (this.value.feedback != null && this.value.feedback.label_id != null) {
        return this.projectLabels[this.value.feedback.label_id];
      }
      return this.projectLabels[this.value.label.id];
    },
  },
  data() {
    return {
      incorrectOptions: [
        {
          text: 'Wrong label',
          func: this.feedbackWrongLabel,
        },
        {
          text: 'Wrong region',
          func: this.feedbackWrongRegion,
        },
      ],
      feedbackLabelId: null,
      updatingLabel: false,
      currentFeedback: null,
      undoing: false,
      feedback: [
        '✓ Correct',
        '✗ Wrong label',
        '✗ Wrong region',
      ],
    };
  },
  methods: {
    genColor(color) {
      return `rgb(${color[0]},${color[1]},${color[2]})`;
    },
    annotationUpdate() {
      this.$nextTick(() => {
        this.$emit('annotation-update');
      });
    },
    editRegion(region) {
      this.updatingLabel = true;
      this.$emit('edit-region', region);
    },
    saveFeedback() {
      this.updatingLabel = false;
      if (this.currentFeedback === 'wrong-label') {
        this.value.feedback.feedback = 1;
      } else if (this.currentFeedback === 'wrong-region') {
        this.value.feedback.feedback = 2;
      }
      this.$emit('annotation-feedback', this.currentFeedback, this.value);
    },
    cancelEdit() {
      this.updatingLabel = false;
      this.$emit('cancel-edit');
    },
    dismissAnnotation() {
      this.$emit('dismiss-annotation', this.value);
    },

    feedbackWrongLabel() {
      if (this.updatingLabel === false) {
        this.undoing = false;
        this.currentFeedback = 'wrong-label';
        this.updatingLabel = true;
        this.value.feedback.feedback = 1;
      }
    },
    feedbackWrongRegion() {
      if (this.updatingLabel === false) {
        this.undoing = false;
        this.updatingLabel = true;
        this.currentFeedback = 'wrong-region';
        this.$emit('annotation-feedback', 'edit-region', this.value);
      }
    },
    feedbackCorrect() {
      this.undoing = false;
      this.$emit('annotation-feedback', 'correct', this.value);
    },
  },
  props: { value: { type: Annotation } }
};
</script>

<style scoped>

</style>
