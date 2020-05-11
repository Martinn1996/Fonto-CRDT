/* eslint-disable no-undef */
const QuillCursors = require('quill-cursors');
const host = location.origin.replace(/^http/, 'ws');
const Logoot = require('../../CRDT/src/index');
const l1 = new Logoot('site1');

Quill.register('modules/cursors', QuillCursors);

const quill = new Quill('#editor', {
	modules: {
		cursors: true,
		toolbar: false
	},
	theme: 'snow'
});

const socket = new WebSocket(host);

socket.onopen = function(_) {};

let initialized = false;
socket.onmessage = function(event) {
	const data = JSON.parse(event.data);
	let cursor = quill.getSelection();
	if (cursor) {
		cursor.index = cursor ? cursor.index : 0;
	} else {
		cursor = { index: 0 };
	}
	if (data.assignSocketId) {
		l1.setState(data.initialValue);
		quill.setText(l1.value());
		initialized = true;
	} else {
		l1.receive(data);

		quill.setText(l1.value());
		if (cursor && cursor.index) quill.setSelection(cursor.index, 0);
	}
};

l1.on('operation', op => {
	if (initialized && (op.type === 'insert' || op.type === 'delete')) {
		socket.send(JSON.stringify(op));
	}
});

quill.on('text-change', function(delta, _, source) {
	if (source === 'user') {
		let retain;
		for (const op of delta.ops) {
			if (op.hasOwnProperty('retain')) {
				retain = op.retain;
			} else if (op.hasOwnProperty('insert')) {
				l1.insert(op.insert, !retain ? 0 : retain);
			} else if (op.hasOwnProperty('delete')) {
				l1.delete(!retain ? 0 : retain, op.delete);
			}
		}
	}
});
