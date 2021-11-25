<template>
  <div>
    <div id="seadragon-viewer"/>

    <div v-if="drawer" class="drawing-tool-container">

      <div class="tool-item">
        <div class="zoom-shortcuts" v-if="task_type === 0">
          <v-menu top :close-on-click="true" offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-btn text v-bind="attrs" v-on="on">
                <v-avatar
                        class="mr-2"
                        :color="`rgb(${selected_label.color[0]},${selected_label.color[1]},${selected_label.color[2]})`"
                        size="26"/>
                {{selected_label.name}}
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="selected_label = item" v-for="(item, index) in labels" :key="index">
                <v-list-item-avatar>
                  <v-avatar :color="`rgb(${item.color[0]},${item.color[1]},${item.color[2]})`" size="26"></v-avatar>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <v-divider></v-divider>
        <div v-if="task_type === 0 && editing.element == null" class="zoom-shortcuts">
          <v-btn text icon @click="selected_tool = 'polygon'"
                 :color="'polygon' === this.selected_tool ? 'primary' : 'grey'">
            <v-icon>mdi-vector-polygon</v-icon>
          </v-btn>
          <v-btn text icon @click="selected_tool = 'rect'"
                 :color="'rect' === this.selected_tool ? 'primary' : 'grey'">
            <v-icon>mdi-vector-rectangle</v-icon>
          </v-btn>
          <v-btn text icon
                 @click="selected_tool = 'circle'"
                 :color="'circle' === this.selected_tool ? 'primary' : 'grey'">
            <v-icon>mdi-circle-outline</v-icon>
          </v-btn>

          <v-btn text icon
                 @click="selected_tool = 'free'"
                 :color="'free' === this.selected_tool ? 'primary' : 'grey'">
            <v-icon>mdi-lead-pencil</v-icon>
          </v-btn>

          <v-btn text icon
                 @click="selected_tool = 'brush'"
                 :color="'brush' === this.selected_tool ? 'primary' : 'grey'">
            <v-icon>mdi-brush</v-icon>
          </v-btn>
          <v-btn text icon
                 @click="selected_tool = 'ruler'"
                 :color="'ruler' === this.selected_tool ? 'primary' : 'grey'">
            <v-icon>mdi-ruler</v-icon>
          </v-btn>
        </div>

        <div v-if="editing.element != null" class="zoom-shortcuts">
          <v-btn text icon
                 @click="editing.mode = 'mover'"
                 :color="'mover' === editing.mode ? 'primary' : 'grey'">
            <v-icon>mdi-vector-polyline-edit</v-icon>
          </v-btn>
          <v-btn text icon
                 @click="editing.mode = 'eraser'"
                 :color="'eraser' === editing.mode ? 'primary' : 'grey'">
            <v-icon>mdi-vector-polyline-minus</v-icon>
          </v-btn>
          <v-btn text icon
                 @click="editing.mode = 'creator'"
                 :color="'creator' === editing.mode ? 'primary' : 'grey'">
            <v-icon>mdi-vector-polyline-plus</v-icon>
          </v-btn>
          <v-btn text icon
                 @click="editing.mode = 'free'"
                 :color="'free' === editing.mode ? 'primary' : 'grey'">
            <v-icon>mdi-lead-pencil</v-icon>
          </v-btn>
        </div>
      </div>


      <div v-if="state_restorer.showing" class="tool-item">
        <v-slider step="1" dense hide-details v-model="state_restorer.undo" :max="state_restorer.max_undo"
                  label="Undo"/>
      </div>

      <div class="tool-item" v-if="info.length > 0">
        <p class="instruction-item" v-for="instruction in info">{{instruction}}</p>
      </div>
    </div>

    <div class="toolbox navigation-toolbox">
      <v-slider hide-details thumb-label dense v-model="zoom" :max="40" min="0.5" step="0">
        <template v-slot:thumb-label="{ value }">
          {{ value.toFixed(2) }}
        </template>
      </v-slider>
      <div class="zoom-shortcuts">
        <v-btn text icon @click="zoom = 1">1x</v-btn>
        <v-btn text icon @click="zoom = 2">2x</v-btn>
        <v-btn text icon @click="zoom = 10">10x</v-btn>
        <v-btn text icon @click="zoom = 20">20x</v-btn>
        <v-btn text icon @click="zoom = 40">40x</v-btn>
      </div>
    </div>

    <div class="toolbox ruler transparent">
      <SliceViewerRuler :value="viewportLocation" :pixel-density="pixel_density"></SliceViewerRuler>
    </div>
  </div>
