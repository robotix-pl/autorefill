const ether = require('./openzeppelin/ether').ether;
const gwei = require('./openzeppelin/ether').gwei;
const weiToEther = require('./openzeppelin/ether').weiToEther;
const weiToGwei = require('./openzeppelin/ether').weiToGwei;

const AutoRefillMock = artifacts.require("AutoRefillMock");

contract('AutoRefill', async (accounts) => {
  let reasonableGasPrice = gwei(10); // 10 Gwei; There were problems when leaving Ganache's default 20 Gwei
  let tokenPriceInWei = ether(0.1); // 0.1 ETH
  let initialBalance = 10000000000; // 10.000.000.000 coin tokens
  
  let coin;
  let owner = accounts[0];
  let account = accounts[1];

  beforeEach(async () => {
    AutoRefillMock.defaults({
        gasPrice: reasonableGasPrice
    });

    coin = await AutoRefillMock.new(initialBalance, tokenPriceInWei);

    await coin.transfer(account, 100, {from: owner}); // fill 'account' with 100 coin tokens (not ETH) from 'owner'
    await logAllBalances();
  });

  /* ------------- TEST which fails below ------------- */

  it("allows transfers from account with little ether", async () => {
    // Arrange
    await sendRefillSupplies(ether(1)); // send 1 Wei from 'owner' to the 'coin'
    await almostEmpty(account); // empty the 'account' from ETH, so a refill will be needed

    // Act (--> fails here <--)
    await coin.transfer(owner, 10, {from: account, gasPrice: reasonableGasPrice});

    // Assert
    await logAllBalances();

    for (let i = 0; i < 3; i++) { // some more transactions should be possible
      await coin.transfer(owner, 2, {from: account, gasPrice: reasonableGasPrice});
      await logAllBalances();
    }
  });

  /* Helper methods */

  let sendRefillSupplies = async function(wei) {
      await web3.eth.sendTransaction({
          from: owner,
          to: coin.address,
          value: wei
      });

      await logAllBalances();
  }

  // it's "almost", because estimated gas cost needed to run the drainage is bigger than the actual gas cost
  let almostEmpty = async function(account) {
      let balance = await web3.eth.getBalance(account);

      let accountNonce = await web3.eth.getTransactionCount(account);
      let gasLimit = web3.eth.estimateGas({from: account, to: owner, nonce: accountNonce}); // usually 21000 (with no data) gas cost of simple transaction
      let gasPrice = web3.eth.gasPrice.toNumber();
      let transactionFee = gasLimit * gasPrice;

      console.log();
      console.log("# Almost Empty");
      console.log("Estimated Gas limit :", gasLimit);
      console.log("Estimated Gas price :", gasPrice, "(" + weiToGwei(gasPrice).toString() + ' gwei)');
      console.log("Transaction fee :", transactionFee, "(" + weiToEther(transactionFee).toString() + ' ETH)');

      let etherNeeded = transactionFee * 4.3; // ganache needs it. but why it is calculated like that?
      // let etherNeeded = transactionFee / 21 * 90;

      await web3.eth.sendTransaction({
          from: account,
          to: owner,
          value: new web3.BigNumber(balance - etherNeeded),
          gasPrice: gasPrice
      });

      await logAllBalances();
  }

  let logAllBalances = async function() {
      console.log();
      await logBalances(account, 'account');
      await logBalances(owner, 'owner');
      await logBalances(coin.address, 'contract');
  }

  let logBalances = async function(someAccount, name) {
      let ethBalance = await web3.eth.getBalance(someAccount);

      console.log('--- ' + name + ' ---');
      console.log('  ETH balance : ' + weiToEther(ethBalance) + ' ETH');
      console.log('Token balance : ' + (await coin.balanceOf(someAccount)));
  }
})
