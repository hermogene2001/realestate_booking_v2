// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationScore is Ownable {
    struct Reputation {
        uint256 totalScore;
        uint256 count;
        uint256 average; // scaled by 100 (e.g. 450 = 4.50)
        uint256 lastUpdated;
    }

    struct Attestation {
        address subject;
        address attester;
        uint8 score; // 1-5
        string comment;
        uint256 timestamp;
    }

    mapping(address => Reputation) public reputations;
    mapping(address => Attestation[]) public attestations;
    address[] public userList;

    event ReputationUpdated(address indexed user, uint256 newAverage, uint256 totalCount);
    event AttestationCreated(address indexed subject, address indexed attester, uint8 score);

    constructor() Ownable(msg.sender) {}

    function submitAttestation(
        address subject,
        uint8 score,
        string calldata comment
    ) external {
        require(subject != address(0), "Invalid subject");
        require(subject != msg.sender, "Cannot self-attest");
        require(score >= 1 && score <= 5, "Score must be 1-5");

        if (reputations[subject].count == 0) {
            userList.push(subject);
        }

        Reputation storage rep = reputations[subject];
        rep.totalScore += score;
        rep.count += 1;
        rep.average = (rep.totalScore * 100) / rep.count;
        rep.lastUpdated = block.timestamp;

        attestations[subject].push(Attestation({
            subject: subject,
            attester: msg.sender,
            score: score,
            comment: comment,
            timestamp: block.timestamp
        }));

        emit ReputationUpdated(subject, rep.average, rep.count);
        emit AttestationCreated(subject, msg.sender, score);
    }

    function batchAttestations(
        address[] calldata subjects,
        uint8[] calldata scores,
        string[] calldata comments
    ) external onlyOwner {
        require(subjects.length == scores.length && scores.length == comments.length, "Length mismatch");
        for (uint256 i = 0; i < subjects.length; i++) {
            this.submitAttestation(subjects[i], scores[i], comments[i]);
        }
    }

    function getReputation(address user) external view returns (Reputation memory) {
        return reputations[user];
    }

    function getAttestationCount(address user) external view returns (uint256) {
        return attestations[user].length;
    }

    function getAttestations(address user) external view returns (Attestation[] memory) {
        return attestations[user];
    }

    function getUserCount() external view returns (uint256) {
        return userList.length;
    }
}
