const generateIndices = require('../generateIndices');

module.exports = rootCRDT => {
	const res = [];
	const crdt = rootCRDT;
	const indices = generateIndices(crdt);
	for (const index of indices) {
		res.push({
			type: 'insert',
			index: index,
			text: '' + Math.floor(Math.random() * 9)
		});
	}

	return res;
};
