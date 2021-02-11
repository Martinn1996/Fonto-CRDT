const _ = require('underscore');

module.exports = function test(nodesInLayer, treeLevel, operations, prunePercentage) {
	console.error = () => {};
	if (treeLevel === 0) return nodesInLayer;
	let res = [];
	let count = 0;
	for (const testNode of nodesInLayer) {
		count++;
		res = res.concat(testNode.createChildNodes(operations));
		console.log('level: ', treeLevel, 'progress: ', count, '/', nodesInLayer.length);
	}

	if (prunePercentage) {
		res = _.sample(res, Math.floor(res.length / (res.length * prunePercentage)));
	}
	test(res, treeLevel - 1, operations, prunePercentage);
};
