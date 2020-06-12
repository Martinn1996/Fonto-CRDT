const EventEmitter = require('nanobus');

const Identifier = require('./identifier');

const BlockNode = require('./class/BlockNode');
const CharacterNode = require('./class/CharacterNode');
const Node = require('./class/Node');
const SplitNode = require('./class/SplitNode');

const generateString = require('./util/generateCode');
const createNodeFromType = require('./util/createNodeFromType');
const isLastWriter = require('./util/isLastWriter');

const MIN = 0;
const MAX = Number.MAX_SAFE_INTEGER;
const BASE = Math.pow(2, 8);

/**
 * Parses the id into an identifier
 * @param {Identifier} id to insert
 * @return {Identifier}
 */
function parseId(id) {
	if (id) return new Identifier(id.int, id.site, id.clock);
}

/**
 * Parses the operation for this tree model
 * @param {JSON} operation to parse
 * @return {JSON}
 */
function parseOperation(operation) {
	operation.parsed = true;
	operation.position = operation.position.map(parseId);
	return operation;
}

/**
 * Checks whether position a and b are equal
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {boolean} whether a and b are equal
 */
function arePositionsEqual(a, b) {
	if (a.length !== b.length) return false;

	return !a.some((id, index) => {
		return id.compare(b[index]) !== 0;
	});
}

/**
 * Generates a random biased integer
 * @param {Integer} a
 * @param {Integer} b
 * @param {Integer} bias
 * @return {Integer} random biased integer
 */
function randomBiasedInt(a, b, bias) {
	return Math.floor(Math.pow(Math.random(), bias) * (b - (a + 1))) + a + 1;
}

/**
 * Generates random alternation
 * @param {Integer} bias
 * @return {Integer} random alternation
 */
function randomAlternation(bias) {
	return Math.random() > 0.5 ? bias : 1 / bias;
}

/**
 * Returns the doubled base
 * @param {Integer} depth
 * @return {Integer} doubled base
 */
function doubledBase(depth) {
	return Math.min(BASE * Math.pow(2, depth), MAX);
}

/**
 * Returns a parsed logoot representation
 * @param {*} node to parse
 * @return {JSON} state of the logoot
 */
function getStateLogoot(node) {
	const res = {
		id: node.id,
		size: node.size,
		empty: node.empty,
		type: node.type,
		value: node.value,
		children: node.children.map(getStateLogoot)
	};

	if (node.type === 'Block') {
		res['logoot'] = node.logoot ? getStateLogoot(node.logoot._root) : null;
		res['blockId'] = node.blockId;
		res['merged'] = node.merged;
		res['timestamp'] = node.timestamp;
		res['mergedTimestamp'] = node.mergedTimestamp;
	}
	if (node.type === 'Merge') {
		res['referenceId'] = node.referenceId;
	}

	if (node.type === 'Split') {
		res['reference'] = node.reference;
	}

	return res;
}

/**
 * Logoot Class
 */
class Logoot extends EventEmitter {
	/**
	 * Logoot instance
	 * @param {string} site of crdt
	 * @param {JSON} state of the tree
	 * @param {Integer} bias
	 */
	constructor(site, state, bias) {
		super();
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
		if (state) {
			this.setState(state);
		}
	}

	/**
	 * Receive function for all the emits
	 * @param {JSON} operation
	 */
	receive(operation) {
		if (!operation.parsed) operation = parseOperation(operation);
		switch (operation.type) {
			case 'mergeBlocks':
				this._receiveMerge(operation);
				break;
			case 'insert':
				this._receiveInsert(operation);
				break;
			case 'insertBlock':
				this._receiveInsertBlock(operation);
				break;
			case 'insertInBlock':
				this._receiveInsertInBlock(operation);
				break;
			case 'delete':
				this._receiveDelete(operation);
				break;
			case 'deleteBlock':
				this._receiveDeleteBlock(operation);
				break;
			case 'deleteInBlock':
				this._receiveDeleteInBlock(operation);
				break;
			case 'moveBlock':
				this._receiveMoveBlock(operation);
				break;
			case 'changeBlockId':
				// TODO: Rename to _receiveChangeBlockId
				this._changeBlockId(operation);
				break;
			case 'splitBlock':
				this._receiveSplitBlock(operation);
				break;
		}
	}

