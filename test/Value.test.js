const ether = require('./helpers/ether').ether;
const gwei = require('./helpers/ether').gwei;
const weiToEther = require('./helpers/ether').weiToEther;
const weiToGwei = require('./helpers/ether').weiToGwei;

const ValueContract = artifacts.require("Value");

contract('Value', async (accounts) => {
  let reasonableGasPrice = gwei(10); // 10 Gwei; There were problems when leaving Ganache's default 20 Gwei
  
  let contract;
  let firstAccount = accounts[0];
  let secondAccount = accounts[1];

  beforeEach(async () => {
    ValueContract.defaults({
        gasPrice: reasonableGasPrice
    });

    contract = await ValueContract.new();

    await logBalancesAndValue();
  });

  /* ------------- TEST which fails below ------------- */

  it("allows transfers from account with little ether", async () => {
    // arrange
    await sendSuppliesToContract(ether(1)); // send 1 Wei from 'firstAccount' to the 'contract'
    await almostEmpty(secondAccount); // empty the 'secondAccount' from ETH (to the lowest "badly" estimated transaction cost)

    // test fails here -> not enough ETH to execute
    await contract.increaseValue({from: secondAccount, gasPrice: reasonableGasPrice});

    // if test will success you should see log with Value:1
    await logBalancesAndValue();
  });

  /* Helper methods */

  let sendSuppliesToContract = async function(wei) {
      await web3.eth.sendTransaction({
          from: firstAccount,
          to: contract.address,
          value: wei
      });

      await logBalancesAndValue();
  }

  // it's "almost", because estimated gas cost needed to run the drainage is bigger than the actual gas cost
  let almostEmpty = async function(account) {
      let balance = await web3.eth.getBalance(account);

      let accountNonce = await web3.eth.getTransactionCount(account);
      let gasLimit = web3.eth.estimateGas({from: account, to: firstAccount, nonce: accountNonce}); // usually 21000 (with no data) gas cost of simple transaction
      let gasPrice = web3.eth.gasPrice.toNumber();
      let transactionFee = gasLimit * gasPrice;

      console.log();
      console.log("# Almost Empty");
      console.log("Estimated Gas limit :", gasLimit);
      console.log("Estimated Gas price :", gasPrice, "(" + weiToGwei(gasPrice).toString() + ' gwei)');
      console.log("Transaction fee :", transactionFee, "(" + weiToEther(transactionFee).toString() + ' ETH)');

      let etherNeeded = transactionFee * 4.3; // ganache needs it. but why it is calculated like that?

      console.log("The lowest ether amount needed to execute Value contract: ", etherNeeded);

      await web3.eth.sendTransaction({
          from: account,
          to: firstAccount,
          value: new web3.BigNumber(balance - etherNeeded),
          gasPrice: gasPrice
      });

      await logBalancesAndValue();
  }

  let logBalancesAndValue = async function() {
      console.log();

      await logEthBalance(firstAccount, 'firstAccount');
      await logEthBalance(secondAccount, 'secondAccount');
      await logEthBalance(contract.address, 'contract');

      let value = await contract.getValue();
      console.log("Contract's value: " + value);
  }

  let logEthBalance = async function(someAccount, name) {
      let ethBalance = await web3.eth.getBalance(someAccount);

      console.log('"'+name+'" balance : ' + weiToEther(ethBalance) + ' ETH');
  }
})
