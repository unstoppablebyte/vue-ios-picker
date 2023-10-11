<template>
  <div class="ios-picker display-flex">
    <div v-for="(group, gIndex) in configuration"
         :key="gIndex"
         :class="getGroupClass(gIndex)"
         class="ios-group"
         ref="iosGroup"
    >
      <div class="ios-list">
        <div v-if="group.divider"
             :class="getItemClass(gIndex, iIndex, true)"
             class="ios-item divider"
        >
          {{ group.text }}
        </div>
        <template v-else>
          <div v-for="(item, iIndex) in group.list"
               :key="iIndex"
               :class="getItemClass(gIndex, iIndex)"
               :style="getItemStyle(gIndex, iIndex)"
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
      default: []
    },
  },
  data () {
    return {
      gIndex: 0, // for suppress vue-loader warning
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
      }
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
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            // for get correct rect list after v-show true (when $el style display not none)
            const elDisplay = this.$el.style.display
            if (elDisplay !== 'none' && this.supInfo.lastStyleDisplay !== elDisplay) {
              this.supInfo.lastStyleDisplay = elDisplay
              this.$nextTick(this.getGroupsRectList)
            }
          }
        })
      })
    },
    safeGetGroupRectList () {
      this.supInfo.getRectTimeoutId && clearTimeout(this.supInfo.getRectTimeoutId)
      this.supInfo.getRectTimeoutId = setTimeout(() => {
        this.getGroupsRectList()
      }, 200)
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
      const touchInfo = this.getTouchInfo(ev)

      for (let i = 0; i < this.groupsRectList.length; i++) {
        const item = this.groupsRectList[i]
        if (item.left < touchInfo.pageX && touchInfo.pageX < item.right) {
          return i
        }
      }
      return null
    },
    setCurrentIndexOnMove (ev) {
      const touchInfo = this.getTouchInfo(ev)
      if (this.dragInfo.groupIndex === null) {
        this.dragInfo.groupIndex = this.getGroupIndexBelongsEvent(ev)
      }

      const gIndex = this.dragInfo.groupIndex
      if (typeof gIndex === 'number' && (this.configuration[gIndex].divider || !this.configuration[gIndex].list)) {
        return
      }

      const moveCount = (this.dragInfo.startPageY - touchInfo.pageY) / 32
      this.currentIndexList[gIndex] = this.currentIndexList[gIndex] + moveCount;

      this.dragInfo.startPageY = touchInfo.pageY
    },
    correctionAfterDragging (ev) {
      const gIndex = this.dragInfo.groupIndex;
      this.correctionCurrentIndex(ev, gIndex);

      this.dragInfo.groupIndex = null;
      this.dragInfo.startPageY = null;
    },
    correctionCurrentIndex (ev, gIndex) {
      setTimeout(() => {
        if (typeof gIndex === 'number' && this.configuration[gIndex].divider !== true && this.configuration[gIndex].list.length > 0) {
          const unsafeGroupIndex = this.currentIndexList[gIndex]

          let movedIndex = unsafeGroupIndex
          if (unsafeGroupIndex > this.configuration[gIndex].list.length - 1) {
            movedIndex = this.configuration[gIndex].list.length - 1
          } else if (unsafeGroupIndex < 0) {
            movedIndex = 0
          }
          movedIndex = Math.round(movedIndex)

          this.currentIndexList[gIndex] = movedIndex

          if (movedIndex !== this.lastCurrentIndexList[gIndex]) {
            this.$emit('update', gIndex, movedIndex, this.configuration[gIndex].list[movedIndex]);
          }

          this.lastCurrentIndexList = [].concat(this.currentIndexList);
        }
      }, 100);
    },
    isCurrentItem (gIndex, iIndex) {
      return this.currentIndexList[gIndex] === iIndex;
    },
  }
}
</script>