	/**
	 * Handles the receive of a merge operation
	 * @param {JSON} operation to perform
	 */
	_receiveMerge(operation) {
		const blockId1 = operation.blockId1;
		const blockId2 = operation.blockId2;
		const block1 = this._searchAllBlock(blockId1);
		const block2 = this._searchAllBlock(blockId2);
		if (!block1) {
			throw Error('BlockId does not exist');
		}

		let list = this._getAllMergeReferences(block1, this);

		// Only insert distinct operations
		this._getAllMergeReferences(block2, this).forEach(op => {
			let contains = false;
			list.forEach(op2 => {
				if (op2.to === op.to) {
					contains = true;
				}
			});

			if (!contains) {
				list.push(op);
			}
		});

		const tempList = list.filter(op => op.to === blockId2);

		if (tempList.length === 0) {
			list.push({ from: blockId1, to: blockId2, timestamp: operation.mergedTimestamp });
		} else if (isLastWriter(tempList[0].timestamp, operation.mergedTimestamp)) {
			list = list.map(op => {
				if (op.to === tempList[0].to) {
					return { from: blockId1, to: blockId2, timestamp: operation.mergedTimestamp };
				}
				return op;
			});
		}

		this._removeAllMergeReferences(block1, this);
		this._removeAllMergeReferences(block2, this);

		list.sort((a, b) => {
			if (a.timestamp.timestamp > b.timestamp.timestamp) {
				return 1;
			} else if (a.timestamp.timestamp === b.timestamp.timestamp) {
				return 0;
			}
			return -1;
		});

		for (const merge of list) {
			const block = this._searchAllBlock(merge.from);
			block.logoot._insertMergeNode(merge.to, this, merge.timestamp, true);
		}

		block2.setMerged();
	}

	/**
	 * Returns all the merge references
	 * @param {BlockNode} block to look into
	 * @param {Logoot} logoot logoot
	 * @return {Array<Object>} list of references
	 */
	_getAllMergeReferences(block, logoot) {
		const array = [];

		let endNode = block.logoot._root.getChildById({ int: 256, site: null, clock: null });

		while (endNode.type === 'Merge') {
			const newBlock = logoot._searchAllBlock(endNode.referenceId, logoot);
			array.push({
				from: block.blockId,
				to: endNode.referenceId,
				timestamp: newBlock.mergedTimestamp
			});
			endNode = newBlock.logoot._root.getChildById({ int: 256, site: null, clock: null });
		}

		return array;
	}

	/**
	 * Removes all references starting from that block
	 * @param {BlockNode} block to remove references from
	 * @param {Logoot} logoot logoot
	 */
	_removeAllMergeReferences(block, logoot) {
		let endNode = block.logoot._root.getChildById({ int: 256, site: null, clock: null });

		while (endNode.type === 'Merge') {
			const newBlock = logoot._searchAllBlock(endNode.referenceId, logoot);
			endNode.type = 'Node';
			endNode = newBlock.logoot._root.getChildById({ int: 256, site: null, clock: null });
		}
	}

	/**
	 * Returns the value of the block
	 * @return {Array.<string>} value of the block
	 */
	blockValue() {
		const arr = [];

		this._root.walk(node => {
			if (!node.empty) {
				if (node.logoot && !node.merged) {
					arr.push({ blockId: node.blockId, value: node.logoot.value(this) });
				}
			}
		});

		return arr;
	}

	/**
	 * Builds the same node as the received inserted node
	 * @param {JSON} operation to perform
	 */
	_receiveInsert(operation) {
		const deleteQueueIndex = this._deleteQueue.findIndex(op => {
			return arePositionsEqual(op.position, operation.position);
		});
		if (deleteQueueIndex > -1) {
			this._deleteQueue.splice(deleteQueueIndex, 1);
			return;
		}
		const existingNode = this._root.getChildByPath(operation.position, false, CharacterNode);
		if (existingNode) return;
		const node = this._root.getChildByPath(operation.position, true, CharacterNode);

		node.value = operation.value;
		node.setEmpty(false);
		const index = node.getOrder();
		this.emit('insert', {
			value: node.value,
			index: index
		});
	}

