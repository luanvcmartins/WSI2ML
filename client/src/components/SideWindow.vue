<template>
  <v-navigation-drawer ref="side_window" app right :width="width" v-model="shown">
    <slot></slot>
  </v-navigation-drawer>
</template>

<script>
export default {
  name: 'SideWindow',
  data: () => ({
    width: 300,
    shown: true,
    borderSize: 3,
  }),
  methods: {
    setBorderWidth() {
      const i = this.$refs.side_window.$el.querySelector(
          '.v-navigation-drawer__border'
      );
      i.style.width = `${this.borderSize}px`;
      i.style.cursor = 'ew-resize';
    },
    setEvents() {
      const minSize = this.borderSize + 300;
      const el = this.$refs.side_window.$el;
      const drawerBorder = el.querySelector('.v-navigation-drawer__border');
      const vm = this;
      const direction = el.classList.contains('v-navigation-drawer--right')
          ? 'right'
          : 'left';

      function resize(e) {
        document.body.style.cursor = 'ew-resize';
        const f = direction === 'right'
            ? document.body.scrollWidth - e.clientX
            : e.clientX;
        el.style.width = `${f}px`;
      }

      drawerBorder.addEventListener(
          'mousedown',
          (e) => {
            if (e.offsetX < minSize) {
              // m_pos = e.x;
              el.style.transition = 'initial';
              document.addEventListener('mousemove', resize, false);
            }
          },
          false
      );

      document.addEventListener(
          'mouseup',
          () => {
            el.style.transition = '';
            vm.width = el.style.width;
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', resize, false);
          },
          false,
      );
    },
  },
  mounted() {
    this.setBorderWidth();
    this.setEvents();
  },
};
</script>

<style scoped>
</style>
