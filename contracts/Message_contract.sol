// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Message Storage Contract for CryptoComm
/// @notice Handles secure storage and retrieval of both text and file messages between registered users.

contract MessageStorage {

    // Structure to represent each message
    struct Message {
        address sender;         // Message sender
        uint256 timestamp;      // When the message was sent
        string message;         // Encrypted text or IPFS link
        string msgType;         // "text" or "file"
    }

    // Reference to User Registration Contract
    address public userContractAddress;

    // Mapping to store all messages under a unique chat code
    mapping(bytes32 => Message[]) private allMessages;

    // Event to notify frontend when a new message is sent
    event MessageSent(
        address indexed from,
        address indexed to,
        bytes32 indexed chatCode,
        string message,
        string msgType,
        uint256 timestamp
    );

    /// @notice Constructor to set user contract address
    constructor(address _userContractAddress) {
        userContractAddress = _userContractAddress;
    }

    /// @notice Internal helper to generate unique chat code between two users
    /// @param pubkey1 Address of first user
    /// @param pubkey2 Address of second user
    /// @return bytes32 Unique chat identifier
    function _getChatCode(address pubkey1, address pubkey2)
        internal
        pure
        returns (bytes32)
    {
        // Ensure consistent order for chat pairing
        if (pubkey1 < pubkey2) {
            return keccak256(abi.encodePacked(pubkey1, pubkey2));
        } else {
            return keccak256(abi.encodePacked(pubkey2, pubkey1));
        }
    }

    /// @notice Send a message (text or file link) to a friend
    /// @param _friendKey Ethereum address of the recipient
    /// @param _msg Message content (text or IPFS URL)
    /// @param _msgType Type of message — "text" or "file"
    function sendMessage(
        address _friendKey,
        string memory _msg,
        string memory _msgType
    ) public {
        require(_friendKey != address(0), "Invalid recipient address!");
        require(bytes(_msg).length > 0, "Message cannot be empty!");
        require(
            keccak256(abi.encodePacked(_msgType)) == keccak256("text") ||
            keccak256(abi.encodePacked(_msgType)) == keccak256("file"),
            "Invalid message type!"
        );

        // Generate chat code for sender–receiver pair
        bytes32 chatCode = _getChatCode(msg.sender, _friendKey);

        // Create message struct
        Message memory newMsg = Message({
            sender: msg.sender,
            timestamp: block.timestamp,
            message: _msg,
            msgType: _msgType
        });

        // Store message under chat code
        allMessages[chatCode].push(newMsg);

        emit MessageSent(
            msg.sender,
            _friendKey,
            chatCode,
            _msg,
            _msgType,
            block.timestamp
        );
    }

    /// @notice Retrieve messages exchanged with a specific friend
    /// @param _friendKey Ethereum address of the friend
    /// @return Array of Message structs
    function readMessages(address _friendKey)
        public
        view
        returns (Message[] memory)
    {
        bytes32 chatCode = _getChatCode(msg.sender, _friendKey);
        return allMessages[chatCode];
    }

    /// @notice Get total number of messages in a chat
    /// @param _friendKey Ethereum address of the friend
    /// @return uint256 Message count
    function getMessageCount(address _friendKey)
        public
        view
        returns (uint256)
    {
        bytes32 chatCode = _getChatCode(msg.sender, _friendKey);
        return allMessages[chatCode].length;
    }

    /// @notice Get a single message by index (for pagination or debugging)
    /// @param _friendKey Ethereum address of the friend
    /// @param index Message index
    /// @return Message struct
    function getMessageByIndex(address _friendKey, uint256 index)
        public
        view
        returns (Message memory)
    {
        bytes32 chatCode = _getChatCode(msg.sender, _friendKey);
        require(index < allMessages[chatCode].length, "Index out of range");
        return allMessages[chatCode][index];
    }
}
