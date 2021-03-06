const generateIndices = require('../generateIndices');

module.exports = rootCRDT => {
	const res = [];
	for (const blockId of rootCRDT.getBlocks()) {
		const crdt = rootCRDT._searchBlock(blockId).logoot;
		const indices = generateIndices.valueBased(crdt);
		for (const index of indices) {
			res.push({
				type: 'insertContentInBlock',
				blockId: blockId,
				index: index,
				text: '' + Math.floor(Math.random() * 9)
			});
		}
	}

	return res;
};
