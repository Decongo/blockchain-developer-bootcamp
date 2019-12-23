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
  event Approval(address indexed owner, address indexed spender, uint256 value);

  // track balances
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;
  // send tokens

  constructor() public {
    totalSupply = 1000000 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }

  function transfer(address _to, uint256 _value) public returns(bool success) {
    require(balanceOf[msg.sender] >= _value, "value must be less-than or equal-to the total funds");
    _transfer(msg.sender, _to, _value);
    return true;
  }

  function _transfer(address _from, address _to, uint256 _value) internal {
    require(_to != address(0), "recipient must be a valid address");
    // decrease sender's balance
    balanceOf[_from] = balanceOf[_from].sub(_value);
    // increase receiver's balance
    balanceOf[_to] = balanceOf[_to].add(_value);
    emit Transfer(_from, _to, _value);
  }

  function approve(address _spender, uint256 _value) public returns(bool success) {
    require(_spender != address(0), "recipient must be a valid address");
    allowance[msg.sender][_spender] = _value;

    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns(bool success) {
    require(_value <= balanceOf[_from], "value must not be greater than balance");
    require(_value <= allowance[_from][msg.sender], "value must not be greater than allowance");
    allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
    _transfer(_from, _to, _value);
    return true;
  }
}