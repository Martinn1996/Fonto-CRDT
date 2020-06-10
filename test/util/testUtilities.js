const Logoot = require('../../src/logoot');
const generateString = require('../../src/util/generateCode');
let crdts = [];

/**
 * returns all CRDT instances with their status
 * @return {Array <CRDT>} an array containing all CRDT instances with their status
 */
exports.getCRDTs = () => {
	return crdts;
};

exports.wait = ms => {
	const start = new Date().getTime();
	let end = start;
	while (end < start + ms) {
		end = new Date().getTime();
	}
};
/**
 * returns a CRDT on given index (index starts at 1)
 * @param {Integer} index index of the CRDT to return (starts at 1)
 * @return {CRDT} a CRDT on given index (index starts at 1)
 */
exports.crdt = index => {
	return crdts[index - 1].logoot;
};

/**
 * creates a new CRDT with index = number of current CRDTs + 1
 */
exports.createCRDT = () => {
	const tempCrdt = {
		logoot: new Logoot(generateString(5)),
		offline: 0,
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

/**
 * Sets a CRDT on given index (index starts at 1) offline
 * @param {Integer} index index of the CRDT to return (starts at 1)
 */
exports.setOffline = index => {
	crdts[index - 1].offline = 1;
};

/**
 * Sets a CRDT on given index (index starts at 1) online
 * @param {Integer} index index of the CRDT to return (starts at 1)
 */
exports.setOnline = index => {
	crdts[index - 1].offline = 0;
	crdts[index - 1].operations.forEach(op =>
		crdts.forEach(function(e) {
			if (index !== e.index) {
				e.logoot.receive(op);
			}
		})
	);
};

/**
 * Sets all CRDTs offline
 */
exports.setAllOffline = () => {
	crdts.forEach(element => (element.offline = 1));
};

/**
 * Sets all CRDTs online
 */
exports.setAllOnline = () => {
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

/**
 * @param {Integer} index index of the CRDT to return (starts at 1)
 * @return {CRDT} returns the status of the CRDT on given index (index starts at 1)
 */
exports.getStatus = index => {
	return crdts[index - 1];
};

/**
 * Returns an array with all stored operations of the CRDT on given index (index starts at 1)
 * @param {Integer} index index of the CRDT to return (starts at 1)
 * @return {Array <Operation>} Array with all stored operations of the CRDT on given index (index starts at 1)
 */
exports.getOperations = index => {
	return crdts[index - 1].operations;
};

/**
 * Creates a new block in a CRDT containing text
 * @param {CRDT} crdt to insert block with text in
 * @param {string} content content to insert in newly created block
 * @param {Integer} index index to create block
 * @return {string} The blockId of the newly inserted block
 */
exports.insertContentInNewBlock = (crdt, content, index) => {
	const block = crdt.insertBlock(index);
	crdt.insertContentInBlock(content, 0, block.blockId);
	return block.blockId;
};

/**
 * Resets all CRDTs
 */
exports.reset = () => {
	crdts = [];
};

/**
 * Shuffles all instances in an array (can be used to shuffle operation order)
 * @param {Array <Object>} array the array to shuffle
 */
exports.shuffle = array => {
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
