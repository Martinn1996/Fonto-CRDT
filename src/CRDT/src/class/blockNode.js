const Node = require('./node');

/**
 * Class for blocks of characters
 * @param {*} id for Logoot
 * @param {*} blockId for refering to blocks
 */
function BlockNode(id, blockId) {
	// Call constructor of parent class
	Node.call(this, id);

	this.blockId = blockId;
	this.empty = true;
}

// Extend Node class
BlockNode.prototype = Object.create(Node.prototype);

// Export class
module.exports = BlockNode;
