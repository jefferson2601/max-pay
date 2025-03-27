// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract PaymentContract {
    address public owner;
    
    struct Transaction {
        address sender;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        bool completed;
    }
    
    mapping(address => Transaction[]) public userTransactions;
    mapping(address => uint256) public balances;
    
    event PaymentReceived(address indexed sender, uint256 amount);
    event PaymentSent(address indexed sender, address indexed recipient, uint256 amount);
    event BalanceUpdated(address indexed user, uint256 newBalance);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas o proprietario pode executar esta funcao");
        _;
    }
    
    // Função para depositar ETH no contrato
    function deposit() external payable {
        require(msg.value > 0, "O valor deve ser maior que zero");
        balances[msg.sender] += msg.value;
        emit PaymentReceived(msg.sender, msg.value);
        emit BalanceUpdated(msg.sender, balances[msg.sender]);
    }
    
    // Função para enviar pagamento
    function sendPayment(address payable recipient, uint256 amount) external {
        require(amount > 0, "O valor deve ser maior que zero");
        require(balances[msg.sender] >= amount, "Saldo insuficiente");
        
        balances[msg.sender] -= amount;
        balances[recipient] += amount;
        
        Transaction memory newTransaction = Transaction({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            completed: true
        });
        
        userTransactions[msg.sender].push(newTransaction);
        userTransactions[recipient].push(newTransaction);
        
        emit PaymentSent(msg.sender, recipient, amount);
        emit BalanceUpdated(msg.sender, balances[msg.sender]);
        emit BalanceUpdated(recipient, balances[recipient]);
    }
    
    // Função para verificar o saldo
    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
    
    // Função para obter o histórico de transações
    function getTransactionHistory() public view returns (Transaction[] memory) {
        return userTransactions[msg.sender];
    }
    
    // Função para saque de fundos
    function withdraw(uint256 amount) external {
        require(amount > 0, "O valor deve ser maior que zero");
        require(balances[msg.sender] >= amount, "Saldo insuficiente");
        
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        
        emit BalanceUpdated(msg.sender, balances[msg.sender]);
    }
} 