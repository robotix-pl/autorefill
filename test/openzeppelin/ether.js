function ether (n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'));
}

function gwei (n) {
  return new web3.BigNumber(web3.toWei(n, 'gwei'));
}

function weiToEther (n) {
  return new web3.BigNumber(web3.fromWei(n, 'ether'));
}

function weiToGwei (n) {
  return new web3.BigNumber(web3.fromWei(n, 'gwei'));
}

module.exports = {
  ether, gwei, weiToEther, weiToGwei
};
