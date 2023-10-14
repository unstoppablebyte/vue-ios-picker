<template>
  <div class="ios-picker display-flex">
    <div v-for="(group, currentGroupIndex) in configuration"
         :key="currentGroupIndex"
         :class="getGroupClass(currentGroupIndex)"
         class="ios-group"
         ref="iosGroup"
    >
      <div class="ios-list">
        <div v-if="group.divider"
             :class="getItemClass(currentGroupIndex, iIndex, true)"
             class="ios-item divider"
        >
          {{ group.text }}
        </div>
        <template v-else>
          <div v-for="(item, iIndex) in group.list"
               :key="iIndex"
               :class="getItemClass(currentGroupIndex, iIndex)"
               :style="getItemStyle(currentGroupIndex, iIndex)"
               class="ios-item"
          >
            {{ item.value || item }}
          </div>
        </template>
      </div>
    </div>
    <div ref="iosHandleLayer" class="ios-handle-layer display-flex flex-direction-column">
      <div data-type="top" class="ios-top flex-grow-1"/>
      <div data-type="middle" class="ios-middle"/>
      <div data-type="bottom" class="ios-bottom flex-grow-1"/>
    </div>
  </div>
</template>

<script>
import IosPickerEvents from "@/IosPickerEvents.js";
import IosPickerStyle from "@/IosPickerStyle.js";

export default {
  name: 'ios-picker',
  mixins: [
      IosPickerEvents,
      IosPickerStyle,
  ],
  emits: ['update'],
  props: {
    configuration: {
      type: Array,
      default: [],
    },
  },
  data () {
    return {
      currentGroupIndex: 0, // for suppress vue-loader warning
      iIndex: 0, // for suppress vue-loader warning

      currentIndexList: this.getInitialCurrentIndexList(), // save groups's index
      lastCurrentIndexList: [], // for detect which group's current index if it is changed

      groupsRectList: new Array(this.configuration.length), // save the dom rect list of this picker's groups

      dragInfo: { // save drag(ing) info
        isTouchable: 'ontouchstart' in window, // for detect event belongs to touch or mouse
        isMouseDown: false, // save the status of mouse (touch) is start and it is not end

        isDragging: false, // for detect the status of mouse (touch) is dragging (moving) after isMouseDown or not
        groupIndex: null, // save which group is dragging now
        startPageY: null // save the pageY value of mouse (touch) after begin isMouseDown
      },

      supInfo: { // supporting for picker usefulness
        getRectTimeoutId: null, // save timeout id
        lastStyleDisplay: null, // for detect picker style display if it is changed
        watchDomObserver: null // for watching this picker dom
      },
    }
  },
  mounted () {
    this.eventsRegister();

    this.$nextTick(this.getGroupsRectList);
    this.supInfo.watchDomObserver = this.createDomObserver();
    this.supInfo.watchDomObserver.observe(this.$el, { attributes: true });

    window.addEventListener('resize', this.safeGetGroupRectList);
  },
  destroyed () {
    this.supInfo.watchDomObserver.disconnect();

    window.removeEventListener('resize', this.safeGetGroupRectList);
  },
  methods: {
    getInitialCurrentIndexList () {
      return this.configuration.map((item) => {
        const iCI = item.currentIndex;

        if (typeof iCI === 'number' && iCI >= 0 && item.list && item.list.length && iCI <= item.list.length - 1) {
          return Math.round(iCI);
        }

        return 0;
      })
    },
    createDomObserver () {
      return new window.MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if(mutation.type !== 'attributes') {
            continue;
          }

          // for get correct rect list after v-show true (when $el style display not none)
          const elDisplay = this.$el.style.display;

          if (elDisplay !== 'none' && this.supInfo.lastStyleDisplay !== elDisplay) {
            this.supInfo.lastStyleDisplay = elDisplay;
            this.$nextTick(this.getGroupsRectList);
          }
        }
      });
    },
    safeGetGroupRectList () {
      this.supInfo.getRectTimeoutId && clearTimeout(this.supInfo.getRectTimeoutId);

      this.supInfo.getRectTimeoutId = setTimeout(() => {
        this.getGroupsRectList();
      }, 200);
    },
    getGroupsRectList () {
      if(!this.$refs.iosGroup) {
        return;
      }

      this.$refs.iosGroup.forEach((item, index) => {
        this.groupsRectList[index] = item.getBoundingClientRect();
      });
    },
    getGroupIndexBelongsEvent (ev) {
      const touchInfo = this.getTouchInfo(ev);

      for (let i = 0; i < this.groupsRectList.length; i++) {
        const item = this.groupsRectList[i];

        if (item.left < touchInfo.pageX && touchInfo.pageX < item.right) {
          return i;
        }
      }

      return null;
    },
    setCurrentIndexOnMove (ev) {
      const touchInfo = this.getTouchInfo(ev);

      if (this.dragInfo.groupIndex === null) {
        this.dragInfo.groupIndex = this.getGroupIndexBelongsEvent(ev);
      }

      const currentGroupIndex = this.dragInfo.groupIndex;
      if (typeof currentGroupIndex === 'number' && (this.configuration[currentGroupIndex].divider || !this.configuration[currentGroupIndex].list)) {
        return
      }

      const moveCount = (this.dragInfo.startPageY - touchInfo.pageY) / 32;
      this.currentIndexList[currentGroupIndex] = this.currentIndexList[currentGroupIndex] + moveCount;

      this.dragInfo.startPageY = touchInfo.pageY;
    },
    correctionAfterDragging (ev) {
      const currentGroupIndex = this.dragInfo.groupIndex;
      this.correctionCurrentIndex(ev, currentGroupIndex);

      this.dragInfo.groupIndex = null;
      this.dragInfo.startPageY = null;
    },
    correctionCurrentIndex (ev, currentGroupIndex) {
      setTimeout(() => {
        if(typeof currentGroupIndex !== 'number') {
          return;
        }

        if(!!this.configuration[currentGroupIndex].divider) {
          return;
        }

        if(!this.configuration[currentGroupIndex].list.length) {
          return;
        }

        const movedIndex = this.getMovedIndex(currentGroupIndex);

        this.currentIndexList[currentGroupIndex] = movedIndex;

        if (movedIndex !== this.lastCurrentIndexList[currentGroupIndex]) {
          this.onUpdateEmit(currentGroupIndex, movedIndex);
        }

        this.lastCurrentIndexList = [].concat(this.currentIndexList);
      }, 100);
    },
    isCurrentItem (currentGroupIndex, iIndex) {
      return this.currentIndexList[currentGroupIndex] === iIndex;
    },
    getMovedIndex(currentGroupIndex) {
      const unsafeGroupIndex = this.currentIndexList[currentGroupIndex];

      let movedIndex = unsafeGroupIndex;

      if(unsafeGroupIndex < 0) {
        movedIndex = 0;
      }

      if(unsafeGroupIndex > this.configuration[currentGroupIndex].list.length - 1) {
        movedIndex = this.configuration[currentGroupIndex].list.length - 1;
      }

      return Math.round(movedIndex);
    },
    onUpdateEmit(currentGroupIndex, movedIndex) {
      const newConfiguration = this.configuration;
      newConfiguration[currentGroupIndex].currentIndex = movedIndex;

      this.$emit(
          'update',
          currentGroupIndex,
          movedIndex,
          this.configuration[currentGroupIndex].list[movedIndex],
          newConfiguration
      );
    },
  }
}
</script>