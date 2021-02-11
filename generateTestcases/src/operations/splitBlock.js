module.exports = (crdt, blockId, index) => {
	crdt.splitBlock(blockId, index);
};
