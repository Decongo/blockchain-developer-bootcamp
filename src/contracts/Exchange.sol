// Deposit and withdraw funds
// Manage orders - make/cancel
// Handle trades - charge fees

// TODO:
// [X] Set fee account
// [X] Deposit Ether
// [X] Withdraw Ether
// [X] Deposit tokens
// [X] Withdraw tokens
// [X] Check balances
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
  event Withdraw(address token, address user, uint256 amount, uint256 balance);


  constructor(address _feeAccount, uint256 _feePercent) public {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  // Fallback: revert when Ether is sent to this smart contract by mistake
  function() external {
    revert();
  }

  function depositEther() public payable {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function withdrawEther(uint _amount) public {
    require(tokens[ETHER][msg.sender] >= _amount, 'insufficient balance; cannot withdraw Ether');
    // remove Ether from the exchange
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
    // send the withdrawn Ether back to the user
    msg.sender.transfer(_amount);
    // emit withdraw event
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint _amount) public {
    // Don't allow Ether deposits
    require(_token != ETHER, "cannot deposit Ether; requires tokens");
    // send tokens to contract
    require(Token(_token).transferFrom(msg.sender, address(this), _amount), "tokens were not deposited");
    // Token(_token) is a way to fetch a copy of the given token on the network

    // manage deposit - update balance
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);

    // emit event
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function withdrawToken(address _token, uint256 _amount) public {
    require(_token != ETHER, "cannot withdraw Ether; requires tokens");
    require(tokens[_token][msg.sender] >= _amount, 'insufficient balance; cannot withdraw tokens');

    tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
    require(Token(_token).transfer(msg.sender, _amount), 'token transfer failed');
    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function balanceOf(address _token, address _user) public view returns(uint256) {
    return tokens[_token][_user];
  }
}
