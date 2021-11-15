<template>
  <v-card :id="`region-${value.id}`" min-width="200" outlined>
    <v-card-title>
      <v-avatar size="16" class="mr-2"
                :color="genColor(value.label.color)"/>
      {{value.label.name}}
    </v-card-title>
    <v-card-text v-if="task_type === 1 && value.feedback.id != null">
      <div v-if="value.feedback.feedback === 0">
        <v-icon>mdi-check</v-icon>
        Correct annotation
      </div>
      <div v-else>
        <p class="ma-0">
          <v-icon>mdi-check</v-icon>
          {{feedback[value.feedback.feedback]}}
        </p>
        <p class="ma-0">Correct label:
          <v-avatar size="16" class="mr-2" :color="genColor(project_labels[value.feedback.label_id].color)"/>
          {{project_labels[value.feedback.label_id].name}}
        </p>
        <p class="ma-0" v-if="value.feedback.data != null && !undoing_feedback"><a @click="swapDrawings">Checkout
          {{drawing_swapped ? 'original' : 'expected'}} region</a></p>
      </div>
    </v-card-text>
    <v-divider/>
    <v-card-actions v-if="task_type === 0">
      <v-spacer/>
      <v-btn v-if="editing !== value" text @click="editRegion(value)">Edit</v-btn>
      <div v-else-if="editing === value">
        <v-btn text @click="cancelEdit">Cancel</v-btn>
        <v-btn text @click="saveRegion(value)">Save</v-btn>
      </div>
    </v-card-actions>
    <v-card-actions v-else-if="task_type === 1">
      <v-spacer/>
      <div v-if="(value.feedback.id == null && editing !== value) || undoing_feedback">
        <v-menu>
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on">Incorrect</v-btn>
          </template>
          <v-list>
            <v-list-item v-for="(item, index) in incorrect_options" :key="index" @click="item.func">
              <v-list-item-title>{{ item.text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn text @click="feedbackCorrect">Correct</v-btn>
      </div>
      <div v-else-if="editing === value">
        <v-btn text @click="cancelEdit">Cancel</v-btn>
        <v-btn text @click="saveRegion(value)">Save</v-btn>
      </div>
      <div v-else-if="value.feedback.id != null">
        <v-btn text @click="undo">Undo</v-btn>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script>
    import SliceDrawer from "../SliceDrawer";

    export default {
        name: "AnnotationCard",
        computed: {
            task_type: function () {
                return this.$store.state.session.type
            },
            project_labels: function () {
                const labels = {}
                const data = this.$store.state.session.task.project.labels
                for (let i = 0; i < data.length; i++) {
                    labels[data[i].id] = data[i]
                }
                return labels
            }
        },
        data() {
            return {
                drawing_swapped: false,
                originalRegion: null,
                undoing_feedback: false,
                incorrect_options: [
                    {text: "Wrong label", func: this.feedbackWrongLabel},
                    {text: "Wrong region", func: this.feedbackWrongRegion},
                ],
                feedback: [
                    "Correct",
                    "Wrong label",
                    "Wrong region"
                ]
            }
        },
        methods: {
            undo() {
                if (this.drawing_swapped) {
                    this.swapDrawings()
                }
                this.undoing_feedback = true
            },
            swapDrawings() {
                console.log("swaping")
                if (!this.drawing_swapped) {
                    this.originalRegion = this.value.data
                    this.value.data = this.value.feedback.data
                } else {
                    this.value.data = this.originalRegion
                }
                this.drawing_swapped = !this.drawing_swapped
                SliceDrawer.update()
            },
            genColor(color) {
                return `rgb(${color[0]},${color[1]},${color[2]})`
            },

            feedbackWrongLabel() {
                console.log("The label is wrong")
                this.undoing_feedback = false
                this.$emit("annotation-feedback", "wrong-label", this.value)
            },
            feedbackWrongRegion() {
                if (this.drawing_swapped) {
                    // If the drawing was swapped, we swap them back
                    this.value.data = this.originalRegion
                    this.drawing_swapped = false
                }
                this.$emit("annotation-feedback", "wrong-region", this.value)
                this.undoing_feedback = false
            },
            feedbackCorrect() {
                this.$emit("annotation-feedback", "correct", this.value)
                this.undoing_feedback = false
            },

            editRegion(region) {
                this.$emit("edit-region", region)
            },
            saveRegion(region) {
                this.$emit("save-region", region)
            },
            cancelEdit() {
                this.$emit("cancel-edit")
            }
        },
        props: ["editing", "value"]
    }
</script>

<style scoped>

</style>