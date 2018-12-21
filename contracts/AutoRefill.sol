pragma solidity ^0.4.24;

import "./openzeppelin/Ownable.sol";
import "./openzeppelin/ERC20.sol";

contract AutoRefill is Ownable, ERC20 {

	uint256 public priceInWei;

	uint256 public minWei;

    event ARLog_(uint8 number);
    event ARLogT(uint8 number, uint256 tokens);
    event ARLogE(uint8 number, uint256 _ether);

	/**
	 * Remember to run this frequently to update price. Especially shortly after ICO.
	 */
	function setPriceInWei(uint256 tokenPriceInWei) public onlyOwner {
        priceInWei = tokenPriceInWei;
    }

	function setMinimumBalanceInFinney(uint256 minimumBalanceInFinney) public onlyOwner {
		minWei = minimumBalanceInFinney.mul(1 finney);
	}

	/**
	 * Fallback function. Contract can receive ether.
	 */
	function() public payable { }

	function withdrawAllTokens() public onlyOwner {
		_transfer(address(this), msg.sender, balanceOf(address(this)));
	}

	// override
	function transfer(address to, uint256 value) public returns (bool) {
		require(balanceOf(msg.sender) >= value, "Not enough funds.");
		emit ARLog_(1);

		uint256 sentToContract = _autoRefill(to, value);
		emit ARLogT(2, sentToContract);
		return super.transfer(to, value.sub(sentToContract)); // send tokens
	}

	function _autoRefill(address to, uint256 sentValue) internal returns (uint256 sendToContract) {

		if (to.balance < minWei) {
			emit ARLogE(3, to.balance);
			sendToContract = _amountToSellForRefill(to.balance);
			emit ARLogT(4, sendToContract);
			require(sentValue > sendToContract, "Transfer too small to refill receipient's gas account.");
			emit ARLog_(5);

			_transfer(msg.sender, address(this), sendToContract); // send tokens to contract
			emit ARLog_(6);
			to.transfer(sendToContract.mul(priceInWei)); // send ether from contract instead tokens from sender
		}

		if (msg.sender.balance < minWei) {
			emit ARLogE(7, msg.sender.balance);
			_exchangeForEther(_amountToSellForRefill(msg.sender.balance));
		}
	}

	function _exchangeForEther(uint256 tokenAmount) internal {
		require(balanceOf(msg.sender) >= tokenAmount, "Not enough funds to pay for transaction.");
		emit ARLogT(8, balanceOf(msg.sender));

		_transfer(msg.sender, address(this), tokenAmount);
		emit ARLog_(9);

		msg.sender.transfer(tokenAmount.mul(priceInWei)); // sends ether to the seller from contract's address: it's important to do this last to prevent recursion attacks
	}

	function _amountToSellForRefill(uint256 balance) internal view returns (uint256 amount) {
		// amount = (minWei - balance) / priceInWei + 1;
		amount = minWei.sub(balance).div(priceInWei).add(1);
	}

}
