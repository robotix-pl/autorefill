var Test = artifacts.require("./Test.sol");
var Value = artifacts.require("./Value.sol");

module.exports = function(deployer) {
  deployer.deploy(Test);
  deployer.deploy(Value);
};
