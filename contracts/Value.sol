pragma solidity ^0.4.24;

contract Value {
	uint256 private value;

	function() public payable { // Contract can receive ether.
		value = 0;
	}

	function increaseValue() public {
		value = value + 1;
	}

	function getValue() public view returns (uint256) {
		return value;
	}
}
