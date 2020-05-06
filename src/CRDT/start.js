const Logoot = require('./src/index');

var l1 = new Logoot('site1')
var l2 = new Logoot('site1')

// send sync messages between peers
l1.on('operation', (op) => {
  // send through your network (just need at-least-once, in-order delivery)
  l2.receive(op)
})
l2.on('operation', (op) => {
  l1.receive(op)
})


l1.insert('abc', 0)
l2.insert('123', 0)
console.log(l1.value()); // 'abc123'
console.log(l2.value()) // 'abc