	/**
	 * Builds the same block node as the received inserted block node
	 * @param {JSON} operation to perform
	 * @return {Node} node that is inserted
	 */
	_receiveInsertBlock(operation) {
		const deleteQueueIndex = this._deleteQueue.findIndex(op => {
			return arePositionsEqual(op.position, operation.position);
		});
		if (deleteQueueIndex > -1) {
			this._deleteQueue.splice(deleteQueueIndex, 1);
			return;
		}
		const existingNode = this._root.getChildByPath(
			operation.position,
			false,
			BlockNode,
			Logoot
		);
		if (existingNode) return;
		const node = this._root.getChildByPath(operation.position, true, BlockNode, Logoot);
		const blockId = operation.blockId;
		node.timestamp = operation.timestamp;
		node.blockId = blockId;
		node.setEmpty(false);
		const index = node.getOrder();
		this.emit('insertBlock', {
			blockId: blockId,
			index: index
		});
		return node;
	}

	/**
	 * Builds the same block node as the received inserted block node
	 * @param {JSON} operation to perform
	 */
	_receiveInsertInBlock(operation) {
		const block = this._searchAllBlock(operation.blockId);
		const logoot = block.logoot;
		const deleteQueueIndex = logoot._deleteQueue.findIndex(op => {
			return arePositionsEqual(op.position, operation.position);
		});
		if (deleteQueueIndex > -1) {
			logoot._deleteQueue.splice(deleteQueueIndex, 1);
			return;
		}
		const existingNode = logoot._root.getChildByPath(operation.position, false, CharacterNode);
		if (existingNode) return;

		const node = logoot._root.getChildByPath(operation.position, true, CharacterNode);
		node.value = operation.value;
		node.setEmpty(false);

		// Move node when splitNode is encountered
		const item = this._moveInsertOnSplitNode(node, block, CharacterNode);

		this.emit('insertInBlock', {
			value: item.node.value,
			index: item.node.getOrder(),
			blockId: item.block.blockId
		});
	}

	/**
	 * Removes the same node as the received removed node
	 * @param {JSON} operation to perform
	 */
	_receiveDelete(operation) {
		const node = this._root.getChildByPath(operation.position, false, CharacterNode);
		if (node && !node.empty) {
			const index = node.getOrder();
			const value = node.value;
			node.setEmpty(true);
			node.trimEmpty();
			this.emit('delete', {
				value: value,
				index: index
			});
		} else if (
			!this._deleteQueue.some(op => {
				return arePositionsEqual(op.position, operation.position);
			})
		) {
			this._deleteQueue.push(operation);
		}
	}

	/**
	 * Removes the same block node as the received removed block node
	 * @param {JSON} operation to perform
	 */
	_receiveDeleteBlock(operation) {
		const block = this._deleteBlock(operation.blockId);

		if (!block) {
			console.error(`Could not find block of blockId: ${operation.blockId}`);
			return;
		}

		this._deleteBlock(operation.blockId);
	}

	/**
	 * Removes the same character node as the received removed character node in a block node
	 * @param {JSON} operation to perform
	 */
	_receiveDeleteInBlock(operation) {
		const block = this._searchAllBlock(operation.blockId);
		const node = block.logoot._root.getChildByPath(operation.position, false, CharacterNode);

		// Check for references
		if (!node) {
			// Create temp node to find previous
			const tempNode = block.logoot._root.getChildByPath(
				operation.position,
				true,
				CharacterNode
			);
			tempNode.setEmpty(false);

			if (
				!this._moveDeleteOnSplitNode(tempNode, block, CharacterNode) &&
				!this._deleteQueue.some(op => {
					return arePositionsEqual(op.position, operation.position);
				})
			) {
				this._deleteQueue.push(operation);
			}

			tempNode.setEmpty(true);
			tempNode.trimEmpty();

			return;
		}

		if (node && !node.empty) {
			const index = node.getOrder();
			const value = node.value;
			node.setEmpty(true);
			node.trimEmpty();
			this.emit('deleteInBlock', {
				value: value,
				index: index,
				blockId: operation.blockId
			});
		} else if (
			!this._deleteQueue.some(op => {
				return arePositionsEqual(op.position, operation.position);
			})
		) {
			this._deleteQueue.push(operation);
		}
	}

