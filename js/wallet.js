const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const key = ec.genKeyPair();
console.log("Private Key:", key.getPrivate('hex'));
console.log("Public Key:", key.getPublic('hex'));
