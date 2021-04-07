const generateCode = require('../../../src/util/generateCode');
const generateIndices = require('../generateIndices');

module.exports = rootCRDT => {
	const res = [];
	for (const blockId of rootCRDT.getBlocks()) {
		const crdt = rootCRDT._searchBlock(blockId).logoot;
		const indices = generateIndices.valueBased(crdt);
		for (const index of indices.slice(1, indices.length - 1)) {
			res.push({
				type: 'splitBlock',
				blockId: blockId,
				index: index,
				newBlockId: generateCode(5)
			});
		}
	}
	return res;
};