	/**
	 * Copies the logoot to the new block (moved block)
	 * @param {JSON} operation to perform
	 */
	_receiveMoveBlock(operation) {
		const oldBlock = this._searchAllBlock(operation.blockId);
		if (isLastWriter(operation.timestamp, oldBlock.timestamp)) {
			return;
		}
		const logoot = oldBlock.logoot;
		const isEmptyBlock = oldBlock.empty;
		oldBlock.setEmpty(true);
		oldBlock.trimEmpty();
		oldBlock.blockId = null;

		const node = this._receiveInsertBlock(operation);
		node.timestamp = operation.timestamp;
		node.mergedTimestamp = oldBlock.mergedTimestamp;
		node.logoot = logoot;
		oldBlock.mergedTimestamp = {};

		// node.merged = oldBlock.merged;
		if (oldBlock.merged) node.setMerged();
		oldBlock.merged = false;
		node.setEmpty(isEmptyBlock);
	}

	/**
	 * Reassigns the id of the block
	 * @param {JSON} operation to perform
	 */

	_changeBlockId(operation) {
		this._deleteBlock(operation.newBlockId);
		const block = this._searchAllBlock(operation.oldId);
		if (!block) {
			throw Error(`Could not find block of blockId for changing: ${operation.oldBlockId}`);
		}

		block.blockId = operation.newBlockId;
	}

	/**
	 * Split block
	 * @param {JSON} operation to perform
	 */
	_receiveSplitBlock(operation) {
		let block = this._searchAllBlock(operation.blockId);

		if (!block) {
			throw Error(`Could not find block of blockId: ${operation.blockId}`);
		}

		const deleteQueueIndex = block.logoot._deleteQueue.findIndex(op => {
			return arePositionsEqual(op.position, operation.position);
		});
		if (deleteQueueIndex > -1) {
			block.logoot._deleteQueue.splice(deleteQueueIndex, 1);
			return;
		}

		const existingNode = block.logoot._root.getChildByPath(
			operation.position,
			false,
			SplitNode
		);
		if (existingNode) return;

		// Create split node
		let node = block.logoot._root.getChildByPath(operation.position, true, SplitNode);
		node.setEmpty(false);
		node.reference = operation.reference;

		// Move node when splitNode is encountered
		const item = this._moveInsertOnSplitNode(node, block, SplitNode);
		node = item.node;
		block = item.block;

		// Find block
		const newBlock = this._searchAllBlock(operation.reference);
		newBlock.logoot.setState(block.logoot.getState());

		// Remove remaining
		block.logoot._setEmpty(node.getOrder() + 1, block.logoot.length(), this);
		newBlock.logoot._setEmpty(0, node.getOrder() + 1, this);

		const endNode = block.logoot._root.getChildById({ int: 256, site: null, clock: null });
		endNode.type = 'Node';
		delete endNode.referenceId;

		this.emit('splitBlock', {
			blockId: newBlock.blockId,
			location: node.getPath(),
			reference: node.reference
		});
	}

	/**
	 * Inserts the value into the tree on index
	 * @param {string} value to insert
	 * @param {Integer} index for insertion
	 * @param {Logoot} logoot the logoot instance for blocks
	 */
	insert(value, index, logoot) {
		value.split('').forEach((character, i) => {
			this._insert(character, index + i, logoot);
		});
	}

	/**
	 * @param {string} referenceId of the node to which the mergeNode references
	 * @param {Logoot} logoot the top level logoot
	 * @param {timestamp} timestamp timestamp
	 * @return {MergeNode} MergeNode that is inserted
	 */
	_insertMergeNode(referenceId, logoot, timestamp, received = false) {
		const endNode = this._root.getChildById({ int: 256, site: null, clock: null });

		if (endNode.type === 'Merge') {
			const newBlock = logoot._searchAllBlock(endNode.referenceId, this);
			return newBlock.logoot._insertMergeNode(referenceId, logoot, timestamp, received);
		}

		if (received && logoot._afterSplitNode(endNode, this)) {
			const newBlock = logoot._searchAllBlock(endNode.referTo);
			delete endNode.referTo;
			return newBlock.logoot._insertMergeNode(referenceId, logoot, timestamp, received);
		}

		delete endNode.referTo;

		if (timestamp) {
			const block = logoot._searchAllBlock(referenceId);
			block.mergedTimestamp = timestamp;
		}

		endNode.referenceId = referenceId;
		endNode.type = 'Merge';
		return endNode;
	}

