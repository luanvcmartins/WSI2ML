<template>
  <div>
    <div id="seadragon-viewer"/>

    <div class="drawing-tool-container">

      <div class="tool-item">
        <div class="zoom-shortcuts" v-if="task_type === 0">
          <v-menu top :close-on-click="true" offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-btn text v-bind="attrs" v-on="on">
                <v-avatar
                    class="mr-2"
                    :color="`rgb(${selectedLabel.color[0]},${selectedLabel.color[1]},${selectedLabel.color[2]})`"
                    size="26"/>
                {{ selectedLabel.name }}
              </v-btn>
            </template>
            <v-list style="overflow: auto; max-height: 600px">
              <v-list-item @click="selectedLabel = item"
                           v-for="(item, index) in labels" :key="index">
                <v-list-item-avatar>
                  <v-avatar :color="`rgb(${item.color[0]},${item.color[1]},${item.color[2]})`"
                            size="26"/>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <v-divider v-if="drawer"></v-divider>
        <div v-if="annotationDrawer != null && annotationDrawer.isDrawingEnabled && editing.element == null"
             class="zoom-shortcuts">
          <v-btn text icon
                 @click="annotationDrawer.tool = 'none'"
                 :color="'none' === annotationDrawer.tool ? 'primary' : 'grey'">
            <v-icon>mdi-cursor-default</v-icon>
          </v-btn>
          <v-btn text icon @click="annotationDrawer.tool = 'polygon'"
                 :color="'polygon' === annotationDrawer.tool ? 'primary' : 'grey'"
                 v-if="drawer">
            <v-icon>mdi-vector-polygon</v-icon>
          </v-btn>
          <v-btn text icon @click="annotationDrawer.tool = 'rect'"
                 :color="'rect' === annotationDrawer.tool ? 'primary' : 'grey'"
                 v-if="drawer">
            <v-icon>mdi-vector-rectangle</v-icon>
          </v-btn>
          <v-btn text icon
                 @click="annotationDrawer.tool = 'circle'"
                 :color="'circle' === annotationDrawer.tool ? 'primary' : 'grey'"
                 v-if="drawer">
            <v-icon>mdi-circle-outline</v-icon>
          </v-btn>
          <v-btn text icon
                 @click="annotationDrawer.tool = 'ruler'"
                 :color="'ruler' === annotationDrawer.tool ? 'primary' : 'grey'">
            <v-icon>mdi-ruler</v-icon>
          </v-btn>
        </div>
      </div>
      <div v-if="stateRestorer.showing" class="tool-item">
        <v-slider step="1" dense hide-details
                  v-model="stateRestorer.undo" :max="stateRestorer.max_undo"
                  label="Undo"/>
      </div>

      <!--      <div class="tool-item" v-if="info.length > 0">-->
      <!--        <p class="instruction-item" v-for="instruction in info" :key="instruction">-->
      <!--          {{ instruction }}-->
      <!--        </p>-->
      <!--      </div>-->
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
import OpenSeadragon from 'openseadragon';
import { AnnotationDrawer, RectAnnotationTool, PolygonAnnotationTool } from '@/SliceDrawer';
import WSIViewerRuler from './WSIViewerRuler';

