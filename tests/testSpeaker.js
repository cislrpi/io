const CELIO = require('../lib/index.js');

const io = new CELIO();
const speaker = io.getSpeaker();

const pa=speaker.speak('<speak><express-as type="Uncertainty">How can I help you with mergers and aquisitions?</express-as></speak>', {
    voice: 'en-US_AllisonVoice'
});

pa.then(()=>console.log('Speech passed.')).catch(err=>console.error(err));
setTimeout(()=>{
    speaker.stop();
    speaker.speak('hello');
}, 2000);
