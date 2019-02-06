let Value = artifacts.require("Value");
let Test = artifacts.require("Test");
let solc = require('solc');

module.exports = function(callback) {

    Value.web3.eth.getGasPrice(function(error, result){
        let gasPrice = Number(result);
        console.log("--------------------");
        console.log("Gas Price is " + gasPrice + " wei"); // "10000000000000"

        // Get Contract instance
        Value.deployed().then(function(instance) {
            // Use the keyword 'estimateGas' after the function name to get the gas estimation for this particular function

            //return instance.increaseValue.estimateGas();
            return instance.getValue.estimateGas();

        }).then(function(result) {
            let gas = Number(result);
            console.log("gas estimation = " + gas + " units");
            console.log("gas cost estimation = " + (gas * gasPrice) + " wei");
            console.log("gas cost estimation = " + Value.web3.fromWei((gas * gasPrice), 'ether') + " ether");
        });
    });

};


