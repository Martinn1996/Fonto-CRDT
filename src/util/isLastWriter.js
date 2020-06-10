/**
 * Returns true if the timestamp is the last writer, otherwise return false
 * @param {JSON} timestamp timestamp of the operation
 * @param {JSON} otherTimestamp timestamp of the other operation to compare to
 * @return {boolean} true if the timestamp
 */
function isLastWriter(timestamp, otherTimestamp) {
	if (timestamp.timestamp === otherTimestamp.timestamp) {
		return timestamp.site < otherTimestamp.site;
	}
	return timestamp.timestamp < otherTimestamp.timestamp;
}

module.exports = isLastWriter;
