// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";


contract AuthorizationManager {
    using ECDSA for bytes32;

    mapping(bytes32 => bool) public usedAuth;

    address public signer;
    uint256 public chainId;
    bool private initialized;

    event AuthorizationConsumed(bytes32 authId);

    function initialize(address _signer) external {
        require(!initialized, "Already initialized");
        signer = _signer;
        chainId = block.chainid;
        initialized = true;
    }

    function verifyAuthorization(
        address vault,
        address recipient,
        uint256 amount,
        bytes32 nonce,
        bytes calldata signature
    ) external returns (bool) {

        bytes32 authId = keccak256(
            abi.encodePacked(vault, recipient, amount, nonce, chainId)
        );

        require(!usedAuth[authId], "Authorization already used");

        bytes32 message = MessageHashUtils.toEthSignedMessageHash(authId);
        address recovered = ECDSA.recover(message, signature);

        require(recovered == signer, "Invalid signature");

        usedAuth[authId] = true;
        emit AuthorizationConsumed(authId);
        return true;
    }
}