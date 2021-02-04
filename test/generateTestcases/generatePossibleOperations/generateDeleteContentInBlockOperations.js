const generateIndices = require('../generateIndices');

module.exports = (rootCRDT, blocks) => {
	const res = [];
	for (const blockId of blocks) {
		const crdt = rootCRDT._searchBlock(blockId).logoot;
		const indices = generateIndices(crdt);
		for (const index of indices) {
			res.push({
				type: 'deleteContentInBlock',
				blockId: blockId,
				index: index,
			});
		}
	}

	return res;
};
