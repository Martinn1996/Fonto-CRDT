const generateIndices = require('../generateIndices');

module.exports = rootCRDT => {
	const res = [];
	const crdt = rootCRDT;
	const indices = generateIndices.valueBased(crdt);
	for (const index of indices) {
		res.push({
			type: 'delete',
			index: index
		});
	}

	return res;
};
