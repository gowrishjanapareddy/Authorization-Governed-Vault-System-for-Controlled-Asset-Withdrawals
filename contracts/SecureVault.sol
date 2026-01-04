// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuthorizationManager {
    function verifyAuthorization(
        address vault,
        address recipient,
        uint256 amount,
        bytes32 nonce,
        bytes calldata signature
    ) external returns (bool);
}

contract SecureVault {
    IAuthorizationManager public authManager;
    bool private initialized;

    event Deposit(address indexed from, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount);

    function initialize(address _authManager) external {
        require(!initialized, "Already initialized");
        authManager = IAuthorizationManager(_authManager);
        initialized = true;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(
        address payable recipient,
        uint256 amount,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        require(address(this).balance >= amount, "Insufficient balance");

        bool ok = authManager.verifyAuthorization(
            address(this),
            recipient,
            amount,
            nonce,
            signature
        );
        require(ok, "Authorization failed");

        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawal(recipient, amount);
    }
}