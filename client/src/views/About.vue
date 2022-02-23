<template>
  <Split style="height: 100%">
    <SplitArea :size="70">
      <v-container fluid grid-list-md>
        <v-layout row wrap>
          <v-flex  col="8" sm="5" md="8" lg="2" v-for="idx in data" >
            <v-card>
              <v-card-text>Item</v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </SplitArea>
    <SplitArea :size="30">
      <v-container fluid grid-list-md>
        <v-row >
          <v-col v-for="idx in data" sm="12" md="6" lg="2">
            <v-card>
              <v-card-text>Item</v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </SplitArea>
  </Split>
</template>
<script>
import SliceViewer from '../components/WSIViewer';
import AppBar from '../components/AppBar';

export default {
  name: 'about',
  components: { AppBar, SliceViewer },
  data: () => ({
    data: [],
  }),
  mounted() {
    for (let i = 0; i < 200; i++) this.data.push(`item #${i}`);
  },
};
</script>
