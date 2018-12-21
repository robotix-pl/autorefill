const ether = require('./openzeppelin/ether').ether;
const gwei = require('./openzeppelin/ether').gwei;
const weiToEther = require('./openzeppelin/ether').weiToEther;
const weiToGwei = require('./openzeppelin/ether').weiToGwei;

const shouldFail = require('./openzeppelin/shouldFail.js');

const AutoRefillMock = artifacts.require("AutoRefillMock");

contract('AutoRefill', async (accounts) => {
  let reasonableGasPrice;
  let initialBalance;
  let tokenPriceInWei;
  let coin;

  let owner = accounts[0];
  let accountTwo = accounts[1];

  let almostEmpty = async function(account) { // it's "almost", because estimated gas cost needed to run the drainage is bigger than the actual gas cost
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
    // let etherNeeded = transactionFee / 21 * 90; // ganache needs it. but why it is calculated like that?

    await web3.eth.sendTransaction({
      from: account,
      to: owner,
      value: new web3.BigNumber(balance - etherNeeded),
      gasPrice: gasPrice
    });
  }

  let logBalances = async function(account, name) {
    let ethBalance = await web3.eth.getBalance(account);

    console.log('--- ' + name + ' ---');
    console.log('  ETH balance : ' + weiToEther(ethBalance) + ' ETH');
    console.log('Token balance : ' + (await coin.balanceOf(account)));
  }

  let logAllBalances = async function() {
    console.log();
    await logBalances(accountTwo, 'accountTwo');
    await logBalances(owner, 'owner');
    await logBalances(coin.address, 'contract');
  }

  let sendRefillSupplies = async function(wei) {
    await web3.eth.sendTransaction({
      from: owner,
      to: coin.address,
      value: wei
    });
  }

  before(function() {
    reasonableGasPrice = gwei(10); // 10 Gwei; There were problems when leaving Ganache's default 20 Gwei
    tokenPriceInWei = ether(0.1); /* 0.1 ETH */

    initialBalance = 10000000000; /* 10. 000.000.000 tokens */
  });

  beforeEach(async () => {
    AutoRefillMock.defaults({
      gasPrice: reasonableGasPrice
    });

    coin = await AutoRefillMock.new(initialBalance, tokenPriceInWei);
    await coin.transfer(accountTwo, 100, {from: owner});
  });

  it("allows transfers from account with little ether", async () => {
    // Arrange
    await logAllBalances();

    await sendRefillSupplies(ether(1));
    await logAllBalances();

    await almostEmpty(accountTwo); // empty the account, so a refill will be needed
    await logAllBalances();

    // Act
    await coin.transfer(owner, 10, {from: accountTwo, gasPrice: reasonableGasPrice});

    // Assert
    await logAllBalances();
    for (let i = 0; i < 3; i++) { // some more transactions should be possible
      await coin.transfer(owner, 2, {from: accountTwo, gasPrice: reasonableGasPrice});
      await logAllBalances();
    }
  });

  // it("allows to send refill ether supplies to a contract", async () => {
  //   // Act
  //   await sendRefillSupplies(1); // 1 ETH

  //   // Assert
  //   let contractEtherSupply = (await web3.eth.getBalance(coin.address)).toNumber();
  //   assert.equal(contractEtherSupply, 1000000000000000000, "Contract cannot receive ether to refill supplies");
  // });

  // it("lets owner withdraw all exchanged tokens", async () => {
  //   // Arrange
  //   await sendRefillSupplies(1); // 1 ETH
  //   await almostEmpty(accountTwo);

  //   // Act
  //   await coin.transfer(accountTwo, 10, {from: owner});
  //   await coin.withdrawAllTokens({from: owner});

  //   // Assert
  //   let ownerBalance = await coin.balanceOf(owner);
  //   assert.equal(ownerBalance, 9999999891, "Owner should reclaim 1 token from contract's address");
  // });

  // it("takes some tokens from your first incoming transaction", async () => {
  //   // Arrange
  //   await sendRefillSupplies(1); // 1 ETH
  //   await almostEmpty(accountTwo);

  //   // Act
  //   await coin.transfer(accountTwo, 10, {from: owner});

  //   // Assert
  //   let balance = await coin.balanceOf(accountTwo);
  //   assert.equal(balance, 109, "You should get 9 tokens, plus 1 exchanged for ether");
  // });

  // it("allows transfers to account with no ether", async () => {
  //   // Arrange
  //   await sendRefillSupplies(1); // 1 ETH
  //   await almostEmpty(accountTwo);

  //   // Act
  //   await coin.transfer(accountTwo, 10, {from: owner});

  //   // Assert
  //   await logAllBalances();
  //   for (let i = 0; i < 4; i++) {
  //     await coin.transfer(owner, 1, {from: accountTwo, gasPrice: reasonableGasPrice});
  //     await logAllBalances();
  //   }
  // });

  // it("fail if contract has no ether to fill new accounts with gas", async () => {
  //   // Arrange
  //   await almostEmpty(accountTwo);

  //   // Act
  //   let __ = coin.transfer(accountTwo, 10, {from: owner});

  //   // Assert
  //   await shouldFail.reverting(__);
  // });


})
