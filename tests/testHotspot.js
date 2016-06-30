const CELIO = require('../lib/index.js');
const io = new CELIO();

h = io.createHotspot({
    normal: [0, 0, 1],
    center: [175.2119, 910.8918, -4263.35],
    over: [1.0, 0.0, 0.0],
    width: 7710,
    height: 4350
});

h.onPointerEnter(msg => {console.log('Entered', msg.details.name);});
h.onPointerLeave(msg => {console.log('Left', msg.details.name);});
h.onPointerDown(msg => {console.log('Down', msg.eventButton);});
h.onPointerUp(msg => {console.log('Up', msg.eventButton);});
h.onPointerClick(msg => {console.log('Click', msg.eventButton);});
h.onPointerAttach(msg => {console.log('Attach', msg.details.name);});
h.onPointerDetach(msg => {console.log('Detach', msg);});
// h.onPointerMove(msg => {console.log('Move', msg.details.name);});
