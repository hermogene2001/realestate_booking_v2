// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DAOGovernance
 * @dev DAO governance for platform decisions, voting, and treasury management
 */
contract DAOGovernance is Ownable {
    uint256 private _proposalIdCounter;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    struct Member {
        address wallet;
        uint256 votingPower;
        bool isActive;
        uint256 joinedAt;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => Member) public members;
    address[] public memberList;
    
    uint256 public votingPeriod = 7 days;
    uint256 public quorum = 10; // Minimum votes required
    uint256 public treasuryBalance;
    
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        string description
    );
    
    event VoteCast(
        uint256 proposalId,
        address voter,
        uint8 vote, // 0=against, 1=for, 2=abstain
        uint256 votingPower
    );
    
    event ProposalExecuted(uint256 proposalId);
    
    event MemberAdded(address wallet, uint256 votingPower);
    
    event TreasuryDeposit(address from, uint256 amount);
    event TreasuryWithdrawal(address to, uint256 amount, string purpose);
    
    modifier onlyMember() {
        require(members[msg.sender].isActive, "Not a DAO member");
        _;
    }
    
    modifier onlyActiveProposal(uint256 proposalId) {
        require(proposals[proposalId].id > 0, "Proposal does not exist");
        require(!proposals[proposalId].executed, "Proposal already executed");
        require(block.timestamp <= proposals[proposalId].endTime, "Voting period ended");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Deployer is initial member with high voting power
        _addMember(msg.sender, 100);
    }
    
    /**
     * @dev Add a new DAO member
     */
    function addMember(address wallet, uint256 votingPower) external onlyOwner {
        _addMember(wallet, votingPower);
    }
    
    /**
     * @dev Internal add member function
     */
    function _addMember(address wallet, uint256 votingPower) internal {
        require(!members[wallet].isActive, "Already a member");
        require(votingPower > 0, "Voting power must be > 0");
        
        members[wallet] = Member({
            wallet: wallet,
            votingPower: votingPower,
            isActive: true,
            joinedAt: block.timestamp
        });
        
        memberList.push(wallet);
        
        emit MemberAdded(wallet, votingPower);
    }
    
    /**
     * @dev Remove a DAO member
     */
    function removeMember(address wallet) external onlyOwner {
        require(members[wallet].isActive, "Not a member");
        members[wallet].isActive = false;
    }
    
    /**
     * @dev Create a new proposal
     */
    function createProposal(string memory description) external onlyMember returns (uint256) {
        _proposalIdCounter++;
        uint256 proposalId = _proposalIdCounter;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;
        proposal.executed = false;
        
        emit ProposalCreated(proposalId, msg.sender, description);
        
        return proposalId;
    }
    
    /**
     * @dev Vote on a proposal
     * @param proposalId Proposal ID
     * @param voteChoice 0=against, 1=for, 2=abstain
     */
    function vote(uint256 proposalId, uint8 voteChoice) external onlyMember onlyActiveProposal(proposalId) {
        require(voteChoice <= 2, "Invalid vote");
        require(!proposals[proposalId].hasVoted[msg.sender], "Already voted");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.hasVoted[msg.sender] = true;
        
        uint256 votingPower = members[msg.sender].votingPower;
        
        if (voteChoice == 0) {
            proposal.votesAgainst += votingPower;
        } else if (voteChoice == 1) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAbstain += votingPower;
        }
        
        emit VoteCast(proposalId, msg.sender, voteChoice, votingPower);
    }
    
    /**
     * @dev Execute a passed proposal
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id > 0, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
        require(totalVotes >= quorum, "Quorum not reached");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal did not pass");
        
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Deposit to treasury
     */
    function depositToTreasury() external payable {
        require(msg.value > 0, "Must deposit > 0");
        treasuryBalance += msg.value;
        
        emit TreasuryDeposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw from treasury (requires approved proposal)
     */
    function withdrawFromTreasury(
        address to,
        uint256 amount,
        string memory purpose
    ) external onlyOwner {
        require(amount <= treasuryBalance, "Insufficient treasury balance");
        
        treasuryBalance -= amount;
        payable(to).transfer(amount);
        
        emit TreasuryWithdrawal(to, amount, purpose);
    }
    
    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory description,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain,
        uint256 startTime,
        uint256 endTime,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id > 0, "Proposal does not exist");
        
        return (
            proposal.proposer,
            proposal.description,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.votesAbstain,
            proposal.startTime,
            proposal.endTime,
            proposal.executed
        );
    }
    
    /**
     * @dev Get member details
     */
    function getMember(address wallet) external view returns (
        uint256 votingPower,
        bool isActive,
        uint256 joinedAt
    ) {
        Member storage member = members[wallet];
        return (member.votingPower, member.isActive, member.joinedAt);
    }
    
    /**
     * @dev Get total members count
     */
    function getMemberCount() external view returns (uint256) {
        return memberList.length;
    }
    
    /**
     * @dev Update voting period
     */
    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod >= 1 days, "Minimum 1 day");
        votingPeriod = newPeriod;
    }
    
    /**
     * @dev Update quorum requirement
     */
    function setQuorum(uint256 newQuorum) external onlyOwner {
        quorum = newQuorum;
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {
        treasuryBalance += msg.value;
        emit TreasuryDeposit(msg.sender, msg.value);
    }
}
