import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Container, Typography, Button, Box, TextField, Paper } from '@mui/material';
import { QRCode } from 'qrcode.react';

const CONTRACT_ADDRESS = "0x8C8c6f5E856195CB1601F94B5ae4159C7e929903"; // Substitua pelo endereço do contrato após o deploy
const CONTRACT_ABI = [
    "function deposit() external payable",
    "function sendPayment(address payable recipient, uint256 amount) external",
    "function getBalance() public view returns (uint256)",
    "function getTransactionHistory() public view returns (tuple(address sender, address recipient, uint256 amount, uint256 timestamp, bool completed)[])",
    "function withdraw(uint256 amount) external"
];

function App() {
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [contract, setContract] = useState(null);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                setAccount(address);
                
                const contractInstance = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    signer
                );
                setContract(contractInstance);
                
                const balance = await contractInstance.getBalance();
                setBalance(ethers.utils.formatEther(balance));
            } catch (error) {
                console.error("Erro ao conectar carteira:", error);
            }
        } else {
            alert("Por favor, instale o MetaMask!");
        }
    };

    const sendPayment = async () => {
        if (!contract || !recipientAddress || !amount) return;
        
        try {
            const amountWei = ethers.utils.parseEther(amount);
            const tx = await contract.sendPayment(recipientAddress, amountWei);
            await tx.wait();
            alert("Pagamento enviado com sucesso!");
            setAmount('');
            setRecipientAddress('');
        } catch (error) {
            console.error("Erro ao enviar pagamento:", error);
            alert("Erro ao enviar pagamento. Verifique o console para mais detalhes.");
        }
    };

    const deposit = async () => {
        if (!contract || !amount) return;
        
        try {
            const amountWei = ethers.utils.parseEther(amount);
            const tx = await contract.deposit({ value: amountWei });
            await tx.wait();
            alert("Depósito realizado com sucesso!");
            setAmount('');
        } catch (error) {
            console.error("Erro ao fazer depósito:", error);
            alert("Erro ao fazer depósito. Verifique o console para mais detalhes.");
        }
    };

    const withdraw = async () => {
        if (!contract || !amount) return;
        
        try {
            const amountWei = ethers.utils.parseEther(amount);
            const tx = await contract.withdraw(amountWei);
            await tx.wait();
            alert("Saque realizado com sucesso!");
            setAmount('');
        } catch (error) {
            console.error("Erro ao fazer saque:", error);
            alert("Erro ao fazer saque. Verifique o console para mais detalhes.");
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Plataforma de Pagamentos Ethereum
                </Typography>

                {!account ? (
                    <Button variant="contained" color="primary" onClick={connectWallet}>
                        Conectar Carteira
                    </Button>
                ) : (
                    <Box>
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6">Conta Conectada</Typography>
                            <Typography>{account}</Typography>
                            <Typography variant="h6">Saldo</Typography>
                            <Typography>{balance} ETH</Typography>
                        </Paper>

                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6">Enviar Pagamento</Typography>
                            <TextField
                                fullWidth
                                label="Endereço do Destinatário"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Quantidade (ETH)"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                margin="normal"
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={sendPayment}
                                sx={{ mt: 2 }}
                            >
                                Enviar Pagamento
                            </Button>
                        </Paper>

                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6">Depósito/Saque</Typography>
                            <TextField
                                fullWidth
                                label="Quantidade (ETH)"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                margin="normal"
                            />
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={deposit}
                                >
                                    Depositar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={withdraw}
                                >
                                    Sacar
                                </Button>
                            </Box>
                        </Paper>

                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">QR Code para Pagamento</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <QRCode
                                    value={`ethereum:${account}?value=${amount || '0'}`}
                                    size={200}
                                />
                            </Box>
                        </Paper>
                    </Box>
                )}
            </Box>
        </Container>
    );
}

export default App; 