const CELIO = require('../lib/index.js');
const io = new CELIO();

h = io.defineHotspot({
    normal: [0, 0, 1],
    center: [175.2119, 910.8918, -4263.35],
    over: [1.0, 0.0, 0.0],
    width: 7710,
    height: 4350
});

h.on(msg => {
    if (msg && msg.within) {
        console.log(msg);
    }
});
