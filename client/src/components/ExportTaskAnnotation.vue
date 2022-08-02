<template>
  <v-dialog
      transition="dialog-bottom-transition"
      scrollable
      fullscreen
      hide-overlay
      v-model="dialog">
    <v-card tile v-if="project != null">
      <v-toolbar flat dark dense color="primary" extended
                 extension-height="180"

                 shrink-on-scroll>
        <v-btn icon dark @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title v-text="project.name"/>
        <template v-slot:extension>
          <div class="text-center full-width" style="width: 100%">
            <div class="ma-1 grey--text text--lighten-2 text-h4">Exporting annotations</div>

            <p>
              <v-menu v-if="annotators != null">
                <!--                  @click="selectAll"-->
                <template v-slot:activator="{ on, attrs }">
                  <v-btn rounded outlined
                         v-bind="attrs"
                         v-on="on"
                         class="ma-1"
                         :disabled="processing">
                    Select annotations by...
                  </v-btn>

                </template>
                <v-list>
                  <v-list-item @click="selectAll()">
                    <v-list-item-title>Everyone</v-list-item-title>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item
                      v-for="(name, index) in Object.keys(annotators)"
                      :key="index"
                      @click="selectAll(annotators[name])">
                    <v-list-item-title>{{ name }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <v-menu v-if="reviewers != null">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn rounded outlined
                         v-bind="attrs"
                         v-on="on"
                         class="ma-1"
                         :disabled="processing">
                    Filter revisions by...
                  </v-btn>

                </template>
                <v-list>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-simple-checkbox v-model="only_revised"/>
                    </v-list-item-icon>
                    <v-list-item-title>Only revised</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                      v-for="(name, index) in Object.keys(reviewers)"
                      :key="index"
                      @click="selectReviewer(reviewers[name])">
                    <v-list-item-title>{{ name }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </p>
            <div class="ma-1 grey--text text--lighten-1">
              Exporting {{ total_annotations }} annotations.
            </div>
            <div class="mt-1 mb-2">
              <p>
                <v-btn :disabled="total_annotations === 0 || processing" rounded
                       @click="exportAnnotations" outlined x-large
                       :loading="processing">
                  Export annotations
                </v-btn>
              </p>
            </div>
          </div>
        </template>
      </v-toolbar>
      <v-card-text>
        <v-container>
          <div class="d-flex flex-row align-content-start align-start flex-wrap">
            <v-card class="ma-2 flex-shrink-0 flex-grow-1" v-for="task in tasks" :key="task.id">
              <v-card-title v-text="task.name == null ? task.name : `${task.slides.length} slide(s) annotation task`"/>
              <v-chip-group class="pl-3 pr-3">
                <v-chip style="pointer-events: none;" :readonly="true"
                        outlined v-for="slide in task.slides"
                        v-text="slide.name" :key="slide.id"/>
              </v-chip-group>
              <v-card-text v-if="task.annotated.length === 0">
                This task has received no annotations yet.
              </v-card-text>
              <v-card-text v-else>
                <div class="text-body-1">Export annotations from:</div>
                <v-expansion-panels
                    v-model="annotated_selected[task.id]"
                    multiple hover accordion>
                  <v-expansion-panel
                      v-for="annotation in task.annotated"
                      :key="annotation.user_task_id"
                      v-on:change="panelChanged(annotation)">
                    <v-expansion-panel-header disable-icon-rotate>
                      <template v-slot:default="{ open }">
                        <v-row no-gutters>
                          <v-col cols="5">
                            <v-icon v-if="open">
                              mdi-check
                            </v-icon>
                            {{ annotation.user_name }}
                            (total annotations: {{ annotation.annotation_count }})
                          </v-col>
                          <v-col cols="7" class="text--secondary">
                            <v-fade-transition leave-absolute>
                              <span
                                  v-if="open">Exporting {{
                                  annotation_counts[annotation.user_task_id]
                                }} annotation(s)</span>
                              <span v-else>Currently not selected for exporting</span>
                            </v-fade-transition>
                          </v-col>
                        </v-row>
                      </template>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content class="expansion-panel-revision">
                      <div v-if="annotation.reviews != null && annotation.reviews.length > 0">
                        <p class="ma-0 text-muted">Include only annotations revised by:</p>
                        <v-chip-group
                            v-model="exporting[annotation.user_task_id]"
                            multiple
                            column>
                          <v-chip pill outlined filter
                                  @click.prevent="count"
                                  v-for="review in annotation.reviews" class="ma-1"
                                  :value="review.revision_user_task_id"
                                  :key="review.revision_user_task_id">
                            {{ review.revision_by_name }} ({{ review.revision_count }} annotations)
                          </v-chip>
                        </v-chip-group>
                      </div>
                      <div v-else>
                        <p class="ma-0 text-muted">Annotations not revised yet.</p>
                      </div>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
              <v-divider/>
              <v-card-actions v-if="task.exporting != null">
                <p class="ma-1 grey--text">
                  Exporting {{ task.exporting.count }} annotations from this task
                </p>
              </v-card-actions>
            </v-card>
          </div>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import _ from 'lodash';

export default {
  name: 'ExportTaskAnnotation',
  watch: {
    project: {
      immediate: true,
      handler() {
        this.load_tasks();
      },
    },
    value(newValue) {
      this.dialog = newValue;
    },
    only_revised() {
      this.count();
    },
  },
  data() {
    return {
      tasks: null,
      exporting: {},
      annotation_counts: {},
      dialog: false,
      only_revised: false,
      annotated_selected: {},
      processing: false,
    };
  },
  computed: {
    total_annotations() {
      if (!_.isEmpty(this.annotation_counts)) {
        return Object.values(this.annotation_counts)
          .reduce((previousValue, currentValue) => previousValue + currentValue);
      }
      return 0;
    },
    annotators() {
      const annotators = {};
      if (this.tasks != null) {
        this.tasks.forEach((task) => {
          task.annotated.forEach((annotator) => {
            if (!(annotator.user_name in annotators)) {
              annotators[annotator.user_name] = [];
            }
            annotators[annotator.user_name].push(annotator.user_task_id);
          });
        });
      }
      return annotators;
    },
    reviewers() {
      const reviewers = {};
      if (this.tasks != null) {
        this.tasks.forEach((task) => {
          task.annotated.forEach((annotator) => {
            if (annotator.reviews != null) {
              annotator.reviews.forEach((reviewer) => {
                if (!(reviewer.revision_by_name in reviewers)) {
                  reviewers[reviewer.revision_by_name] = [];
                }
                reviewers[reviewer.revision_by_name].push({
                  annotation: annotator.user_task_id,
                  revision: reviewer.revision_user_task_id,
                });
              });
            }
          });
        });
      }
      return reviewers;
    },
  },
  methods: {
    close() {
      this.$emit('input', false);
    },
    load_tasks() {
      if (this.project != null) {
        this.$get('export/list/by_task', { params: { project_id: this.project.id } })
          .then((res) => {
            this.tasks = res;
          })
          .catch((err) => alert(err));
      }
    },
    panelChanged(annotation) {
      if (annotation.user_task_id in this.exporting) {
        delete this.exporting[annotation.user_task_id];
        this.annotation_counts[annotation.user_task_id] = 0;
      } else {
        this.exporting[annotation.user_task_id] = [];
        if (!this.only_revised) {
          this.$set(this.annotation_counts, annotation.user_task_id, annotation.annotation_count);
        }
      }

      // If we don't have the reviews yet (only the first access), get the list of reviews
      if (annotation.reviews == null) {
        this.$get('export/review/by_task', { params: { user_task_id: annotation.user_task_id } })
          .then((res) => this.$set(annotation, 'reviews', res))
          .catch((err) => alert(err));
      }
    },
    selectAll(annotations = null) {
      this.tasks.forEach((task) => {
        let counter = 0;
        task.annotated.forEach((annotation) => {
          if (annotations == null || annotations.includes(annotation.user_task_id)) {
            if (!(annotation.user_task_id in this.exporting)) {
              this.panelChanged(annotation);
              if (!(task.id in this.annotated_selected)) {
                this.annotated_selected[task.id] = [];
              }
              this.annotated_selected[task.id].push(counter);
            }
          }
          counter += 1;
        });
      });
    },
    selectReviewer(reviews) {
      reviews.forEach((review) => {
        this.exporting[review.annotation].push(review.revision);
      });
      this.count();
    },
    exportAnnotations() {
      this.processing = true;
      this.$post(`export/by_task?only_revised=${this.only_revised}`, this.exporting)
        .then((res) => {
          const taskId = res.task_id;
          console.log(res);
          this.currentStatusChecker = setInterval(() => {
            this.checkFileReady(taskId);
          }, 3000);
        })
        .catch((err) => alert(err));
    },
    checkFileReady(taskId) {
      this.$get(`export/by_task/${taskId}`)
        .then((resStatus) => {
          if (resStatus.status === 'done') {
            this.$get(`/export/download/${taskId}`, { responseType: 'blob' })
              .then((resFile) => {
                this.processing = false;
                clearInterval(this.currentStatusChecker);
                this.download(resFile);
              });
          }
        });
    },
    download(res) {
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${this.project.name}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    count() {
      setTimeout(() => {
        this.$post(`export/count?only_revised=${this.only_revised}`, this.exporting)
          .then((res) => {
            this.annotation_counts = res;
          })
          .catch((err) => alert(err));
      }, 1000);
    },
  },
  props: ['project', 'value'],
};
</script>

<style scoped>
.expansion-panel-revision {
  border: darkgrey 1px dotted;
  background-color: whitesmoke;
}
</style>
