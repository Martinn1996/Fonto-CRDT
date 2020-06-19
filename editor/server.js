/* eslint-disable no-console */
const express = require('express');
// const http = require('http');

const fs = require('fs');
const ejs = require('ejs');
const app = express();
const port = process.env.PORT || 3000;

const WebSocket = require('ws').Server;

app.use(express.static('editor/static'));
const ops = [];

const Logoot = require('../src/logoot');
let l1 = new Logoot('site1');
l1.insertBlock(0);

app.get('/', (_, res) => {
	const editor = fs.readFileSync('./editor/static/editor.html');
	res.end(editor);
});

app.get('/crdt-tree', (_, res) => {
	const html = fs.readFileSync('./editor/static/tree.ejs', 'utf8');
	res.end(ejs.render(html, { tree: JSON.stringify(JSON.parse(l1.getState()), null, 4) }));
});

app.get('/get-tree-at-op', (_, res) => {
	const html = fs.readFileSync('./editor/static/opList.ejs', 'utf8');
	res.end(ejs.render(html, { ops: ops }));
});

app.get('/get-tree-at-op/:id', (req, res) => {
	if (!ops[req.params.id]) {
		return res.status(400).end('Invalid operation id');
	}
	const html = fs.readFileSync('./editor/static/tree.ejs', 'utf8');
	res.end(
		ejs.render(html, { tree: JSON.stringify(JSON.parse(ops[req.params.id].state), null, 4) })
	);
});
const server = app.listen(port, () => console.log(`App listening on localhost:3000`));

const wss = new WebSocket({ server: server });

const clients = [];
wss.on('connection', function connection(ws) {
	const index = clients.length;
	const id = Math.random()
		.toString(36)
		.substring(7);
	clients.push({ client: ws, socketId: id });
	ws.send(JSON.stringify({ assignSocketId: id, initialValue: l1.getState() }));
	ws.on('message', function incoming(message) {
		const data = JSON.parse(message);
		if (data.type === 'reset') {
			l1 = new Logoot('site1');
		} else {
			l1.receive(data);
		}

		delete data.position;

		ops.push({ data: data, state: l1.getState() });

		clients.forEach(function each(client, i) {
			if (i !== index) {
				client.client.send(message);
			}
		});
	});
});
