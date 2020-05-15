const Logoot = require('./logoot');

const crdt = new Logoot('fds');
crdt.insertBlock('fds', 0);
console.log(crdt.value());