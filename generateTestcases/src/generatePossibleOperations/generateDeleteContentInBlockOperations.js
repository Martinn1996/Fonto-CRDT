const generateIndices = require('../generateIndices');

module.exports = rootCRDT => {
	const res = [];
	for (const blockId of rootCRDT.getBlocks()) {
		const crdt = rootCRDT._searchBlock(blockId).logoot;
		const indices = generateIndices.valueBased(crdt);

		for (const index of indices.slice(0, indices.length - 1)) {
			res.push({
				type: 'deleteContentInBlock',
				blockId: blockId,
				index: index
			});
		}
	}

	return res;
};
