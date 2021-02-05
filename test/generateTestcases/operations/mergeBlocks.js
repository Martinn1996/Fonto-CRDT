module.exports = (crdt, blockId1, blockId2) => {
	crdt.mergeBlocks(blockId1, blockId2);
};
