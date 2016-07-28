const CELIO = require('../lib/index.js');

const io = new CELIO();

io.doCall('test-queue', msg=>{
    console.log(msg.toString());
    return 'world';
    // return new Error('wrong');
}, true, false);

setTimeout(function() {
    io.call('test-queue', 'hello').then(msg=>console.log(msg.toString()))
        .catch(e=>console.error(e));
}, 1000);