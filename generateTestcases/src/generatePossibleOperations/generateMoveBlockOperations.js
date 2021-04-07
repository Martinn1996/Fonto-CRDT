const generateIndices = require('../generateIndices');

module.exports = rootCRDT => {
	const indices = generateIndices.nodeBased(rootCRDT);
	const res = [];
	for (const index of indices) {
		for (const blockId of rootCRDT.getBlocks()) {
			res.push({
				type: 'moveBlock',
				blockId: blockId,
				index: index
			});
		}
	}

	return res;
};
