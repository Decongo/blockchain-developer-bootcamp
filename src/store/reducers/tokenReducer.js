import { calculateNewBalance } from '../../helpers.js'


function token(state = {}, action) {
  switch (action.type) {
    case 'TOKEN_LOADED':
      return { ...state, loaded: true, contract: action.contract };
    case 'TOKEN_BALANCE_LOADED':
      return { ...state, balance: action.balance }
    case 'TOKEN_DEPOSITED':
      return { ...state, balance: calculateNewBalance(state.balance, action.amount, 'sub') }
    case 'TOKEN_WITHDRAWN':
      return { ...state, balance: calculateNewBalance(state.balance, action.amount) }
    default:
      return state;
  }
}


export default token;