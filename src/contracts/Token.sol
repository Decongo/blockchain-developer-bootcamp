pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Token {
  using SafeMath for uint;
  
  // Variables
  string public name = "DApp Token";
  string public symbol = "DApp";
  uint256 public decimals = 18;
  uint256 public totalSupply;

  // Events
  // `indexed` keyword causes us to only listen for events that have to do with us
  event Transfer(address indexed from, address indexed to, uint256 value);


  // track balances
  mapping(address => uint256) public balanceOf;
  // send tokens

  constructor() public {
    totalSupply = 1000000 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }

  function transfer(address _to, uint256 _value) public returns(bool success) {
    require(_to != address(0), "recipient must be a valid address");
    require(balanceOf[msg.sender] >= _value, "value must be less-than or equal-to the total funds");
    // decrease sender's balance
    balanceOf[msg.sender] = balanceOf[msg.sender].sub(_value);
    // increase receiver's balance
    balanceOf[_to] = balanceOf[_to].add(_value);

  emit Transfer(msg.sender, _to, _value);
    return true;
  }

}