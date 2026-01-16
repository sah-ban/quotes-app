// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Quotes is Ownable, EIP712 {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidSignature();
    error CooldownActive();
    error InsufficientContractBalance();

    /*//////////////////////////////////////////////////////////////
                              STORAGE
    //////////////////////////////////////////////////////////////*/

    IERC20 public immutable token;
    address public immutable SIGNER;

    uint256 public cooldownHours = 12;

    // FID => last claim timestamp
    mapping(uint256 => uint256) public lastFidClaimTimestamp;

    // FID => nonce
    mapping(uint256 => uint256) public fidNonces;

    /*//////////////////////////////////////////////////////////////
                              EIP-712
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant CLAIM_TYPEHASH =
        keccak256(
            "Claim(address user,uint256 fid,uint256 nonce,uint256 amount)"
        );

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Claimed(address indexed user, uint256 indexed fid, uint256 amount);
    event TokensDeposited(address indexed sender, uint256 amount);
    event CooldownUpdated(uint256 newCooldownHours);
    event Withdrawn(address indexed owner, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _token,
        address _signer
    ) Ownable(msg.sender) EIP712("Quotes", "1") {
        require(_token != address(0), "Invalid token");
        require(_signer != address(0), "Invalid signer");

        token = IERC20(_token);
        SIGNER = _signer;
    }

    /*//////////////////////////////////////////////////////////////
                              CLAIM LOGIC
    //////////////////////////////////////////////////////////////*/

    function claim(
        uint256 fid,
        uint256 amount,
        bytes calldata signature
    ) external {
        uint256 lastClaim = lastFidClaimTimestamp[fid];

        if (lastClaim != 0) {
            if (
                block.timestamp <
                lastClaim + (cooldownHours * 1 hours)
            ) {
                revert CooldownActive();
            }
        }

        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                msg.sender,
                fid,
                fidNonces[fid],
                amount
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = ECDSA.recover(digest, signature);

        if (recoveredSigner != SIGNER) {
            revert InvalidSignature();
        }

        if (token.balanceOf(address(this)) < amount) {
            revert InsufficientContractBalance();
        }

        // Effects
        fidNonces[fid]++;
        lastFidClaimTimestamp[fid] = block.timestamp;

        // Interaction
        token.safeTransfer(msg.sender, amount);

        emit Claimed(msg.sender, fid, amount);
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function updateCooldown(uint256 _hours) external onlyOwner {
        cooldownHours = _hours;
        emit CooldownUpdated(_hours);
    }

    function withdrawAll() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens");

        token.safeTransfer(owner(), balance);
        emit Withdrawn(owner(), balance);
    }

    /*//////////////////////////////////////////////////////////////
                          TOKEN MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function depositTokens(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                              VIEWS
    //////////////////////////////////////////////////////////////*/

    function getCooldownRemaining(uint256 fid)
        external
        view
        returns (uint256)
    {
        uint256 lastClaim = lastFidClaimTimestamp[fid];

        if (lastClaim == 0) return 0;

        uint256 cooldownEnd = lastClaim + (cooldownHours * 1 hours);

        if (block.timestamp >= cooldownEnd) return 0;

        return cooldownEnd - block.timestamp;
    }

    function getStructHash(
        address user,
        uint256 fid,
        uint256 amount
    ) external view returns (bytes32) {
        return keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                user,
                fid,
                fidNonces[fid],
                amount
            )
        );
    }

    function getContractTokenBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
