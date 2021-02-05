module.exports = (crdt, blockId, index) => {
	crdt.deleteContentInBlock(index, 1, blockId);
};
