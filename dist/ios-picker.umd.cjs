(function(r,i){typeof exports=="object"&&typeof module<"u"?i(exports,require("vue")):typeof define=="function"&&define.amd?define(["exports","vue"],i):(r=typeof globalThis<"u"?globalThis:r||self,i(r.IosPicker={},r.Vue))})(this,function(r,i){"use strict";const f={methods:{eventsRegister(){const t=this.$refs.iosHandleLayer;t&&this.addEventsForElement(t)},addEventsForElement(t){const e=this.dragInfo.isTouchable,s=[{name:e?"touchstart":"mousedown",handler:this.handleStart},{name:e?"touchmove":"mousemove",handler:this.handleMove},{name:e?"touchend":"mouseup",handler:this.handleEnd},{name:e?"touchcancel":"mouseleave",handler:this.handleCancel}];for(const n of s)t.removeEventListener(n.name,n.handler,!1),t.addEventListener(n.name,n.handler,!1)},handleEventClick(t){const e=this.getGroupIndexBelongsEvent(t);switch(t.target.dataset.type){case"top":this.triggerAboveLayerClick(t,e);break;case"middle":this.triggerMiddleLayerClick(t,e);break;case"bottom":this.triggerBelowLayerClick(t,e);break}},handleStart(t){t.cancelable&&(t.preventDefault(),t.stopPropagation());const e=this.getTouchInfo(t);this.dragInfo.startPageY=e.pageY,this.dragInfo.isTouchable||(this.dragInfo.isMouseDown=!0)},handleMove(t){t.cancelable&&(t.preventDefault(),t.stopPropagation()),(this.dragInfo.isTouchable||this.dragInfo.isMouseDown)&&(this.dragInfo.isDragging=!0,this.setCurrentIndexOnMove(t))},handleEnd(t){t.cancelable&&(t.preventDefault(),t.stopPropagation()),this.dragInfo.isDragging||this.handleEventClick(t),this.dragInfo.isDragging=!1,this.dragInfo.isMouseDown=!1,this.correctionAfterDragging(t)},handleCancel(t){t.cancelable&&(t.preventDefault(),t.stopPropagation()),(this.dragInfo.isTouchable||this.dragInfo.isMouseDown)&&(this.correctionAfterDragging(t),this.dragInfo.isMouseDown=!1,this.dragInfo.isDragging=!1)},triggerMiddleLayerGroupClick(t){const e=this.configuration;if(typeof t!="number")return;const s=e[t];s.hasOwnProperty("onClick")&&typeof s.onClick=="function"&&e[t].onClick(t,this.currentIndexList[t])},triggerAboveLayerClick(t,e){this.currentIndexList[e]=this.currentIndexList[e]+1,this.correctionCurrentIndex(t,e)},triggerMiddleLayerClick(t,e){this.triggerMiddleLayerGroupClick(e)},triggerBelowLayerClick(t,e){this.currentIndexList[e]=this.currentIndexList[e]-1,this.correctionCurrentIndex(t,e)},getTouchInfo(t){return this.dragInfo.isTouchable?t.changedTouches[0]||t.touches[0]:t}}},g={methods:{getGroupClass(t){const e=this.configuration[t];let s=["flex-grow-"+(e.flex||1)];return Array.isArray(e.className)?s=[...s,...e.className]:s.push(e.className),s},getItemClass(t,e,s=!1){const n=[],o=this.configuration[t];return o.textAlign&&n.push("ios-text-align-"+o.textAlign),!s&&this.isCurrentItem(t,e)&&n.push("ios-item-selected"),n},getItemStyle(t,e){const s=this.currentIndexList[t]-e;if(Math.abs(s)<4){let n="transform: rotateX("+s*23+"deg) translate3d(0, 0, 5.625em);";return this.dragInfo.isDragging||(n+=" transition: transform 150ms ease-out;"),n}return s>0?"transform: rotateX(100deg) translate3d(0, 0, 5.625em)":"transform: rotateX(-100deg) translate3d(0, 0, 5.625em)"}}},p=(t,e)=>{const s=t.__vccOpts||t;for(const[n,o]of e)s[n]=o;return s},m={name:"ios-picker",mixins:[f,g],emits:["update"],props:{configuration:{type:Array,default:[]}},data(){return{gIndex:0,iIndex:0,currentIndexList:this.getInitialCurrentIndexList(),lastCurrentIndexList:[],groupsRectList:new Array(this.configuration.length),dragInfo:{isTouchable:"ontouchstart"in window,isMouseDown:!1,isDragging:!1,groupIndex:null,startPageY:null},supInfo:{getRectTimeoutId:null,lastStyleDisplay:null,watchDomObserver:null}}},mounted(){this.eventsRegister(),this.$nextTick(this.getGroupsRectList),this.supInfo.watchDomObserver=this.createDomObserver(),this.supInfo.watchDomObserver.observe(this.$el,{attributes:!0}),window.addEventListener("resize",this.safeGetGroupRectList)},destroyed(){this.supInfo.watchDomObserver.disconnect(),window.removeEventListener("resize",this.safeGetGroupRectList)},methods:{getInitialCurrentIndexList(){return this.configuration.map(t=>{const e=t.currentIndex;return typeof e=="number"&&e>=0&&t.list&&t.list.length&&e<=t.list.length-1?Math.round(e):0})},createDomObserver(){return new window.MutationObserver(t=>{t.forEach(e=>{if(e.type==="attributes"){const s=this.$el.style.display;s!=="none"&&this.supInfo.lastStyleDisplay!==s&&(this.supInfo.lastStyleDisplay=s,this.$nextTick(this.getGroupsRectList))}})})},safeGetGroupRectList(){this.supInfo.getRectTimeoutId&&clearTimeout(this.supInfo.getRectTimeoutId),this.supInfo.getRectTimeoutId=setTimeout(()=>{this.getGroupsRectList()},200)},getGroupsRectList(){this.$refs.iosGroup&&this.$refs.iosGroup.forEach((t,e)=>{this.groupsRectList[e]=t.getBoundingClientRect()})},getGroupIndexBelongsEvent(t){const e=this.getTouchInfo(t);for(let s=0;s<this.groupsRectList.length;s++){const n=this.groupsRectList[s];if(n.left<e.pageX&&e.pageX<n.right)return s}return null},setCurrentIndexOnMove(t){const e=this.getTouchInfo(t);this.dragInfo.groupIndex===null&&(this.dragInfo.groupIndex=this.getGroupIndexBelongsEvent(t));const s=this.dragInfo.groupIndex;if(typeof s=="number"&&(this.configuration[s].divider||!this.configuration[s].list))return;const n=(this.dragInfo.startPageY-e.pageY)/32;this.currentIndexList[s]=this.currentIndexList[s]+n,this.dragInfo.startPageY=e.pageY},correctionAfterDragging(t){const e=this.dragInfo.groupIndex;this.correctionCurrentIndex(t,e),this.dragInfo.groupIndex=null,this.dragInfo.startPageY=null},correctionCurrentIndex(t,e){setTimeout(()=>{if(typeof e=="number"&&this.configuration[e].divider!==!0&&this.configuration[e].list.length>0){const s=this.currentIndexList[e];let n=s;s>this.configuration[e].list.length-1?n=this.configuration[e].list.length-1:s<0&&(n=0),n=Math.round(n),this.currentIndexList[e]=n,n!==this.lastCurrentIndexList[e]&&this.$emit("update",e,n,this.configuration[e].list[n]),this.lastCurrentIndexList=[].concat(this.currentIndexList)}},100)},isCurrentItem(t,e){return this.currentIndexList[t]===e}}},I={class:"ios-picker display-flex"},y={class:"ios-list"},L={ref:"iosHandleLayer",class:"ios-handle-layer display-flex flex-direction-column"},k=[i.createElementVNode("div",{"data-type":"top",class:"ios-top flex-grow-1"},null,-1),i.createElementVNode("div",{"data-type":"middle",class:"ios-middle"},null,-1),i.createElementVNode("div",{"data-type":"bottom",class:"ios-bottom flex-grow-1"},null,-1)];function C(t,e,s,n,o,_){return i.openBlock(),i.createElementBlock("div",I,[(i.openBlock(!0),i.createElementBlock(i.Fragment,null,i.renderList(s.configuration,(c,a)=>(i.openBlock(),i.createElementBlock("div",{key:a,class:i.normalizeClass([t.getGroupClass(a),"ios-group"]),ref_for:!0,ref:"iosGroup"},[i.createElementVNode("div",y,[c.divider?(i.openBlock(),i.createElementBlock("div",{key:0,class:i.normalizeClass([t.getItemClass(a,o.iIndex,!0),"ios-item divider"])},i.toDisplayString(c.text),3)):(i.openBlock(!0),i.createElementBlock(i.Fragment,{key:1},i.renderList(c.list,(h,u)=>(i.openBlock(),i.createElementBlock("div",{key:u,class:i.normalizeClass([t.getItemClass(a,u),"ios-item"]),style:i.normalizeStyle(t.getItemStyle(a,u))},i.toDisplayString(h.value||h),7))),128))])],2))),128)),i.createElementVNode("div",L,k,512)])}const l=p(m,[["render",C]]),d=t=>{t.component(l.name,l)},b={install:d};r.IosPicker=l,r.default=b,r.install=d,Object.defineProperties(r,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});