</template>

<script>
    import OpenSeadragon from "openseadragon"
    import SliceDrawer from "../SliceDrawer";
    import SliceViewerRuler from "./SliceViewerRuler";
    import _ from "lodash"

    export default {
        name: "SliceViewer",
        components: {SliceViewerRuler},
        computed: {
            task_type: function () {
                return this.$store.state.session.type
            },
            pixel_density: function () {
                // console.log("calculating pixel_density")
                if (this.viewportLocation == null || this.slideProperties == null) return 0
                const imgPixels = this.viewportLocation.max.x - this.viewportLocation.min.x
                const imgPixelPerCanvasPixel = imgPixels / SliceDrawer.ctx.canvas.width
                return (this.slideProperties.pixel_width * imgPixelPerCanvasPixel) * 1.2// why are we off by this amount? this is some seriously shade stuff
            }
        },

        data: () => {
            return {
                selected_label: null,
                labeled_regions: [],
                selected_tool: "polygon",
                editor_tool: "",
                zoom: 0,
                viewportLocation: null,
                editing: {
                    element: null,
                    mode: "mover",
                },
                state_restorer: {
                    showing: false,
                    undo: 0,
                    max_undo: 0
                },
                info: []
            }
        },
        watch: {
            value: {
                immediate: true,
                handler: function (new_value) {
                    this.labeled_regions = new_value
                    SliceDrawer.annotations = new_value
                    SliceDrawer.update()
                }
            },
            task_type: {
                immediate: true,
                handler(new_value) {
                    SliceDrawer.enabled = new_value === 0
                }
            },
            labels: {
                immediate: true,
                handler: function (new_labels) {
                    this.selected_label = new_labels[0]
                }
            },
            labelsVisibility: {
                immediate: true,
                deep: true,
                handler: function (new_visibility) {
                    SliceDrawer.filtering = new_visibility
                    SliceDrawer.update()
                },
            },
            selected_label: {
                immediate: true,
                handler: function (new_value) {
                    SliceDrawer.current_label = new_value
                    if (this.editing.element != null) {
                        //this.editing.element.data.color = new_value.color
                        SliceDrawer.update()
                    }
                }
            },
            selected_tool: function (tool) {
                SliceDrawer.tool = tool
            },
            zoom: function (new_zoom) {
                const viewer = this.viewer
                if (viewer != null && !this.no_model_action) {
                    viewer.viewport.zoomTo(new_zoom)
                }
                this.no_model_action = false
            },
            drawingStyle: {
                deep: true,
                handler(new_style) {
                    SliceDrawer.drawingStyle = new_style
                    SliceDrawer.update()
                }
            },
            "editing.mode": function (value) {
                SliceDrawer.editorMode = value
            },
            "state_restorer.undo": function (value) {
                if (!this.no_model_action) {
                    SliceDrawer.stateRestorer.restoreToPoint(value)
                }
                this.no_model_action = false
            },
            tileSources: function (value) {
                this.viewer.open(value)
            },
            slideProperties: {
                immediate: true,
                deep: true,
                handler(new_value) {
                    SliceDrawer.pixel_width = new_value.pixel_width
                }
            }
        },
        methods: {
            editElement(element) {
                this.editing.element = element
                this.no_model_action = true
                SliceDrawer.editElement(element)
            },
            saveEdition(element) {
                // this.editing.element = element
                // this.no_model_action = true
                SliceDrawer.concludeEdit()
            },
            cancelEdit() {
                SliceDrawer.cancelEdit()
            },
        },
        mounted() {
            console.log("drawEvents:", this.drawEvents)
            this.$nextTick(() => {
                const viewer = OpenSeadragon({
                    id: "seadragon-viewer",
                    tileSources: this.tileSources,
                    showNavigator: true,
                    navigatorPosition: "TOP_RIGHT",
                    navigatorRight: "16px",
                    navigatorBottom: "16px",
                    navigatorHeight: "120px",
                    navigatorWidth: "145px",
                    showNavigationControl: false,
                    gestureSettingsMouse: {
                        clickToZoom: false,
                    },
                })

                const delegateCallback = (callback, ...args) => {
                    if (callback != null) {
                        callback(...args)
                    }
                }

                this.viewer = viewer
                SliceDrawer.init(viewer, {
                    onViewportChanged: (viewport) => {
                        this.viewportLocation = viewport
                        delegateCallback(this.drawEvents.onViewportChanged, viewport)
                    },
                    onHover: (element) => {
                        delegateCallback(this.drawEvents.onHover, element)
                        // if (this.drawEvents != null && this.drawEvents.onHover != null)
                        //     this.drawEvents.onHover(element)
                    },
                    onLeave: (element) => {
                        delegateCallback(this.drawEvents.onLeave, element)
                    },
                    onClick: (element) => {
                        delegateCallback(this.drawEvents.onClick, element)
                    },
                    onStateRestorerEvent: (stateRestorer) => {
                        this.no_model_action = true
                        if (stateRestorer != null) {
                            this.state_restorer.showing = true
                            this.state_restorer.max_undo = stateRestorer.states.length - 1
                            this.state_restorer.undo = stateRestorer.current_state_point
                        } else {
                            this.state_restorer.showing = false
                        }
                        delegateCallback(this.drawEvents.onStateRestorerEvent, stateRestorer)
                    },
                    onEditingEvent: () => {
                        this.no_model_action = true
                        const lastStateIndex = SliceDrawer.currently_editing.history.length - 1
                        this.editing.max_undo = lastStateIndex
                        this.editing.undo = lastStateIndex
                        delegateCallback(this.drawEvents.onEditingEvent)
                    },
                    onFinishNewDrawing: (element) => {
                        // Creating a new label object:
                        this.$emit("new-draw", {
                            label: this.selected_label,
                            geometry: element
                        })
                    },
                    onInfoUpdate: (messages) => {
                        this.info = messages
                    },
                    onFinishedEditing: (changed, element_data) => {
                        if (changed) {
                            console.log("data", {
                                ...this.editing.element,
                                geometry: element_data
                            })
                            this.$emit("edit-draw", {
                                ...this.editing.element,
                                geometry: element_data
                            })
                        }
                        this.editing.element = null
                        delegateCallback(this.drawEvents.onFinishedEditing, changed, element_data)
                    }
                })
                this.viewer.addHandler("zoom", (e) => {
                    this.no_model_action = true // don't let the zoom listener take action
                    this.zoom = e.zoom
                })
                this.no_model_action = false
            })
        },
        props: {
            drawer: {
                type: Boolean,
                default: true
            },
            labels: {type: Array},
            value: {type: Array},
            tileSources: {type: String},
            labelsVisibility: {type: Object},
            drawingStyle: {type: Object},
            drawEvents: {},
            slideProperties: {type: Object}
        }
    }
