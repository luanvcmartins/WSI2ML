(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-35e0dac4"],{"0cd8":function(t,e,n){"use strict";var a=n("5ca1"),i=n("7b23");a(a.P+a.F*!n("2f21")([].reduce,!0),"Array",{reduce:function(t){return i(this,t,arguments.length,arguments[1],!1)}})},"1c01":function(t,e,n){var a=n("5ca1");a(a.S+a.F*!n("9e1e"),"Object",{defineProperty:n("86cc").f})},2677:function(t,e,n){"use strict";var a=n("8654");e["a"]=a["a"]},"2caf":function(t,e,n){var a=n("5ca1");a(a.S,"Array",{isArray:n("1169")})},5803:function(t,e,n){},"58b2":function(t,e,n){var a=n("5ca1");a(a.S+a.F*!n("9e1e"),"Object",{defineProperties:n("1495")})},"7b23":function(t,e,n){var a=n("d8e8"),i=n("4bf8"),r=n("626a"),o=n("9def");t.exports=function(t,e,n,s,c){a(e);var l=i(t),u=r(l),p=o(l.length),d=c?p-1:0,f=c?-1:1;if(n<2)for(;;){if(d in u){s=u[d],d+=f;break}if(d+=f,c?d<0:p<=d)throw TypeError("Reduce of empty array with no initial value")}for(;c?d>=0:p>d;d+=f)d in u&&(s=e(s,u[d],d,l));return s}},e082:function(t,e,n){"use strict";n.r(e);var a=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("loading-content",{attrs:{"is-loading":t.isLoading}},[n("v-container",[n("v-row",[n("v-col",[n("v-card",[n("v-toolbar",{attrs:{dense:"",outlined:"",elevation:"0",extended:""},scopedSlots:t._u([{key:"extension",fn:function(){return[n("v-tabs",{model:{value:t.config.selected_tab,callback:function(e){t.$set(t.config,"selected_tab",e)},expression:"config.selected_tab"}},t._l(t.apps_tasks.projects,(function(e){return n("v-tab",{key:e.id},[t._v("\n                  "+t._s(e.name)+"\n                ")])})),1)]},proxy:!0}])},[n("v-toolbar-title",[t._v("\n              App classification tasks\n            ")]),n("v-spacer"),n("v-toolbar-items",[n("v-btn",{attrs:{text:""},on:{click:t.newTask}},[t._v("Create task")])],1)],1),t.apps_tasks.projects.length>0?n("v-card-text",[n("v-data-table",{attrs:{headers:t.config.app_task,items:t.apps_tasks.tasks[t.projectId],"items-per-page":10,expanded:t.config.extended_tasks,"show-expand":""},on:{"update:expanded":function(e){return t.$set(t.config,"extended_tasks",e)}},scopedSlots:t._u([{key:"item.slides",fn:function(e){var a=e.item;return[n("v-chip-group",{attrs:{column:"","show-arrows":""}},t._l(a.slides,(function(e){return n("v-chip",{staticStyle:{"pointer-events":"none"},attrs:{outlined:"",readonly:!0}},[t._v("\n                    "+t._s(e.name)+"\n                  ")])})),1)]}},{key:"item.actions",fn:function(e){var a=e.item;return[n("v-btn",{attrs:{rounded:"",elevation:"0",color:"orange accent-4",dark:""},on:{click:function(e){return t.newAppTask(a)}}},[n("v-icon",[t._v("mdi-plus")]),t._v("\n                  New app task\n                ")],1)]}},{key:"expanded-item",fn:function(e){var a=e.headers,i=e.item;return[n("td",{attrs:{colspan:a.length}},[n("v-row",[n("v-chip-group",t._l(i.app_tasks,(function(e){return n("v-chip",{key:e.user_task_id,attrs:{color:e.completed?"gray":"orange"},on:{click:function(n){return t.openSession(i,e)}}},[n("v-icon",{attrs:{left:""}},[t._v("\n                          mdi-play\n                        ")]),t._v("\n                        "+t._s(e.app_name)+" ("+t._s(e.created)+")\n                      ")],1)})),1)],1)],1)]}}],null,!1,684081381)})],1):n("v-card-text",[t._v("\n            No task registered yet.\n          ")]),n("v-card-actions")],1)],1)],1),n("v-row",[n("v-col",[n("v-card",[n("v-toolbar",{attrs:{dense:"",outlined:"",elevation:"0"}},[n("v-toolbar-title",[t._v("Your apps")]),n("v-spacer"),n("v-toolbar-items",[n("v-btn",{attrs:{text:""},on:{click:t.newApp}},[t._v("New app")])],1)],1),n("v-card-text",[n("v-data-table",{attrs:{headers:t.config.app_table_header,items:t.apps,"items-per-page":5,expanded:t.config.extended_apps},on:{"update:expanded":function(e){return t.$set(t.config,"extended_apps",e)}},scopedSlots:t._u([{key:"item.actions",fn:function(e){var a=e.item;return[n("v-btn",{attrs:{rounded:"",elevation:"0",color:"orange accent-4",dark:""},on:{click:function(e){return t.newAppToken(a)}}},[n("v-icon",[t._v("mdi-plus")]),t._v("\n                  Access token\n                ")],1)]}}])})],1)],1)],1)],1),t.drawer?n("v-navigation-drawer",{attrs:{app:"",temporary:"",stateless:"",right:"",width:"500px"},model:{value:t.drawer,callback:function(e){t.drawer=e},expression:"drawer"}},[n("v-toolbar",[n("v-toolbar-title",[n("v-icon",{staticClass:"mr-1",attrs:{large:""},on:{click:function(e){t.drawer=!1}}},[t._v("mdi-close")]),t._v("\n          Information editor\n        ")],1)],1),n("v-container",["app"===t.mode?n("app-editor",{on:{done:t.done},model:{value:t.current,callback:function(e){t.current=e},expression:"current"}}):"task"===t.mode?n("task-editor",{on:{done:t.done},model:{value:t.current,callback:function(e){t.current=e},expression:"current"}}):"app-task"===t.mode?n("app-task-editor",{on:{done:t.done},model:{value:t.current,callback:function(e){t.current=e},expression:"current"}}):t._e()],1)],1):t._e(),n("v-dialog",{attrs:{"max-width":"500"},model:{value:t.config.dialog,callback:function(e){t.$set(t.config,"dialog",e)},expression:"config.dialog"}},[n("v-card",[n("v-card-title",[t._v("Temporary app token")]),n("v-card-text",[n("v-textarea",{attrs:{readonly:"",label:"App token"},model:{value:t.config.dialog_token,callback:function(e){t.$set(t.config,"dialog_token",e)},expression:"config.dialog_token"}})],1),n("v-divider"),n("v-card-actions",[n("v-spacer"),n("v-btn",{attrs:{text:""},on:{click:function(e){t.config.dialog=!1}}},[t._v("Continue")])],1)],1)],1)],1)],1)},i=[],r=n("9d34"),o=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("v-text-field",{attrs:{label:"App name"},model:{value:t.app.name,callback:function(e){t.$set(t.app,"name",e)},expression:"app.name"}}),n("v-textarea",{attrs:{label:"App description"},model:{value:t.app.description,callback:function(e){t.$set(t.app,"description",e)},expression:"app.description"}}),n("v-card-actions",[n("v-spacer"),n("v-btn",{attrs:{outlined:""},on:{click:t.save}},[t._v("Continue")])],1)],1)},s=[],c=n("2ef0"),l=n.n(c),u={name:"AppEditor",watch:{value:{immediate:!0,handler:function(t){this.app=l.a.cloneDeep(t)}}},data:function(){return{app:null}},methods:{save:function(){var t=this;null==this.app.id?this.$post("app/new",this.app).then((function(e){t.app=e,t.$emit("input",e),t.$emit("done","task")})).catch((function(t){alert(t)})):this.$post("app/edit",this.app).then((function(e){t.app=e,t.$emit("input",e),t.$emit("done","task")})).catch((function(t){alert(t)}))}},props:["value"]},p=u,d=n("2877"),f=n("6544"),h=n.n(f),v=n("8336"),m=n("99d9"),b=n("2fa4"),g=n("8654"),_=n("a844"),k=Object(d["a"])(p,o,s,!1,null,"7cb438fc",null),y=k.exports;h()(k,{VBtn:v["a"],VCardActions:m["a"],VSpacer:b["a"],VTextField:g["a"],VTextarea:_["a"]});var x=n("7607"),w=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("v-select",{attrs:{label:"App task",chips:"",items:t.apps,"item-text":"name","return-object":""},model:{value:t.app,callback:function(e){t.app=e},expression:"app"}}),n("v-tabs",{model:{value:t.annotate,callback:function(e){t.annotate=e},expression:"annotate"}},[n("v-tab",[t._v("None")]),n("v-tab",[t._v("Geojson")]),n("v-tab",[t._v("Triton")])],1),n("v-tabs-items",{model:{value:t.annotate,callback:function(e){t.annotate=e},expression:"annotate"}},[n("v-tab-item",[t._v("Create an empty task to be annotated later on.")]),n("v-tab-item",[t._v("\n      Register annotations from previously generated GeoJSON file.\n      "),n("v-form",t._l(t.task.slides,(function(e){return n("v-file-input",{attrs:{label:e.name+"'s GeoJSON",id:"annotation-file-"+e.id,"persistent-hint":"",hint:e.id in t.annotations?t.annotations[e.id].length+" annotations loaded.":"Select GeoJSON file"},on:{change:function(n){return t.loadGeoJSON(e.id)}}})})),1)],1),n("v-tab-item",[t._v("\n      Annotate from inference server.\n      "),n("v-text-field",{attrs:{label:"Inference server URL",type:"uri"}})],1)],1),n("v-card-actions",[n("v-spacer"),n("v-btn",{attrs:{outlined:""},on:{click:t.save}},[t._v("Continue")])],1)],1)},V=[],O=(n("6d67"),n("167a")),S={name:"AppTaskEditor",watch:{value:{immediate:!0,handler:function(t){this.task=l.a.cloneDeep(t)}}},data:function(){return{task:{},app:null,apps:[],annotate:0,annotations:{}}},methods:{loadGeoJSON:function(t){var e={};t in e||(e[t]=[]);var n=new FileReader,a=document.getElementById("annotation-file-".concat(t));n.readAsText(a.files[0],"UTF-8"),n.onload=function(n){var a=JSON.parse(n.target.result);e[t]=a.features.map((function(e,n){var a=e.geometry,i=e.properties;return{label_id:i.label_id,title:i.title,geometry:{type:"polygon",points:Object(O["d"])(a.coordinates[0].map((function(t){return{x:t[0],y:t[1]}})))},slide_id:t}}))},this.annotations=e},loadApps:function(){var t=this;this.$get("app/list").then((function(e){t.apps=e})).catch((function(t){return alert(t)}))},save:function(){var t=this,e={annotation_id:this.value.id,app_id:this.app.id,annotations:this.annotations};this.$post("task/new_app_task",e).then((function(e){t.$emit("done")})).catch((function(t){return alert(t)}))}},mounted:function(){this.loadApps()},props:["value"]},j=S,$=(n("1c01"),n("58b2"),n("8e6e"),n("d25f"),n("456d"),n("2909")),T=(n("ac6a"),n("f3e2"),n("7f7f"),n("0cd8"),n("ade3")),A=n("53ca"),C=(n("2caf"),n("6762"),n("2fdb"),n("c5f6"),n("5803"),n("2677")),I=n("cc20"),B=n("80d2"),D=n("d9bd"),E=n("d9f7");function P(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,a)}return n}function z(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?P(Object(n),!0).forEach((function(e){Object(T["a"])(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):P(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}var N=C["a"].extend({name:"v-file-input",model:{prop:"value",event:"change"},props:{chips:Boolean,clearable:{type:Boolean,default:!0},counterSizeString:{type:String,default:"$vuetify.fileInput.counterSize"},counterString:{type:String,default:"$vuetify.fileInput.counter"},hideInput:Boolean,multiple:Boolean,placeholder:String,prependIcon:{type:String,default:"$file"},readonly:{type:Boolean,default:!1},showSize:{type:[Boolean,Number],default:!1,validator:function(t){return"boolean"===typeof t||[1e3,1024].includes(t)}},smallChips:Boolean,truncateLength:{type:[Number,String],default:22},type:{type:String,default:"file"},value:{default:void 0,validator:function(t){return Object(B["I"])(t).every((function(t){return null!=t&&"object"===Object(A["a"])(t)}))}}},computed:{classes:function(){return z(z({},C["a"].options.computed.classes.call(this)),{},{"v-file-input":!0})},computedCounterValue:function(){var t=this.multiple&&this.lazyValue?this.lazyValue.length:this.lazyValue instanceof File?1:0;if(!this.showSize)return this.$vuetify.lang.t(this.counterString,t);var e=this.internalArrayValue.reduce((function(t,e){var n=e.size,a=void 0===n?0:n;return t+a}),0);return this.$vuetify.lang.t(this.counterSizeString,t,Object(B["x"])(e,1024===this.base))},internalArrayValue:function(){return Object(B["I"])(this.internalValue)},internalValue:{get:function(){return this.lazyValue},set:function(t){this.lazyValue=t,this.$emit("change",this.lazyValue)}},isDirty:function(){return this.internalArrayValue.length>0},isLabelActive:function(){return this.isDirty},text:function(){var t=this;return this.isDirty||!this.persistentPlaceholder&&!this.isFocused&&this.hasLabel?this.internalArrayValue.map((function(e){var n=e.name,a=void 0===n?"":n,i=e.size,r=void 0===i?0:i,o=t.truncateText(a);return t.showSize?"".concat(o," (").concat(Object(B["x"])(r,1024===t.base),")"):o})):[this.placeholder]},base:function(){return"boolean"!==typeof this.showSize?this.showSize:void 0},hasChips:function(){return this.chips||this.smallChips}},watch:{readonly:{handler:function(t){!0===t&&Object(D["b"])("readonly is not supported on <v-file-input>",this)},immediate:!0},value:function(t){var e=this.multiple?t:t?[t]:[];Object(B["k"])(e,this.$refs.input.files)||(this.$refs.input.value="")}},methods:{clearableCallback:function(){this.internalValue=this.multiple?[]:null,this.$refs.input.value=""},genChips:function(){var t=this;return this.isDirty?this.text.map((function(e,n){return t.$createElement(I["a"],{props:{small:t.smallChips},on:{"click:close":function(){var e=t.internalValue;e.splice(n,1),t.internalValue=e}}},[e])})):[]},genControl:function(){var t=C["a"].options.methods.genControl.call(this);return this.hideInput&&(t.data.style=Object(E["d"])(t.data.style,{display:"none"})),t},genInput:function(){var t=C["a"].options.methods.genInput.call(this);return t.data.attrs.multiple=this.multiple,delete t.data.domProps.value,delete t.data.on.input,t.data.on.change=this.onInput,[this.genSelections(),t]},genPrependSlot:function(){var t=this;if(!this.prependIcon)return null;var e=this.genIcon("prepend",(function(){t.$refs.input.click()}));return this.genSlot("prepend","outer",[e])},genSelectionText:function(){var t=this.text.length;return t<2?this.text:this.showSize&&!this.counter?[this.computedCounterValue]:[this.$vuetify.lang.t(this.counterString,t)]},genSelections:function(){var t=this,e=[];return this.isDirty&&this.$scopedSlots.selection?this.internalArrayValue.forEach((function(n,a){t.$scopedSlots.selection&&e.push(t.$scopedSlots.selection({text:t.text[a],file:n,index:a}))})):e.push(this.hasChips&&this.isDirty?this.genChips():this.genSelectionText()),this.$createElement("div",{staticClass:"v-file-input__text",class:{"v-file-input__text--placeholder":this.placeholder&&!this.isDirty,"v-file-input__text--chips":this.hasChips&&!this.$scopedSlots.selection}},e)},genTextFieldSlot:function(){var t=this,e=C["a"].options.methods.genTextFieldSlot.call(this);return e.data.on=z(z({},e.data.on||{}),{},{click:function(){return t.$refs.input.click()}}),e},onInput:function(t){var e=Object($["a"])(t.target.files||[]);this.internalValue=this.multiple?e:e[0],this.initialValue=this.internalValue},onKeyDown:function(t){this.$emit("keydown",t)},truncateText:function(t){if(t.length<Number(this.truncateLength))return t;var e=Math.floor((Number(this.truncateLength)-1)/2);return"".concat(t.slice(0,e),"…").concat(t.slice(t.length-e))}}}),F=(n("7514"),n("8615"),n("58df")),L=n("7e2b"),J=n("3206");function G(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,a)}return n}function R(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?G(Object(n),!0).forEach((function(e){Object(T["a"])(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):G(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}var U=Object(F["a"])(L["a"],Object(J["b"])("form")).extend({name:"v-form",provide:function(){return{form:this}},inheritAttrs:!1,props:{disabled:Boolean,lazyValidation:Boolean,readonly:Boolean,value:Boolean},data:function(){return{inputs:[],watchers:[],errorBag:{}}},watch:{errorBag:{handler:function(t){var e=Object.values(t).includes(!0);this.$emit("input",!e)},deep:!0,immediate:!0}},methods:{watchInput:function(t){var e=this,n=function(t){return t.$watch("hasError",(function(n){e.$set(e.errorBag,t._uid,n)}),{immediate:!0})},a={_uid:t._uid,valid:function(){},shouldValidate:function(){}};return this.lazyValidation?a.shouldValidate=t.$watch("shouldValidate",(function(i){i&&(e.errorBag.hasOwnProperty(t._uid)||(a.valid=n(t)))})):a.valid=n(t),a},validate:function(){return 0===this.inputs.filter((function(t){return!t.validate(!0)})).length},reset:function(){this.inputs.forEach((function(t){return t.reset()})),this.resetErrorBag()},resetErrorBag:function(){var t=this;this.lazyValidation&&setTimeout((function(){t.errorBag={}}),0)},resetValidation:function(){this.inputs.forEach((function(t){return t.resetValidation()})),this.resetErrorBag()},register:function(t){this.inputs.push(t),this.watchers.push(this.watchInput(t))},unregister:function(t){var e=this.inputs.find((function(e){return e._uid===t._uid}));if(e){var n=this.watchers.find((function(t){return t._uid===e._uid}));n&&(n.valid(),n.shouldValidate()),this.watchers=this.watchers.filter((function(t){return t._uid!==e._uid})),this.inputs=this.inputs.filter((function(t){return t._uid!==e._uid})),this.$delete(this.errorBag,e._uid)}}},render:function(t){var e=this;return t("form",{staticClass:"v-form",attrs:R({novalidate:!0},this.attrs$),on:{submit:function(t){return e.$emit("submit",t)}}},this.$slots.default)}}),K=n("b974"),M=n("71a3"),Y=n("c671"),q=n("fe57"),H=n("aac8"),Q=Object(d["a"])(j,w,V,!1,null,"29aea268",null),W=Q.exports;h()(Q,{VBtn:v["a"],VCardActions:m["a"],VFileInput:N,VForm:U,VSelect:K["a"],VSpacer:b["a"],VTab:M["a"],VTabItem:Y["a"],VTabs:q["a"],VTabsItems:H["a"],VTextField:g["a"]});var X={name:"Apps",computed:{projectId:function(){return this.apps_tasks.projects[this.config.selected_tab].id}},data:function(){return{isLoading:!0,mode:"new-app",drawer:!1,current:null,apps:null,apps_tasks:{projects:[],tasks:{}},config:{extended_tasks:[],extended_apps:[],selected_tab:0,dialog:!1,dialog_token:null,app_table_header:[{text:"id",align:"start",sortable:!1,value:"id"},{text:"Name",value:"name"},{text:"Description",value:"Description"},{text:"Actions",value:"actions"}],app_task:[{text:"id",align:"start",sortable:!1,value:"id"},{text:"Name",value:"name"},{text:"Slides",value:"slides"},{text:"Registered tasks",value:"app_tasks"},{text:"Actions",value:"actions"}]}}},methods:{openSession:function(t,e){var n=this;this.$post("session/create",e).then((function(t){n.$store.commit("set_session",t),n.$router.push("/session/".concat(t.id))})).catch((function(t){return alert(t)}))},newApp:function(){this.mode="app",this.current={name:"",description:""},this.drawer=!0},newTask:function(){this.mode="task",this.current={name:"",type:2,slides:[],assigned:[]},this.drawer=!0},newAppTask:function(t){this.mode="app-task",this.current=t,this.drawer=!0},newAppToken:function(t){var e=this;this.$post("app/token",t).then((function(t){e.config.dialog_token=t.token,e.config.dialog=!0})).catch((function(t){return alert(t)}))},loadApps:function(){var t=this;this.isLoading=!0,this.$get("app/list").then((function(e){t.apps=e,t.isLoading=!1})).catch((function(t){return alert(t)}))},loadTasks:function(){var t=this;this.isLoading=!0,this.$get("task/app_task_list").then((function(e){t.apps_tasks=e,e.projects.length>0&&(t.config.project_id=e.projects[0].id),t.isLoading=!1})).catch((function(t){return alert(t)}))},done:function(){this.current=null,this.drawer=!1,"app"===this.mode?this.loadApps():"task"!==this.mode&&"app-task"!==this.mode||this.loadTasks(),this.mode=""}},mounted:function(){this.loadApps(),this.loadTasks()},components:{AppTaskEditor:W,TaskEditor:x["a"],AppEditor:y,LoadingContent:r["a"]}},Z=X,tt=n("b0af"),et=n("ef9a"),nt=n("62ad"),at=n("a523"),it=n("8fea"),rt=n("169a"),ot=n("ce7e"),st=n("132d"),ct=n("f774"),lt=n("0fd9"),ut=n("71d9"),pt=n("2a7f"),dt=Object(d["a"])(Z,a,i,!1,null,"3e9acd68",null);e["default"]=dt.exports;h()(dt,{VBtn:v["a"],VCard:tt["a"],VCardActions:m["a"],VCardText:m["b"],VCardTitle:m["c"],VChip:I["a"],VChipGroup:et["a"],VCol:nt["a"],VContainer:at["a"],VDataTable:it["a"],VDialog:rt["a"],VDivider:ot["a"],VIcon:st["a"],VNavigationDrawer:ct["a"],VRow:lt["a"],VSpacer:b["a"],VTab:M["a"],VTabs:q["a"],VTextarea:_["a"],VToolbar:ut["a"],VToolbarItems:pt["a"],VToolbarTitle:pt["b"]})}}]);
//# sourceMappingURL=chunk-35e0dac4.905f70b6.js.map