	/**
	 * Inserts the character into the tree on index
	 * @param {string} value to insert
	 * @param {Integer} index for insertion
	 * @return {Array.<number>} path to the newly created node
	 * @param {Logoot} logoot the logoot instance for blocks
	 */
	_insert(value, index, logoot) {
		let prev = this._root.getChildByOrder(index, logoot);
		if (prev === undefined) {
			prev = this._root.getChildByOrder(this._getTotalSize(logoot), logoot);
		}

		if (prev.block) {
			logoot.insertContentInBlock(value, prev.index, prev.block.blockId);
		} else {
			index = Math.min(index, this._getTotalSize(logoot));
			prev = this._root.getChildByOrder(index, logoot);
			let next = this._root.getChildByOrder(index + 1, logoot);

			if (next.ref) {
				next = next.ref;
			}

			const prevPos = prev.getPath();
			const nextPos = next.getPath();
			let position = null;
			position = this._generatePositionBetween(prevPos, nextPos);
			const node = this._root.getChildByPath(position, true, CharacterNode);
			node.value = value;
			node.setEmpty(false);
			this.emit('operation', {
				type: 'insert',
				position: position,
				value: value
			});
			return node.getPath();
		}
	}

	/**
	 * Generates a new identifier based on previous and next ids
	 * @param {Integer} prevInt id of left neighbor
	 * @param {Integer} nextInt id of right neighbor
	 * @return {Identifier} generated identifier
	 */
	_generateNewIdentifier(prevInt, nextInt) {
		const int = randomBiasedInt(prevInt, nextInt, randomAlternation(this._bias));
		return new Identifier(int, this.site, this.clock++);
	}

