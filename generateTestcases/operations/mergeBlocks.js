const { wait } = require("../../test/util/testUtilities");

module.exports = (crdt, blockId1, blockId2) => {
	crdt.mergeBlocks(blockId1, blockId2);
	wait(10);
};
