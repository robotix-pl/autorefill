let Test = artifacts.require("Test");

// Run other unit tests to populate my contract
// ...
// ...

// getGasPrice returns the gas price on the current network
Test.web3.eth.getGasPrice(function(error, result){
    let gasPrice = Number(result);
    console.log("Gas Price is " + gasPrice + " wei"); // "10000000000000"
    
    // Get Contract instance
    Test.deployed().then(function(instance) {
        console.log("aa");
        // Use the keyword 'estimateGas' after the function name to get the gas estimation for this particular function 
        return instance.set.estimateGas(1);
        
    }).then(function(result) {
        let gas = Number(result);
        console.log("gas estimation = " + gas + " units");
        console.log("gas cost estimation = " + (gas * gasPrice) + " wei");
        console.log("gas cost estimation = " + Test.web3.fromWei((gas * gasPrice), 'ether') + " ether");
    });
});


