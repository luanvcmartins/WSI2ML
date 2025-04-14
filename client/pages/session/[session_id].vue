<template>
  <v-container style="overflow: hidden" class="fill-height">
    <Teleport v-for="task in tasks" :key="task._id" :to="`#div-${task._id}`">
      <SlideManager :task="task"></SlideManager>
    </Teleport>
    <div id="gl-container" class="fill-height seadragon-viewer"></div>
    <v-btn @click="loadTask('67fbc530d1cbe4a96028722b')"></v-btn>
  </v-container>
</template>
<script setup>
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-light-theme.css';

import { nextTick, onMounted, createApp, h, render } from 'vue';
import { ComponentItem, GoldenLayout } from 'golden-layout';
import SlideManager from '~/components/SlideManager.vue';

const { $axios } = useNuxtApp();

const tasks = ref([]);
let layout = null;

onMounted(() => {
  nextTick(() => {
    const config = {
      type: 'row',
      content: [
        {
          type: 'row',
          content: []
        }
      ]
      //     {
      //       type: 'row',
      //       content: [
      //         {
      //           type: "row",
      //           content: []
      //         }
      //         // {
      //         //   type: 'component',
      //         //   componentState: {
      //         //     _id: '67fbc530d1cbe4a96028722b',
      //         //     project: {
      //         //       file: 'file-a'
      //         //     },
      //         //   },
      //         //   componentType: 'example', // must match registered type
      //         //   title: 'Page Title 1',
      //         //   id: 'Example',
      //         // },
      //         // {
      //         //   type: 'component',
      //         //   componentState: {
      //         //     _id: '67fbc530d1cbe4a96028722c',
      //         //     project: {
      //         //       file: 'file-b'
      //         //     },
      //         //   },
      //         //   componentType: 'example',
      //         //   title: 'Page Title 2',
      //         //   id: 'Example',
      //         // },
      //       ],
      //     },
      //   ],
    };
    layout = new GoldenLayout(document.getElementById('gl-container'));

    layout.registerComponentFactoryFunction('example', (container, state) => {
      console.log('Sending state:', state);
      const mountEl = document.createElement('div');
      mountEl.id = `div-${state._id}`;
      container.element.appendChild(mountEl);

      tasks.value.push(state);
      //
      // const vm = h(SlideManager, { ...state });
      // render(vm, mountEl); // from vue@3
      //
      // container.on('destroy', () => {
      //   render(null, mountEl);
      // });

      // const slideApp = createApp(SlideManager, { ...state });
      // slideApp._context = app._context;
      // const mountEl = document.createElement('div');
      // container.element.appendChild(mountEl);
      // slideApp.mount(mountEl);
      //
      // container.on('destroy', () => {
      //   slideApp.unmount();
      // });
    });

    layout.loadLayout({
      root: {
        type: 'column',
        content: [
          {
            type: 'stack', // this is like a tab group
            content: []
          }
        ]
      }
    });
  });
});

function findFirstStack(item) {
  if (item.type === 'stack') return item;
  if (!item.contentItems) return null;
  for (const child of item.contentItems) {
    const result = findFirstStack(child);
    if (result) return result;
  }
  return null;
}

function loadTask(sessionId) {
  $axios.get(`/session/${sessionId}`)
      .then(resp => {
        const rootStack = findFirstStack(layout.root);
        console.log(rootStack);
        const task = resp.data;
        rootStack.addItem(
            {
              type: 'component',
              componentState: resp.data,
              componentType: 'example',
              title: task.file,
            });
      });
}

definePageMeta({
  layout: 'empty',
});
</script>
<style scoped>
.seadragon-viewer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

</style>