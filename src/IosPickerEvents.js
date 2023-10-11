export default {
    methods: {
        eventsRegister () {
            const handleEventLayer = this.$refs.iosHandleLayer;

            if(!handleEventLayer) {
                return;
            }

            this.addEventsForElement(handleEventLayer);
        },
        addEventsForElement (el) {
            const _ = this.dragInfo.isTouchable;

            const eventHandlerList = [
                { name: _ ? 'touchstart' : 'mousedown', handler: this.handleStart },
                { name: _ ? 'touchmove' : 'mousemove', handler: this.handleMove },
                { name: _ ? 'touchend' : 'mouseup', handler: this.handleEnd },
                { name: _ ? 'touchcancel' : 'mouseleave', handler: this.handleCancel }
            ];

            for (const item of eventHandlerList) {
                el.removeEventListener(item.name, item.handler, false);
                el.addEventListener(item.name, item.handler, false);
            }
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
        triggerMiddleLayerGroupClick (gIndex) {
            const data = this.configuration;

            if(typeof gIndex !== 'number') {
                return;
            }

            const dataItem = data[gIndex];

            if (!dataItem.hasOwnProperty('onClick')) {
                return;
            }

            if(typeof dataItem.onClick !== 'function') {
                return;
            }

            data[gIndex].onClick(gIndex, this.currentIndexList[gIndex]);
        },
        triggerAboveLayerClick (ev, gIndex) {
            this.currentIndexList[gIndex] = this.currentIndexList[gIndex] + 1;
            this.correctionCurrentIndex(ev, gIndex);
        },
        triggerMiddleLayerClick (ev, gIndex) {
            this.triggerMiddleLayerGroupClick(gIndex);
        },
        triggerBelowLayerClick (ev, gIndex) {
            this.currentIndexList[gIndex] = this.currentIndexList[gIndex] - 1;
            this.correctionCurrentIndex(ev, gIndex);
        },
        getTouchInfo (ev) {
            return this.dragInfo.isTouchable ? ev.changedTouches[0] || ev.touches[0] : ev
        },
    },
}