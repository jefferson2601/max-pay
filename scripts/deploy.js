async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployando contratos com a conta:", deployer.address);

    const PaymentContract = await ethers.getContractFactory("PaymentContract");
    const paymentContract = await PaymentContract.deploy();
    await paymentContract.waitForDeployment();
    
    console.log("PaymentContract implantado em:", await paymentContract.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
