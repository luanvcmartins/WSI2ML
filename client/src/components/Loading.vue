<template>
  <div>
    <div v-if="isLoading">
      <v-progress-circular :indeterminate="true" class="loading" size="52"/>
    </div>
    <div v-else>
      <v-fade-transition>
        <slot></slot>
      </v-fade-transition>
    </div>
  </div>
</template>

<script>
    export default {
        name: "Loading",
        watch: {
            loading: function () {
                console.log("loading", this.loading)
            }
        },
        props: ['isLoading']
    }
</script>

<style scoped>
  .loading {
    position: absolute;

    margin: auto;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

</style>