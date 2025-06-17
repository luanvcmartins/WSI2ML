import { ref, h } from "vue";
import { VMenu } from "vuetify/components/VMenu";

export const useContextMenu = () => {
  const show = ref(false);
  const x = ref(0);
  const y = ref(0);

  const ContextMenu = {
    setup(_, { slots, attrs }) {
      return () =>
        h(
          VMenu,
          {
            modelValue: show.value,
            target: [x.value, y.value],
            locationStrategy: "connected",
            scrim: false,
            ...attrs,
            "onUpdate:modelValue": ($event) => (show.value = $event),
          },
          slots,
        );
    },
  };

  const openFromEvent = (ev) => {
    x.value = ev.clientX;
    y.value = ev.clientY;
    show.value = true;
  };

  return {
    show,
    x,
    y,
    ContextMenu,
    openFromEvent,
  };
};