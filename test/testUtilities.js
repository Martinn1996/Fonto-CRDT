const Logoot = require('../src/logoot');

let crdts = [];

// TODO: Delays with threads??? or is there a better way?
exports.getCRDTs = function() {
	return crdts;
};

exports.crdt = function(index) {
	return crdts[index - 1].logoot;
};

exports.createCRDT = function() {
	const tempCrdt = {
		logoot: new Logoot(),
		offline: 0,
		delay: 0,
		operations: [],
		index: crdts.length
	};
	crdts.push(tempCrdt);

	tempCrdt.logoot.on('operation', op => {
		if (tempCrdt.offline === 0) {
			crdts.forEach(function(e, idx) {
				// if (idx !== e.index) {
				    e.logoot.receive(op);
				// }
			});
		} else {
			tempCrdt.operations.push(op);
		}
	});
};

exports.putOffline = function(index) {
	crdts[index].offline = 1;
};

exports.putOnline = function(index) {
	crdts[index].offline = 0;
	crdts[index].operations.forEach(op =>
		crdts.forEach(function(e, idx) {
			if (idx !== e.index) {
				e.operations.push(op);
			}
		})
	);
};

exports.putAllOffline = function() {
	crdts.forEach(element => (element.offline = 0));
};

exports.putAllOnline = function() {
	crdts.forEach(element => (element.offline = 1));
	crdts.forEach(element =>
		element.operations.forEach(op =>
			crdts.forEach(function(e, idx) {
				if (idx !== e.index) {
					e.operations.push(op);
				}
			})
		)
	);
};

exports.setDelay = function(index, delay) {
	crdts[index].delay = delay;
};

exports.getStatus = function(index) {
	return crdts[index];
};

exports.getAllStatus = function() {
	return crdts;
};

exports.insertContentInNewBlock = function(crdt, content, index) {
	const block = crdt.insertBlock(index);
	crdt.insertContentInBlock(content, 0, block.blockId);
	return block.blockId;
};

exports.reset = function() {
	crdts = [];
};

module.exports = this;
