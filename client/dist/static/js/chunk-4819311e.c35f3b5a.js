(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-4819311e"],{"0cd8":function(t,n,e){"use strict";var o=e("5ca1"),a=e("7b23");o(o.P+o.F*!e("2f21")([].reduce,!0),"Array",{reduce:function(t){return a(this,t,arguments.length,arguments[1],!1)}})},"67b5":function(t,n,e){"use strict";e("8865")},"7b23":function(t,n,e){var o=e("d8e8"),a=e("4bf8"),i=e("626a"),s=e("9def");t.exports=function(t,n,e,r,c){o(n);var l=a(t),u=i(l),d=s(l.length),v=c?d-1:0,_=c?-1:1;if(e<2)for(;;){if(v in u){r=u[v],v+=_;break}if(v+=_,c?v<0:d<=v)throw TypeError("Reduce of empty array with no initial value")}for(;c?v>=0:d>v;v+=_)v in u&&(r=n(r,u[v],v,l));return r}},8865:function(t,n,e){},"8bd8":function(t,n,e){"use strict";e("cef8")},a415:function(t,n,e){"use strict";e.r(n);var o=function(){var t=this,n=t.$createElement,e=t._self._c||n;return e("v-container",{attrs:{"grid-list-md":""}},[e("v-row",t._l(t.projects,(function(n){return e("v-col",{key:n.id,attrs:{cols:"12",sm:"12",md:"6"}},[e("v-card",[e("v-card-title",{domProps:{textContent:t._s(n.name)}}),e("v-card-text",{domProps:{textContent:t._s(n.description)}}),e("v-divider"),e("v-card-actions",[e("v-spacer"),e("v-btn",{attrs:{text:"",block:""},on:{click:function(e){return t.showExporting(n)}}},[t._v("Export annotations")])],1)],1)],1)})),1),e("export-task-annotation",{attrs:{project:t.selected_project},model:{value:t.dialog,callback:function(n){t.dialog=n},expression:"dialog"}})],1)},a=[],i=function(){var t=this,n=t.$createElement,e=t._self._c||n;return e("v-dialog",{attrs:{transition:"dialog-bottom-transition",scrollable:"",fullscreen:"","hide-overlay":""},model:{value:t.dialog,callback:function(n){t.dialog=n},expression:"dialog"}},[null!=t.project?e("v-card",{attrs:{tile:""}},[e("v-toolbar",{attrs:{flat:"",dark:"",dense:"",color:"primary",extended:"","extension-height":"180","shrink-on-scroll":""},scopedSlots:t._u([{key:"extension",fn:function(){return[e("div",{staticClass:"text-center full-width",staticStyle:{width:"100%"}},[e("div",{staticClass:"ma-1 grey--text text--lighten-2 text-h4"},[t._v("Exporting annotations")]),e("p",[null!=t.annotators?e("v-menu",{scopedSlots:t._u([{key:"activator",fn:function(n){var o=n.on,a=n.attrs;return[e("v-btn",t._g(t._b({staticClass:"ma-1",attrs:{rounded:"",outlined:""}},"v-btn",a,!1),o),[t._v("\n                  Select annotations by...\n                ")])]}}],null,!1,2036443985)},[e("v-list",[e("v-list-item",{on:{click:function(n){return t.selectAll()}}},[e("v-list-item-title",[t._v("Everyone")])],1),e("v-divider"),t._l(Object.keys(t.annotators),(function(n,o){return e("v-list-item",{key:o,on:{click:function(e){return t.selectAll(t.annotators[n])}}},[e("v-list-item-title",[t._v(t._s(n))])],1)}))],2)],1):t._e(),null!=t.reviewers?e("v-menu",{scopedSlots:t._u([{key:"activator",fn:function(n){var o=n.on,a=n.attrs;return[e("v-btn",t._g(t._b({staticClass:"ma-1",attrs:{rounded:"",outlined:""}},"v-btn",a,!1),o),[t._v("\n                  Filter revisions by...\n                ")])]}}],null,!1,1520020269)},[e("v-list",[e("v-list-item",[e("v-list-item-icon",[e("v-simple-checkbox",{model:{value:t.only_revised,callback:function(n){t.only_revised=n},expression:"only_revised"}})],1),e("v-list-item-title",[t._v("Only revised")])],1),t._l(Object.keys(t.reviewers),(function(n,o){return e("v-list-item",{key:o,on:{click:function(e){return t.selectReviewer(t.reviewers[n])}}},[e("v-list-item-title",[t._v(t._s(n))])],1)}))],2)],1):t._e()],1),e("div",{staticClass:"ma-1 grey--text text--lighten-1"},[t._v("\n            Exporting "+t._s(t.total_annotations)+" annotations.\n          ")]),e("div",{staticClass:"mt-1 mb-2"},[e("p",[e("v-btn",{attrs:{disabled:0===t.total_annotations,rounded:"",outlined:"","x-large":""},on:{click:t.exportAnnotations}},[t._v("\n                Export annotations\n              ")])],1)])])]},proxy:!0}],null,!1,3657517898)},[e("v-btn",{attrs:{icon:"",dark:""},on:{click:t.close}},[e("v-icon",[t._v("mdi-close")])],1),e("v-toolbar-title",{domProps:{textContent:t._s(t.project.name)}})],1),e("v-card-text",[e("v-container",[e("div",{staticClass:"d-flex flex-row align-content-start align-start flex-wrap"},t._l(t.tasks,(function(n){return e("v-card",{key:n.id,staticClass:"ma-2 flex-shrink-0 flex-grow-1"},[e("v-card-title",{domProps:{textContent:t._s(null==n.name?n.name:n.slides.length+" slide(s) annotation task")}}),e("v-chip-group",{staticClass:"pl-3 pr-3"},t._l(n.slides,(function(n){return e("v-chip",{key:n.id,staticStyle:{"pointer-events":"none"},attrs:{readonly:!0,outlined:""},domProps:{textContent:t._s(n.name)}})})),1),0===n.annotated.length?e("v-card-text",[t._v("\n              This task has received no annotations yet.\n            ")]):e("v-card-text",[e("div",{staticClass:"text-body-1"},[t._v("Export annotations from:")]),e("v-expansion-panels",{attrs:{multiple:"",hover:"",accordion:""},model:{value:t.annotated_selected[n.id],callback:function(e){t.$set(t.annotated_selected,n.id,e)},expression:"annotated_selected[task.id]"}},t._l(n.annotated,(function(n){return e("v-expansion-panel",{key:n.user_task_id,on:{change:function(e){return t.panelChanged(n)}}},[e("v-expansion-panel-header",{attrs:{"disable-icon-rotate":""},scopedSlots:t._u([{key:"default",fn:function(o){var a=o.open;return[e("v-row",{attrs:{"no-gutters":""}},[e("v-col",{attrs:{cols:"5"}},[a?e("v-icon",[t._v("\n                            mdi-check\n                          ")]):t._e(),t._v("\n                          "+t._s(n.user_name)+"\n                          (total annotations: "+t._s(n.annotation_count)+")\n                        ")],1),e("v-col",{staticClass:"text--secondary",attrs:{cols:"7"}},[e("v-fade-transition",{attrs:{"leave-absolute":""}},[e("span",a?[t._v("Exporting "+t._s(t.annotation_counts[n.user_task_id])+" annotation(s)")]:[t._v("Currently not selected for exporting")])])],1)],1)]}}],null,!0)}),e("v-expansion-panel-content",{staticClass:"expansion-panel-revision"},[null!=n.reviews&&n.reviews.length>0?e("div",[e("p",{staticClass:"ma-0 text-muted"},[t._v("Include only annotations revised by:")]),e("v-chip-group",{attrs:{multiple:"",column:""},model:{value:t.exporting[n.user_task_id],callback:function(e){t.$set(t.exporting,n.user_task_id,e)},expression:"exporting[annotation.user_task_id]"}},t._l(n.reviews,(function(n){return e("v-chip",{key:n.revision_user_task_id,staticClass:"ma-1",attrs:{pill:"",outlined:"",filter:"",value:n.revision_user_task_id},on:{click:function(n){return n.preventDefault(),t.count.apply(null,arguments)}}},[t._v("\n                          "+t._s(n.revision_by_name)+" ("+t._s(n.revision_count)+" annotations)\n                        ")])})),1)],1):e("div",[e("p",{staticClass:"ma-0 text-muted"},[t._v("Annotations not revised yet.")])])])],1)})),1)],1),e("v-divider"),null!=n.exporting?e("v-card-actions",[e("p",{staticClass:"ma-1 grey--text"},[t._v("\n                Exporting "+t._s(n.exporting.count)+" annotations from this task\n              ")])]):t._e()],1)})),1)])],1)],1):t._e()],1)},s=[],r=(e("7f7f"),e("6762"),e("2fdb"),e("f3e2"),e("ac6a"),e("8615"),e("0cd8"),e("2ef0")),c=e.n(r),l={name:"ExportTaskAnnotation",watch:{project:{immediate:!0,handler:function(){this.load_tasks()}},value:function(t){this.dialog=t},only_revised:function(){this.count()}},data:function(){return{tasks:null,exporting:{},annotation_counts:{},dialog:!1,only_revised:!1,annotated_selected:{}}},computed:{total_annotations:function(){return c.a.isEmpty(this.annotation_counts)?0:Object.values(this.annotation_counts).reduce((function(t,n){return t+n}))},annotators:function(){var t={};return null!=this.tasks&&this.tasks.forEach((function(n){n.annotated.forEach((function(n){n.user_name in t||(t[n.user_name]=[]),t[n.user_name].push(n.user_task_id)}))})),t},reviewers:function(){var t={};return null!=this.tasks&&this.tasks.forEach((function(n){n.annotated.forEach((function(n){null!=n.reviews&&n.reviews.forEach((function(e){console.log("Reviewer:",e.revision_by_name),e.revision_by_name in t||(t[e.revision_by_name]=[]),t[e.revision_by_name].push({annotation:n.user_task_id,revision:e.revision_user_task_id})}))}))})),t}},methods:{close:function(){this.$emit("input",!1)},load_tasks:function(){var t=this;null!=this.project&&this.$get("export/list/by_task",{params:{project_id:this.project.id}}).then((function(n){t.tasks=n})).catch((function(t){return alert(t)}))},panelChanged:function(t){var n=this;t.user_task_id in this.exporting?(delete this.exporting[t.user_task_id],this.annotation_counts[t.user_task_id]=0):(this.exporting[t.user_task_id]=[],this.only_revised||this.$set(this.annotation_counts,t.user_task_id,t.annotation_count)),null==t.reviews&&this.$get("export/review/by_task",{params:{user_task_id:t.user_task_id}}).then((function(e){return n.$set(t,"reviews",e)})).catch((function(t){return alert(t)}))},selectAll:function(){var t=this,n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;this.tasks.forEach((function(e){var o=0;e.annotated.forEach((function(a){(null==n||n.includes(a.user_task_id))&&(a.user_task_id in t.exporting||(t.panelChanged(a),e.id in t.annotated_selected||(t.annotated_selected[e.id]=[]),t.annotated_selected[e.id].push(o))),o+=1}))}))},selectReviewer:function(t){var n=this;t.forEach((function(t){n.exporting[t.annotation].push(t.revision)})),this.count()},exportAnnotations:function(){var t=this;this.$post("export/by_task?only_revised=".concat(this.only_revised),this.exporting,{responseType:"blob"}).then((function(n){var e=window.URL.createObjectURL(new Blob([n])),o=document.createElement("a");o.href=e,o.setAttribute("download","".concat(t.project.name,".zip")),document.body.appendChild(o),o.click(),document.body.removeChild(o)})).catch((function(t){return alert(t)}))},count:function(){var t=this;setTimeout((function(){t.$post("export/count?only_revised=".concat(t.only_revised),t.exporting).then((function(n){t.annotation_counts=n})).catch((function(t){return alert(t)}))}),1e3)}},props:["project","value"]},u=l,d=(e("8bd8"),e("2877")),v=e("6544"),_=e.n(v),p=e("8336"),f=e("b0af"),h=e("99d9"),m=e("cc20"),x=e("ef9a"),k=e("62ad"),b=e("a523"),g=e("169a"),y=e("ce7e"),C=e("cd55"),w=e("49e2"),V=e("c865"),E=e("0393"),j=e("0789"),T=e("132d"),A=e("8860"),$=e("da13"),P=e("34c3"),S=e("5d23"),R=e("e449"),O=e("0fd9"),I=e("9e88"),L=e("71d9"),D=e("2a7f"),B=Object(d["a"])(u,i,s,!1,null,"0b17899c",null),F=B.exports;_()(B,{VBtn:p["a"],VCard:f["a"],VCardActions:h["a"],VCardText:h["b"],VCardTitle:h["c"],VChip:m["a"],VChipGroup:x["a"],VCol:k["a"],VContainer:b["a"],VDialog:g["a"],VDivider:y["a"],VExpansionPanel:C["a"],VExpansionPanelContent:w["a"],VExpansionPanelHeader:V["a"],VExpansionPanels:E["a"],VFadeTransition:j["d"],VIcon:T["a"],VList:A["a"],VListItem:$["a"],VListItemIcon:P["a"],VListItemTitle:S["d"],VMenu:R["a"],VRow:O["a"],VSimpleCheckbox:I["a"],VToolbar:L["a"],VToolbarTitle:D["b"]});var J={name:"Export",components:{ExportTaskAnnotation:F},watch:{selected_users:{deep:!0,handler:function(t){}}},data:function(){return{dialog:!1,projects:[],selected_project:null,selected_users:{},selected_user_tasks:{},exporting:{},annotation_counts:{}}},methods:{load:function(){var t=this;this.$get("export/list").then((function(n){return t.projects=n})).catch((function(t){return alert(t)}))},showExporting:function(t){this.selected_project=t,this.dialog=!0}},mounted:function(){this.load()}},U=J,z=(e("67b5"),e("2fa4")),G=Object(d["a"])(U,o,a,!1,null,"3c933254",null);n["default"]=G.exports;_()(G,{VBtn:p["a"],VCard:f["a"],VCardActions:h["a"],VCardText:h["b"],VCardTitle:h["c"],VCol:k["a"],VContainer:b["a"],VDivider:y["a"],VRow:O["a"],VSpacer:z["a"]})},cef8:function(t,n,e){}}]);
//# sourceMappingURL=chunk-4819311e.c35f3b5a.js.map