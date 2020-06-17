const arePositionsEqual = require('./arePositionsEqual');

function checkDeleteQueue(operation, logoot) {
	const deleteQueueIndex = logoot._deleteQueue.findIndex(op => {
		return arePositionsEqual(op.position, operation.position);
	});
	if (deleteQueueIndex > -1) {
		logoot._deleteQueue.splice(deleteQueueIndex, 1);
		return false;
	}
	return true;
}

module.exports = checkDeleteQueue;
