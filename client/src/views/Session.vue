<template>
  <v-container style="overflow: hidden">
    <slice-viewer
        ref="slice_viewer"
        :drawer="!session.completed && task_type === 0 && taskBelongsToUser"
        :tile-sources="tile_sources"
        :labels="project_labels"
        :labels-visibility="labelsVisible"
        :drawing-style="drawingStyle"
        :draw-events="draw_events"
        :slide-properties="currentSlide.properties"
        v-model="annotations[currentSlide.id]"
        v-on:region-clicked="regionClicked"
        v-on:new-draw="onNewRegionDraw"
        v-on:edit-draw="onEditRegionDraw"/>
    <side-window>
      <v-toolbar dense fixed color="grey lighten-4">
        <v-toolbar-title>{{ task_type === 0 ? 'Annotation task' : 'Review task' }}</v-toolbar-title>
        <template v-slot:extension>
          <v-tabs v-model="selectedTab">
            <v-tab>View</v-tab>
            <v-tab v-if="annotationTabVisible">
              Annotations ({{ annotations[currentSlide.id].length }})
            </v-tab>
          </v-tabs>
        </template>
      </v-toolbar>

      <v-tabs-items v-model="selectedTab">
        <v-tab-item>
          <!-- Controls tab -->
          <v-container fluid grid-list-md>
            <v-layout row wrap>
              <v-flex v-if="task_type === 0" cols="12" sm="12" md="6">
                <session-class-balance
                    ref="classBalance"
                    :session-id="session_id"
                    :slide-id="currentSlide.id"/>
              </v-flex>
              <v-flex cols="12" sm="12" md="6">
                <v-card>
                  <v-card-title>Annotation visibility</v-card-title>
                  <div class="pl-3 pr-3 pb-3" style="max-height: 200px; overflow-y: auto">

                    <v-switch
                        class="mt-0"
                        hide-details dense
                        v-for="label in project_labels"
                        :key="label.id"
                        v-model="labelsVisible[label.name]"
                        :label="label.name"
                        :color="genColor(label.color)"/>
                    <v-switch
                        class="mt-0"
                        hide-details dense
                        label="Show importing"
                        v-model="drawingStyle[0].showImporting"
                    />
                  </div>
                  <div style="text-align: center;">
                    <a href="javascript:void(0)"
                       class="link-btn"
                       @click="labelAnnotationsVisibility(true)">
                      Select all
                    </a> |
                    <a href="javascript:void(0)"
                       class="link-btn"
                       @click="labelAnnotationsVisibility(false)">
                      Unselect all
                    </a>
                  </div>
                  <v-divider></v-divider>
                  <div class="flex-container">
                    <v-slider hide-details class="pl-2 pr-2"
                              style="width: 50%"
                              prepend-icon="mdi-circle-opacity"
                              v-model="drawingStyle[0].fillOpacity"
                              step="0"
                              thumb-label
                              min="0.0" max="1">
                      <template v-slot:thumb-label="{ value }">
                        {{ value.toFixed(2) }}
                      </template>
                    </v-slider>
                    <v-slider hide-details class="pl-2 pr-2"
                              style="width: 50%"
                              prepend-icon="mdi-gesture-tap"
                              v-model="drawingStyle[0].hoverOpacity"
                              step="0"
                              thumb-label
                              min="0.0" max="1">
                      <template v-slot:thumb-label="{ value }">
                        {{ value.toFixed(2) }}
                      </template>
                    </v-slider>
                    <div class="break"/>
                    <v-slider hide-details class="pl-2 pr-2"
                              style="width: 50%"
                              prepend-icon="mdi-format-line-weight"
                              v-model="drawingStyle[0].lineWidth"
                              step="1"
                              thumb-label
                              min="1" max="10">
                      <template v-slot:thumb-label="{ value }">
                        {{ value.toFixed(2) }}
                      </template>
                    </v-slider>
                    <v-switch
                        style="width: 50%; margin:0;"
                        hide-details
                        v-model="highlightOnTab" label="Highlight"/>
                  </div>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6">
                <v-card>
                  <div class="pa-3 pb-0 text-h6 text--primary">Task slides</div>
                  <div class="pl-3 pr-3 text-center font-weight-thin card-description">
                    Select the slide you want to work with below.
                  </div>
                  <div class="pl-3 pr-3 pb-3">

                    <v-list dense shaped class="slides-list">
                      <v-list-item-group v-model="currentSlide" color="orange" mandatory>
                        <v-list-item
                            two-line
                            v-for="slide in slides" :key="slide.id"
                            :value="slide">

                          <v-list-item-content>
                            <v-list-item-title v-text="slide.name"/>
                            <v-list-item-subtitle v-text="slide.properties.comment"/>
                          </v-list-item-content>
                        </v-list-item>
                      </v-list-item-group>
                    </v-list>
                  </div>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6">
                <v-card>
                  <div class="pa-3 pb-0 text-h6 text--primary">Task status</div>
                  <div class="pl-3 pr-3 text-center font-weight-thin card-description">
                    Once you feel you are done with
                    task you may mark it as completed.
                  </div>
                  <div class="pl-3 pr-3 pb-3">
                    <v-switch
                        v-model="session.completed"
                        :disabled="!taskBelongsToUser" label="Task completed"/>
                  </div>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6" v-if="task_type === 1">
                <v-card>
                  <div class="pa-3 pb-0 text-h6 text--primary">Annotations to review</div>
                  <div class="pl-3 pr-3 text-center font-weight-thin card-description">
                    List of user's annotations for this task that must be reviewed.
                    Select the user's annotations you want to review at this time.
                  </div>
                  <div class="pl-3 pr-3 pb-3">
                    <v-radio-group v-model="revisingUserTask">
                      <v-radio value="none" label="None"/>
                      <v-radio
                          v-for="item in revisions" :key="item.id"
                          :value="item.id" :label="item.user"/>
                    </v-radio-group>
                  </div>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6" v-if="annotationImportingEnabled">
                <v-card>
                  <div class="pa-3 pb-0 text-h6 text--primary">Import annotations</div>
                  <div class="pl-3 pr-3 text-center font-weight-thin card-description">
                    Select a geojson file to import its annotations to the currently selected slide.
                  </div>
                  <div v-if="confirmingImportAnnotations" class="pl-3 pr-3 pb-3">
                    <v-btn @click="dismissAll" text>Cancel</v-btn>
                    <v-btn @click="importAll" text>Import all</v-btn>
                  </div>
                  <div v-else class="pl-3 pr-3 pb-3">
                    <input id="file-importer-input" type="file" style="display: none">
                    <v-btn @click="importAnnotations" block text>Select file</v-btn>
                  </div>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6">
                <MLPredictionsOverlapTool
                    :current-slide="currentSlide"
                    v-on:clear-overlay="onClearOverlayAnnotations"
                    v-on:annotations="onOverlayAnnotations"
                    v-on:style-changed="onOverlayStyleChanged"/>
              </v-flex>
            </v-layout>
          </v-container>
        </v-tab-item>
        <v-tab-item v-if="annotations[currentSlide.id] != null">
          <v-container fluid grid-list-md>
            <v-layout row wrap id="annotation-tab">
              <v-flex cols="12" sm="12" md="6"
                      v-for="idx in annotationsLister.pageMax"
                      :key="idx">
                <annotation-card
                    v-model="annotations[currentSlide.id][annotationsListStart + idx]"
                    v-on:save-annotation="concludeEdit"
                    v-on:edit-annotation="editRegion"
                    v-on:cancel-edit="cancelEdit"
                    v-on:annotation-feedback="annotationFeedback"
                    v-on:import-annotation="onNewRegionDraw"
                    v-on:dismiss-annotation="dismissAnnotation"
                    v-on:annotation-peep="annotationPeep"
                    v-on:annotation-update="annotationUpdate"/>
              </v-flex>
              <v-flex>
                <v-pagination
                    v-model="annotationsLister.page"
                    :length="annotationsLister.totalPages+1"
                    circle
                    :total-visible="4"
                ></v-pagination>
              </v-flex>
            </v-layout>

            <!--            <v-btn fab @click="stressTest"></v-btn>-->
          </v-container>
        </v-tab-item>
      </v-tabs-items>

    </side-window>
  </v-container>
