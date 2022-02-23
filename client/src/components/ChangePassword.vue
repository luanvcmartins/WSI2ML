<template>
  <v-dialog v-model="value" width="300">
    <v-card>
      <v-card-title class="text-h5 grey lighten-2">
        Change password
      </v-card-title>

      <v-card-text>
        <v-text-field v-model="password" label="New password" type="password"/>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close">Cancel</v-btn>
        <v-btn color="primary" text @click="submit">
          Change password
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ChangePassword',
  watch: {},
  data() {
    return {
      password: null
    };
  },
  methods: {
    close() {
      this.$emit('input', false);
    },
    submit() {
      this.$post('user/change_password', { password: this.password })
          .then(resp => {
            this.$emit('input', false);
          })
          .catch(err => alert(err));
    }
  },
  props: ['value']
};
</script>

<style scoped>

</style>
