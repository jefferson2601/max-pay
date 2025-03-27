import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  TextField, 
  Paper,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  Grid,
  Fade,
  CircularProgress,
  Backdrop,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Divider,
  Link,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  ThemeProvider,
  createTheme,
  Tabs,
  Tab,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { Web3ReactProvider, useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import contractABI from './contractABI.json';
import './App.css';

const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 11155111],
  shimDisconnect: true,
  shimChainChanged: true,
  shimAccountsChanged: true
});

const CONTRACT_ADDRESS = "0x3fCDB5Fc85a91D3914F17d9f7C8087F05e5930b6";

function getLibrary(provider) {
  return new ethers.providers.Web3Provider(provider);
}

// Traduções
const translations = {
  pt: {
    welcome: "Bem-vindo ao MaxPay",
    connectWallet: "Conecte sua carteira para começar a fazer pagamentos em Ethereum",
    connect: "Conectar Carteira",
    disconnect: "Desconectar",
    totalBalance: "Saldo Total",
    send: "Enviar",
    deposit: "Depósito/Saque",
    qrCode: "QR Code",
    history: "Histórico",
    recipientAddress: "Endereço do Destinatário",
    amount: "Quantidade (ETH)",
    sendPayment: "Enviar Pagamento",
    depositButton: "Depositar",
    withdrawButton: "Sacar",
    transactionHistory: "Histórico de Transações",
    update: "Atualizar",
    exportCSV: "Exportar CSV",
    searchAddress: "Buscar por endereço...",
    startDate: "Data Inicial",
    endDate: "Data Final",
    date: "Data",
    from: "De",
    to: "Para",
    value: "Valor (ETH)",
    status: "Status",
    completed: "Concluída",
    pending: "Pendente",
    you: "Você",
    usefulLinks: "Links Úteis",
    contact: "Contato",
    terms: "Termos de Uso",
    privacy: "Política de Privacidade",
    developedBy: "Desenvolvido por Jefferson Lopes"
  },
  en: {
    welcome: "Welcome to MaxPay",
    connectWallet: "Connect your wallet to start making payments in Ethereum",
    connect: "Connect Wallet",
    disconnect: "Disconnect",
    totalBalance: "Total Balance",
    send: "Send",
    deposit: "Deposit/Withdraw",
    qrCode: "QR Code",
    history: "History",
    recipientAddress: "Recipient Address",
    amount: "Amount (ETH)",
    sendPayment: "Send Payment",
    depositButton: "Deposit",
    withdrawButton: "Withdraw",
    transactionHistory: "Transaction History",
    update: "Update",
    exportCSV: "Export CSV",
    searchAddress: "Search by address...",
    startDate: "Start Date",
    endDate: "End Date",
    date: "Date",
    from: "From",
    to: "To",
    value: "Value (ETH)",
    status: "Status",
    completed: "Completed",
    pending: "Pending",
    you: "You",
    usefulLinks: "Useful Links",
    contact: "Contact",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    developedBy: "Developed by Jefferson Lopes"
  }
};

