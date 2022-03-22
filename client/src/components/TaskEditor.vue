<template>
  <div>
    <!--  <v-form  v-if="task != null">-->
    <v-text-field label="Task name" v-model="task.name"/>
    <v-select label="Project" chips :items="projects" item-text="name"
              item-value="id" v-model="task.project_id"/>
    <v-tabs v-model="task.type">
      <v-tab :disabled="task.id != null || isAppContext">
        <v-simple-checkbox disabled :value="task.type === 0"/>
        User annotation
      </v-tab>
      <v-tab :disabled="task.id != null || isAppContext">
        <v-simple-checkbox disabled :value="task.type === 1"/>
        Revision
      </v-tab>
      <v-tab :disabled="task.id != null">
        <v-simple-checkbox disabled :value="task.type === 2"/>
        App annotation
      </v-tab>
    </v-tabs>
    <v-tabs-items v-if="task.id == null" v-model="taskType">
      <v-tab-item value="annotation">
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
      <v-tab-item value="revision">
        <v-select label="Tasks" v-model="review_task"
                  :items="reviewTaskList"
                  item-value="id" item-text="name"
                  return-object>
          <template v-slot:item="{ item, on, attrs  }">
            <v-list-item class="fit-window" three-line v-bind="attrs" v-on="on">
              <v-list-item-content>
                <v-list-item-title v-if="item.name !== ''">{{ item.name }}</v-list-item-title>
                <v-list-item-title v-else>Annotation task number #{{ item.id }}</v-list-item-title>
                <v-list-item-subtitle>Created: {{ item.created }}</v-list-item-subtitle>
                <v-list-item-action-text>
                  <span class="fake-chip" v-for="slide in item.slides" :key="slide.id">{{ slide.name }}</span>
                </v-list-item-action-text>
              </v-list-item-content>
              <v-list-item-action>
                <v-simple-checkbox disabled :value="attrs.inputValue" :ripple="false"/>
              </v-list-item-action>
            </v-list-item>
          </template>
        </v-select>
        <v-select v-if="task.task_id != null" label="Annotator"
                  v-model="task.revision"
                  :items="review_task.user_tasks"
                  item-value="id" item-text="app.name"
                  multiple>
          <template v-slot:item="{ item, on, attrs  }">
            <v-list-item class="fit-window" two-line v-bind="attrs" v-on="on">
              <v-list-item-content>
                <v-list-item-title v-if="'app' in item">{{ item.app.name }}</v-list-item-title>
                <v-list-item-title v-else>{{ item.user.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ taskLabel[item.task.type] }} ♦ Created: {{
                    item.created
                  }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-simple-checkbox disabled :value="attrs.inputValue" :ripple="false"/>
              </v-list-item-action>
            </v-list-item>
          </template>
        </v-select>
      </v-tab-item>
    </v-tabs-items>

    <v-select v-if="value.type === 2" label="Apps assigned" chips multiple
              :items="apps" item-text="name"
              v-model="task.assigned"
              return-object/>
    <v-select v-else label="Users assigned" chips multiple
              :items="users" item-text="username"
              v-model="task.assigned"
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
import _ from 'lodash';

export default {
  name: 'TaskEditor',
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.task = _.cloneDeep(newValue);
      },
    },

    color_picked(newValue) {
      // this.editing_label.color = `${new_value.rgba.r};${new_value.rgba.g};${new_value.rgba.b}`
      this.editing_label.color = [newValue.rgba.r, newValue.rgba.g, newValue.rgba.b];
    },
    'task.project_id': function (newProjectId) {
      if (newProjectId != null) {
        if (this.task.type === 1) {
          // We have to load this project's tasks:
          this.loadReviewTasks(newProjectId);
        } else {
          // We have to load this project's files:
          this.loadFiles(newProjectId);
        }
      }
    },
    'task.type': function (newValue) {
      if (newValue === 1 && this.reviewTaskList.length === 0) {
        this.loadReviewTasks(this.task.project_id);
      }
    },
    review_task(newValue) {
      this.task.task_id = newValue.id;
    },
  },
  computed: {
    currentUser() {
      return this.$store.state.user;
    },
    taskType() {
      if (this.task.type === 0 || this.task.type === 2) {
        return 'annotation';
      }
      return 'revision';
    },
    isAppContext() {
      return this.value.type === 2;
    },
  },
  data: () => ({
    task: null,
    editing_label: null,
    new_label: null,
    users: [],
    apps: [],
    projects: [],
    files: [],
    reviewTaskList: [],
    review_task: [],
    taskLabel: {
      0: 'Human annotation',
      2: 'App annotation'
    }
  }),
  methods: {
    loadUsers() {
      this.$get('user/list')
          .then((resp) => {
            this.users = resp;
          })
          .catch((err) => alert(err));
    },

    loadApps() {
      this.$get('app/list')
          .then((resp) => {
            this.apps = resp;
          })
          .catch((err) => alert(err));
    },

    loadProjects() {
      this.$get('project/list')
          .then((resp) => this.projects = resp)
          .catch((err) => alert(err));
    },

    loadReviewTasks(projectId) {
      this.$get('project/tasks?project_id=' + projectId)
          .then((resp) => {
            this.reviewTaskList = resp;
          })
          .catch((err) => alert(err));
    },

    save() {
      if (this.task.id == null) {
        this.$post('task/new', this.task)
            .then((resp) => {
              this.task = resp;
              this.$emit('input', resp);
              this.$emit('done', 'task');
            })
            .catch((err) => {
              alert(err);
            });
      } else {
        this.$post('task/edit', this.task)
            .then((resp) => {
              this.task = resp;
              this.$emit('input', resp);
              this.$emit('done', 'task');
            })
            .catch((err) => {
              alert(err);
            });
      }
    },
    loadFiles(projectId) {
      this.$get(`task/files?project_id=${projectId}`)
          .then((resp) => {
            this.files = resp;
          })
          .catch(() => {
            alert('Unable to locate the project\'s folder. Make sure the project is properly setup for the current environment.');
          });
    },
  },
  mounted() {
    this.loadProjects();
    if (this.isAppContext) {
      this.loadApps();
    } else {
      this.loadUsers();
    }
    if (this.task.project != null) {
      this.loadFiles(this.task.project.id);
    }
  },
  props: ['value'],
};
</script>

<style scoped>
.fit-window {
  max-width: 500px;
}

.fake-chip {
  margin-right: 2px;
  margin-left: 2px;
  border-radius: 10px;
  padding-left: 4px;
  padding-right: 4px;
  border: 1px dotted #37474f;
}
</style>
