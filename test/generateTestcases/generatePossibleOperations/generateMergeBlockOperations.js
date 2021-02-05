module.exports = rootCRDT => {
	const res = [];
	const blocks = rootCRDT.getBlocks();
	for (const blockId1 of blocks) {
		for (const blockId2 of blocks) {
			if (blockId1 !== blockId2) {
				res.push({
					type: 'mergeBlocks',
					blockId1: blockId1,
					blockId2: blockId2
				});
			}
		}
	}

	return res;
};
