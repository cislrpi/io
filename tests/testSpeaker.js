const CELIO = require('../lib/index.js');

const io = new CELIO();
const speaker = io.getSpeaker();

speaker.speak('<speak><express-as type="Uncertainty">How can I help you with mergers and aquisitions?</express-as></speak>', 'en-US_AllisonVoice');
// setTimeout(()=>speaker.stop(), 1500);

