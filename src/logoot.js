const EventEmitter = require('nanobus');
const inherits = require('inherits');

const Node = require('./class/node');
const CharacterNode = require('./class/characterNode');
const Identifier = require('./identifier');
// const BlockNode = require('./class/blockNode');

const createNodeFromType = require('./util/getNodeType');
const generateString = require('./util/generateCode');

// eslint-disable-next-line no-use-before-define
inherits(Logoot, EventEmitter);

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
		this.logoot = new Logoot(blockId);
	}

	getChildren() {
		return this.logoot._root.children;
	}
}

const MIN = 0;
const MAX = Number.MAX_SAFE_INTEGER;
const BASE = Math.pow(2, 8);

function Logoot(site, state, bias) {
	EventEmitter.call(this);

	this.site = site;
	this.clock = 0;
	this._deleteQueue = [];
	this._bias = bias || 15;

	Node.compare = (a, b) => {
		return a.compare(b);
	};

	this._root = new Node();
	this._root.setEmpty(true);
	this._root.addChild(new Node(new Identifier(MIN, null, null)));
	this._root.addChild(new Node(new Identifier(BASE, null, null)));

	if (state) this.setState(state);
}

function parseId(id) {
	if (id) return new Identifier(id.int, id.site, id.clock);
}
function parseOperation(operation) {
	operation.parsed = true;
	operation.position = operation.position.map(parseId);
	return operation;
}
function arePositionsEqual(a, b) {
	if (a.length !== b.length) return false;
	return !a.some((id, index) => {
		return id.compare(b[index]) !== 0;
	});
}

Logoot.prototype.receive = function(operation) {
	if (!operation.parsed) operation = parseOperation(operation);
	switch (operation.type) {
		case 'insert':
			this._receiveInsert(operation);
			break;
		case 'delete':
			this._receiveDelete(operation);
			break;
		case 'insertBlock':
			this._receiveInsertBlock(operation);
			break;
	}
};

Logoot.prototype._receiveInsert = function(operation) {
	const deleteQueueIndex = this._deleteQueue.findIndex(op => {
		return arePositionsEqual(op.position, operation.position);
	});
	if (deleteQueueIndex > -1) {
		this._deleteQueue.splice(deleteQueueIndex, 1);
		return;
	}
	const existingNode = this._root.getChildByPath(operation.position, false, CharacterNode);

	// invalid duplication, ignore it
	if (existingNode) return;
	const node = this._root.getChildByPath(operation.position, true, CharacterNode);
	node.value = operation.value;
	node.setEmpty(false);
	const index = node.getOrder();

	this.emit('insert', { value: node.value, index });
};

Logoot.prototype._receiveDelete = function(operation) {
	const node = this._root.getChildByPath(operation.position, false, CharacterNode);
	if (node && !node.empty) {
		const index = node.getOrder();
		const value = node.value;
		node.setEmpty(true);
		node.trimEmpty();

		this.emit('delete', { value, index });
	} else if (
		!this._deleteQueue.some(op => {
			return arePositionsEqual(op.position, operation.position);
		})
	) {
		this._deleteQueue.push(operation);
	}
};

// To fix
Logoot.prototype._receiveInsertBlock = function(operation) {
	const deleteQueueIndex = this._deleteQueue.findIndex(op => {
		return arePositionsEqual(op.position, operation.position);
	});
	if (deleteQueueIndex > -1) {
		this._deleteQueue.splice(deleteQueueIndex, 1);
		return;
	}
	const existingNode = this._root.getChildByPath(operation.position, false, BlockNode);

	// invalid duplication, ignore it
	if (existingNode) return;
	const node = this._root.getChildByPath(operation.position, true, BlockNode);
	const blockId = operation.blockId;
	node.blockId = blockId;
	node.setEmpty(true);
	const index = node.getOrder();

	this.emit('insertBlock', { blockId: blockId, index });
};

Logoot.prototype.insert = function(value, index) {
	value.split('').forEach((character, i) => {
		this._insert(character, index + i);
	});
};

Logoot.prototype._insert = function(value, index) {
	index = Math.min(index, this.length());

	const prev = this._root.getChildByOrder(index);
	const next = this._root.getChildByOrder(index + 1);

	const prevPos = prev.getPath();
	const nextPos = next.getPath();

	const position = this._generatePositionBetween(prevPos, nextPos);

	const node = this._root.getChildByPath(position, true, CharacterNode);
	node.value = value;
	node.setEmpty(false);

	this.emit('operation', { type: 'insert', position, value });
};

function randomBiasedInt(a, b, bias) {
	return Math.floor(Math.pow(Math.random(), bias) * (b - (a + 1))) + a + 1;
}
function randomAlternation(bias) {
	return Math.random() > 0.5 ? bias : 1 / bias;
}
function doubledBase(depth) {
	return Math.min(BASE * Math.pow(2, depth), MAX);
}

