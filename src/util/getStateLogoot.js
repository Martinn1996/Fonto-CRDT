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

module.exports = getStateLogoot;
