function isLastWriter(timestamp, otherTimestamp) {
	if (timestamp.timestamp === otherTimestamp.timestamp) {
		return timestamp.site < otherTimestamp.site;
	}
	return timestamp.timestamp < otherTimestamp.timestamp;
}

module.exports = isLastWriter;
