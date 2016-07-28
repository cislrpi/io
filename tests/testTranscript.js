const CELIO = require('../lib/index.js');

const io = new CELIO();
const t = io.getTranscript();

t.onFinal((msg, headers) => {
    // console.log(fields);
    // console.log(properties);
    console.log(JSON.stringify(msg));
    input = msg.result.alternatives[0].transcript;
    if (input.indexOf('stopped listen') > -1 || input.indexOf('stop listen') > -1) {
        t.stopPublishing();
    }
});

setTimeout(()=>{
    console.log('Sending ping');
    t.publish('test', true, {result:{alternatives:[{transcript:'hi'}]}});
}, 1000);
