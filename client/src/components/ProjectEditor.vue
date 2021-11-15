<template>
  <div>
    <!--  <v-form v-if="project != null">-->
    <v-text-field label="Project name" v-model="project.name"/>
    <v-textarea label="Project description" v-model="project.description"/>
    <v-text-field label="Files location" v-model="project.folder" :error-messages="path_errors" @input="check_path"/>
    <v-data-table :headers="header" :items="project.labels" :items-per-page="5">
      <template v-slot:item.color="{ item, idx }">
        <v-menu v-model="color_menu[item.name]" offset-y :close-on-content-click="false">
          <template v-slot:activator="{ on, attrs }">
            <div class="color-box"
                 @click="change_color(item)"
                 :style="gen_color(item)"
                 v-bind="attrs"
                 v-on="on"></div>
          </template>
          <v-card>
            <v-color-picker hide-inputs :swatches-max-height="100" show-swatches
                            v-model="color_picked"></v-color-picker>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="color_menu[item.name] = false">Done</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon small @click="remove_label(item)">
          mdi-delete
        </v-icon>
      </template>
    </v-data-table>
    <v-text-field
            filled
            label="New label"
            v-model="new_label"
            append-outer-icon="add"
            @click:append-outer="add_label"
    />
    <v-btn @click="save" outlined style="position: absolute; right:16px">Save</v-btn>
  </div>
</template>

<script>

    export default {
        name: "ProjectEditor",
        watch: {
            value: {
                immediate: true,
                handler: function (new_value) {
                    this.project = new_value
                }
            },

            color_picked: function (new_value) {
                // this.editing_label.color = `${new_value.rgba.r};${new_value.rgba.g};${new_value.rgba.b}`
                this.editing_label.color = [new_value.rgba.r, new_value.rgba.g, new_value.rgba.b]
            }
        },
        data: () => {
            return {
                project: null,
                color_picked: null,
                color_menu: [],
                header: [
                    {text: 'Label', value: 'name'},
                    {text: 'Color', value: 'color', sortable: false},
                    {text: "Actions", value: "actions"}
                ],
                path_errors: [],
                editing_label: null,
                new_label: null
            }
        },
        methods: {
            check_path(input) {
                if (input === "") {
                    this.path_errors = ["Path required"]
                } else {
                    this.$post("project/valid_path", {"path": input})
                        .then(resp => {
                            if (resp.valid_path) {
                                this.path_errors = []
                            } else {
                                this.path_errors = ["Path not found on environment"]
                            }
                        })
                        .catch(err => alert(err))
                }
            },

            add_label() {
                if (this.project == null)
                    this.project = {labels: []}
                if (this.project.labels == null)
                    this.project.labels = []
                this.project.labels.push({
                    "name": this.new_label,
                    "color": [255, 255, 255]
                })
                this.new_label = ""
            },

            change_color(item) {
                this.editing_label = item
            },

            gen_color(item) {
                const colors = item.color
                return `background-color: rgba(${colors[0]},${colors[1]},${colors[2]}, 1)`
            },
            save() {
                if (this.path_errors.length > 0)
                    alert("You need to fix the project's path before continuing.")
                else if (confirm("Are you sure you want to continue?")) {
                    if (this.project.id == null) {
                        this.$post("/project/new", this.project)
                            .then(resp => {
                                this.project = resp
                                this.$emit("input", this.project)
                            this.$emit("done", "project")
                            })
                            .catch(err => {
                                alert(err)
                            })
                    } else {
                        this.$post("/project/edit", this.project)
                            .then(resp => {
                                this.project = resp
                                this.$emit("input", this.project)
                            this.$emit("done", "project")
                            })
                            .catch(err => {
                                alert(err)
                            })
                    }
                }
            },
            remove_label(label) {
                if (label.id == null) {
                    // No id, simple remove item from the list
                    this.project.labels = this.project.labels.filter(item => item !== label)
                } else {
                    // Request removal from the the database
                    this.$post("/project/remove_label", label)
                        .then(resp => {
                                this.project.labels = this.project.labels.filter(item => item.id !== label.id)
                                this.$emit("input", this.project)
                            }
                        )
                        .catch(err => alert(err))
                }
            }
        },
        mounted() {
            // this.load_users()
        }
        ,
        props: ['value']
    }
</script>

<style scoped>
  .color-box {
    height: 30px;
    width: 60px;
    border: black 1px solid;
  }
</style>