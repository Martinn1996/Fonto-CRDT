const Logoot = require('../src/logoot');

let crdts = [];

// TODO: Delays with setTimeOut?? Or is there a better way?
// Delays not working at the moment :'(
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
			crdts.forEach(function(e) {
				if (tempCrdt.index !== e.index) {
					e.logoot.receive(op);
				}
			});
		} else {
			tempCrdt.operations.push(op);
		}
	});
};

exports.setOffline = function(index) {
	crdts[index - 1].offline = 1;
};

exports.setOnline = function(index) {
	crdts[index - 1].offline = 0;
	crdts[index - 1].operations.forEach(op =>
		crdts.forEach(function(e) {
			if (index !== e.index) {
				e.logoot.receive(op);
			}
		})
	);
};

exports.setAllOffline = function() {
	crdts.forEach(element => (element.offline = 1));
};

exports.setAllOnline = function() {
	crdts.forEach(element => (element.offline = 0));
	crdts.forEach(element =>
		element.operations.forEach(op =>
			crdts.forEach(function(e) {
				if (element.index !== e.index) {
					e.logoot.receive(op);
				}
			})
		)
	);
};

exports.setDelay = function(index, delay) {
	crdts[index - 1].delay = delay;
};

exports.getStatus = function(index) {
	return crdts[index - 1];
};

exports.getAllStatus = function() {
	return crdts;
};

exports.getOperations = function(index) {
	return crdts[index - 1].operations;
};

exports.insertContentInNewBlock = function(crdt, content, index) {
	const block = crdt.insertBlock(index);
	crdt.insertContentInBlock(content, 0, block.blockId);
	return block.blockId;
};

exports.reset = function() {
	crdts = [];
};

exports.shuffle = function(array) {
	let m = array.length;

	// While there remain elements to shuffle…
	while (m > 0) {
		// Pick a remaining element…
		const i = Math.floor(Math.random() * m--);

		// And swap it with the current element.
		const t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
};

module.exports = this;
