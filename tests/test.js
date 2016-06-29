const CELIO = require('../lib/index.js');

const io = new CELIO();

io.onTopic('test', msg=>console.log('Received', msg.content.toString()));

setTimeout(()=>{
    console.log('Sending ping');
    io.publishTopic('test', new Buffer('ping'));
}, 1000);

