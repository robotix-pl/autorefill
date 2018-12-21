pragma solidity ^0.4.24;

import "./AutoRefill.sol";

contract AutoRefillMock is AutoRefill {

    constructor (uint256 initialBalance, uint256 tokenPriceInWei) public {
        _mint(msg.sender, initialBalance);

		setPriceInWei(tokenPriceInWei);
		minWei = 5 finney; /* 5 000 000 000 000 000 = 5 finney */
    }

}