Logoot.prototype._generateNewIdentifier = function(prevInt, nextInt) {
	const int = randomBiasedInt(prevInt, nextInt, randomAlternation(this._bias));
	return new Identifier(int, this.site, this.clock++);
};

Logoot.prototype._generatePositionBetween = function(prevPos, nextPos) {
	const newPos = [];

	const maxLength = Math.max(prevPos.length, nextPos.length);
	let samePrefixes = true;

	for (let depth = 0; depth < maxLength + 1; depth++) {
		const DEPTH_MAX = doubledBase(depth);
		const prevId = prevPos[depth] || new Identifier(MIN, null, null);

		// base doubling
		const nextId =
			samePrefixes && nextPos[depth] ? nextPos[depth] : new Identifier(DEPTH_MAX, null, null);

		const diff = nextId.int - prevId.int;

		if (diff > 1) {
			// enough room for integer between prevInt and nextInt
			newPos.push(this._generateNewIdentifier(prevId.int, nextId.int));
			break;
		} else {
			// eslint-disable-next-line no-unused-expressions
			if (prevId.site === null && depth > 0) prevId.site === this.site;
			newPos.push(prevId);
			if (prevId.compare(nextId) !== 0) samePrefixes = false;
		}
	}

	return newPos;
};

Logoot.prototype.delete = function(index, length = 1) {
	for (let i = 0; i < length; i++) {
		this._delete(index);
	}
};

Logoot.prototype._delete = function(index) {
	const node = this._root.getChildByOrder(index + 1);
	if (!node || node.id.site === null) return;

	const position = node.getPath();
	node.setEmpty(true);
	node.trimEmpty();
	this.emit('operation', { type: 'delete', position });
};

// construct a string from the sequence
Logoot.prototype.value = function() {
	const arr = [];
	this._root.walk(node => {
		if (!node.empty) arr.push(node.value);
	});
	return arr.join('');
};

Logoot.prototype.length = function() {
	return this._root.size - 2;
};

Logoot.prototype.replaceRange = function(value, start, length) {
	this.delete(start, length);
	this.insert(value, start);
};

Logoot.prototype.setValue = function(value) {
	this.replaceRange(value, 0, this.length());
};

Logoot.prototype.getState = function() {
	return JSON.stringify(
		{
			root: this._root,
			deleteQueue: this._deleteQueue
		},
		(key, value) => (key === 'parent' ? undefined : value)
	);
};

Logoot.prototype.setState = function(state) {
	const parsed = JSON.parse(state);

	function parseNode(n, parent) {
		const NodeType = createNodeFromType(n.type);
		const node = new NodeType(parseId(n.id), n.value);
		node.parent = parent;
		node.children = n.children.map(c => parseNode(c, node));
		node.size = n.size;
		node.empty = n.empty;
		return node;
	}

	this._root = parseNode(parsed.root, null);
	this._deleteQueue = parsed.deleteQueue;
};

// ***********************************
// | ADDITIONAL FUNCTIONS FOR BLOCKS |
// ***********************************

/**
 * New insertion for characters
 * @param { * } value for insertion
 * @param { * } index the offset
 * @param { * } block to write to
 */
Logoot.prototype.insertBlock = function(value, index, block) {
	// Initialise node for insertion
	let node;

	// Checks whether the insertion is for a specific block
	if (block !== undefined && block !== null && block !== '') {
		node = this._searchBlock(block);
	} else {
		// Connect block node to current tree
		node = this._allocateBlock();
	}

	// For every character in the value
	value.split('').forEach((character, i) => {
		// Insert with the logoot in the block node
		node.logoot.insert(character, index + i);
	});
	return node.blockId;
};

/**
 * Places the node in the tree
 * @return { * } the block node
 */
Logoot.prototype._allocateBlock = function() {
	// Gets the neighbor nodes
	const prev = this._root.getChildByOrder(0);
	const next = this._root.getChildByOrder(1);

	// Gets the position of neighbors
	const prevPos = prev.getPath();
	const nextPos = next.getPath();

	// Generates the position
	const position = this._generatePositionBetween(prevPos, nextPos);
	// Create node
	const node = this._root.getChildByPath(position, true, BlockNode);
	node.setEmpty(true);
	const blockId = generateString(5);
	node.blockId = blockId;
	// console.log(node.getChildren());
	// Create emit operation
	this.emit('operation', { type: 'insertBlock', position, blockId });
	return node;
};

/**
 * Breadth-first search for blocks on id
 * @param { * } id for searching block
 * @return { * } block node with corresponding id
 */
Logoot.prototype._searchBlock = function(id) {
	// Initialise queue
	const queue = [];
	queue.push(this._root);

	// Loop until all nodes are visited
	while (queue.length > 0) {
		// Get first node in the queue
		const node = queue.shift();

		if (node instanceof BlockNode && node.blockId === id) {
			return node;
		}
		for (const child of node.getChildren()) {
			queue.push(child);
		}
	}

	// Invalid
	return null;
};

module.exports = Logoot;
