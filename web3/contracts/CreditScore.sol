// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.24;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {IInputBox} from "@cartesi/rollups/contracts/inputs/IInputBox.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ICreditScore} from "./ICreditScore.sol";

contract CreditScore is ICreditScore, FunctionsClient, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    IInputBox inputBox;
    address public layer2DApp;
    address public chainlinkRouter;
    bytes32 public chainlinkDonID;
    uint64 public chainlinkSubscriptionId;
    uint32 public chainlinkGasLimit;
    string public requestSource;

    mapping(string => CreditScoreOutput) public lastCreditScore; // taxId -> CreditScoreOutput
    mapping(string => CreditScoreOutput[]) public allCreditScores; // taxId -> CreditScoreOutput[]
    mapping(bytes32 => CreditScoreInput) public chainlinkRequests; // requestId -> CreditScoreInput
    mapping(bytes32 => CreditScoreResponse) public chainlinkResponses; // requestId -> CreditScoreResponse

    constructor(
        bytes32 _chainlinkDonID,
        uint32 _chainlinkGasLimit,
        address _chainlinkRouter,
        address _inputBox
    ) Ownable(msg.sender) FunctionsClient(_chainlinkRouter) {
        chainlinkDonID = _chainlinkDonID;
        chainlinkGasLimit = _chainlinkGasLimit;
        chainlinkRouter = _chainlinkRouter;
        inputBox = IInputBox(_inputBox);
    }

    // view functions

    function getLastCreditScore(
        string memory _taxId
    ) public view returns (string memory, uint256, uint16, bool, string[] memory, uint256) {
        CreditScoreOutput memory output = lastCreditScore[_taxId];
        return (output.taxId, output.loanAmount, output.score, output.qualified, output.sources, output.timestamp);
    }

    // user functions

    function requestCreditScore(CreditScoreInput memory _input) external returns (bytes32 requestId) {
        if (bytes(requestSource).length == 0) revert RequestSourceNotSetError();

        string[] memory args = new string[](2);
        args[0] = _input.taxId;
        args[1] = Strings.toString(_input.loanAmount);

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(requestSource);
        if (args.length > 0) req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), chainlinkSubscriptionId, chainlinkGasLimit, chainlinkDonID);

        chainlinkRequests[requestId] = _input;

        emit CreditScoreRequested(_input.taxId, _input.loanAmount, requestId, block.timestamp);

        return requestId;
    }

    // chainlink functions

    function fulfillRequest(bytes32 _requestId, bytes memory _response, bytes memory _err) internal override {
        chainlinkResponses[_requestId] = CreditScoreResponse(_err, _response);
        CreditScoreInput memory input = chainlinkRequests[_requestId];

        if (_err.length > 0) {
            revert CreditScoreRequestError(input.taxId, input.loanAmount, _requestId);
        }

        bytes memory payload = abi.encode(input.taxId, input.loanAmount, _response);
        inputBox.addInput(layer2DApp, payload);
    }

    // dapp functions

    function storeCreditScore(CreditScoreOutput memory _result) external {
        if (msg.sender != layer2DApp) revert UpdateUnauthorizedError();

        lastCreditScore[_result.taxId] = _result;
        allCreditScores[_result.taxId].push(_result);

        emit CreditScoreStored(_result.taxId, _result.score, _result.qualified, _result.timestamp);
    }

    // owner functions

    function getLayer2DAppAddress() public view onlyOwner returns (address) {
        return layer2DApp;
    }

    function setLayer2DAppAddress(address _layer2DApp) public onlyOwner {
        layer2DApp = _layer2DApp;
    }

    function setRequestSource(string memory _requestSource) public onlyOwner {
        requestSource = _requestSource;
    }

    function setInputBoxAddress(address _inputBox) public onlyOwner {
        inputBox = IInputBox(_inputBox);
    }

    function setChainlinkParams(bytes32 _donID, uint64 _subscriptionId, uint32 _gasLimit) public onlyOwner {
        chainlinkDonID = _donID;
        chainlinkSubscriptionId = _subscriptionId;
        chainlinkGasLimit = _gasLimit;
    }
}
