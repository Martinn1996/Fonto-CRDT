const Logoot = require('./logoot');

const crdt = new Logoot('fds');
const id = crdt.insertBlock('fds', 0);
console.log(crdt._searchBlock(id));
console.log(crdt.value());
