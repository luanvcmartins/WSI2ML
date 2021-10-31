<template>
  <v-container style="overflow: hidden">
    <slice-viewer
            ref="slice_viewer"
            :tile-sources="tile_sources"
            :labels="project_labels"
            :labels-visibility="labels_visible"
            :region-opacity="region_opacity"
            v-model="labelled[current_slide]"
            v-on:region-clicked="regionClicked"
            v-on:new-draw="onNewRegionDraw"
            v-on:edit-draw="onEditRegionDraw"/>
    <side-window>
      <v-toolbar dense color="grey lighten-4">
        <v-toolbar-title>Labelling task</v-toolbar-title>
        <template v-slot:extension>
          <v-tabs v-model="selected_tab">
            <v-tab>View</v-tab>
            <v-tab>Regions</v-tab>
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
                  <v-card-title>Region visibility by label</v-card-title>
                  <div class="pl-3 pr-3 pb-3">
                    <v-switch
                            class="mt-0"
                            hide-details dense
                            v-for="label in project_labels"
                            v-model="labels_visible[label.name]"
                            :label="label.name"
                            :color="genColor(label.color)"/>
                  </div>
                  <v-divider></v-divider>
                  <v-slider hide-details class="pl-2 pr-2"
                            prepend-icon="mdi-circle-opacity"
                            v-model="region_opacity"
                            step="0"
                            thumb-label
                            min="0.1" max="1">
                    <template v-slot:thumb-label="{ value }">
                      {{ value.toFixed(2) }}
                    </template>
                  </v-slider>
                </v-card>
              </v-flex>
              <v-flex cols="12" sm="12" md="6">
                <v-card>
                  <v-card-title class="ma-0">Task slides</v-card-title>
                  <div class="pl-3 pr-3 pb-3">
                    <v-radio-group hide-details v-model="current_slide">
                      <v-radio v-for="slide in slides" :value="slide.id" :label="slide.id"/>
                    </v-radio-group>
                  </div>
                </v-card>
              </v-flex>
            </v-layout>
          </v-container>
        </v-tab-item>
        <v-tab-item>
          <v-container fluid grid-list-md>
            <v-layout row wrap>
              <v-flex cols="12" sm="12" md="6" v-for="(region, idx) in labelled[current_slide]">
                <v-card :id="`region-${region.id}`" min-width="200" outlined>
                  <v-card-title>
                    <v-avatar size="16" class="mr-2"
                              :color="genColor(region.label.color)"/>
                    {{region.label.name}}
                  </v-card-title>
                  <v-card-text>
                    {{region.data.type}}.
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer/>
                    <v-btn text @click="editRegion(region)">Edit</v-btn>
                  </v-card-actions>
                </v-card>
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
    import SliceViewer from "../components/SliceViewer";
    import SideWindow from "../components/SideWindow";

    export default {
        name: "Session",
        computed: {
            session_id: function () {
                return this.$route.params.session_id
            },
            tile_sources: function () {
                return "http://localhost:2000/api/session/" + this.session_id + "/" + this.current_slide + ".dzi"
            },
            project_labels: function () {
                return this.$store.state.session.task.project.labels
            },
            session: function () {
                return this.$store.state.session
            },
            slides: function () {
                return this.$store.state.session.task.slides
            }
        },
        watch: {
            session: {
                immediate: true,
                handler: function (session) {
                    this.labelled = session.labelled
                    this.current_slide = session.task.slides[0].id
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
            }
        },
        data: () => {
            return {
                current_slide: null,
                labelled: {},
                selected_tab: 0,
                labels_visible: {},
                region_opacity: 0.3
            }
        },
        methods: {
            genColor(color) {
                return `rgb(${color[0]},${color[1]},${color[2]})`
            },

            onNewRegionDraw(labeledRegion) {
                labeledRegion.slide_id = this.current_slide
                this.$post("session/" + this.session_id + "/add_region", labeledRegion)
                    .then(resp => {
                        // Add the new region to the list
                        this.labelled[this.current_slide].push(resp)
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
                this.$post("session/" + this.session_id + "/edit_region", element)
                    .then(resp => {
                        // Add the new region to the list
                        console.log(resp)
                    })
                    .catch(err => {
                        alert("Error while saving region: " + err)
                    })
            },

            /**
             * User clicked on a region. We will highlighted it in the list
             *
             * @param region
             */
            regionClicked(region) {
                console.log("regionClicked", region)
                const element = document.getElementById(`region-${region.id}`)
                this.selected_tab = 1
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                })
                element.classList.add("highlighted")
                setTimeout(() => {
                    element.classList.remove("highlighted")
                }, 3000)
            },
            /**
             *
             * @param region
             */
            editRegion(region) {
                this.$refs.slice_viewer.editElement(region)
            },
            randomNumber(max) {
                return Math.floor(Math.random() * max);
            },
            stressTest() {
                const items = []
                console.time("creating mock data")
                for (let i = 0; i < 3000; i++) {
                    const points = [
                        {x: 1, y: 1,},
                        {x: 1, y: 50,},
                        {x: 50, y: 1,},
                    ]
                    for (let y = 0; y < 3; y++) {
                        points[y].x += i * 50
                        points[y].y += i * 25
                    }
                    items.push({
                        label: {id: 0, name: "Stresstest", color: [160, 160, 160]},
                        data: {
                            type: "polygon",
                            points: points,
                            color: [255, 165, 0]
                        }
                    })
                }
                console.timeEnd("creating mock data")
                console.time("updating data")
                this.labelled.push(...items)
                console.timeEnd("updating data")
            }
        },
        components: {SideWindow, SliceViewer}
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
</style>