</script>

<style scoped>
  #seadragon-viewer {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  .toolbox {
    position: absolute;
    border-radius: 8px;
    background-color: #f1f1f1;
    padding: 8px;
  }

  .transparent {
    background-color: transparent;
  }

  .ruler {
    right: 32px;
    bottom: 16px;
  }

  .drawing-tool-container {
    position: absolute;
    left: 16px;
    bottom: 16px;
    height: 500px;
    display: flex;
    flex-direction: column-reverse;
  }

  .tool-item {
    flex-flow: column;
    border-radius: 8px;
    background-color: #f1f1f1;
    padding: 8px;
    margin-top: 4px;
    margin-bottom: 4px;
  }

  .instruction-item {
    font-size: small;
    font-weight: normal;
    width: 100%;
    margin: 0;
  }

  .drawing-toolbox {
    bottom: 16px;
    left: 32px;
    /*-webkit-box-shadow: 0px 0px 19px -6px #000000;*/
    /*box-shadow: 0px 0px 19px -6px #000000;*/
  }

  .state-toolbox {
    left: 32px;
    width: 150px;
    bottom: 120px;
  }

  .navigation-toolbox {
    width: 200px;
    bottom: 16px;
    margin: 0 auto;
    left: calc(50% - 100px);
  }

  .zoom-shortcuts {
    display: flex;
    justify-content: center;
  }
</style>