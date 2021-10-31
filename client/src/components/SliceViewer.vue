<template>
  <div>
    <div id="seadragon-viewer"/>

    <div v-if="drawer" class="toolbox drawing-toolbox">
      <div class="zoom-shortcuts">
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
      <div v-if="editing.element == null">
        <v-btn text icon @click="selected_tool = 'polygon'"
               :color="'polygon' === this.selected_tool ? 'primary' : 'grey'">
          <v-icon>mdi-vector-polygon</v-icon>
        </v-btn>
        <v-btn text icon @click="selected_tool = 'rect'"
               :color="'rect' === this.selected_tool ? 'primary' : 'grey'">
          <v-icon>mdi-vector-rectangle</v-icon>
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
      </div>
      <div v-if="editing.element != null">
        <v-slider step="1" dense hide-details v-model="editing.undo" :max="editing.max_undo" label="Undo"/>
        <div class="zoom-shortcuts">
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
        </div>
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
  </div>
</template>

<script>
    import OpenSeadragon from "openseadragon"
    import SliceDrawer from "../SliceDrawer";

    export default {
        name: "SliceViewer",
        data: () => {
            return {
                selected_label: null,
                labeled_regions: [],
                selected_tool: "polygon",
                editor_tool: "",
                zoom: 0,
                editing: {
                    element: null,
                    mode: "mover",
                    undo: 0,
                    max_undo: 0,
                }
            }
        },
        watch: {
            value: {
                immediate: true,
                handler: function (new_value) {
                    this.labeled_regions = new_value
                    SliceDrawer.elements = new_value
                    SliceDrawer.update()
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
                    SliceDrawer.drawing_color = new_value.color
                    if (this.editing.element != null) {
                        this.editing.element.data.color = new_value.color
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
            regionOpacity: function (new_opacity) {
                SliceDrawer.default_opacity = new_opacity
                SliceDrawer.update()
            },
            undo: function (value) {
                SliceDrawer.currently_editing.points_history = value
                SliceDrawer.update()
            },
            "editing.mode": function (value) {
                SliceDrawer.editorMode = value
            },
            "editing.undo": function (value) {
                if (!this.no_model_action) {
                    SliceDrawer.currently_editing.restoreState(value)
                }
                this.no_model_action = false
            },
            tileSources: function (value) {
                console.log("tileSources: ", value)
                this.viewer.open(value)
            }
        },
        methods: {
            editElement(element) {
                console.log("editElement", element)
                this.editing.element = element
                this.no_model_action = true
                SliceDrawer.editElement(element.data)
            },

        },
        mounted() {
            this.$nextTick(() => {
                const viewer = OpenSeadragon({
                    id: "seadragon-viewer",
                    tileSources: this.tileSources,
                    showNavigator: true,
                    navigatorPosition: "BOTTOM_RIGHT",
                    navigatorRight: "16px",
                    navigatorBottom: "16px",
                    navigatorHeight: "120px",
                    navigatorWidth: "145px",
                    showNavigationControl: false,
                    gestureSettingsMouse: {
                        clickToZoom: false,
                    },
                })

                this.viewer = viewer
                SliceDrawer.init(viewer, {
                    onHover: function (element) {
                        console.log("onHover: ", element)
                    },
                    onLeave: function (element) {
                        console.log("onLeave: ", element)
                    },
                    onClick: (element) => {
                        this.$emit("region-clicked", element)
                    },
                    onEditingEvent: () => {
                        this.no_model_action = true
                        const lastStateIndex = SliceDrawer.currently_editing.history.length - 1
                        this.editing.max_undo = lastStateIndex
                        this.editing.undo = lastStateIndex
                    },
                    onFinishNewDrawing: (element) => {
                        // Creating a new label object:
                        this.$emit("new-draw", {
                            label: this.selected_label,
                            data: element
                        })
                    },
                    onFinishedEditing: (changed, element_data) => {
                        if (changed) {
                            console.log("data", {
                                ...this.editing.element,
                                data: element_data
                            })
                            this.$emit("edit-draw", {
                                ...this.editing.element,
                                data: element_data
                            })
                        }
                        this.editing.element = null
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
            regionOpacity: {type: Number}
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

  .drawing-toolbox {
    bottom: 16px;
    left: 32px;
    /*-webkit-box-shadow: 0px 0px 19px -6px #000000;*/
    /*box-shadow: 0px 0px 19px -6px #000000;*/
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