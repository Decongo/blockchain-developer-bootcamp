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
// [X] Make order
// [X] Cancel order
// [X] Fill order
// [X] Charge fees


pragma solidity ^0.5.0;

import "./Token.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Exchange {
  using SafeMath for uint256;

  address public feeAccount; // the account that receives exchange fees
  uint256 public feePercent; // fee percentage
  address constant ETHER = address(0); // store ether in tokens mapping with blank address
  mapping(address => mapping(address => uint256)) public tokens;
  mapping(uint256 => _Order) public orders;
  uint256 public orderCount;
  mapping(uint256 => bool) public orderCancelled;
  mapping(uint256 => bool) public orderFilled;

  event Deposit(address token, address user, uint256 amount, uint256 balance);
  event Withdraw(address token, address user, uint256 amount, uint256 balance);
  event Order(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
  event Cancel(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
  event Trade(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address userFill, uint256 timestamp);


  struct _Order {
    uint256 id;
    address user;
    address tokenGet;
    uint256 amountGet;
    address tokenGive;
    uint256 amountGive;
    uint256 timestamp;
  }

  constructor(address _feeAccount, uint256 _feePercent) public {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  // Fallback: revert when Ether is sent to this smart contract by mistake
  function() external {
    revert('ether was sent by mistake');
  }

  function depositEther() public payable {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function withdrawEther(uint256 _amount) public {
    require(tokens[ETHER][msg.sender] >= _amount, 'insufficient balance; cannot withdraw Ether');
    // remove Ether from the exchange
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
    // send the withdrawn Ether back to the user
    msg.sender.transfer(_amount);
    // emit withdraw event
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint256 _amount) public {
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

  function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
    orderCount = orderCount.add(1);
    orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
  }

  function cancelOrder(uint256 _id) public {
    _Order storage _order = orders[_id];
    // must be "my" order
    require(address(_order.user) == msg.sender, 'cancellor does not match order\'s creator');
    // must be a valid order
    require(_order.id == _id, 'order does not exist');
    orderCancelled[_id] = true;
    emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, _order.timestamp);
  }

  function fillOrder(uint256 _id) public {
    require(_id > 0 && _id <= orderCount, 'invalid id');
    require(!orderFilled[_id], 'order has already been filled');
    require(!orderCancelled[_id], 'order has already been cancelled');

    _Order storage _order = orders[_id];
    // Fetch order
    _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
    // mark as filled
    orderFilled[_order.id] = true;

  }

  function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
    // fee paid by the user that fills the order, e.i. msg.sender
    // fee is deducted from _amountGet
    uint256 _feeAmount = _amountGive.mul(feePercent).div(100);

    // execute trade
    tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
    tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
    tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);
    tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
    tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);

    emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
  }
}
