// Deposit and withdraw funds
// Manage orders - make/cancel
// Handle trades - charge fees

// TODO:
// [X] Set fee account
// [X] Deposit Ether
// [ ] Withdraw Ether
// [X] Deposit tokens
// [ ] Withdraw tokens
// [ ] Check balances
// [ ] Make order
// [ ] Cancel order
// [ ] Fill order
// [ ] Charge fees


pragma solidity ^0.5.0;

import "./Token.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Exchange {
  using SafeMath for uint;

  address public feeAccount; // the account that receives exchange fees
  uint256 public feePercent; // fee percentage
  address constant ETHER = address(0); // store ether in tokens mapping with blank address
  mapping(address => mapping(address => uint256)) public tokens;

  event Deposit(address token, address user, uint256 amount, uint256 balance);

  constructor(address _feeAccount, uint256 _feePercent) public {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  // Fallback: revert when Ether is sent to this smart contract by mistake
  function() external {
    revert();
  }

  function depositEther() payable public {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint _amount) public {
    // Don't allow Ether deposits
    require(_token != ETHER);
    // send tokens to contract
    require(Token(_token).transferFrom(msg.sender, address(this), _amount), "tokens were not deposited");
    // Token(_token) is a way to fetch a copy of the given token on the network

    // manage deposit - update balance
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);

    // emit event
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }
  
}
