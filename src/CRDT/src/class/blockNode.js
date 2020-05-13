const Node = require('./node');

class BlockNode extends Node {
	/**
	 * Constructor for creating block nodes
	 * @param {*} id for Logoot
	 * @param {*} blockId for refering to blocks
	 */
	constructor(id, blockId) {
		// Call constructor of parent class
		super(id);

		this.blockId = blockId;
		this.empty = true;
	}
}

// Export class
module.exports = BlockNode;
