# WSI Annotation Tool: client UI

The WSI Annotation System client UI was made in Vue.js. It uses OpenSeadragon to display the WSI files, which are served from OpenSlide on the backend. The UI was fully build from scratch, including all the annotation functionality, which doesn't exist on OpenSeadragon. This software uses the html canvas object to draw its annotations.

Wanna figure out how it works? Here are important files:
 - **views/Session.vue**: this is the task screen where the user will annotate WSIs. It depends on several other components.
 - **views/Admin.vue**: the management screen where the users with management permissions can manage the tasks, users and projects.
 - **views/Tasks.vue**: the "_welcome screen_" where annotators receive their tasks once they log in.
 - **SliceDrawer.js**: contains all the annotation drawing functionality. Once instantiated, it creates a canvas and draws to it.

Notice that project is set up to output the build files into the _dist_ folder, also included in the repository. The server will look into the _dist_ folder to server the client UI, which is handy when deploying the application.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```


### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
