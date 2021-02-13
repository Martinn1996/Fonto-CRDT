const generateIndices = require('../generateIndices');

module.exports = rootCRDT => {
	const res = [];
	for (const blockId of rootCRDT.getBlocks()) {
		const crdt = rootCRDT._searchBlock(blockId).logoot;
		const indices = generateIndices(crdt);
		for (const index of indices) {
		for (const index of indices.slice(1, indices.length - 1)) {
			res.push({
				type: 'splitBlock',
				blockId: blockId,
				index: index
			});
		}
	}

	return res;
};
