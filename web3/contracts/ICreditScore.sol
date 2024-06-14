// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.24;

interface ICreditScore {
    struct CreditScoreInput {
        string taxId;
        uint256 loanAmount;
    }

    struct CreditScoreOutput {
        string taxId;
        uint256 loanAmount;
        uint16 score;
        bool qualified;
        string[] sources;
        uint256 timestamp;
    }

    error RequestSourceNotSetError();
    error CreditScoreRequestError(string taxId, uint256 loanAmount, bytes32 requestId);
    error UpdateUnauthorizedError();

    event CreditScoreRequested(
        string indexed taxId,
        uint256 indexed loanAmount,
        bytes32 indexed requestId,
        uint256 timestamp
    );
    event CreditScoreStored(string indexed taxId, uint16 indexed score, bool indexed qualified, uint256 timestamp);
}
