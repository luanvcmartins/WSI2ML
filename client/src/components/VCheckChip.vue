<template>
  <v-chip filter :color="color" v-model="value" @click="$emit('input', !value)">
    <slot></slot>
  </v-chip>
</template>

<script>
export default {
  name: 'VCheckChip',
  props: ['value', 'color'],
};
</script>

<style scoped>

</style>
