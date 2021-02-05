module.exports = (crdt, blockId, index, text) => {
	crdt.insertContentInBlock(text, index, blockId);
};
