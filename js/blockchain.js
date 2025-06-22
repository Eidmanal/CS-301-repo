const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const app = express();
const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());

const HTTP_PORT = process.env.HTTP_PORT || 3001;
const P2P_PORT = process.env.P2P_PORT || 6001;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
const sockets = [];

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://krcolgqsxhpsilzzjyig.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyY29sZ3FzeGhwc2lsenpqeWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNzU0MzcsImV4cCI6MjA1Njg1MTQzN30.GKYzect5Zsk0Hh9ocDI_BLygGu6Tk5qIDp1AyJq1Yng'
);


class Transaction {
    constructor(fromAddress, toAddress, amount, data = {}) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
        this.data = data;
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.fromAddress + this.toAddress + this.amount + this.timestamp + JSON.stringify(this.data))
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
        if (this.fromAddress === null) return true;
        if (!this.signature) throw new Error('No signature');
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

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
        }
        console.log(`✅ Block mined: ${this.hash}`);
    }

    hasValidTransactions() {
        return this.transactions.every(tx => tx.isValid());
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.difficulty = 2;
        this.miningReward = 100;
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), [], '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningAddress) {
        const rewardTx = new Transaction(null, miningAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        const block = new Block(this.chain.length, Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        this.chain.push(block);
        this.pendingTransactions = [];

        // sync with Supabase
        syncBlockWithDatabase(block).catch(console.error);

    }

    addTransaction(transaction) {
        if (!transaction.fromAddress && transaction.fromAddress !== null) {
            throw new Error('Invalid from address');
        }
        if (!transaction.toAddress) {
            throw new Error('Invalid to address');
        }
        if (!transaction.isValid()) {
            throw new Error('Invalid transaction');
        }
        this.pendingTransactions.push(transaction);
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

    getOwnerOfLand(landId) {
        for (let i = this.chain.length - 1; i >= 0; i--) {
            for (const tx of this.chain[i].transactions) {
                if (tx.data && tx.data.landId === landId) {
                    return tx.toAddress;
                }
            }
        }
        return null;
    }

    isValidChain(chain) {
        for (let i = 1; i < chain.length; i++) {
            const current = chain[i];
            const previous = chain[i - 1];
            if (!current.hasValidTransactions()) return false;
            if (current.hash !== current.calculateHash()) return false;
            if (current.previousHash !== previous.hash) return false;
        }
        return true;
    }

    replaceChain(newChain) {
        if (newChain.length > this.chain.length && this.isValidChain(newChain)) {
            this.chain = newChain;
        }
    }
}

async function syncBlockWithDatabase(block) {
    for (const tx of block.transactions) {
        const { fromAddress, toAddress, amount, timestamp, data } = tx;

        // Save transaction
        await supabase.from('transactions').insert({
            block_index: block.index,
            from_address: fromAddress,
            to_address: toAddress,
            amount,
            land_id: data.landId || null,
            type: data.type || null,
            timestamp
        });

        // Update current land owner if it's a land transfer or registration
        if (data.landId) {
            await supabase.from('lands')
                .upsert({
                    land_id: data.landId,
                    current_owner: toAddress,
                    last_updated: timestamp
                });
        }
    }
}


const blockchain = new Blockchain();

// ✅ PATCHED: Now allows system txs without privateKey
app.post('/transaction', (req, res) => {
    const { fromAddress, toAddress, amount, privateKey, data } = req.body;

    try {
        const tx = new Transaction(fromAddress, toAddress, amount, data);

        if (privateKey) {
            const key = ec.keyFromPrivate(privateKey, 'hex');
            tx.signTransaction(key);
        } else if (fromAddress !== null) {
            throw new Error('Private key is required for user-signed transactions');
        }

        blockchain.addTransaction(tx);
        blockchain.minePendingTransactions('0xautobot');
        res.send('✅ Transaction added and mined by 0xautobot');

    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.post('/mine', (req, res) => {
    const { minerAddress } = req.body;
    blockchain.minePendingTransactions(minerAddress);
    res.send('⛏️ Block mined successfully');
});

app.get('/blocks', (req, res) => {
    res.send(blockchain.chain);
});

app.get('/balance/:address', (req, res) => {
    const balance = blockchain.getBalanceOfAddress(req.params.address);
    res.send({ address: req.params.address, balance });
});

app.get('/owner/:landId', (req, res) => {
    const owner = blockchain.getOwnerOfLand(req.params.landId);
    res.send({ landId: req.params.landId, owner });
});

const server = app.listen(HTTP_PORT, () => {
    console.log(`HTTP server running at http://localhost:${HTTP_PORT}`);
});

const initP2PServer = () => {
    const wsServer = new WebSocket.Server({ port: P2P_PORT });
    wsServer.on('connection', socket => {
        sockets.push(socket);
        socket.on('message', msg => {
            const message = JSON.parse(msg);
            if (message.type === 'CHAIN') blockchain.replaceChain(message.data);
        });
        socket.send(JSON.stringify({ type: 'CHAIN', data: blockchain.chain }));
    });
};

initP2PServer();

peers.forEach(peer => {
    const ws = new WebSocket(peer);
    ws.on('open', () => {
        sockets.push(ws);
        ws.send(JSON.stringify({ type: 'CHAIN', data: blockchain.chain }));
    });
});
