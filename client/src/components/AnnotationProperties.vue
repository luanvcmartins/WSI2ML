<template>
  <v-card>
    <v-card-title class="text-h5 grey lighten-2">
      Annotation properties
    </v-card-title>

    <v-card-text>

    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
          color="primary"
          text
          @click="dialog = false"
      >
        OK
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'AnnotationProperties',
  computed: {
    properties() {
      return this.value;
    },
  },
  data() {
    return {};
  },
  props: ['value'],
};
</script>

<style scoped>

</style>
