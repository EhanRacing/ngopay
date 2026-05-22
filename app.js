/**
 * NgoPay Engine v2 - Versi Final Stabil Berbasis Jaringan
 */

// 1. GANTI DENGAN ADDRESS KONTRAK RE-DEPLOY ANDA DI REMIX IDE
const contractAddress = "0x16d19a19d672B7da8607C8668f68f8c150919eee"; 

// 2. ABI BARU: Menyesuaikan dengan fungsi Smart Contract yang sudah centang hijau di Remix
const contractABI = [
    {
        "inputs": [{ "internalType": "string", "name": "_note", "type": "string" }],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address payable", "name": "_to", "type": "address" },
            { "internalType": "uint256", "name": "_amount", "type": "uint256" },
            { "internalType": "string", "name": "_note", "type": "string" }
        ],
        "name": "transferP2P",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
        "name": "getBalance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

let provider; let signer; let ngoPayContract; let activeUserAddress = "";

// Mengunci elemen HTML sesuai template project lu
const connectBtn = document.getElementById('connect-btn');
const walletAddress = document.getElementById('wallet-address');
const walletBalance = document.getElementById('wallet-balance');
const btnSubmitDep = document.getElementById('btn-submit-dep');
const btnSubmitTx = document.getElementById('btn-submit-tx');
const display = document.getElementById('logs-display');

// FUNGSI UTAMA CONNECTOR METAMASK
async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            activeUserAddress = accounts[0];

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            ngoPayContract = new ethers.Contract(contractAddress, contractABI, signer);

            if(connectBtn) connectBtn.innerText = "Wallet Terhubung ✅";
            if(walletAddress) walletAddress.innerText = `${activeUserAddress.substring(0,6)}...${activeUserAddress.substring(38)}`;

            if(btnSubmitDep) btnSubmitDep.disabled = false;
            if(btnSubmitTx) btnSubmitTx.disabled = false;

            await updateUIState();

            window.ethereum.on('accountsChanged', (newAccs) => {
                if (newAccs.length > 0) { 
                    activeUserAddress = newAccs[0]; 
                    if(walletAddress) walletAddress.innerText = `${activeUserAddress.substring(0,6)}...${activeUserAddress.substring(38)}`; 
                    updateUIState(); 
                } else { 
                    location.reload(); 
                }
            });
        } catch (err) { console.error("Akses MetaMask ditolak", err); }
    } else { alert("Pasang ekstensi MetaMask dulu, bro!"); }
}

// UPDATE DATA SALDO DARl BLOCKCHAIN KONTRAK
async function updateUIState() {
    if (!ngoPayContract || !activeUserAddress) return;
    try {
        // Memanggil fungsi getBalance kontrak baru
        const balanceWei = await ngoPayContract.getBalance(activeUserAddress);
        const ethValue = ethers.utils.formatEther(balanceWei);
        if(walletBalance) walletBalance.innerHTML = `${parseFloat(ethValue).toFixed(4)} <span>ETH</span>`;
    } catch(e) { console.error("Gagal sinkronisasi data saldo", e); }
}

// HANDLER TOMBOL FORM DEPOSIT
document.getElementById('deposit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amt = document.getElementById('dep-amount').value;
    const note = document.getElementById('dep-note').value || "Seduh Saldo";
    
    if (!amt || amt <= 0) return alert("Masukkan nominal yang valid!");
    
    try {
        btnSubmitDep.innerText = "Memproses..."; btnSubmitDep.disabled = true;
        
        // Memanggil fungsi deposit kontrak baru
        const tx = await ngoPayContract.deposit(note, { value: ethers.utils.parseEther(amt) });
        await tx.wait();
        
        document.getElementById('deposit-form').reset();
        await updateUIState();
        tambahLogKeTabel("Deposit", amt, note, tx.hash);
    } catch(err) { 
        console.error(err);
        alert("Deposit gagal atau dibatalkan!"); 
    } finally { 
        btnSubmitDep.innerText = "Deposit Sekarang"; btnSubmitDep.disabled = false; 
    }
});

// HANDLER TOMBOL FORM TRANSFER P2P
document.getElementById('transfer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const to = document.getElementById('tx-to').value;
    const amt = document.getElementById('tx-amount').value;
    const note = document.getElementById('tx-note').value || "Bayar Kopi";
    
    if (!ethers.utils.isAddress(to)) return alert("Alamat dompet tujuan tidak valid!");
    if (!amt || amt <= 0) return alert("Masukkan nominal transfer yang valid!");

    try {
        btnSubmitTx.innerText = "Mengirim..."; btnSubmitTx.disabled = true;
        
        // Memanggil fungsi transferP2P kontrak baru
        const tx = await ngoPayContract.transferP2P(to, ethers.utils.parseEther(amt), note);
        await tx.wait();
        
        document.getElementById('transfer-form').reset();
        await updateUIState();
        tambahLogKeTabel("Transfer", amt, note, tx.hash);
    } catch(err) { 
        console.error(err);
        alert("Transfer gagal! Saldo tidak cukup atau dibatalkan."); 
    } finally { 
        btnSubmitTx.innerText = "Kirim Uang"; btnSubmitTx.disabled = false; 
    }
});

// MEMBUAT BARIS LOG TRANSAKSI REAL-TIME DI LAYOUT TABEL BAWAH
function tambahLogKeTabel(tipe, jumlah, catatan, txHash) {
    if (!display) return;
    const emptyRow = display.querySelector(".empty-row");
    if (emptyRow) display.innerHTML = '';

    const isDep = tipe === "Deposit";
    const ringkasHash = `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><span class="badge-tag ${isDep ? 'bg-dep' : 'bg-tx'}">${tipe}</span></td>
        <td style="font-family:monospace; font-size:0.8rem;">
            <a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank" style="color: #5c4033;">${ringkasHash}</a>
        </td>
        <td>${catatan}</td>
        <td class="text-right" style="font-weight:600; color:${isDep ? '#059669':'#2563eb'}">
            ${isDep ? '+':'-'} ${parseFloat(jumlah).toFixed(4)} ETH
        </td>
    `;
    display.insertBefore(tr, display.firstChild);
}

if (connectBtn) connectBtn.addEventListener('click', connectWallet);