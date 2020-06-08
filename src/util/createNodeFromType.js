const BlockNode = require('../class/BlockNode');
const CharacterNode = require('../class/CharacterNode');
const Node = require('../class/Node');
const SplitNode = require('../class/SplitNode');
const MergeNode = require('../class/MergeNode');

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
		case 'Split':
			return SplitNode;
		case 'Merge':
			return MergeNode;
		default:
			return Node;
	}
}

module.exports = createNodeFromType;
