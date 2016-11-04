const CELIO = require('../lib/index.js');

const io = new CELIO();
io.publishTopic('pool.knice', JSON.stringify({descrips: ["a"], ingests: {}}))
io.onTopic('pool.knice', msg=>console.log(msg.toString()))
// const t = io.getTranscript();

// t.onFinal((msg, headers) => {
//     // console.log(fields);
//     // console.log(properties);
//     console.log(msg);
//     input = msg.result.alternatives[0].transcript;
//     if (input.indexOf('stopped listen') > -1 ||
//         input.indexOf('stop listen') > -1) {
//         t.stopPublishing();
//     }

//     const regexSpeakerID = /this is (.+) speaking $/;
//     const match = msg.result.alternatives[0].transcript.match(regexSpeakerID);
//     if (match) {
//         console.log('tagging channel');
//         t.tagChannel(msg.workerID, msg.channelIndex, match[1]);
//     }
// });

// setTimeout(()=>{
//     console.log('Sending ping');
//     t.publish('test', true, {result:{alternatives:[{transcript:'hi'}]}});
// }, 1000);
