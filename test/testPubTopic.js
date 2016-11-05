const CELIO = require('../lib/index.js');

const io = new CELIO();

io.onTopic('vis.*', msg=>{
    console.log(msg.toString())
    //console.log(msg.fields.routingKey)
});

// setInterval(()=>{
//     // console.log('Sending ping');
//     io.publishTopic('test', JSON.stringify({time: new Date().getTime()}));
// }, 10);
