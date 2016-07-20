const CELIO = require('../lib/index.js');

const io = new CELIO();
const t = io.getTranscript();

t.onFinal((msg, fields, properties) => {
    // console.log(fields);
    // console.log(properties);
    console.log(JSON.stringify(msg));
});

setTimeout(()=>{
    console.log('Sending ping');
    t.publish('test', true, {result:{alternatives:[{transcript:'hi'}]}});
}, 1000);