	/**
	 * Generates the position between the prevPos and nextPos
	 * @param {Array.<number>} prevPos position of left neighbor
	 * @param {Array.<number>} nextPos position of right neighbor
	 * @return {Array.<number>} generated position
	 */
	_generatePositionBetween(prevPos, nextPos) {
		const newPos = [];
		const maxLength = Math.max(prevPos.length, nextPos.length);
		let samePrefixes = true;
		for (let depth = 0; depth < maxLength + 1; depth++) {
			const DEPTH_MAX = doubledBase(depth);
			const prevId = prevPos[depth] || new Identifier(MIN, null, null);
			const nextId =
				samePrefixes && nextPos[depth]
					? nextPos[depth]
					: new Identifier(DEPTH_MAX, null, null);
			const diff = nextId.int - prevId.int;
			if (diff > 1) {
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
	}

	/**
	 * Deletes from index 'length' nodes
	 * @param {Integer} index
	 * @param {Integer} length
	 * @param {Logoot} logoot the logoot instance for blocks
	 */
	delete(index, length = 1, logoot) {
		for (let i = 0; i < length; i++) {
			this._delete(index, logoot);
		}
	}

	/**
	 * Deletes the node on index
	 * @param {Integer} index
	 * @param {Logoot} logoot the logoot instance for blocks
	 */
	_delete(index, logoot) {
		const node = this._root.getChildByOrder(index + 1, logoot);
		if (!node || node.id.site === null) return;
		node.setEmpty(true);
		node.trimEmpty();
		this.emit('operation', {
			type: 'delete',
			position: node.getPath()
		});
	}

	/**
	 * Construct a string from the sequence
	 * @param {Node} root the root of this Logoot
	 * @return {string} value of the tree
	 */
	value(root = this) {
		const arr = [];
		this._root.walk(node => {
			if (!node.empty && !node.merged) {
				if (node.logoot) {
					arr.push(`${node.logoot.value(root)}\n\n`);
				} else if (node.type === 'Merge') {
					const block = root._searchBlock(node.referenceId);
					if (block) {
						arr.push(block.logoot.value(root));
					}
				} else {
					arr.push(node.value);
				}
			}
		});
		return arr.join('');
	}

	/**
	 * Returns the size of the root excluding the start and end node
	 * @return {Integer} size of the root
	 */
	length() {
		return this._root.size - 2;
	}

	/**
	 * Replace text in range with value
	 * @param {string} value to write
	 * @param {Integer} start index to delete
	 * @param {Integer} length of deletion
	 * @param {Logoot} logoot the logoot instance for blocks
	 */
	replaceRange(value, start, length, logoot) {
		this.delete(start, length, logoot);
		this.insert(value, start, logoot);
	}

	/**
	 * Sets the value of the tree
	 * @param {string} value to write
	 */
	setValue(value) {
		this.replaceRange(value, 0, this.length());
	}

	/**
	 * Returns the state of the JSON
	 * @return {string} stringified JSON representation
	 */
	getState() {
		return JSON.stringify(
			{
				root: getStateLogoot(this._root),
				deleteQueue: this._deleteQueue
			},
			(key, value) => (key === 'parent' ? undefined : value)
		);
	}

	/**
	 * Parse the state into the tree
	 * @param {string} state
	 */
	setState(state) {
		const parsed = JSON.parse(state);
		/**
		 * Function to parse the JSON into the tree
		 * @param {Node} n
		 * @param {Node} parent
		 * @return {Node}
		 */
		function parseNode(n, parent) {
			const NodeType = createNodeFromType(n.type);
			const node = new NodeType(parseId(n.id), n.value, Logoot);
			node.parent = parent;
			node.children = n.children.map(c => parseNode(c, node));
			node.size = n.size;
			node.empty = n.empty;
			if (n.type === 'Block') {
				node.blockId = n.blockId;
				node.logoot = new Logoot(node.blockId);
				node.logoot.setState(JSON.stringify({ root: n.logoot }));
				node.merged = n.merged;
				node.timestamp = n.timestamp;
			}
			if (n.type === 'Merge') {
				node.referenceId = n.referenceId;
			}
			if (n.type === 'Split') {
				node.reference = n.reference;
			}
			return node;
		}
		this._root = parseNode(parsed.root, null);
		this._deleteQueue = parsed.deleteQueue ? parsed.deleteQueue : [];
	}

	_insertBlock(index, id) {
		index = Math.min(index, this.length());
		const prev = this._root.getChildByOrder(index, this);
		const next = this._root.getChildByOrder(index + 1, this);
		const prevPos = prev.getPath();
		const nextPos = next.getPath();
		const position = this._generatePositionBetween(prevPos, nextPos);
		const node = this._root.getChildByPath(position, true, BlockNode, Logoot);
		node.setEmpty(false);
		const blockId = id ? id : generateString(5);
		node.blockId = blockId;
		node.timestamp = { timestamp: new Date().getTime(), site: this.site };

		return node;
	}
	/**
	 * New insertion for characters
	 * @param {Integer} index index of the block
	 * @param {string} id optional id of the block
	 * @return {string} blockId
	 */
	insertBlock(index, id) {
		const node = this._insertBlock(index, id);
		this.emit('operation', {
			type: 'insertBlock',
			position: node.getPath(),
			blockId: node.blockId,
			timestamp: node.timestamp
		});
		return node;
	}

	/**
	 * Inserts the value into the index of block with blockId
	 * @param {string} content to write
	 * @param {Integer} index of the block to write the value to
	 * @param {string} blockId of the block to write to
	 */
	insertContentInBlock(content, index, blockId) {
		let node = null;
		if (blockId !== undefined && blockId !== null && blockId !== '') {
			node = this._searchAllBlock(blockId);
		}
		if (node === null) {
			throw Error(`Block not found! Insertion in block: ${blockId} cancelled.`);
		}
		content.split('').forEach((value, i) => {
			const position = node.logoot._insert(value, index + i, this);

			if (position) {
				this.emit('operation', {
					type: 'insertInBlock',
					position: position,
					value: value,
					blockId: blockId
				});
			}
		});
	}

	replaceRangeInBlock(value, start, length, blockId) {
		this.deleteContentInBlock(start, length, blockId);
		this.insertContentInBlock(value, start, blockId);
	}

	/**
	 * Breadth-first search for blocks on id
	 * @param {string} blockId for searching block
	 * @return {BlockNode} block node with corresponding id
	 */
	_searchBlock(blockId) {
		const queue = [];
		queue.push(this._root);
		while (queue.length > 0) {
			const node = queue.shift();
			if (node instanceof BlockNode && node.blockId === blockId && !node.empty) {
				return node;
			}
			for (const child of node.children) {
				queue.push(child);
			}
		}
		console.error(`Could not find block: ${blockId}`);
		return null;
	}

	/**
	 * Breadth-first search for blocks on id
	 * @param {string} blockId for searching block
	 * @return {BlockNode} block node with corresponding id
	 */
	_searchAllBlock(blockId) {
		const queue = [];
		queue.push(this._root);
		while (queue.length > 0) {
			const node = queue.shift();
			if (node instanceof BlockNode && node.blockId === blockId) {
				return node;
			}
			for (const child of node.children) {
				queue.push(child);
			}
		}
		console.error(`Could not find block: ${blockId}`);
		return null;
	}

	/**
	 * Moves the block to the index
	 * @param {string} blockId to perfom on
	 * @param {Integer} index of the position of the new block
	 */
	moveBlock(blockId, index) {
		const block = this._searchBlock(blockId);
		if (!block) {
			throw Error(`Could not find block of id: ${blockId}`);
		}

		const newBlock = this._insertBlock(index);
		newBlock.logoot = block.logoot;
		// newBlock.merged = block.merged;
		if (block.merged) newBlock.setMerged();
		newBlock.blockId = blockId;
		newBlock.mergedTimestamp = block.mergedTimestamp;

		block.setEmpty(true);
		block.trimEmpty();
		block.blockId = null;
		block.mergedTimestamp = {};
		block.merged = false;
		this.emit('operation', {
			type: 'moveBlock',
			position: newBlock.getPath(),
			timestamp: newBlock.timestamp,
			blockId: blockId
		});
	}

	/**
	 * Deletes the block in the tree
	 * @param {string} blockId id for block
	 */
	_deleteBlock(blockId) {
		const block = this._searchBlock(blockId);
		if (!block) {
			console.error(`There does not exist a block of id ${blockId}`);
			return;
		}

		block.setEmpty(true);
	}

	/**
	 * Removes block from tree and communicates with other CRDTs
	 * @param {string} blockId id for block
	 */
	deleteBlock(blockId) {
		this._deleteBlock(blockId);

		this.emit('operation', {
			type: 'deleteBlock',
			position: [new Identifier(0, this.site, this.clock++)],
			blockId: blockId
		});
	}

	/**
	 * Merge two blocks into one and delete the second block
	 * @param {string} blockId1 The first block where all content will be merged into
	 * @param {string} blockId2 The second block which will be deleted after the merge
	 */
	mergeBlocks(blockId1, blockId2) {
		const block1 = this._searchBlock(blockId1);
		const block2 = this._searchBlock(blockId2);
		if (!block1 || !block2) {
			throw Error('BlockId does not exist');
		}
		const timestamp = {
			timestamp: new Date().getTime(),
			site: this.site,
			blockId: blockId1
		};
		// insert merge node
		const node = block1.logoot._insertMergeNode(blockId2, this, timestamp);
		// set block2 to invisible
		block2.setMerged();
		block2.mergedTimestamp = timestamp;

		this.emit('operation', {
			type: 'mergeBlocks',
			position: node.getPath(),
			mergedTimestamp: block2.mergedTimestamp,
			blockId1: blockId1,
			blockId2: blockId2
		});
	}

	/**
	 * Deletes content in block
	 * @param {Integer} index of start of deletion
	 * @param {Integer} length amount of items to delete
	 * @param {string} blockId of location to delete the content
	 */
	deleteContentInBlock(index, length = 1, blockId) {
		const block = this._searchAllBlock(blockId);
		for (let i = 0; i < length; i++) {
			const node = block.logoot._root.getChildByOrder(index + 1, this);

			if (node.block) {
				this.deleteContentInBlock(node.index - 1, length - i, node.block.blockId);
				return;
			}

			if (!node || node.id.site === null) continue;
			node.setEmpty(true);
			node.trimEmpty();
			this.emit('operation', {
				type: 'deleteInBlock',
				position: node.getPath(),
				blockId: blockId
			});
		}
	}

	/**
	 * Split block into two and moves the content over
	 * @param {string} blockId
	 * @param {Integer} index
	 * @return {BlockNode} newBlock
	 */
	splitBlock(blockId, index) {
		const block = this._searchAllBlock(blockId);

		if (!block) {
			throw Error('BlockId does not exist');
		}

		if (index > block.logoot._getTotalSize(this) || index < 0) {
			throw Error('Index out of range');
		}

		// Adjust blocks
		const blockIndex = block.getOrder();

		// Insert special node
		// index = Math.min(index, block.logoot.length());
		// const prev = block.logoot._root.getChildByOrder(index, this);
		// const next = block.logoot._root.getChildByOrder(index + 1, this);

		// const prevPos = prev.getPath();
		// const nextPos = next.getPath();
		let prev = block.logoot._root.getChildByOrder(index, this);

		if (prev === undefined) {
			prev = block.logoot._root.getChildByOrder(this.length(), this);
		}

		if (prev.block) {
			this.splitBlock(prev.block.blockId, prev.index);
		} else {
			index = Math.min(index, block.logoot.length());
			prev = block.logoot._root.getChildByOrder(index, this);

			let next = block.logoot._root.getChildByOrder(index + 1, this);

			if (next.ref) {
				next = next.ref;
			}

			const prevPos = prev.getPath();
			const nextPos = next.getPath();

			let position = null;
			position = block.logoot._generatePositionBetween(prevPos, nextPos);
			const split = block.logoot._root.getChildByPath(position, true, SplitNode);
			split.setEmpty(false);

			const newBlock = this.insertBlock(blockIndex + 1);
			newBlock.logoot.setState(block.logoot.getState());
			split.reference = newBlock.blockId;

			this.emit('operation', {
				type: 'splitBlock',
				blockId: blockId,
				position: position,
				reference: split.reference,
				blockPosition: block.getPath(),
				blockReferences: block.references
			});

			block.logoot._setEmpty(split.getOrder() + 1, block.logoot.length(), this);
			newBlock.logoot._setEmpty(0, split.getOrder() + 1, this);

			const endNode = block.logoot._root.getChildById({ int: 256, site: null, clock: null });
			endNode.type = 'Node';
			delete endNode.referenceId;

			return newBlock;
		}
	}

	/**
	 * Removes the nodes from left boundary to right boundary
	 * @param {Integer} left boundary
	 * @param {Integer} right boundary
	 * @param {Logoot} logoot the logoot instance for blocks
	 */
	_setEmpty(left, right, logoot) {
		for (let i = right; i > left; i--) {
			const node = this._root.getChildByOrder(i, logoot);

			node.setEmpty(true);
			node.trimEmpty();
		}
	}

	/**
	 * Inserts the node in referenced block if there is a split node before
	 * @param {Node} node to insert
	 * @param {BlockNode} block where node will be inserted
	 * @param {NodeType} type of node to insert
	 * @return {JSON} tuple of node and block
	 */
	_moveInsertOnSplitNode(node, block, type) {
		if (this._afterSplitNode(node, block.logoot)) {
			const newBlock = this._searchAllBlock(node.referTo);
			const newNode = newBlock.logoot._root.getChildByPath(node.getPath(), true, type);
			newNode.setEmpty(false);

			if (node.value) {
				newNode.value = node.value;
			}

			if (node.referTo) {
				newNode.reference = node.reference;
			}

			// Remove node
			node.setEmpty(true);
			node.trimEmpty();

			return { node: newNode, block: newBlock };
		}

		return { node: node, block: block };
	}

	/**
	 * Deletes the node when there is a split node before it
	 * @param {Node} node to delete
	 * @param {BlockNode} block to delete the node from
	 * @param {nodeType} type of the node to delete
	 * @return {boolean} whether it is deleted when it has a split node
	 */
	_moveDeleteOnSplitNode(node, block, type) {
		if (this._afterSplitNode(node, block.logoot)) {
			const refBlock = this._searchAllBlock(node.referTo);
			const deleteNode = refBlock.logoot._root.getChildByPath(node.getPath(), false, type);
			deleteNode.setEmpty(false);

			// Remove node
			deleteNode.setEmpty(true);
			deleteNode.trimEmpty();

			node.setEmpty(true);
			node.trimEmpty();

			return true;
		}

		return false;
	}

	/**
	 * Checks whether the node contains a split node in front of the node
	 * @param {Node} node to check
	 * @param {CRDT} logoot to check
	 * @return {boolean} whether there is a split node before the current node
	 */
	_afterSplitNode(node, logoot) {
		const prevNode = logoot._root.getChildByOrder(node.getOrder());
		node.referTo = prevNode.reference;
		return prevNode instanceof SplitNode;
	}

	/**
	 * gets the size of a Logoot instance including merged blocks
	 * @param {Logoot} logoot of the entire CRDT
	 * @return {Integer} size of the block
	 */
	_getTotalSize(logoot) {
		let length = this.length();

		let blockLogoot = this;
		let endNode = blockLogoot._root.getChildById({ int: 256, site: null, clock: null });
		while (endNode.type === 'Merge') {
			blockLogoot = logoot._searchAllBlock(endNode.referenceId).logoot;
			endNode = blockLogoot._root.getChildById({ int: 256, site: null, clock: null });
			length += blockLogoot.length();
		}

		return length;
	}
}

module.exports = Logoot;
