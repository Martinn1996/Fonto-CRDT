const Node = require('./node');

/**
 * Node for resolving conflicts
 * @param {*} id for Logoot
 */
function IntermediateNode(id) {
	// Call constructor of parent class
	Node.call(this, id);

	this.empty = true;
}

// Extend Node class
IntermediateNode.prototype = Object.create(Node.prototype);

// Export class
module.exports = IntermediateNode;
