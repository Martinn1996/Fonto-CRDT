const Node = require('./node');
const Logoot = require('../logoot');

class BlockNode extends Node {
	/**
	 * Constructor for creating block nodes
	 * @param {*} id for Logoot
	 * @param {*} blockId for refering to blocks
	 */
	constructor(id, blockId) {
		// Call constructor of parent class
		super(id);
		super.type = 'Block';

		this.blockId = blockId;
		this.empty = true;
		this.logoot = new Logoot(this.blockId);
		this.logoot._root = this;
	}
}

// Export class
module.exports = BlockNode;
