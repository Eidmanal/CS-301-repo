const API_BASE = 'http://localhost:3001';

let walletConnected = false;

function connectWallet() {
  walletConnected = true;
  document.getElementById('walletStatus').textContent = '✔ Wallet connected (simulated)';
}

function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status-text ${isError ? 'error' : 'success'}`;
}

function disableButtons(disabled) {
  document.getElementById('registerBtn').disabled = disabled;
  document.getElementById('transferBtn').disabled = disabled;
}

async function createLand() {
  const landId = document.getElementById('landId').value.trim();
  const owner = document.getElementById('owner').value.trim();
  if (!walletConnected) return showStatus('Please connect wallet first.', true);
  if (!landId || !owner) return showStatus('Land ID and Owner are required.', true);

  disableButtons(true);
  const tx = {
    fromAddress: null,
    toAddress: owner,
    amount: 0,
    data: { type: 'register', landId }
  };

  try {
    await fetch(`${API_BASE}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    showStatus(`✅ Land ${landId} registered to ${owner}`);
  } catch (err) {
    showStatus('Failed to register land.', true);
  } finally {
    disableButtons(false);
  }
}

async function transferLand() {
  const landId = document.getElementById('landId').value.trim();
  const from = document.getElementById('owner').value.trim();
  const to = document.getElementById('buyer').value.trim();
  const amount = parseFloat(document.getElementById('price').value);
  if (!walletConnected) return showStatus('Please connect wallet first.', true);
  if (!landId || !from || !to || isNaN(amount)) {
    return showStatus('All fields must be filled in correctly.', true);
  }

  disableButtons(true);
  const tx = {
    fromAddress: from,
    toAddress: to,
    amount,
    data: { type: 'transfer', landId }
  };

  try {
    await fetch(`${API_BASE}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    showStatus(`🔄 Transferred ${landId} from ${from} to ${to}`);
  } catch (err) {
    showStatus('Transfer failed.', true);
  } finally {
    disableButtons(false);
  }
}

async function viewBlockchain() {
  const panel = document.getElementById('blockchainPanel');
  const container = document.getElementById('blockchainData');
  panel.classList.remove('d-none');
  container.innerHTML = '⏳ Loading blockchain...';

  try {
    const res = await fetch(`${API_BASE}/blocks`);
    const blocks = await res.json();
    container.innerHTML = blocks.map(block => `
      <div>
        <strong>Block #${block.index}</strong><br/>
        ⛏ Hash: ${block.hash.slice(0, 20)}...<br/>
        🕒 ${new Date(block.timestamp).toLocaleString()}<br/>
        🔗 Tx Count: ${block.transactions.length}
      </div><hr/>
    `).join('');
  } catch (err) {
    container.innerHTML = '<span class="text-danger">Failed to load blockchain.</span>';
  }
}
