<template>
  <div>
    <!--  <v-form  v-if="task != null">-->
    <v-text-field label="Task name" v-model="task.name"/>
    <v-select label="Project" chips :items="projects" item-text="name" item-value="id" v-model="task.project_id"/>
    <v-tabs v-model="task.type">
      <v-tab :disabled="task.id != null">
        <v-simple-checkbox disabled :value="task.type === 0"/>
        Annotate
      </v-tab>
      <v-tab :disabled="task.id != null">
        <v-simple-checkbox disabled :value="task.type === 1"/>
        Revision
      </v-tab>
    </v-tabs>
    <v-tabs-items v-if="task.id == null" v-model="task.type">
      <v-tab-item>
        <!--        <v-select :label="`File to analyze ${current_folder != null ? `(from ${current_folder})` : '' }`"-->
        <!--                  v-model="task.slides"-->
        <!--                  :items="files" :readonly="task.project_id == null"-->
        <!--                  item-text="id"-->
        <!--                  multiple-->
        <!--                  chips-->
        <!--                  deletable-chips-->
        <!--                  return-object/>-->
        <div style="overflow-y: auto">
          <v-scroll-x-transition group hide-on-leave>
            <v-chip v-for="(selection, i) in task.slides" :key="i" color="grey"
                    dark small class="ma-1">
              <v-icon left small>
                mdi-file
              </v-icon>
              {{ selection.name }}
            </v-chip>
          </v-scroll-x-transition>
        </div>
        <v-treeview
                style="max-height: 300px; overflow-y: auto"
                :items="files"
                selectable
                dense
                open-on-click
                item-text="name"
                :readonly="task.project_id == null"
                v-model="task.slides"
                return-object
                shaped
                hoverable
                selection-type="leaf"/>
      </v-tab-item>
      <v-tab-item>
        <v-select label="Tasks" v-model="review_task" :items="review_task_list" item-value="id" item-text="name"
                  return-object/>
        <v-select v-if="task.task_id != null" label="Users"
                  v-model="task.revision"
                  :items="review_task.user_tasks"
                  item-value="id" item-text="user.name"
                  multiple/>
      </v-tab-item>
    </v-tabs-items>

    <v-select label="Users assigned" chips multiple :items="users" item-text="username" v-model="task.assigned"
              return-object/>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="save" outlined>Continue</v-btn>
    </v-card-actions>
    <!--    -->
    <!--  </v-form>-->

  </div>
</template>

<script>
    import _ from "lodash"

    export default {
        name: "TaskEditor",
        watch: {
            value: {
                immediate: true,
                handler: function (new_value) {
                    this.task = _.cloneDeep(new_value)
                }
            },

            color_picked: function (new_value) {
                // this.editing_label.color = `${new_value.rgba.r};${new_value.rgba.g};${new_value.rgba.b}`
                this.editing_label.color = [new_value.rgba.r, new_value.rgba.g, new_value.rgba.b]
            },
            "task.project_id": function (new_value) {
                if (new_value != null)
                    this.load_files(new_value)
            },
            "task.type": function (new_value) {
                if (new_value === 1 && this.review_task_list == null) {
                    this.load_review_tasks()
                }
            },
            review_task: function (new_value) {
                this.task.task_id = new_value.id
            }
        },
        computed: {
            current_folder: function () {
                if (this.task != null) {
                    if (this.task.project != null) {
                        // We already have a project object read the folder
                        console.log(this.task.project)
                        return this.task.project.folder
                    } else if (this.task.project_id != null && this.projects.length === 0) {
                        // We have a assigned project id, we can search for it
                        const project_id = this.task.project_id
                        return this.projects.filter(item => item.id === project_id)[0].folder
                    }
                }
            }
        },
        data: () => {
            return {
                task: null,
                editing_label: null,
                new_label: null,
                users: [],
                projects: [],
                files: [],
                review_task_list: null,
                review_task: []
            }
        },
        methods: {
            load_users() {
                this.$get("user/list")
                    .then(resp => this.users = resp)
                    .catch(err => alert(err))
            },

            load_projects() {
                this.$get("project/list")
                    .then(resp => this.projects = resp)
                    .catch(err => alert(err))
            },

            load_review_tasks() {
                this.$get("project/tasks")
                    .then(resp => this.review_task_list = resp)
                    .catch(err => alert(err))
            },

            save() {
                if (this.task.id == null) {
                    this.$post("task/new", this.task)
                        .then(resp => {
                            this.task = resp
                            this.$emit("input", resp)
                            this.$emit("done", "task")
                        })
                        .catch(err => {
                            alert(err)
                        })
                } else {
                    this.$post("task/edit", this.task)
                        .then(resp => {
                            this.task = resp
                            this.$emit("input", resp)
                            this.$emit("done", "task")
                        })
                        .catch(err => {
                            alert(err)
                        })
                }
            },
            load_files(project_id) {
                this.$get("task/files?project_id=" + project_id)
                    .then(resp => {
                        this.files = resp
                    })
                    .catch(err => {
                        alert("Unable to locate the project's folder. Make sure the project is properly setup for the current environment.")
                    })
            }
        },
        mounted() {
            this.load_users()
            this.load_projects()
            if (this.task.project != null)
                this.load_files(this.task.project.id)
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