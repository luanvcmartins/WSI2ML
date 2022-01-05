<template>
  <div>
    <!--  <v-form  v-if="task != null">-->
    <v-text-field label="Task name" v-model="task.name"/>
    <v-select label="Project" chips :items="projects" item-text="name" item-value="id" v-model="task.project_id"/>
    <span v-if="folders.length > 0" class="grey--text text--darken-2 text-body-2"
          style="font-size: 10px">Files from:</span>
    <v-treeview
            style="max-height: 300px; overflow-y: auto"
            :items="folders"
            selectable
            dense
            open-all
            item-text="name"
            item-value="id"
            return-object
            :readonly="task.project_id == null"
            v-model="task.folders"
            shaped
            hoverable
            selection-type="independent">
      <template v-slot:label="{ item }">
        <div>{{ item.name }} ({{item.total}} file(s), {{item.new}} new files)</div>
      </template>
    </v-treeview>
    <v-checkbox v-if="folders.length > 0" v-model="task.only_new" label="Only include new files"/>

    <v-select label="Divide between" chips multiple :items="users" item-text="username" v-model="task.assigned"
              return-object/>

    <span class="grey--text text--darken-2 text-body-2"
          style="font-size: 10px">Intersection: how many people should annotate each slide?</span>
    <v-slider v-model="task.concurrent"
              label="Intersection"
              min="1"
              :max="task.assigned.length"
              step="1"
              thumb-label
              ticks="always"
              tick-size="5"/>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="save" outlined>Continue</v-btn>
    </v-card-actions>
  </div>
</template>

<script>
    export default {
        name: "TaskBatch",
        watch: {
            "task.project_id": function (new_value) {
                if (new_value != null)
                    this.load_folders(new_value)
            },
        },
        data() {
            return {
                projects: null,
                users: null,
                folders: [],
                task: {
                    name: "",
                    project_id: null,
                    assigned: [],
                    folders: [],
                    concurrent: 1,
                    only_new: true
                }
            }
        },
        methods: {
            save() {
                this.$post("task/new_batch", this.task)
                    .then(res => {
                        let counter = ""
                        Object.entries(res.user_tasks).forEach(([name, count]) => {
                            counter += `${name} has ${count} new tasks.\n`
                        })
                        alert(`Successfully created ${res.new_tasks} new tasks.\n${counter}`)
                        this.$emit("done", "task")
                    })
                    .catch(err => alert(err))
            },

            load_projects() {
                this.$get("project/list")
                    .then(resp => this.projects = resp)
                    .catch(err => alert(err))
            },
            load_users() {
                this.$get("user/list")
                    .then(resp => this.users = resp)
                    .catch(err => alert(err))
            },
            load_folders(project_id) {
                this.$get("task/folders?project_id=" + project_id)
                    .then(resp => {
                        this.folders = resp
                    })
                    .catch(err => {
                        alert("Unable to locate the project's folder. Make sure the project is properly setup for the current environment.")
                    })
            }
        },
        mounted() {
            this.load_projects()
            this.load_users()
        }
    }
</script>

<style scoped>

</style>