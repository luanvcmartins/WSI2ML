<template>
  <div>
    <!--  <v-form v-if="project != null">-->
    <v-text-field label="Project name" v-model="project.name"/>
    <v-textarea label="Project description" v-model="project.description"/>
    <v-text-field label="Files location" v-model="project.folder"/>
    <v-data-table :headers="header" :items="project.labels" :items-per-page="5">
      <template v-slot:item.actions="{ item }">
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <div class="color-box"
                 @click="change_color(item)"
                 :style="gen_color(item)"
                 v-bind="attrs"
                 v-on="on"></div>
          </template>
          <v-color-picker v-model="color_picked"></v-color-picker>
        </v-menu>
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
    <!--    <v-select chips multiple :items="users" item-text="username" item-value="id"/>-->
    <!--  </v-form>-->
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
                header: [
                    {text: 'Label', value: 'name'},
                    {text: 'Config', value: 'actions', sortable: false},
                ],
                editing_label: null,
                new_label: null
            }
        },
        methods: {
            // load_users() {
            //     this.$get("user/list")
            //         .then(resp => this.users = resp)
            //         .catch(err => alert(err))
            // }
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
                if (this.project.id == null) {
                    this.$post("/project/new", this.project)
                        .then(resp => {
                            this.project = resp
                            this.$emit("input", this.project)
                        })
                        .catch(err => {
                            alert(err)
                        })
                }
            }
        },
        mounted() {
            // this.load_users()
        },
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