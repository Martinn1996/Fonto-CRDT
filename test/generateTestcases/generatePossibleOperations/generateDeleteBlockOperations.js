module.exports = (_, blocks) => {
	return blocks.map(block => {
		return {
			type: 'deleteBlock',
			blockId: block
		};
	});
};
