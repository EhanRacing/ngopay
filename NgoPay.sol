// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NgoPay - Decentralized Account-based Financial Platform
 * @dev Mengimplementasikan konsep Account-based Model secara nyata di Blockchain Sepolia.
 * Saldo disimpan langsung pada state mapping terikat dengan address wallet pengguna.
 */
contract NgoPay {
    // State Database Account-based: Menyimpan saldo langsung di-mapping ke alamat wallet
    mapping(address => uint256) public balances;
    
    // Struktur data untuk melacak riwayat mutasi saku secara global
    struct TransactionLog {
        string txType;    // "Deposit" atau "Transfer"
        address user;     // Pelaku transaksi / Pengirim dana
        address receiver; // Penerima dana (0x0 jika jenisnya Deposit)
        uint256 amount;   // Nominal transaksi dalam satuan Wei
        string note;      // Catatan santai ngopi
        uint256 timestamp;// Waktu block di-mine
    }
    
    // Array menampung seluruh log mutasi akun
    TransactionLog[] public logs;

    // Events untuk tracking realtime di sisi Frontend / Web3 Ethers
    event DepositMade(address indexed user, uint256 amount, string note);
    event TransferMade(address indexed from, address indexed to, uint256 amount, string note);

    /**
     * @notice Mengisi saku digital NgoPay dengan cara mengunci Sepolia ETH ke dalam contract.
     * @param _note Catatan singkat pengisian saldo.
     */
    function depositSaku(string memory _note) public payable {
        require(msg.value > 0, "Nominal isi saku harus lebih besar dari 0 Wei!");
        
        // --- MUTASI ACCOUNT-BASED (DEPOSIT) ---
        balances[msg.sender] += msg.value;
        // --------------------------------------
        
        logs.push(TransactionLog("Deposit", msg.sender, address(0), msg.value, _note, block.timestamp));
        emit DepositMade(msg.sender, msg.value, _note);
    }

    /**
     * @notice Mengalirkan dana dari saku pengirim ke saku penerima secara internal di dalam contract.
     * @param _to Alamat dompet Sepolia tujuan.
     * @param _amount Jumlah dana yang ditransfer (dalam satuan Wei).
     * @param _note Keterangan pembayaran.
     */
    function transferSaku(address _to, uint256 _amount, string memory _note) public {
        require(_to != address(0), "Alamat tujuan kopi tidak valid!");
        require(balances[msg.sender] >= _amount, "Saldo saku NgoPay Anda tidak mencukupi!");
        require(_to != msg.sender, "Tidak bisa mentransfer dana ke alamat saku sendiri!");
        require(_amount > 0, "Jumlah transfer harus lebih besar dari 0 Wei!");

        // --- INTI LOGIKA ACCOUNT-BASED MODEL MUTATION ---
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        // ------------------------------------------------

        logs.push(TransactionLog("Transfer", msg.sender, _to, _amount, _note, block.timestamp));
        emit TransferMade(msg.sender, _to, _amount, _note);
    }

    /**
     * @notice Mengambil seluruh histori transaksi kas mutasi untuk di-render di tabel frontend.
     */
    function getAllLogs() public view returns (TransactionLog[] memory) {
        return logs;
    }
}
