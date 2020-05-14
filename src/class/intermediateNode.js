const Node = require('./node');

class IntermediateNode extends Node {
	/**
	 * Constructor for creating intermediate nodes
	 * @param {*} id for Logoot
	 */
	constructor(id) {
		// Call constructor of parent class
		super(id);

		this.empty = true;
		super.type = 'Intermediate';
	}
}

// Export class
module.exports = IntermediateNode;
