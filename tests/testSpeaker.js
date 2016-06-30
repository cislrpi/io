const CELIO = require('../lib/index.js');

const io = new CELIO();
const speaker = io.getSpeaker();

speaker.speak('Hello. How are you?', 'en-US_AllisonVoice');
setTimeout(()=>speaker.stop(), 1500);

