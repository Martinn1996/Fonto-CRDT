const assert = require('chai').assert;
const expect = require('chai').expect;
const Logoot = require('../src/CRDT/src/index');

let w1;
let w2;

beforeEach(() => {
	w1 = new Logoot('1');
	w2 = new Logoot('2');

	w1.on('operation', op => {
		w2.receive(op);
	});

	w2.on('operation', op => {
		w1.receive(op);
	});
});

describe('Test replace 1 site', function() {
	it('text should be replaced', function() {
		w1.insert('abc', 0);
		w1.replaceRange('xyz', 0, 3);
		assert.equal(w1.value(), 'xyz');
		assert.equal(w2.value(), 'xyz');
		assert.equal(w1.getState(), w2.getState());
	});
});

describe('Test replace 2 sites', function() {
	it('text should be replaced by text of site 2', function() {
		w1.insert('abc', 0);
		w2.replaceRange('xyz', 0, 3);
		assert.equal(w1.value(), 'xyz');
		assert.equal(w2.value(), 'xyz');
		assert.equal(w1.getState(), w2.getState());
	});
});

describe('Test replace in middle of text', function() {
	it('text should be replaced by text of site 2', function() {
		w1.insert('hfg', 0);
		w2.insert('abc', 0);
		w1.replaceRange('xyz', 3, 6);
		assert.equal(w1.value(), 'abcxyz');
		assert.equal(w2.value(), 'abcxyz');
		assert.deepEqual(w1.getState(), w2.getState());
	});
});

describe('Test replace no size given', function() {
	it('text should replace first character at start index', function() {
		w1.insert('abc', 0);
		w2.replaceRange('xyz', 0);
		assert.equal(w1.value(), 'xyzbc');
		assert.equal(w2.value(), 'xyzbc');
		assert.deepEqual(w1.getState(), w2.getState());
	});
});

describe('Test replace no start given', function() {
	it('should give a TypeError when no start index is given', function() {
		expect(function() {
			w1.insert('abc', 0);
			w2.replaceRange('xyz');
		}).to.throw(TypeError);
	});
});

describe('Test replace with negative start index given', function() {
	it('should give a TypeError when negative start index is given', function() {
		expect(function() {
			w1.insert('abc', 0);
			w2.replaceRange('xyz', -2);
		}).to.throw(TypeError);
	});
});

describe('Test replace negative length given', function() {
	it('text should be inserted before start index', function() {
		w1.insert('abc', 0);
		w2.replaceRange('xyz', 0, -100);
		assert.equal(w1.value(), 'xyzabc');
		assert.equal(w2.value(), 'xyzabc');
		assert.deepEqual(w1.getState(), w2.getState());
	});
});

describe('Test replace start index after end of document', function() {
	it('text should be inserted at the end of the document', function() {
		w1.insert('abc', 0);
		w2.replaceRange('xyz', 6, 3);
		assert.equal(w1.value(), 'abcxyz');
		assert.equal(w2.value(), 'abcxyz');
		assert.deepEqual(w1.getState(), w2.getState());
	});
});
