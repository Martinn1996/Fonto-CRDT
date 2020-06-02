const Node = require('./Node');
const generateCode = require('../util/generateCode');

/**
 * Block nodes for blocks in the tree
 */
class BlockNode extends Node {
	/**
	 * Constructor for creating block nodes
	 * @param {*} id for Logoot
	 * @param {*} blockId for refering to blocks
	 * @param {*} LogootConstructor Constructor for a Logoot instance
	 */
	constructor(id, blockId, LogootConstructor) {
		super(id);

		super.type = 'Block';
		this.blockId = blockId;
		this.merged = false;
		this.empty = false;
		this.logoot = new LogootConstructor(blockId ? blockId : generateCode(5));
	}

	setMerged() {
		if (true === this.merged) return;

		this.merged = true;

		this.adjustSize(-1);
	}
}

module.exports = BlockNode;
