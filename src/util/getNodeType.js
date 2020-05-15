const CharacterNode = require('../class/characterNode');
const BlockNode = require('../logoot').BlockNode;
const IntermediateNode = require('../class/intermediateNode');
const Node = require('../class/node');

module.exports = nodeType => {
	switch (nodeType) {
		case 'Character':
			return CharacterNode;
		case 'Block':
			return BlockNode;
		case 'Intermediate':
			return IntermediateNode;
		default:
			return Node;
	}
};