function App({ darkMode, setDarkMode }) {
    const { active, account, library, activate, deactivate } = useWeb3React();
    const [balance, setBalance] = useState(null);
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('send');
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [language, setLanguage] = useState('pt');
    const [anchorEl, setAnchorEl] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const theme = useTheme();

    const t = translations[language];

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        setAnchorEl(null);
    };

    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    // Função para verificar se o MetaMask está instalado
    const checkMetaMask = () => {
        if (typeof window.ethereum !== 'undefined') {
            return true;
        }
        return false;
    };

    // Função para verificar se a carteira está conectada
    const checkWalletConnection = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                return accounts.length > 0;
            } catch (error) {
                console.error('Erro ao verificar conexão:', error);
                return false;
            }
        }
        return false;
    };

    const connectWallet = async () => {
        if (isConnecting) return;
        setIsConnecting(true);
        
        try {
            // Primeiro, verifica se o MetaMask está instalado
            if (!checkMetaMask()) {
                alert('Por favor, instale o MetaMask para continuar.');
                return;
            }

            // Tenta conectar
            await activate(injected);
            
            // Se chegou aqui, a conexão foi bem sucedida
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('lastConnectedAccount', account);
        } catch (error) {
            console.error('Erro ao conectar carteira:', error);
            localStorage.setItem('walletConnected', 'false');
            localStorage.removeItem('lastConnectedAccount');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = async () => {
        try {
            // Limpa o localStorage
            localStorage.setItem('walletConnected', 'false');
            localStorage.removeItem('lastConnectedAccount');
            
            // Desconecta do Web3React
            await deactivate();
        } catch (error) {
            console.error('Erro ao desconectar carteira:', error);
        }
    };

    // Efeito para reconectar automaticamente
    useEffect(() => {
        const reconnectWallet = async () => {
            if (isConnecting) return;
            
            setIsConnecting(true);
            try {
                const isMetaMaskInstalled = checkMetaMask();
                const isWalletConnected = await checkWalletConnection();
                const wasConnected = localStorage.getItem('walletConnected') === 'true';
                const lastAccount = localStorage.getItem('lastConnectedAccount');
                
                if (isMetaMaskInstalled && isWalletConnected && wasConnected && lastAccount === account) {
                    await activate(injected);
                } else {
                    // Se alguma condição não for atendida, limpa o estado
                    localStorage.setItem('walletConnected', 'false');
                    localStorage.removeItem('lastConnectedAccount');
                }
            } catch (error) {
                console.error('Erro ao reconectar:', error);
                localStorage.setItem('walletConnected', 'false');
                localStorage.removeItem('lastConnectedAccount');
            } finally {
                setIsConnecting(false);
            }
        };

        reconnectWallet();

        // Adicionar listener para mudanças na conta
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    // Usuário desconectou todas as contas
                    await disconnectWallet();
                } else {
                    // Usuário trocou de conta
                    localStorage.setItem('lastConnectedAccount', accounts[0]);
                    await reconnectWallet();
                }
            });

            window.ethereum.on('disconnect', async () => {
                await disconnectWallet();
            });
        }

        // Cleanup
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => {});
                window.ethereum.removeListener('disconnect', () => {});
            }
        };
    }, [activate, account]);

    // Efeito para atualizar o contrato quando a biblioteca mudar
    useEffect(() => {
        if (library && account) {
            const signer = library.getSigner();
            const contractInstance = new ethers.Contract(
                CONTRACT_ADDRESS,
                contractABI,
                signer
            );
            setContract(contractInstance);
        }
    }, [library, account]);

    useEffect(() => {
        if (active && library) {
            const signer = library.getSigner();
            const contractInstance = new ethers.Contract(
                CONTRACT_ADDRESS,
                contractABI,
                signer
            );
            setContract(contractInstance);
            
            const getBalance = async () => {
                try {
                    const balance = await contractInstance.getBalance();
                    setBalance(ethers.utils.formatEther(balance));
                } catch (error) {
                    console.error("Erro ao obter saldo:", error);
                }
            };
            
            getBalance();
        }
    }, [active, library]);

    const handleTransaction = async (type) => {
        if (!contract || (!amount && type !== 'balance')) return;
        setLoading(true);
        
        try {
            const amountWei = ethers.utils.parseEther(amount);
            let tx;
            
            switch (type) {
                case 'send':
                    tx = await contract.sendPayment(recipientAddress, amountWei);
                    break;
                case 'deposit':
                    tx = await contract.deposit({ value: amountWei });
                    break;
                case 'withdraw':
                    tx = await contract.withdraw(amountWei);
                    break;
                default:
                    return;
            }
            
            await tx.wait();
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} realizado com sucesso!`);
            setAmount('');
            if (type === 'send') setRecipientAddress('');
        } catch (error) {
            console.error(`Erro ao realizar ${type}:`, error);
            alert(`Erro ao realizar ${type}. Verifique o console para mais detalhes.`);
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async () => {
        if (!contract) return;
        setLoadingTransactions(true);
        try {
            const history = await contract.getTransactionHistory();
            const formattedHistory = history.map(tx => ({
                sender: tx.sender,
                recipient: tx.recipient,
                amount: ethers.utils.formatEther(tx.amount),
                timestamp: new Date(tx.timestamp * 1000).toLocaleString(),
                completed: tx.completed,
                date: new Date(tx.timestamp * 1000)
            }));
            setTransactions(formattedHistory);
            setFilteredTransactions(formattedHistory);
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    useEffect(() => {
        let filtered = [...transactions];

        // Filtro por busca
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(tx => 
                tx.sender.toLowerCase().includes(searchLower) ||
                tx.recipient.toLowerCase().includes(searchLower)
            );
        }

        // Filtro por data
        if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            filtered = filtered.filter(tx => tx.date >= startDate);
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(tx => tx.date <= endDate);
        }

        setFilteredTransactions(filtered);
    }, [searchTerm, dateRange, transactions]);

    const exportTransactions = () => {
        const csv = [
            ['Data', 'De', 'Para', 'Valor (ETH)', 'Status'],
            ...transactions.map(tx => [
                tx.timestamp,
                tx.sender,
                tx.recipient,
                tx.amount,
                tx.completed ? 'Concluída' : 'Pendente'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        MaxPay
                    </Typography>
                    <IconButton onClick={toggleTheme} color="inherit">
                        {darkMode ? '☀️' : '🌙'}
                    </IconButton>
                    <LanguageSelector language={language} setLanguage={handleLanguageChange} anchorEl={anchorEl} handleClick={(e) => setAnchorEl(e.currentTarget)} handleClose={() => setAnchorEl(null)} />
                    {active ? (
                        <Button 
                            color="inherit" 
                            onClick={disconnectWallet}
                        >
                            {t.disconnect}
                        </Button>
                    ) : (
                        <Button 
                            color="inherit" 
                            onClick={connectWallet}
                        >
                            {t.connect}
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4, flex: 1 }}>
                {!active ? (
                    <Box sx={{ textAlign: 'center', mt: 8 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {t.welcome}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" paragraph>
                            {t.connectWallet}
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={connectWallet}
                            sx={{ mt: 2 }}
                        >
                            {t.connect}
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Card 
                                elevation={3}
                                sx={{ 
                                    borderRadius: '15px',
                                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                    color: 'white'
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>{t.totalBalance}</Typography>
                                    <Typography variant="h4">{balance} ETH</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={8}>
                            <Paper 
                                elevation={3}
                                sx={{ 
                                    p: 3,
                                    borderRadius: '15px',
                                    minHeight: '400px'
                                }}
                            >
                                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                    <Grid container spacing={2}>
                                        <Grid item>
                                            <Button
                                                variant={activeTab === 'send' ? 'contained' : 'text'}
                                                onClick={() => setActiveTab('send')}
                                                sx={{ borderRadius: '20px' }}
                                            >
                                                {t.send}
                                            </Button>
                                        </Grid>
                                        <Grid item>
                                            <Button
                                                variant={activeTab === 'deposit' ? 'contained' : 'text'}
                                                onClick={() => setActiveTab('deposit')}
                                                sx={{ borderRadius: '20px' }}
                                            >
                                                {t.deposit}
                                            </Button>
                                        </Grid>
                                        <Grid item>
                                            <Button
                                                variant={activeTab === 'qr' ? 'contained' : 'text'}
                                                onClick={() => setActiveTab('qr')}
                                                sx={{ borderRadius: '20px' }}
                                            >
                                                {t.qrCode}
                                            </Button>
                                        </Grid>
                                        <Grid item>
                                            <Button
                                                variant={activeTab === 'history' ? 'contained' : 'text'}
                                                onClick={() => setActiveTab('history')}
                                                sx={{ borderRadius: '20px' }}
                                            >
                                                {t.history}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Fade in={activeTab === 'send'}>
                                    <Box sx={{ display: activeTab === 'send' ? 'block' : 'none' }}>
                                        <TextField
                                            fullWidth
                                            label={t.recipientAddress}
                                            value={recipientAddress}
                                            onChange={(e) => setRecipientAddress(e.target.value)}
                                            margin="normal"
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label={t.amount}
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            margin="normal"
                                            variant="outlined"
                                            sx={{ mb: 3 }}
                                        />
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={() => handleTransaction('send')}
                                            sx={{ 
                                                borderRadius: '20px',
                                                py: 1.5
                                            }}
                                        >
                                            {t.sendPayment}
                                        </Button>
                                    </Box>
                                </Fade>

                                <Fade in={activeTab === 'deposit'}>
                                    <Box sx={{ display: activeTab === 'deposit' ? 'block' : 'none' }}>
                                        <TextField
                                            fullWidth
                                            label={t.amount}
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            margin="normal"
                                            variant="outlined"
                                            sx={{ mb: 3 }}
                                        />
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    onClick={() => handleTransaction('deposit')}
                                                    sx={{ 
                                                        borderRadius: '20px',
                                                        py: 1.5
                                                    }}
                                                >
                                                    {t.depositButton}
                                                </Button>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    onClick={() => handleTransaction('withdraw')}
                                                    sx={{ 
                                                        borderRadius: '20px',
                                                        py: 1.5
                                                    }}
                                                >
                                                    {t.withdrawButton}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Fade>

                                <Fade in={activeTab === 'qr'}>
                                    <Box 
                                        sx={{ 
                                            display: activeTab === 'qr' ? 'flex' : 'none',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 2
                                        }}
                                    >
                                        <TextField
                                            label={t.amount}
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        />
                                        <Paper 
                                            elevation={2}
                                            sx={{ 
                                                p: 3,
                                                borderRadius: '15px',
                                                bgcolor: 'white'
                                            }}
                                        >
                                            <QRCodeSVG
                                                value={`ethereum:${account}?value=${amount || '0'}`}
                                                size={200}
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </Paper>
                                    </Box>
                                </Fade>

                                <Fade in={activeTab === 'history'}>
                                    <Box sx={{ display: activeTab === 'history' ? 'block' : 'none' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="h6">{t.transactionHistory}</Typography>
                                            <Box>
                                                <Button
                                                    variant="outlined"
                                                    onClick={loadTransactions}
                                                    disabled={loadingTransactions}
                                                    sx={{ mr: 1 }}
                                                >
                                                    {t.update}
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    onClick={exportTransactions}
                                                >
                                                    {t.exportCSV}
                                                </Button>
                                            </Box>
                                        </Box>

                                        <Stack spacing={2} sx={{ mb: 3 }}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                placeholder={t.searchAddress}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        type="date"
                                                        label={t.startDate}
                                                        value={dateRange.start}
                                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        type="date"
                                                        label={t.endDate}
                                                        value={dateRange.end}
                                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Stack>

                                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                                            <Table stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>{t.date}</TableCell>
                                                        <TableCell>{t.from}</TableCell>
                                                        <TableCell>{t.to}</TableCell>
                                                        <TableCell align="right">{t.value}</TableCell>
                                                        <TableCell align="center">{t.status}</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredTransactions.map((tx, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{tx.timestamp}</TableCell>
                                                            <TableCell>
                                                                {tx.sender === account ? t.you : `${tx.sender.substring(0, 6)}...${tx.sender.substring(38)}`}
                                                            </TableCell>
                                                            <TableCell>
                                                                {tx.recipient === account ? t.you : `${tx.recipient.substring(0, 6)}...${tx.recipient.substring(38)}`}
                                                            </TableCell>
                                                            <TableCell align="right">{tx.amount}</TableCell>
                                                            <TableCell align="center">
                                                                <Chip 
                                                                    label={tx.completed ? t.completed : t.pending} 
                                                                    color={tx.completed ? 'success' : 'warning'}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                </Fade>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Container>

            <Box
                component="footer"
                sx={{
                    py: 3,
                    px: 2,
                    mt: 8,
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                            ? theme.palette.grey[200]
                            : theme.palette.grey[800],
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="h6" color="text.primary" gutterBottom>
                                MaxPay
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Sua plataforma descentralizada para pagamentos em Ethereum.
                                Segura, rápida e fácil de usar.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="h6" color="text.primary" gutterBottom>
                                {t.usefulLinks}
                            </Typography>
                            <Stack spacing={1}>
                                <Link href="https://ethereum.org" target="_blank" rel="noopener noreferrer" color="inherit">
                                    Ethereum.org
                                </Link>
                                <Link href="https://metamask.io" target="_blank" rel="noopener noreferrer" color="inherit">
                                    MetaMask
                                </Link>
                                <Link href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" color="inherit">
                                    Sepolia Etherscan
                                </Link>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="h6" color="text.primary" gutterBottom>
                                {t.contact}
                            </Typography>
                            <Stack spacing={1}>
                                <Typography variant="body2" color="text.secondary">
                                    Email: jefferson260114@gmail.com
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Telefone: (98) 98509-3657
                                </Typography>
                                <Link href="https://linkedin.com/in/jefferson2601" target="_blank" rel="noopener noreferrer" color="inherit">
                                    LinkedIn
                                </Link>
                                <Link href="https://github.com/jefferson2601" target="_blank" rel="noopener noreferrer" color="inherit">
                                    GitHub
                                </Link>
                            </Stack>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 3 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                            © {new Date().getFullYear()} MaxPay. {t.developedBy}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Link href="#" color="inherit" underline="hover">
                                {t.terms}
                            </Link>
                            <Link href="#" color="inherit" underline="hover">
                                {t.privacy}
                            </Link>
                        </Stack>
                    </Box>
                </Container>
            </Box>

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}

function AppWrapper() {
    const [darkMode, setDarkMode] = useState(false);

    const theme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: '#2196F3',
            },
            secondary: {
                main: '#21CBF3',
            },
            background: {
                default: darkMode ? '#303030' : '#f5f5f5',
                paper: darkMode ? '#424242' : '#fff',
            },
        },
    });

    return (
        <ThemeProvider theme={theme}>
            <Web3ReactProvider getLibrary={getLibrary}>
                <Router>
                    <Routes>
                        <Route path="/" element={<App darkMode={darkMode} setDarkMode={setDarkMode} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </Web3ReactProvider>
        </ThemeProvider>
    );
}

export default AppWrapper;

// Substituir os ícones por texto simples
const ThemeToggle = ({ darkMode, toggleTheme }) => (
  <IconButton onClick={toggleTheme} color="inherit">
    ☀️
  </IconButton>
);

const LanguageSelector = ({ language, setLanguage, anchorEl, handleClick, handleClose }) => (
  <>
    <IconButton onClick={handleClick} color="inherit">
      🌐
    </IconButton>
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
    >
      <MenuItem onClick={() => { setLanguage('pt'); handleClose(); }}>
        🇧🇷 Português
      </MenuItem>
      <MenuItem onClick={() => { setLanguage('en'); handleClose(); }}>
        🇺🇸 English
      </MenuItem>
    </Menu>
  </>
);
