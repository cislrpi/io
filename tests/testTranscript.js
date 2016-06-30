const CELIO = require('../lib/index.js');

const io = new CELIO();
const t = io.getTranscript();

t.onAll(msg => console.log(msg));

setTimeout(()=>{
    console.log('Sending ping');
    t.publish('test', true, {result: {transcript: 'hello'}});
    t.switchModel('generic');
}, 1000);
