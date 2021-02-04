const generateIndices = require('../generateIndices');

module.exports = (rootCRDT, blocks) => {
	const indices = generateIndices(rootCRDT);
	const res = [];
	for (const index of indices) {
		for (const blockId of blocks) {
			res.push({
				type: 'moveBlock',
				blockId: blockId,
				index: index
			});
		}
	}

	return res;
};
