<template>
  <div>
    <v-text-field label="App name" v-model="app.name"/>
    <v-textarea label="App description" v-model="app.description"/>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="save" outlined>Continue</v-btn>
    </v-card-actions>
  </div>
</template>

<script>
import _ from 'lodash';

export default {
  name: 'AppEditor',
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.app = _.cloneDeep(newValue);
      },
    },
  },
  data() {
    return {
      app: null,
    };
  },
  methods: {
    save() {
      if (this.app.id == null) {
        this.$post('app/new', this.app)
          .then((resp) => {
            this.app = resp;
            this.$emit('input', resp);
            this.$emit('done', 'task');
          })
          .catch((err) => {
            alert(err);
          });
      } else {
        this.$post('app/edit', this.app)
          .then((resp) => {
            this.app = resp;
            this.$emit('input', resp);
            this.$emit('done', 'task');
          })
          .catch((err) => {
            alert(err);
          });
      }
    },
  },
  props: ['value'],
};
</script>

<style scoped>

</style>
