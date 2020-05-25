const BlockNode = require('../class/BlockNode');
const CharacterNode = require('../class/CharacterNode');
const Node = require('../class/Node');

/**
 * Returns the parsed node type
 * @param {string} nodeType to parse
 * @return {Node} parsed node type
 */
function createNodeFromType(nodeType) {
	switch (nodeType) {
		case 'Character':
			return CharacterNode;
		case 'Block':
			return BlockNode;
		default:
			return Node;
	}
}

module.exports = createNodeFromType;