</template>

<script>
/* eslint-disable no-param-reassign */
import { loadAnnotations, optimizePath, EventManager } from '../SliceDrawer';
import SliceViewer from '../components/WSIViewer.vue';
import SideWindow from '../components/SideWindow.vue';
import AnnotationCard from '../components/AnnotationCard.vue';
import SessionClassBalance from '../components/SessionClassBalance.vue';
import MLPredictionsOverlapTool from '@/components/MLPredictionsOverlapTool';

export default {
  name: 'Session',
  computed: {
    /**
     * Returns true if annotation importing is enabled.
     * Importing is enabled when the task is human or app annotation
     * (type 0 and 2, respectively), the task is not currently completed
     * and the task belongs to the current user.
     *
     * @returns {boolean} true if annotation importing is allowed
     */
    annotationImportingEnabled() {
      return !this.completed
          && (this.session.type === 0 || this.session.type === 2)
          && this.taskBelongsToUser;
    },
    annotationTabVisible() {
      return this.annotations[this.currentSlide.id] != null
          && this.annotations[this.currentSlide.id].length > 0;
    },
    session_id() {
      return this.$route.params.session_id;
    },
    tile_sources() {
      return `${process.env.VUE_APP_BASE_URL}session/${this.session_id}/${this.currentSlide.id}.dzi`;
    },
    project_labels() {
      return this.$store.state.session.task.project.labels;
    },
    session() {
      return this.$store.state.session;
    },
    slides() {
      const { session } = this.$store.state;
      return session.type !== 1 ? session.task.slides : session.task.task.slides;
    },
    revisions() {
      const revision = [];
      const revisionMeta = this.$store.state.session.task.revisions;
      const revisionData = this.$store.state.session.revision;
      for (let i = 0; i < revisionMeta.length; i += 1) {
        revision.push({
          id: revisionMeta[i].id,
          user: revisionMeta[i].user != null ? revisionMeta[i].user.name : revisionMeta[i].app.name,
          annotations: revisionData[revisionMeta[i].id],
          selected: false,
        });
      }
      return revision;
    },
    /**
     * Checks if this task belongs to this user. Otherwise, this is
     * currently only for visualization purposes.
     * @returns {boolean} true if the task belongs to the user
     */
    taskBelongsToUser() {
      if (this.task_type === 2) {
        // This is an app annotation task, the task belongs to the user if the user owns the app:
        return this.session.app.owner.id === this.$store.state.user.id;
      }
      // This is a user-based task
      return this.session.user.id === this.$store.state.user.id;
    },
    task_type() {
      return this.$store.state.session.type;
    },
    annotationsListStart() {
      return (this.annotationsLister.page - 1) * this.annotationsLister.max;
    },
  },
  watch: {
    session: {
      immediate: true,
      handler(session) {
        if (session.task.type === 0 || session.task.type === 2) {
          this.annotations = loadAnnotations(session.labelled);
          this.currentSlide = session.task.slides[0];
          this.calculatePagination();
        } else if (session.task.type === 1) {
          this.annotations = {};
          this.currentSlide = session.task.task.slides[0];
        }
      },
    },
    project_labels: {
      immediate: true,
      deep: true,
      handler(newLabels) {
        for (let i = 0; i < newLabels.length; i += 1) {
          this.$set(this.labelsVisible, newLabels[i].name, true);
        }
      },
    },

    'annotationsLister.page': function (newPage) {
      const totalAnnotation = this.annotations[this.currentSlide.id].length;
      const remaining = totalAnnotation - ((newPage - 1) * this.annotationsLister.max);
      this.annotationsLister.pageMax = Math.min(this.annotationsLister.max, remaining);
    },

    'session.completed': function (newValue) {
      this.$get(`task/completed?id=${this.session.id}&completed=${newValue}`)
        .catch((err) => {
          this.session.completed = !this.session.completed;
          alert(err);
        });
    },
    revisingUserTask: {
      handler(newRevisionUserTask) {
        if (newRevisionUserTask !== 'none') {
          const userTaskAnnotations = this.$store.state.session.revision[newRevisionUserTask];
          this.annotations = loadAnnotations(userTaskAnnotations);
          this.calculatePagination();
        } else {
          const annotations = {};
          this.slides.forEach((item) => {
            annotations[item.id] = [];
          });
          this.annotations = annotations;
          this.calculatePagination();
        }
        this.$nextTick(() => {
          this.annotationUpdate();
        });
      },
    },
    currentSlide() {
      this.calculatePagination();
    },
  },
  data() {
    const self = this;
    return {
      currentSlide: null,
      annotations: {},
      selectedTab: 0,
      labelsVisible: {},
      annotationsLister: {
        page: 1,
        totalPages: 1,
        pageMax: 10,
        max: 10,
      },
      drawingStyle: [{
        fillOpacity: 0.2,
        lineWidth: 2,
        hoverOpacity: 0.5,
        showImporting: true,
      }, {
        fillOpacity: 0.2,
        lineWidth: 2,
      }],
      revisingUserTask: 'none',
      highlightOnTab: false,
      confirmingImportAnnotations: false,
      draw_events: {
        onHover: self.onRegionHover,
        onLeave: self.onRegionLeave,
        onClick: self.regionClicked,
        // onFinishedEditing: (completed, annotation) => {},
      },
    };
  },
  methods: {
    onOverlayAnnotations(newAnnotations) {
      this.$refs.slice_viewer.loadOverlayAnnotations(newAnnotations);
    },

    onClearOverlayAnnotations() {
      console.log('onClearOverlayAnnotations', 'Session');
      this.$refs.slice_viewer.clearOverlayAnnotations();
    },

    onOverlayStyleChanged(style) {
      this.drawingStyle[1] = style;
    },

    labelAnnotationsVisibility(target) {
      this.project_labels.forEach((label) => {
        this.labelsVisible[label.name] = target;
      });
    },

    calculatePagination() {
      if (this.currentSlide.id in this.annotations) {
        const totalAnnotation = this.annotations[this.currentSlide.id].length;
        this.annotationsLister.totalPages = Math.floor(totalAnnotation
            / this.annotationsLister.max);
        if (this.annotationsLister.page !== 1) {
          this.annotationsLister.page = 1;
        }
      } else {
        this.annotationsLister.totalPages = 0;
        this.annotationsLister.page = 0;
      }
    },

    saveFeedback(annotation) {
      this.$post(`session/${this.session_id}/annotation_feedback`, annotation.serialize())
        .then((resp) => {
          annotation.feedback.id = resp.feedback.id;
        })
        .catch((err) => alert(err));
    },

    onRegionHover(region) {
      if (this.highlightOnTab) {
        const element = document.getElementById(`region-${region.id}`);
        if (element == null) return;
        this.selectedTab = 1;
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        element.classList.add('hovered');
      }
    },

    onRegionLeave(region) {
      const element = document.getElementById(`region-${region.id}`);
      if (element == null) return;
      element.classList.remove('hovered');
    },

    genColor(color) {
      return `rgb(${color[0]},${color[1]},${color[2]})`;
    },

    // eslint-disable-next-line no-param-reassign
    onNewRegionDraw(annotation) {
      annotation.id = null; // making sure to reset the id
      annotation.slideId = this.currentSlide.id;
      const self = this;
      this.$post(`session/${this.session_id}/add_region`, annotation.serialize())
        .then((resp) => {
          // Add the new region to the list
          annotation.id = resp.id;
          annotation.state = 'idle';
          annotation.updateImageLocation();
          self.annotations[self.currentSlide.id].push(annotation);
          self.annotationUpdate();
          this.$refs.classBalance.refresh();
          this.calculatePagination();
          this.$toast('Successfully saved annotation', { timeout: 1000 });
        })
        .catch((err) => {
          alert(`Error while saving region: ${err}`);
        });
    },

    /**
     * A region was updated. We will submit the data to the server.
     *
     * @param annotation Annotation instance
     */
    onEditRegionDraw(annotation) {
      if (this.task_type === 0) {
        this.editing = null;
        this.$post(`session/${this.session_id}/edit_region`, annotation.serialize())
          .then(() => {
            // Add the new region to the list
            this.$refs.classBalance.refresh();
            // this.calculatePagination();
          })
          .catch((err) => {
            alert(`Error while saving region: ${err}`);
          });
      } else if (this.task_type === 1) {
        // Making sure to assign that this is a wrong-region type of feedback
        annotation.feedback.feedback = 2;
        this.saveFeedback(annotation);
        this.calculatePagination();
      }
    },

    /**
     * User clicked on a region. We will highlight it in the list
     *
     * @param region
     * @param short
     */
    regionClicked(region, short = false) {
      this.selectedTab = 1;
      const pageChanged = this.navigateAnnotationPage(region);
      if (pageChanged && this.attempted === 0) {
        this.attempted = 1;
        this.$nextTick(() => {
          this.regionClicked(region, short);
        });
      } else {
        this.attempted = 0;
        const element = document.getElementById(`region-${region.id}`);
        if (element == null) {
          // if element is null we will wait a few seconds before trying again (switching tabs)
          setTimeout(() => {
            document.getElementById(`region-${region.id}`)
              .scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
          }, 250);
        } else {
          // element is already instantiated, we will jump to it:
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          element.classList.add('highlighted');
          if (short) element.classList.add('short');
          setTimeout(() => {
            element.classList.remove('highlighted');
            element.classList.remove('short');
          }, short ? 250 : 3000);
        }
      }
    },

    navigateAnnotationPage(annotation) {
      const idx = this.annotations[this.currentSlide.id].indexOf(annotation);
      const newPage = Math.ceil(idx / this.annotationsLister.max);
      if (newPage !== this.annotationsLister.page) {
        this.annotationsLister.page = newPage;
        return true;
      }
      return false;
    },

    importAnnotations() {
      const input = document.getElementById('file-importer-input');
      input.onchange = (e) => {
        const reader = new FileReader();
        reader.readAsText(e.target.files[0], 'UTF-8');
        reader.onload = (readerEvent) => {
          const json = JSON.parse(readerEvent.target.result);
          const slideId = this.currentSlide.id;
          const annotations = json.features.map((feature, idx) => {
            const geo = feature.geometry;
            const label = feature.properties.label != null
              ? feature.properties.label
              : {
                color: [0, 0, 0],
                name: 'Imported annotation',
              };
            const description = feature.properties.description != null
              ? feature.properties.description : null;
            return {
              id: `import-${idx}`,
              label,
              description,
              geometry: {
                type: 'polygon',
                points: optimizePath(geo.coordinates[0].map((coord) => ({
                  x: coord[0],
                  y: coord[1],
                }))),
              },
              slide_id: slideId,
              state: 'importing',
            };
          });
          this.confirmingImportAnnotations = true;
          const slideAnnotations = loadAnnotations({ 0: annotations })[0];
          this.annotations[slideId].push(...slideAnnotations);
          this.calculatePagination();
          this.annotationUpdate();
        };
      };
      input.click();
    },

    importAll() {
      const toImport = this.annotations[this.currentSlide.id]
        .filter(
          (annotation) => annotation.state === 'importing'
                  && annotation.label.id != null,
        )
        .map((annotation) => annotation.serialize());
      this.$post(`session/${this.session_id}/${this.currentSlide.id}/importing`, toImport)
        .then((res) => {
          alert(res);
        })
        .catch((err) => alert(err));
    },

    dismissAll() {
      this.annotations[this.currentSlide.id] = this.annotations[this.currentSlide.id]
        .filter((annotation) => annotation.state !== 'importing');
      this.confirmingImportAnnotations = false;
    },
    /**
     *
     * @param region
     */
    editRegion(region) {
      // this.$refs.slice_viewer.editElement(region);
      // this.editing = region;
    },
    concludeEdit(region) {
      this.$refs.slice_viewer.concludeEdit(region);
    },
    cancelEdit() {
      this.$refs.slice_viewer.cancelEdit();
      this.editing = null;
    },

    annotationPeep(annotation) {
      // this.$refs.slice_viewer.peepAnnotation(annotation);
    },

    annotationUpdate() {
      this.$refs.slice_viewer.update();
    },

    annotationFeedback(feedback, annotation) {
      // this.editing = annotation;
      switch (feedback) {
        case 'correct':
          annotation.feedback.feedback = 0;
          annotation.feedback.geometry = null;
          annotation.feedback.label_id = null;
          this.saveFeedback(annotation);
          break;
        case 'wrong-label':
          this.saveFeedback(annotation);
          break;
        case 'edit-region':
          this.editRegion(annotation);
          break;
        case 'wrong-region':
          this.concludeEdit(annotation);
          break;
        default:
          break;
      }
    },

    dismissAnnotation(annotation) {
      if (annotation.state === 'importing') {
        this.annotations[this.currentSlide.id] = this.annotations[this.currentSlide.id]
          .filter((item) => item !== annotation);
      } else if (confirm('Are you sure you want to remove this annotation?')) {
        this.$post(`session/${this.session_id}/remove_annotation`, annotation.serialize())
          .then(() => {
            this.annotations[this.currentSlide.id] = this.annotations[this.currentSlide.id]
              .filter((item) => item.id !== annotation.id);
            this.annotationUpdate();
            this.calculatePagination();
          })
          .catch((err) => alert(err));
      }
    },
  },
  mounted() {
    EventManager.getInstance()
      .register('session', {
        annotationClicked: (annotation) => {
        },
        peepAnnotation: (annotation) => {
          console.log('Receive event for peeping annotation', annotation);
          this.$refs.slice_viewer.peepAnnotation(annotation);
        },
        editAnnotation: (annotation) => {
          console.log('Received event for editing annotation', annotation);
          // this.$refs.slice_viewer.editElement(annotation);
          this.editing = annotation;
        },
      });
    // EventManager.getInstance()
    //  .annotationClicked(null);
    // console.log();
  },
  components: {
    MLPredictionsOverlapTool,
    SessionClassBalance,
    AnnotationCard,
    SideWindow,
    SliceViewer,
  },
};
</script>

<style scoped>
@keyframes highlight {

  0% {
    background-color: white;
  }
  50% {
    background-color: darkgrey;
  }
  100% {
    background-color: white;
  }
}

.slides-list {
  max-height: 200px;
  overflow-y: auto;
}

.highlighted {
  animation-name: highlight;
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-direction: reverse;
}

.hovered {
  background-color: darkgrey;
}

.flex-container {
  display: flex;
  flex-wrap: wrap;
}

.break {
  flex-basis: 100%;
  height: 0;
}

.card-description {
  font-size: 12px;
}

.link-btn {
  font-size: 12px;
  margin-left: 4px;
  margin-right: 4px;
}
</style>
