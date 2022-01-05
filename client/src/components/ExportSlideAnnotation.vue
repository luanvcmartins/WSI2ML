<template>
  <v-card tile v-if="selected_project != null">
    <v-toolbar flat dark dense color="primary">
      <v-btn icon dark @click="dialog = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-toolbar-title v-text="selected_project.name"/>
    </v-toolbar>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col v-for="slide in selected_project.slides" :key="slide.id" md="6">
            <v-card>
              <v-card-title v-text="slide.name"/>
              <v-card-text v-if="slide.annotated.length === 0">
                This slide has received no annotations yet.
              </v-card-text>
              <v-card-text v-else>
                <div class="text-body-1">Annotations:</div>
                <v-expansion-panels multiple hover accordion>
                  <v-expansion-panel
                          v-for="annotation in slide.annotated"
                          :key="annotation.user_task_id"
                          v-on:change="panelChanged(slide, annotation)">
                    <v-expansion-panel-header disable-icon-rotate>
                      <template v-slot:default="{ open }">
                        <v-row no-gutters>
                          <v-col cols="5">
                            <v-icon v-if="open">
                              mdi-check
                            </v-icon>
                            {{annotation.user_name}} (total annotations: {{annotation.annotation_count}})
                          </v-col>
                          <v-col cols="7" class="text--secondary">
                            <v-fade-transition leave-absolute>
                              <span v-if="open">{{annotation.annotation_count}} unfiltered annotations</span>
                              <span v-else>Currently not selected for exporting</span>
                            </v-fade-transition>
                          </v-col>
                        </v-row>
                      </template>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content style="border: darkgrey 1px dotted; background-color: whitesmoke;">
                      <div v-if="annotation.reviews != null && annotation.reviews.length > 0">
                        <p class="ma-0 text-muted">Include only annotations revised by:</p>
                        <v-chip-group v-model="exporting.selected[slide.id][annotation.user_task_id]" multiple
                                      column>
                          <v-chip pill outlined filter
                                  v-for="review in annotation.reviews" class="ma-1"
                                  :value="review.revision_user_task_id"
                                  :key="review.revision_user_task_id">
                            {{review.revision_by_name}} ({{review.revision_count}} annotations)
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
              <v-card-actions v-if="slide.exporting != null">
                <p class="ma-1 grey--text">Exporting {{slide.exporting.count}} annotations from this slide</p>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script>
    export default {
        name: "ExportSlideAnnotation",
        props: ["projectId"]
    }
</script>

<style scoped>

</style>