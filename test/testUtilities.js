const assert = require('chai').assert;
const Logoot = require('../src/logoot');

let crdts = [];

//TODO: Delays with threads??? or is there a better way?
function createCRDTs() {
        let crdt = {logoot: new Logoot(), offline: 0, delay: 0, operations: [], index: crdt.length};
        crdts.push(crdt);

        crdt.logoot.on('operation', op => {
            if(crdt.offline == 0){
                crdts.forEach(function(e, idx){
                    if (idx !== e.index){ 
                        op => e.receive(op);
                    }
                 });
            }else{
                crdts.forEach(function(e, idx){
                    if (idx !== e.index){ 
                        e.operations.push(op);
                    }
                 });
            }
        });
    }
	return crdts;
}

function putOffline(index){
    crdts[index].offline = 1;
}

function putOnline(index){
    offline[index].offline = 0;
    crdts[index].operations.forEach(op =>  
        crdts.forEach(function(e, idx){
        if (idx !== e.index){ 
            e.operations.push(op);
        }
     }));
}

function putAllOffline() {
    crdts.forEach(element => element.offline = 0);
}

function putAllOnline() {
    crdts.forEach(element => element.offline = 1);
    crdts.forEach(element => element.operations.forEach(op =>  
        crdts.forEach(function(e, idx){
        if (idx !== e.index){ 
            e.operations.push(op);
        }
     })));
}

function setDelay(index, delay) {
    crdts[index].delay = delay;
}

function getStatus(index) {
    return crdts[index]
}

function getAllStatus(index) {
    return crdts;
}

function insertContentInNewBlock(crdt, content, index) {
    const block = crdt.insertBlock(index);
    crdt.insertContentInBlock(content, 0, block.blockId);
    return block.blockId;
}

