const CELIO = require('../lib/index.js');

const io = new CELIO();

io.onTopic('test', msg=>console.log(new Date().getTime() - JSON.parse(msg.content.toString()).time));

setInterval(()=>{
    // console.log('Sending ping');
    io.publishTopic('test', JSON.stringify({time: new Date().getTime()}));
}, 10);
