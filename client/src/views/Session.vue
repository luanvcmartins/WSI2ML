<template>
  <v-container style="overflow: hidden">
    <slice-viewer
            ref="slice_viewer"
            :drawer="!session.completed"
            :tile-sources="tile_sources"
            :labels="project_labels"
            :labels-visibility="labels_visible"
            :drawing-style="drawing_style"
            :draw-events="draw_events"
            :slide-properties="current_slide.properties"
            v-model="labelled[current_slide.id]"
            v-on:region-clicked="regionClicked"
            v-on:new-draw="onNewRegionDraw"
            v-on:edit-draw="onEditRegionDraw"/>
    <side-window>
      <v-toolbar dense fixed color="grey lighten-4">
        <v-toolbar-title>{{task_type === 0 ? "Labelling task" : "Review task"}}</v-toolbar-title>
        <template v-slot:extension>
          <v-tabs v-model="selected_tab">
            <v-tab>View</v-tab>
            <v-tab v-if="labelled[current_slide.id] != null && labelled[current_slide.id].length > 0">Annotations
              ({{labelled[current_slide.id].length}})
            </v-tab>
          </v-tabs>
        </template>
      </v-toolbar>

      <v-tabs-items v-model="selected_tab">
        <v-tab-item>
          <!-- Controls tab -->
          <v-container fluid grid-list-md>
            <v-layout row wrap>
              <v-flex cols="12" sm="12" md="6">
                <v-card>
                  <v-card-title>Annotation visibility</v-card-title>
                  <div class="pl-3 pr-3 pb-3" style="max-height: 200px; overflow-y: auto">
                    <v-switch
                            class="mt-0"
                            hide-details dense
                            v-for="label in project_labels"
                            :key="label.id"
                            v-model="labels_visible[label.name]"
                            :label="label.name"
                            :color="genColor(label.color)"/>
                  </div>
                  <v-divider></v-divider>
                  <div style="display: flex">
                    <v-slider hide-details class="pl-2 pr-2"
                              style="width: 50%"
                              prepend-icon="mdi-circle-opacity"
                              v-model="drawing_style.region_opacity"
                              step="0"
                              thumb-label
                              min="0.0" max="1">
                      <template v-slot:thumb-label="{ value }">
                        {{ value.toFixed(2) }}
                      </template>
                    </v-slider>
                    <v-slider hide-details class="pl-2 pr-2"
                              style="width: 50%"
                              prepend-icon="mdi-format-line-weight"
                              v-model="drawing_style.line_weight"
                              step="1"
                              thumb-label
                              min="1" max="10">
                      <template v-slot:thumb-label="{ value }">
                        {{ value.toFixed(2) }}
                      </template>
                    </v-slider>
                  </div>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6" v-if="slides.length > 1">
                <v-card>
                  <div class="pa-3 pb-0 text-h6 text--primary">Task slides</div>
                  <div class="pl-3 pr-3 text-center font-weight-thin card-description">There is more than one slide
                    associated with this task. Select the slide you want to work with below.
                  </div>
                  <div class="pl-3 pr-3 pb-3">
                    <!--                    <v-radio-group hide-details v-model="current_slide">-->
                    <!--                      <v-radio v-for="slide in slides" :label="slide.name" :value="slide"/>-->
                    <!--                    </v-radio-group>-->

                    <v-list dense shaped>
                      <v-list-item-group v-model="current_slide" color="orange" mandatory>
                        <v-list-item two-line v-for="slide in slides" :key="slide.id" :value="slide">

                          <v-list-item-content>
                            <v-list-item-title v-text="slide.name"></v-list-item-title>
                            <v-list-item-subtitle v-text="slide.properties.comment"></v-list-item-subtitle>
                          </v-list-item-content>

                          <v-list-item-action>
                            <v-btn @click.stop="slideInfo(slide)" icon>
                              <v-icon dark>mdi-information-outline</v-icon>
                            </v-btn>
                          </v-list-item-action>
                        </v-list-item>
                      </v-list-item-group>
                    </v-list>
                  </div>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6">
                <v-card>
                  <div class="pa-3 pb-0 text-h6 text--primary">Task status</div>
                  <div class="pl-3 pr-3 text-center font-weight-thin card-description">Once you feel you are done with
                    task you may mark it as completed.
                  </div>
                  <div class="pl-3 pr-3 pb-3">
                    <v-switch v-model="session.completed" label="Task completed"/>
                  </div>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6" v-if="task_type === 1">
                <v-card>
                  <div class="pa-3 pb-0 text-h6 text--primary">Annotations to review</div>
                  <div class="pl-3 pr-3 text-center font-weight-thin card-description">List of user's annotations for
                    this task that must be reviewed. Select the user's annotations you want to review at this time.
                  </div>
                  <div class="pl-3 pr-3 pb-3">
                    <v-switch v-for="item in revisions" :label="item.user" v-model="revision_enabled[item.id]"/>
                  </div>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6" v-if="task_type === 0">
                <v-card>
                  <div class="pa-3 pb-0 text-h6 text--primary">Import annotations</div>
                  <div class="pl-3 pr-3 text-center font-weight-thin card-description">Select a geojson file to import
                    its annotations to the currently selected slide.
                  </div>
                  <div class="pl-3 pr-3 pb-3">
                    <input id="file-importer-input" type="file" style="display: none">
                    <v-btn @click="importAnnotations" block text>Select file</v-btn>
                  </div>
                </v-card>
              </v-flex>
            </v-layout>
          </v-container>
        </v-tab-item>
        <v-tab-item>
          <v-container fluid grid-list-md>
            <v-layout row wrap>
              <v-flex cols="12" sm="12" md="6" v-for="(region, idx) in labelled[current_slide.id]" :key="region.id">
                <annotation-card
                        v-model="labelled[current_slide.id][idx]" :key="idx"
                        :editing="editing"
                        v-on:save-region="saveEdition"
                        v-on:edit-region="editRegion"
                        v-on:cancel-edit="cancelEdit"
                        v-on:annotation-feedback="annotationFeedback"
                        v-on:import-annotation="onNewRegionDraw"
                        v-on:dismiss-annotation="dismissAnnotation"/>
              </v-flex>
            </v-layout>
            <!--            <v-btn fab @click="stressTest"></v-btn>-->
          </v-container>
        </v-tab-item>
      </v-tabs-items>

    </side-window>
    <v-dialog v-if="feedback_dialog" v-model="feedback_dialog" width="500">
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Annotation label feedback
        </v-card-title>
        <v-card-text>
          <div class="text-center font-weight-light">What is the correct label?</div>
          <v-chip-group v-model="editing.feedback.label_id" mandatory>
            <v-chip filter :key="label.id" v-for="label in project_labels" :value="label.id">{{label.name}}</v-chip>
          </v-chip-group>
        </v-card-text>
        <v-divider/>
        <v-card-actions>
          <v-spacer/>
          <v-btn text @click="relabelScreenContinue">Continue</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
    import SliceViewer from "../components/SliceViewer";
    import SideWindow from "../components/SideWindow";
    import AnnotationCard from "../components/AnnotationCard";
    import SliceDrawer from "../SliceDrawer";
    import {optimizePath} from "../SliceDrawer"

    export default {
        name: "Session",
        computed: {
            session_id: function () {
                return this.$route.params.session_id
            },
            tile_sources: function () {
                return `${process.env.VUE_APP_BASE_URL}session/${this.session_id}/${this.current_slide.id}.dzi`
            },
            project_labels: function () {
                return this.$store.state.session.task.project.labels
            },
            session: function () {
                return this.$store.state.session
            },
            slides: function () {
                const session = this.$store.state.session
                console.log(session)
                return session.type === 0 ? session.task.slides : session.task.task.slides
            },
            revisions: function () {
                const revision = []
                const revisionMeta = this.$store.state.session.task.revisions
                const revisionData = this.$store.state.session.revision
                for (let i = 0; i < revisionMeta.length; i++) {
                    revision.push({
                        "id": revisionMeta[i].id,
                        "user": revisionMeta[i].user.name,
                        "annotations": revisionData[revisionMeta[i].id],
                        "selected": false
                    })
                }
                return revision
            },
            task_type: function () {
                return this.$store.state.session.type
            }
        },
        watch: {
            session: {
                immediate: true,
                handler: function (session) {
                    if (session.task.type === 0) {
                        this.labelled = session.labelled
                        this.current_slide = session.task.slides[0]
                    } else {
                        this.labelled = []
                        this.current_slide = session.task.task.slides[0]
                    }
                }
            },
            project_labels: {
                immediate: true,
                deep: true,
                handler: function (new_labels) {
                    console.log("project_labels watcher", new_labels)
                    for (let i = 0; i < new_labels.length; i++) {
                        this.$set(this.labels_visible, new_labels[i].name, true)
                        // this.labels_visible[new_labels[i].name] = true
                    }
                }
            },
            labels_visible: {
                deep: true,
                handler: function (value) {
                    console.log("labels_visible watcher:", value)
                }
            },
            "session.completed": function (new_value) {
                this.$get(`task/completed?id=${this.session.id}&completed=${new_value}`)
                    .catch(err => {
                        this.session.completed = !this.session.completed
                        alert(err)
                    })
            },
            revision_enabled: {
                deep: true,
                handler(new_value) {
                    const newElements = {}
                    this.slides.forEach(item => newElements[item] = {})
                    Object.entries(new_value).forEach(([revision_id, enabled]) => {
                        if (enabled) {
                            const slidesAnnotation = this.$store.state.session.revision[revision_id]
                            Object.entries(slidesAnnotation).forEach(([k, v]) => newElements[k] = v)
                        }
                    })
                    this.labelled = newElements
                }
            }
        },
        data() {
            const self = this
            return {
                current_slide: null,
                labelled: {},
                selected_tab: 0,
                labels_visible: {},
                drawing_style: {
                    region_opacity: 0.3,
                    line_weight: 1
                },
                line_weight: 1,
                editing: null,
                revision_enabled: {},
                feedback_dialog: false,
                draw_events: {
                    onHover: self.onRegionHover,
                    onLeave: self.onRegionLeave,
                    onClick: self.regionClicked,
                    onFinishedEditing: (completed, region) => {
                        self.editing = null
                    },
                }
            }
        },
        methods: {
            slideInfo(slide) {
                alert(slide.properties.comment)
            },

            relabelScreenContinue() {
                if (this.editing.feedback.feedback !== 2) {
                    this.saveFeedback()
                } else {
                    this.feedback_dialog = false
                    this.editRegion(this.editing)
                }
            },

            saveFeedback() {
                this.$post(`session/${this.session_id}/annotation_feedback`, this.editing)
                    .then(resp => {
                        console.log(resp)
                        this.editing.feedback.id = resp.feedback.id
                        this.feedback_dialog = false
                        this.editing = null
                    })
                    .catch(err => alert(err))
            },

            onRegionHover(region) {
                const element = document.getElementById(`region-${region.id}`)
                if (element == null) return

                this.selected_tab = 1
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                })
                element.classList.add("hovered")
            },

            onRegionLeave(region) {
                const element = document.getElementById(`region-${region.id}`)
                if (element == null) return
                element.classList.remove("hovered")
            },

            genColor(color) {
                return `rgb(${color[0]},${color[1]},${color[2]})`
            },

            onNewRegionDraw(annotation) {
                console.log(annotation)
                annotation.id = null // making sure to reset the id
                annotation.slide_id = this.current_slide.id

                this.$post("session/" + this.session_id + "/add_region", annotation)
                    .then(resp => {
                        // Add the new region to the list
                        this.labelled[this.current_slide.id] = this.labelled[this.current_slide.id].filter(item => annotation.id !== item.id)
                        this.labelled[this.current_slide.id].push(resp)
                    })
                    .catch(err => {
                        alert("Error while saving region: " + err)
                    })
            },

            /**
             * A region was updated. We will submit the data to the server.
             *
             * @param element Region data
             */
            onEditRegionDraw(element) {
                if (this.task_type === 0) {
                    this.editing = null
                    this.$post("session/" + this.session_id + "/edit_region", element)
                        .then(resp => {
                            // Add the new region to the list
                            console.log(resp)
                        })
                        .catch(err => {
                            alert("Error while saving region: " + err)
                        })
                } else if (this.task_type === 1) {
                    console.log("editing before request: ", this.editing, this.original_data)
                    const editing = this.editing
                    const original_data = this.original_data
                    editing.feedback.geometry = element.geometry
                    this.$post(`session/${this.session_id}/annotation_feedback`, this.editing)
                        .then(resp => {
                            console.log("editing", editing, "original_data", original_data)
                            console.log("resp:", resp)
                            editing.geometry = resp.geometry
                            editing.feedback.id = resp.feedback.id
                            this.feedback_dialog = false
                            SliceDrawer.update()
                            // this.editing = null
                        })
                        .catch(err => alert(err))
                }
            },

            /**
             * User clicked on a region. We will highlighted it in the list
             *
             * @param region
             * @param short
             */
            regionClicked(region, short = false) {
                console.log("regionClicked", region)
                const element = document.getElementById(`region-${region.id}`)
                this.selected_tab = 1
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                })
                element.classList.add("highlighted")
                if (short) element.classList.add("short")
                setTimeout(() => {
                    element.classList.remove("highlighted")
                    element.classList.remove("short")
                }, short ? 250 : 3000)
            },

            importAnnotations() {
                const input = document.getElementById("file-importer-input")
                input.onchange = e => {
                    const reader = new FileReader()
                    reader.readAsText(e.target.files[0], 'UTF-8')
                    reader.onload = readerEvent => {
                        const json = JSON.parse(readerEvent.target.result)
                        const annotations = json.features.map((feature, idx) => {
                            const geo = feature.geometry
                            return {
                                id: `import-${idx}`,
                                label: {color: [0, 0, 0], name: "Imported annotation"},
                                geometry: {
                                    type: "polygon",
                                    points: optimizePath(geo.coordinates[0].map(coord => {
                                        return {x: coord[0], y: coord[1]}
                                    }))
                                },
                                meta: {
                                    importing: true
                                }
                            }
                        })
                        console.log("Annotations: ", annotations)
                        this.labelled[this.current_slide.id].push(...annotations)
                    }
                }
                input.click()
            },

            /**
             *
             * @param region
             */
            editRegion(region) {
                console.log("editRegion session")
                this.$refs.slice_viewer.editElement(region)
                this.editing = region
            },
            saveEdition(region) {
                this.$refs.slice_viewer.saveEdition(region)
                //this.editing = null
            },
            cancelEdit() {
                this.$refs.slice_viewer.cancelEdit()
                this.editing = null
            },
            annotationFeedback(feedback, annotation) {
                console.log(feedback, annotation)
                this.editing = annotation
                switch (feedback) {
                    case "correct":
                        this.editing.feedback.feedback = 0
                        this.editing.feedback.data = null
                        this.editing.feedback.label_id = null
                        this.saveFeedback()
                        break
                    case "wrong-label":
                        this.editing.feedback.feedback = 1
                        this.editing.feedback.data = null
                        this.feedback_dialog = true
                        break
                    case "wrong-region":
                        this.editing.feedback.feedback = 2
                        this.feedback_dialog = true
                        this.original_data = annotation.geometry
                        break
                }
            },
            dismissAnnotation(annotation) {
                if (annotation.meta.importing) {
                    this.labelled[this.current_slide.id] = this.labelled[this.current_slide.id].filter(item => item !== annotation)
                } else {
                    if (confirm("Are you sure you want to remove this annotation?")) {
                        this.$post(`session/${this.session_id}/remove_annotation`, annotation)
                            .then(resp => {
                                this.labelled[this.current_slide.id] = this.labelled[this.current_slide.id].filter(item => item !== annotation)
                            })
                            .catch(err => alert(err))
                    }
                }
            }
        },
        components: {AnnotationCard, SideWindow, SliceViewer}
    }
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

  .highlighted {
    animation-name: highlight;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-direction: reverse;
  }

  .hovered {
    background-color: darkgrey;
  }

  .card-description {
    font-size: 12px;
  }
</style>