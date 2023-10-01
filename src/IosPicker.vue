<template>
  <div class="ios-picker flex-box">
    <!-- ios-group-layer -->
    <div ref="iosGroup" v-for="(group, gIndex) in data" :key="gIndex"
         class="ios-group" :class="getGroupClass(gIndex)">

      <div class="ios-list">
        <div v-if="group.divider" class="ios-item divider" :class="getItemClass(gIndex, iIndex, true)">{{ group.text }}</div>

        <div v-else v-for="(item, iIndex) in group.list" :key="iIndex"
             class="ios-item" :class="getItemClass(gIndex, iIndex)" :style="getItemStyle(gIndex, iIndex)">
          {{ item.value || item }}
        </div>
      </div>
    </div>

    <div ref="iosHandleLayer" class="ios-handle-layer flex-box direction-column">
      <div data-type="top" class="ios-top flex-1"></div>
      <div data-type="middle" class="ios-middle"></div>
      <div data-type="bottom" class="ios-bottom flex-1"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ios-picker',
  props: {
    data: {
      type: Array,
      default: []
    },
    change: {
      type: Function,
      default: () => {}
    }
  },
  data () {
    return {
      gIndex: 0, // for suppress vue-loader warning
      iIndex: 0, // for suppress vue-loader warning

      currentIndexList: this.getInitialCurrentIndexList(), // save groups's index
      lastCurrentIndexList: [], // for detect which group's current index if it is changed

      groupsRectList: new Array(this.data.length), // save the dom rect list of this picker's groups

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
    this.eventsRegister()

    this.$nextTick(this.getGroupsRectList())
    this.supInfo.watchDomObserver = this.createDomObserver()
    this.supInfo.watchDomObserver.observe(this.$el, { attributes: true })

    window.addEventListener('resize', this.safeGetGroupRectList)
  },
  destroyed () {
    this.supInfo.watchDomObserver.disconnect()

    window.removeEventListener('resize', this.safeGetGroupRectList)
  },
  methods: {
    setGroupData (gIndex, groupData) {
      // for current index list
      const iCI = groupData.currentIndex
      let movedIndex = 0
      if (typeof iCI === 'number' && iCI >= 0 && groupData.list && groupData.list.length && iCI <= groupData.list.length - 1) {
        movedIndex = Math.round(iCI)
      }
      this.currentIndexList[gIndex] = movedIndex
      this.lastCurrentIndexList = [].concat(this.currentIndexList)

      // for detect group flex if changed
      const gF = groupData.flex
      if (gF && this.data[gIndex].flex !== gF) {
        this.safeGetGroupRectList()
      }

      // set group data
      this.data[gIndex] = groupData;
    },
    getInitialCurrentIndexList () {
      return this.data.map((item, index) => {
        const iCI = item.currentIndex
        if (typeof iCI === 'number' && iCI >= 0 && item.list && item.list.length && iCI <= item.list.length - 1) {
          return Math.round(iCI)
        }
        return 0
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
              this.$nextTick(this.getGroupsRectList())
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
      if (this.$refs.iosGroup) {
        this.$refs.iosGroup.forEach((item, index) => {
          this.groupsRectList[index] = item.getBoundingClientRect()
        })
      }
    },
    eventsRegister () {
      const handleEventLayer = this.$refs.iosHandleLayer
      if (handleEventLayer) {
        this.addEventsForElement(handleEventLayer)
      }
    },
    addEventsForElement (el) {
      const _ = this.dragInfo.isTouchable
      const eventHandlerList = [
        { name: _ ? 'touchstart' : 'mousedown', handler: this.handleStart },
        { name: _ ? 'touchmove' : 'mousemove', handler: this.handleMove },
        { name: _ ? 'touchend' : 'mouseup', handler: this.handleEnd },
        { name: _ ? 'touchcancel' : 'mouseleave', handler: this.handleCancel }
      ]
      eventHandlerList.forEach((item, index) => {
        el.removeEventListener(item.name, item.handler, false)
        el.addEventListener(item.name, item.handler, false)
      })
    },
    triggerMiddleLayerGroupClick (gIndex) {
      const data = this.data
      if (typeof gIndex === 'number' && typeof data[gIndex].onClick === 'function') {
        data[gIndex].onClick(gIndex, this.currentIndexList[gIndex])
      }
    },
    triggerAboveLayerClick (ev, gIndex) {
      this.currentIndexList[gIndex] = this.currentIndexList[gIndex] + 1;
      this.correctionCurrentIndex(ev, gIndex)
    },
    triggerMiddleLayerClick (ev, gIndex) {
      this.triggerMiddleLayerGroupClick(gIndex)
    },
    triggerBelowLayerClick (ev, gIndex) {
      this.currentIndexList[gIndex] = this.currentIndexList[gIndex] - 1;
      this.correctionCurrentIndex(ev, gIndex)
    },
    getTouchInfo (ev) {
      return this.dragInfo.isTouchable ? ev.changedTouches[0] || ev.touches[0] : ev
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
    handleEventClick (ev) {
      const gIndex = this.getGroupIndexBelongsEvent(ev)

      switch (ev.target.dataset.type) {
        case 'top':
          this.triggerAboveLayerClick(ev, gIndex)
          break
        case 'middle':
          this.triggerMiddleLayerClick(ev, gIndex)
          break
        case 'bottom':
          this.triggerBelowLayerClick(ev, gIndex)
          break
        default:
      }
    },
    handleStart (ev) {
      if (ev.cancelable) {
        ev.preventDefault()
        ev.stopPropagation()
      }

      const touchInfo = this.getTouchInfo(ev)
      this.dragInfo.startPageY = touchInfo.pageY
      if (!this.dragInfo.isTouchable) {
        this.dragInfo.isMouseDown = true
      }
    },
    handleMove (ev) {
      if (ev.cancelable) {
        ev.preventDefault()
        ev.stopPropagation()
      }

      if (this.dragInfo.isTouchable || this.dragInfo.isMouseDown) {
        this.dragInfo.isDragging = true
        this.setCurrentIndexOnMove(ev)
      }
    },
    handleEnd (ev) {
      if (ev.cancelable) {
        ev.preventDefault()
        ev.stopPropagation()
      }

      if (!this.dragInfo.isDragging) {
        this.handleEventClick(ev)
      }
      this.dragInfo.isDragging = false
      this.dragInfo.isMouseDown = false

      this.correctionAfterDragging(ev)
    },
    handleCancel (ev) {
      if (ev.cancelable) {
        ev.preventDefault()
        ev.stopPropagation()
      }

      if (this.dragInfo.isTouchable || this.dragInfo.isMouseDown) {
        this.correctionAfterDragging(ev)
        this.dragInfo.isMouseDown = false
        this.dragInfo.isDragging = false
      }
    },
    setCurrentIndexOnMove (ev) {
      const touchInfo = this.getTouchInfo(ev)
      if (this.dragInfo.groupIndex === null) {
        this.dragInfo.groupIndex = this.getGroupIndexBelongsEvent(ev)
      }

      const gIndex = this.dragInfo.groupIndex
      if (typeof gIndex === 'number' && (this.data[gIndex].divider || !this.data[gIndex].list)) {
        return
      }

      const moveCount = (this.dragInfo.startPageY - touchInfo.pageY) / 32
      const movedIndex = this.currentIndexList[gIndex] + moveCount

      this.currentIndexList[gIndex] = movedIndex;

      this.dragInfo.startPageY = touchInfo.pageY
    },
    correctionAfterDragging (ev) {
      const gIndex = this.dragInfo.groupIndex
      this.correctionCurrentIndex(ev, gIndex)

      this.dragInfo.groupIndex = null
      this.dragInfo.startPageY = null
    },
    correctionCurrentIndex (ev, gIndex) {
      setTimeout(() => {
        if (typeof gIndex === 'number' && this.data[gIndex].divider !== true && this.data[gIndex].list.length > 0) {
          const unsafeGroupIndex = this.currentIndexList[gIndex]

          let movedIndex = unsafeGroupIndex
          if (unsafeGroupIndex > this.data[gIndex].list.length - 1) {
            movedIndex = this.data[gIndex].list.length - 1
          } else if (unsafeGroupIndex < 0) {
            movedIndex = 0
          }
          movedIndex = Math.round(movedIndex)

          this.currentIndexList[gIndex] = movedIndex;

          if (movedIndex !== this.lastCurrentIndexList[gIndex]) {
            this.change(gIndex, movedIndex)
          }

          this.lastCurrentIndexList = [].concat(this.currentIndexList)
        }
      }, 100)
    },
    isCurrentItem (gIndex, iIndex) {
      return this.currentIndexList[gIndex] === iIndex
    },
    getCurrentIndexList () {
      return this.currentIndexList
    },
    getGroupClass (gIndex) {
      const group = this.data[gIndex]
      const defaultFlexClass = 'flex-' + (group.flex || 1)
      const groupClass = [defaultFlexClass]
      if (group.className) {
        groupClass.push(group.className)
      }
      return groupClass
    },
    getItemClass (gIndex, iIndex, isDevider = false) {
      const itemClass = []
      const group = this.data[gIndex]
      if (group.textAlign) {
        itemClass.push('text-' + group.textAlign)
      }
      if (!isDevider && this.isCurrentItem(gIndex, iIndex)) {
        itemClass.push('ios-item-selected')
      }
      return itemClass
    },
    getItemStyle (gIndex, iIndex) {
      const gapCount = this.currentIndexList[gIndex] - iIndex
      if (Math.abs(gapCount) < 4) {
        let rotateStyle = 'transform: rotateX(' + gapCount * 23 + 'deg) translate3d(0, 0, 5.625em);'
        if (!this.dragInfo.isDragging) {
          rotateStyle += ' transition: transform 150ms ease-out;'
        }
        return rotateStyle
      }
      if (gapCount > 0) {
        return 'transform: rotateX(100deg) translate3d(0, 0, 5.625em)'
      } else {
        return 'transform: rotateX(-100deg) translate3d(0, 0, 5.625em)'
      }
    }
  }
}
</script>