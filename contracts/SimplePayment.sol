// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract SimplePayment {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function sendPayment(address payable recipient) public payable {
        require(msg.value > 0, "You must send some Ether.");
        recipient.transfer(msg.value);
    }

    function balanceOf() public view returns (uint) {
        return address(this).balance;
    }
}
