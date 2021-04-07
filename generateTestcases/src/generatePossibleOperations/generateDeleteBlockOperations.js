module.exports = crdt => {
	return crdt.getBlocks().map(block => {
		return {
			type: 'deleteBlock',
			blockId: block
		};
	});
};
