const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); // same as Bitcoin & Ethereum

// Server configs
const app = express();
app.use(bodyParser.json());

const HTTP_PORT = process.env.HTTP_PORT || 3001;
const P2P_PORT = process.env.P2P_PORT || 6001;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
const sockets = [];

class Block {
    constructor(index, timestamp, transactions, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.index + this.timestamp + JSON.stringify(this.transactions) + this.previousHash + this.nonce)
            .digest('hex');
    }

    mineBlock(difficulty) {
        while (!this.hash.startsWith('0'.repeat(difficulty))) {
            this.nonce++;
            this.hash = this.calculateHash();
              // console.log(`⛏️ Mining... ${this.hash}`);
        }

        console.log(`✅ Block mined: ${this.hash}`);
    }


    hasValidTransactions() {
        return this.transactions.every(tx => tx.isValid());
    }
}

class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
            .digest('hex');
    }

    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('❌ Cannot sign transactions for other wallets!');
        }

        const hash = this.calculateHash();
        const signature = signingKey.sign(hash, 'base64');
        this.signature = signature.toDER('hex');
    }

    isValid() {
        if (this.fromAddress === null) return true; // reward transaction

        if (!this.signature) throw new Error('No signature');

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}


class Blockchain {

    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.miningReward = 100;
        this.difficulty = 2; // Adjust difficulty (more = slower mining)
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        const newBlock = new Block(
            this.chain.length,
            Date.now(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );

        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
        this.pendingTransactions = [];
    }

    addTransaction(tx) {
        if (!tx.fromAddress || !tx.toAddress) {
            throw new Error('Transaction must include from and to address');
        }
        if (!tx.isValid()) {
            throw new Error('Invalid transaction signature');
        }
        this.pendingTransactions.push(tx);
    }

    getBalanceOfAddress(address) {
        let balance = 0;
        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.fromAddress === address) balance -= tx.amount;
                if (tx.toAddress === address) balance += tx.amount;
            }
        }
        return balance;
    }

    isValidChain(chain) {
        for (let i = 1; i < chain.length; i++) {
            const current = chain[i];
            const prev = chain[i - 1];

            if (!current.hasValidTransactions()) return false;
            if (current.previousHash !== prev.hash) return false;
            if (current.hash !== current.calculateHash()) return false;
        }
        return true;
    }

    replaceChain(newChain) {
        if (newChain.length > this.chain.length && this.isValidChain(newChain)) {
            console.log("⛓ Replacing current chain with the new one");
            this.chain = newChain;
        }
    }
}

const blockchain = new Blockchain();

const initP2PServer = () => {
    const server = new WebSocket.Server({ port: P2P_PORT });

    server.on('connection', socket => {
        console.log("Peer connected");
        initConnection(socket);
    });
};

const initConnection = socket => {
    sockets.push(socket);
    handleMessage(socket);
    sendChain(socket);
};

const handleMessage = socket => {
    socket.on('message', msg => {
        const received = JSON.parse(msg);
        if (received.type === 'CHAIN') {
            const newChain = received.data;
            blockchain.replaceChain(newChain);
        }
    });
};

const broadcastChain = () => {
    sockets.forEach(socket => sendChain(socket));
};

const sendChain = socket => {
    socket.send(JSON.stringify({
        type: 'CHAIN',
        data: blockchain.chain
    }));
};

app.post('/transaction', (req, res) => {
    const { fromAddress, toAddress, amount, privateKey } = req.body;

    const key = ec.keyFromPrivate(privateKey, 'hex');
    const tx = new Transaction(fromAddress, toAddress, amount);
    tx.signTransaction(key);

    try {
        blockchain.addTransaction(tx);
        res.send('✅ Transaction added to pending pool');
    } catch (e) {
        res.status(400).send(e.message);
    }
});

app.get('/balance/:address', (req, res) => {
    const balance = blockchain.getBalanceOfAddress(req.params.address);
    res.send({ address: req.params.address, balance });
});

app.get('/pending', (req, res) => {
    res.send(blockchain.pendingTransactions);
});

app.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening on port ${HTTP_PORT}`);
});

initP2PServer();
console.log(`WebSocket P2P server listening on port ${P2P_PORT}`);

peers.forEach(peer => {
    const ws = new WebSocket(peer);
    ws.on('open', () => initConnection(ws));
});

/*
RUNNING NODES:

Node1:
HTTP_PORT=3001 P2P_PORT=6001 node blockchain.js

Node 2:
HTTP_PORT=3002 P2P_PORT=6002 PEERS=ws://localhost:6001 node blockchain.js

*/