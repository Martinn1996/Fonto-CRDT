const Node = require('./Node');

/**
 * Special node to recognize a split in a block
 */
class SplitNode extends Node {
	/**
	 * Constructor for creating split nodes
	 * @param {Integer} id for Logoot
	 * @param {string} reference blockId to refer to
	 */
	constructor(id, reference) {
		super(id);
		super.type = 'Split';

		this.reference = reference;
	}
}

module.exports = SplitNode;
