/* eslint-disable no-undef */
const QuillCursors = require('quill-cursors');
const ejs = require('ejs');
const host = location.origin.replace(/^http/, 'ws');
const Logoot = require('../../src/logoot');
const l1 = new Logoot('site1');
const format = require('xml-formatter');

Quill.register('modules/cursors', QuillCursors);

const socket = new WebSocket(host);
socket.onopen = function(_) {};

let online = true;
let opsToSend = [];
let opsToReceive = [];

function receiveOperation(op) {
	/* eslint-disable no-use-before-define */
	const cursor = getCursor();
	l1.receive(op);
	/* eslint-disable no-use-before-define */
	render(l1);
	if (cursor) {
		/* eslint-disable no-use-before-define */
		setCursor(cursor);
	}
}

$('#trigger-online').on('click', () => {
	online = !online;
	$('#trigger-online').html(online ? 'Go offline' : 'Go online');
	$('#network-status').html(online ? 'Online' : 'Offline');

	if (online) {
		opsToSend.forEach(op => {
			socket.send(JSON.stringify(op));
		});
		opsToReceive.forEach(op => {
			receiveOperation(op);
		});
		opsToSend = [];
		opsToReceive = [];
	}
});

let initialized = false;
socket.onmessage = function(event) {
	const data = JSON.parse(event.data);
	if (data.assignSocketId) {
		l1.setState(data.initialValue);
		/* eslint-disable no-use-before-define */
		render(l1);
		initialized = true;
	} else if (online) {
		receiveOperation(data);
	} else {
		opsToReceive.push(data);
	}
};
const supportedOps = [
	'insert',
	'insertBlock',
	'insertInBlock',
	'delete',
	'deleteBlock',
	'deleteInBlock',
	'moveBlock',
	'changeBlockId',
	'splitBlock',
	'mergeBlocks'
];
l1.on('operation', op => {
	renderParsedText(l1);
	if (initialized && supportedOps.includes(op.type)) {
		if (online) {
			socket.send(JSON.stringify(op));
		} else {
			opsToSend.push(op);
		}
	}
});
const html = `
	<div id="test" class="container">
		<div class="row">
			<div class="col-sm">
				<button class="insert operation" id="insert-0">insert block here</button>
			</div>
		</div>
		<% for(let i = 0; i < blocks.length; i++) { %>
		<div class="row">
			<div class="col-sm">
				Blockid: <%= blocks[i].blockId %>
			</div>
		</div>
		<div class="row">
			<div class="col-sm-8">
				<div id="<%= blocks[i].blockId %>"></div>
			</div>
			<div class="col-sm-4">
				<button class="delete operation" id="delete-<%= blocks[i].blockId %>">Delete block</button>
				<button class="split operation" id="split-<%= blocks[i].blockId %>">Split block at cursor</button>
				<div><button class="move operation" id="move-<%= blocks[i].blockId %>">Move block</button><input class="move-input" id="input-<%= blocks[i].blockId %>" placeholder="Move to index"/></div>
			</div>
		</div>
		<div class="row">
			<div class="col-sm">
				<button class="insert operation" id="insert-<%= i + 1 %>">insert block here</button>
				<%if (i < blocks.length - 1) { %>
					<button class="merge" id="merge-<%= blocks[i].blockId %>-<%= blocks[i + 1].blockId %>">Merge blocks</button>
				<% } %>
			</div>
		</div>
		<% } %>
	</div>
`;

let editors = [];
function getCursor() {
	for (const editor of editors) {
		const cursor = editor.editor.getSelection();
		if (cursor) {
			return { cursor: cursor, blockId: editor.blockId };
		}
	}
	return null;
}

function setCursor(cursor) {
	const editor = editors.filter(e1 => e1.blockId === cursor.blockId);
	if (editor) {
		editor[0].editor.setSelection(cursor.cursor.index);
	}
}

function renderParsedText(logoot) {
	$('#parsed-text').html(logoot.XMLvalue());
	try {
		$('#parsed-xml').text(
			format(logoot.XMLvalue(), {
				lineSeparator: '\n'
			})
		);
	} catch (_) {
		$('#parsed-xml').text('');
	}
}

function render(logoot) {
	$('#editor').html(
		ejs.render(html, {
			blocks: logoot.blockValue()
		})
	);
	renderParsedText(logoot);

	editors = logoot.blockValue().map(block => {
		const quill = new Quill(`#${block.blockId}`, {
			modules: {
				cursors: true,
				toolbar: false
			},
			theme: 'snow'
		});
		quill.on('text-change', function(delta, _, source) {
			if (source === 'user') {
				let retain;
				for (const op of delta.ops) {
					if (op.hasOwnProperty('retain')) {
						retain = op.retain;
					} else if (op.hasOwnProperty('insert')) {
						l1.insertContentInBlock(op.insert, !retain ? 0 : retain, block.blockId);
					} else if (op.hasOwnProperty('delete')) {
						l1.deleteContentInBlock(!retain ? 0 : retain, op.delete, block.blockId);
					}
				}
			}
		});
		quill.setText(block.value);
		return { editor: quill, blockId: block.blockId };
	});
	$('.insert').on('click', e => {
		l1.insertBlock(e.target.id.split('-')[1]);
		render(l1);
	});

	$('.delete').on('click', e => {
		l1.deleteBlock(e.target.id.split('-')[1]);
		render(l1);
	});

	$('.merge').on('click', e => {
		const blockIds = e.target.id.split('-');
		l1.mergeBlocks(blockIds[1], blockIds[2]);
		render(l1);
	});

	$('.split').on('click', e => {
		const blockId = e.target.id.split('-')[1];
		const editor = editors.filter(e1 => e1.blockId === blockId)[0];
		const index = editor.editor.getSelection();
		if (!index) {
			alert('Please add a cursor to show where to split');
			return;
		}
		l1.splitBlock(blockId, index.index);
		render(l1);
	});

	$('.move').on('click', e => {
		const blockId = e.target.id.split('-')[1];
		const index = parseInt($(`#input-${blockId}`).val(), 10);
		if (index !== 0 && !index) {
			alert('please enter a valid index');
			return;
		}
		l1.moveBlock(blockId, index);
		render(l1);
	});
}
