export default {
    methods: {
        getGroupClass (gIndex) {
            const group = this.configuration[gIndex];
            let groupClass = [
                'flex-grow-' + (group.flex || 1),
            ];

            if (Array.isArray(group.className)) {
                groupClass = [
                    ...groupClass,
                    ...group.className
                ];
            } else {
                groupClass.push(group.className);
            }

            return groupClass;
        },
        getItemClass (gIndex, iIndex, isDivider = false) {
            const itemClass = [];
            const group = this.configuration[gIndex];

            if (group.textAlign) {
                itemClass.push('ios-text-align-' + group.textAlign);
            }

            if (!isDivider && this.isCurrentItem(gIndex, iIndex)) {
                itemClass.push('ios-item-selected');
            }

            return itemClass;
        },
        getItemStyle (gIndex, iIndex) {
            const gapCount = this.currentIndexList[gIndex] - iIndex;

            if (Math.abs(gapCount) < 4) {
                let rotateStyle = 'transform: rotateX(' + gapCount * 23 + 'deg) translate3d(0, 0, 5.625em);';

                if (!this.dragInfo.isDragging) {
                    rotateStyle += ' transition: transform 150ms ease-out;';
                }

                return rotateStyle;
            }

            return gapCount > 0
                ? 'transform: rotateX(100deg) translate3d(0, 0, 5.625em)'
                : 'transform: rotateX(-100deg) translate3d(0, 0, 5.625em)';
        },
    },
}