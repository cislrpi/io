const CELIO = require('../lib/index.js');

const io = new CELIO();

io.onTopic('display.*', msg=>{
    console.log(msg.content.toString())
    console.log(msg.fields.routingKey)
});

// setInterval(()=>{
//     // console.log('Sending ping');
//     io.publishTopic('test', JSON.stringify({time: new Date().getTime()}));
// }, 10);
