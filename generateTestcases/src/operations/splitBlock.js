module.exports = (crdt, blockId, index, newBlockId) => {
	crdt.splitBlock(blockId, index, newBlockId);
};
