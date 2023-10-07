import IosPicker from "@/IosPicker.vue";

const install = (app) => {
    app.component(IosPicker.name, IosPicker);
};

export {
    IosPicker,
    install
};

export default {
    install
};