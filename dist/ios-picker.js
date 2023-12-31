import { openBlock as r, createElementBlock as o, Fragment as g, renderList as f, normalizeClass as h, createElementVNode as l, toDisplayString as p, normalizeStyle as I } from "vue";
const y = {
  methods: {
    eventsRegister() {
      const t = this.$refs.iosHandleLayer;
      t && this.addEventsForElement(t);
    },
    addEventsForElement(t) {
      const e = this.dragInfo.isTouchable, s = [
        { name: e ? "touchstart" : "mousedown", handler: this.handleStart },
        { name: e ? "touchmove" : "mousemove", handler: this.handleMove },
        { name: e ? "touchend" : "mouseup", handler: this.handleEnd },
        { name: e ? "touchcancel" : "mouseleave", handler: this.handleCancel }
      ];
      for (const i of s)
        t.removeEventListener(i.name, i.handler, !1), t.addEventListener(i.name, i.handler, !1);
    },
    handleEventClick(t) {
      const e = this.getGroupIndexBelongsEvent(t);
      switch (t.target.dataset.type) {
        case "top":
          this.triggerAboveLayerClick(t, e);
          break;
        case "middle":
          this.triggerMiddleLayerClick(t, e);
          break;
        case "bottom":
          this.triggerBelowLayerClick(t, e);
          break;
      }
    },
    handleStart(t) {
      t.cancelable && (t.preventDefault(), t.stopPropagation());
      const e = this.getTouchInfo(t);
      this.dragInfo.startPageY = e.pageY, this.dragInfo.isTouchable || (this.dragInfo.isMouseDown = !0);
    },
    handleMove(t) {
      t.cancelable && (t.preventDefault(), t.stopPropagation()), (this.dragInfo.isTouchable || this.dragInfo.isMouseDown) && (this.dragInfo.isDragging = !0, this.setCurrentIndexOnMove(t));
    },
    handleEnd(t) {
      t.cancelable && (t.preventDefault(), t.stopPropagation()), this.dragInfo.isDragging || this.handleEventClick(t), this.dragInfo.isDragging = !1, this.dragInfo.isMouseDown = !1, this.correctionAfterDragging(t);
    },
    handleCancel(t) {
      t.cancelable && (t.preventDefault(), t.stopPropagation()), (this.dragInfo.isTouchable || this.dragInfo.isMouseDown) && (this.correctionAfterDragging(t), this.dragInfo.isMouseDown = !1, this.dragInfo.isDragging = !1);
    },
    triggerMiddleLayerGroupClick(t) {
      const e = this.configuration;
      if (typeof t != "number")
        return;
      const s = e[t];
      s.hasOwnProperty("onClick") && typeof s.onClick == "function" && e[t].onClick(t, this.currentIndexList[t]);
    },
    triggerAboveLayerClick(t, e) {
      this.currentIndexList[e] = this.currentIndexList[e] + 1, this.correctionCurrentIndex(t, e);
    },
    triggerMiddleLayerClick(t, e) {
      this.triggerMiddleLayerGroupClick(e);
    },
    triggerBelowLayerClick(t, e) {
      this.currentIndexList[e] = this.currentIndexList[e] - 1, this.correctionCurrentIndex(t, e);
    },
    getTouchInfo(t) {
      return this.dragInfo.isTouchable ? t.changedTouches[0] || t.touches[0] : t;
    }
  }
}, L = {
  methods: {
    getGroupClass(t) {
      const e = this.configuration[t];
      let s = [
        "flex-grow-" + (e.flex || 1)
      ];
      return Array.isArray(e.className) ? s = [
        ...s,
        ...e.className
      ] : s.push(e.className), s;
    },
    getItemClass(t, e, s = !1) {
      const i = [], n = this.configuration[t];
      return n.textAlign && i.push("ios-text-align-" + n.textAlign), !s && this.isCurrentItem(t, e) && i.push("ios-item-selected"), i;
    },
    getItemStyle(t, e) {
      const s = this.currentIndexList[t] - e;
      if (Math.abs(s) < 4) {
        let i = "transform: rotateX(" + s * 23 + "deg) translate3d(0, 0, 5.625em);";
        return this.dragInfo.isDragging || (i += " transition: transform 150ms ease-out;"), i;
      }
      return s > 0 ? "transform: rotateX(100deg) translate3d(0, 0, 5.625em)" : "transform: rotateX(-100deg) translate3d(0, 0, 5.625em)";
    }
  }
}, C = (t, e) => {
  const s = t.__vccOpts || t;
  for (const [i, n] of e)
    s[i] = n;
  return s;
}, v = {
  name: "ios-picker",
  mixins: [
    y,
    L
  ],
  emits: ["update"],
  props: {
    configuration: {
      type: Array,
      default: []
    }
  },
  data() {
    return {
      currentGroupIndex: 0,
      // for suppress vue-loader warning
      iIndex: 0,
      // for suppress vue-loader warning
      currentIndexList: this.getInitialCurrentIndexList(),
      // save groups's index
      lastCurrentIndexList: [],
      // for detect which group's current index if it is changed
      groupsRectList: new Array(this.configuration.length),
      // save the dom rect list of this picker's groups
      dragInfo: {
        // save drag(ing) info
        isTouchable: "ontouchstart" in window,
        // for detect event belongs to touch or mouse
        isMouseDown: !1,
        // save the status of mouse (touch) is start and it is not end
        isDragging: !1,
        // for detect the status of mouse (touch) is dragging (moving) after isMouseDown or not
        groupIndex: null,
        // save which group is dragging now
        startPageY: null
        // save the pageY value of mouse (touch) after begin isMouseDown
      },
      supInfo: {
        // supporting for picker usefulness
        getRectTimeoutId: null,
        // save timeout id
        lastStyleDisplay: null,
        // for detect picker style display if it is changed
        watchDomObserver: null
        // for watching this picker dom
      }
    };
  },
  mounted() {
    this.eventsRegister(), this.$nextTick(this.getGroupsRectList), this.supInfo.watchDomObserver = this.createDomObserver(), this.supInfo.watchDomObserver.observe(this.$el, { attributes: !0 }), window.addEventListener("resize", this.safeGetGroupRectList);
  },
  destroyed() {
    this.supInfo.watchDomObserver.disconnect(), window.removeEventListener("resize", this.safeGetGroupRectList);
  },
  methods: {
    getInitialCurrentIndexList() {
      return this.configuration.map((t) => {
        const e = t.currentIndex;
        return typeof e == "number" && e >= 0 && t.list && t.list.length && e <= t.list.length - 1 ? Math.round(e) : 0;
      });
    },
    createDomObserver() {
      return new window.MutationObserver((t) => {
        for (const e of t) {
          if (e.type !== "attributes")
            continue;
          const s = this.$el.style.display;
          s !== "none" && this.supInfo.lastStyleDisplay !== s && (this.supInfo.lastStyleDisplay = s, this.$nextTick(this.getGroupsRectList));
        }
      });
    },
    safeGetGroupRectList() {
      this.supInfo.getRectTimeoutId && clearTimeout(this.supInfo.getRectTimeoutId), this.supInfo.getRectTimeoutId = setTimeout(() => {
        this.getGroupsRectList();
      }, 200);
    },
    getGroupsRectList() {
      this.$refs.iosGroup && this.$refs.iosGroup.forEach((t, e) => {
        this.groupsRectList[e] = t.getBoundingClientRect();
      });
    },
    getGroupIndexBelongsEvent(t) {
      const e = this.getTouchInfo(t);
      for (let s = 0; s < this.groupsRectList.length; s++) {
        const i = this.groupsRectList[s];
        if (i.left < e.pageX && e.pageX < i.right)
          return s;
      }
      return null;
    },
    setCurrentIndexOnMove(t) {
      const e = this.getTouchInfo(t);
      this.dragInfo.groupIndex === null && (this.dragInfo.groupIndex = this.getGroupIndexBelongsEvent(t));
      const s = this.dragInfo.groupIndex;
      if (typeof s == "number" && (this.configuration[s].divider || !this.configuration[s].list))
        return;
      const i = (this.dragInfo.startPageY - e.pageY) / 32;
      this.currentIndexList[s] = this.currentIndexList[s] + i, this.dragInfo.startPageY = e.pageY;
    },
    correctionAfterDragging(t) {
      const e = this.dragInfo.groupIndex;
      this.correctionCurrentIndex(t, e), this.dragInfo.groupIndex = null, this.dragInfo.startPageY = null;
    },
    correctionCurrentIndex(t, e) {
      setTimeout(() => {
        if (typeof e != "number" || this.configuration[e].divider || !this.configuration[e].list.length)
          return;
        const s = this.getMovedIndex(e);
        this.currentIndexList[e] = s, s !== this.lastCurrentIndexList[e] && this.onUpdateEmit(e, s), this.lastCurrentIndexList = [].concat(this.currentIndexList);
      }, 100);
    },
    isCurrentItem(t, e) {
      return this.currentIndexList[t] === e;
    },
    getMovedIndex(t) {
      const e = this.currentIndexList[t];
      let s = e;
      return e < 0 && (s = 0), e > this.configuration[t].list.length - 1 && (s = this.configuration[t].list.length - 1), Math.round(s);
    },
    onUpdateEmit(t, e) {
      const s = this.configuration;
      s[t].currentIndex = e, this.$emit(
        "update",
        t,
        e,
        this.configuration[t].list[e],
        s
      );
    }
  }
}, b = { class: "ios-picker display-flex" }, x = { class: "ios-list" }, k = {
  ref: "iosHandleLayer",
  class: "ios-handle-layer display-flex flex-direction-column"
}, D = /* @__PURE__ */ l("div", {
  "data-type": "top",
  class: "ios-top flex-grow-1"
}, null, -1), w = /* @__PURE__ */ l("div", {
  "data-type": "middle",
  class: "ios-middle"
}, null, -1), E = /* @__PURE__ */ l("div", {
  "data-type": "bottom",
  class: "ios-bottom flex-grow-1"
}, null, -1), _ = [
  D,
  w,
  E
];
function M(t, e, s, i, n, R) {
  return r(), o("div", b, [
    (r(!0), o(g, null, f(s.configuration, (c, a) => (r(), o("div", {
      key: a,
      class: h([t.getGroupClass(a), "ios-group"]),
      ref_for: !0,
      ref: "iosGroup"
    }, [
      l("div", x, [
        c.divider ? (r(), o("div", {
          key: 0,
          class: h([t.getItemClass(a, n.iIndex, !0), "ios-item divider"])
        }, p(c.text), 3)) : (r(!0), o(g, { key: 1 }, f(c.list, (d, u) => (r(), o("div", {
          key: u,
          class: h([t.getItemClass(a, u), "ios-item"]),
          style: I(t.getItemStyle(a, u))
        }, p(d.value || d), 7))), 128))
      ])
    ], 2))), 128)),
    l("div", k, _, 512)
  ]);
}
const m = /* @__PURE__ */ C(v, [["render", M]]), T = (t) => {
  t.component(m.name, m);
}, A = {
  install: T
};
export {
  m as IosPicker,
  A as default,
  T as install
};