export default {
  name: 'WSIViewer',
  components: { SliceViewerRuler: WSIViewerRuler },
  computed: {
    task_type() {
      return this.$store.state.session.type;
    },
    pixel_density() {
      // console.log("calculating pixel_density")
      if (this.viewportLocation == null || this.slideProperties == null) return 0;
      const imgPixels = this.viewportLocation.right - this.viewportLocation.left;
      const imgPixelPerCanvasPixel = imgPixels / this.annotationDrawer.ctx.canvas.width;
      // why are we off by this amount? this is some seriously shade stuff:
      return (this.slideProperties.pixel_width * imgPixelPerCanvasPixel) * 1.2;
    },
  },

  data: () => ({
    selectedLabel: null,
    zoom: 0,
    viewportLocation: null,
    annotationDrawer: null,
    editing: {
      element: null,
      mode: 'mover',
    },
    stateRestorer: {
      showing: false,
      undo: 0,
      max_undo: 0,
    },
    info: [],
  }),
  watch: {
    drawer() {
      // Changes on the drawer will immediately reset the current tool to none.
      if (this.annotationDrawer != null) {
        this.annotationDrawer.tool = null;
      }
    },
    value: {
      immediate: true,
      handler(newValue) {
        if (this.annotationDrawer != null) {
          this.annotationDrawer.annotationSet[0] = newValue;
          newValue.forEach((annotation) => {
            annotation.drawer = this.annotationDrawer;
          });
        }
      },
    },
    task_type: {
      immediate: true,
      handler(newValue) {
        if (this.annotationDrawer != null) {
          this.annotationDrawer.isDrawingEnabled = newValue === 0;
        }
      },
    },
    labels: {
      immediate: true,
      handler(newLabels) {
        this.selectedLabel = newLabels[0];
      },
    },
    labelsVisibility: {
      immediate: true,
      deep: true,
      handler(newVisibility) {
        if (this.annotationDrawer != null) {
          this.annotationDrawer.filtering = newVisibility;
          this.annotationDrawer.refresh();
        }
      },
    },
    selectedLabel: {
      immediate: true,
      handler(newValue) {
        if (this.annotationDrawer != null) {
          this.annotationDrawer.label = newValue;
        }
        // if (this.annotationDrawer != null) {
        //   this.annotationDrawer.currentLabel = newValue;
        // }
        // if (this.editing.element != null) {
        //   // this.editing.element.data.color = new_value.color
        //   this.annotationDrawer.refresh();
        // }
      },
    },
    zoom(newZoom) {
      const { viewer } = this;
      if (viewer != null && !this.no_model_action) {
        viewer.viewport.zoomTo(newZoom);
      }
      this.no_model_action = false;
    },
    drawingStyle: {
      deep: true,
      immediate: true,
      handler(newStyle) {
        if (this.annotationDrawer != null) {
          this.annotationDrawer.style = newStyle;
          this.annotationDrawer.refresh();
        }
      },
    },
    'stateRestorer.undo': function (value) {
      if (!this.no_model_action) {
        if (this.annotationDrawer.currentTool != null) {
          this.annotationDrawer.currentTool.stateRestorer.restoreToPoint(value);
        }
      }
      this.no_model_action = false;
    },
    tileSources(value) {
      this.viewer.open(value);
    },
    slideProperties: {
      immediate: true,
      deep: true,
      handler(newValue) {
        if (this.annotationDrawer != null) {
          this.annotationDrawer.pixelWidth = newValue.pixel_width;
        }
      },
    },
  },
  methods: {
    loadOverlayAnnotations(overlayAnnotations) {
      console.log('loadOverlayAnnotations', overlayAnnotations);
      if (this.annotationDrawer != null) {
        if (this.annotationDrawer.annotationSet.length === 1) {
          this.annotationDrawer.annotationSet.push({});
        }
        this.annotationDrawer.annotationSet[1] = overlayAnnotations;
        overlayAnnotations.forEach((annotation) => {
          annotation.drawer = this.annotationDrawer;
        });
        this.annotationDrawer.update();
      }
    },

    clearOverlayAnnotations() {
      console.log('clearOverlayAnnotations', 'WSIViewer');
      this.annotationDrawer.annotationSet.splice(1, 1);
      this.annotationDrawer.update();
    },

    editElement(annotation) {
      // this.editing.element = element;
      this.no_model_action = true;
      // this.annotationDrawer.editAnnotation(annotation);
    },
    concludeEdit() {
      this.annotationDrawer.concludeEdit();
    },
    cancelEdit() {
      this.annotationDrawer.cancelEdit();
    },
    peepAnnotation(annotation) {
      this.annotationDrawer.peep(annotation);
    },
    update() {
      this.annotationDrawer.update();
    },
  },
  mounted() {
    this.$nextTick(() => {
      const viewer = OpenSeadragon({
        id: 'seadragon-viewer',
        tileSources: this.tileSources,
        showNavigator: true,
        navigatorPosition: 'TOP_RIGHT',
        navigatorRight: '16px',
        navigatorBottom: '16px',
        navigatorHeight: '120px',
        navigatorWidth: '145px',
        showNavigationControl: false,
        gestureSettingsMouse: {
          clickToZoom: false,
        },
      });

      const delegateCallback = (callback, ...args) => {
        if (callback != null) {
          callback(...args);
        }
      };

      this.viewer = viewer;
      this.annotationDrawer = new AnnotationDrawer(viewer, {
        onViewportChanged: (viewport) => {
          this.viewportLocation = viewport;
          delegateCallback(this.drawEvents.onViewportChanged, viewport);
        },
        onHover: (element) => {
          delegateCallback(this.drawEvents.onHover, element);
        },
        onLeave: (element) => {
          delegateCallback(this.drawEvents.onLeave, element);
        },
        onClick: (element) => {
          delegateCallback(this.drawEvents.onClick, element);
        },
        onStateRestorerEvent: (stateRestorer) => {
          // console.log('onStateRestorerEvent', stateRestorer);
          this.no_model_action = true;
          if (stateRestorer != null) {
            this.stateRestorer.showing = true;
            this.stateRestorer.max_undo = stateRestorer.states.length - 1;
            this.stateRestorer.undo = stateRestorer.currentStatePoint;
          } else {
            this.stateRestorer.showing = false;
          }
          delegateCallback(this.drawEvents.onStateRestorerEvent, stateRestorer);
        },
        onEditingEvent: () => {
          this.no_model_action = true;
          const lastStateIndex = this.annotationDrawer.currently_editing.history.length - 1;
          this.editing.max_undo = lastStateIndex;
          this.editing.undo = lastStateIndex;
          delegateCallback(this.drawEvents.onEditingEvent);
        },
        onFinishNewDrawing: (annotation) => {
          // Creating a new label object:
          this.$emit('new-draw', annotation);
        },
        onInfoUpdate: (messages) => {
          this.info = messages;
        },
        onFinishedEditing: (changed, annotation) => {
          this.annotationDrawer.tool = null;
          if (changed) {
            this.$emit('edit-draw', annotation);
          }
          this.editing.element = null;
          delegateCallback(this.drawEvents.onFinishedEditing, changed, annotation);
        },
      });
      const self = this.annotationDrawer;
      if (this.value != null) {
        this.value.forEach((annotation) => {
          annotation.drawer = self;
        });
      }
      this.annotationDrawer.annotationSet[0] = this.value;
      this.annotationDrawer.tool = 'pointer';
      this.annotationDrawer.filtering = this.labelsVisibility;
      this.annotationDrawer.label = this.selectedLabel;
      this.annotationDrawer.pixelWidth = this.slideProperties.pixel_width;
      this.annotationDrawer.style = this.drawingStyle;
      this.annotationDrawer.update();
      this.viewer.addHandler('zoom', (e) => {
        this.no_model_action = true; // don't let the zoom listener take action
        this.zoom = e.zoom;
      });
      this.no_model_action = false;
    });
  },
  props: {
    drawer: {
      type: Boolean,
      default: true,
    },
    labels: { type: Array },
    value: { type: Array },
    tileSources: { type: String },
    labelsVisibility: { type: Object },
    drawingStyle: { type: Array },
    drawEvents: {},
    slideProperties: { type: Object },
  },
};
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
  height: auto;
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
