# Fonto-CRDT ![Build Status](https://travis-ci.com/Martinn1996/Fonto-CRDT.svg?token=HdYYc8AMcFxsCXPsirCH&branch=master) [![codecov](https://codecov.io/gh/Martinn1996/Fonto-CRDT/branch/master/graph/badge.svg?token=GHPSZTGH9L)](https://codecov.io/gh/Martinn1996/Fonto-CRDT)

## Bachelor Project: CRDT for Fonto

To conclude our bachelor program for Computer Science and Engineering at the TU Delft, we made a research prototype about Conflict-Free Replicated Data Types. Our CRDT is based on a [logoot implementation](https://github.com/t-mullen/logoot-crdt).

## Installation

```
git clone git@github.com:Martinn1996/Fonto-CRDT.git
cd Fonto-CRDT
npm install
```

## Usage
```
npm start
```

## Testing
To run all manually created tests
```
npm test
```

To run the generated test cases

```
npm run enumerate-all-test-cases

```
Which test cases will be executed, is defined in `generatedTestcases/testSuites/main.json` and `generatedTestcases/testSuites/definitions`.

The `main.json` file is of the following format:

```
[
    {
        "file": "File-in-definition-folder.json",
        "execute": false
    }
]
```

A definition is of the following format:

```
{
    "name": "testSuite name",
    "actionCount": 2,
    "prunePercentage": 0.9,
    "operations": [
        "generateDeleteOperations",
        "generateInsertOperations",
        ...
    ],
    "startState": "(optional CRDT startstate)"
}
```

These definitions can be generated by editing the code in `generateTestcases/testSuites/generateSuite.js` running the command `npm run generate-test-suite`
## Editor
Our editor makes use of blocks of texts. Multiple users can edit the text inside the blocks. Blocks can also be moved, merged and splitted.

## JSDoc
```
npm run jsdoc
```
You can find the generated JSDoc in the `/out` folder.