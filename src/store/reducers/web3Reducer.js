import { calculateNewBalance } from '../../helpers.js'


function web3(state = {}, action) {
  switch (action.type) {
    case 'WEB3_LOADED':
      return { ...state, connection: action.connection };
    case 'WEB3_ACCOUNT_LOADED':
      return { ...state, account: action.account };
    case 'ETHER_BALANCE_LOADED':
      return { ...state, balance: action.balance };
    case 'METAMASK_FOUND':
      return { ...state, metaMaskFound: action.value };
    case 'ETHER_DEPOSITED':
      return { ...state, balance: calculateNewBalance(state.balance, action.amount, 'sub') }
    case 'ETHER_WITHDRAWN':
      return { ...state, balance: calculateNewBalance(state.balance, action.amount, 'add') }
    default:
      return state;
  }
}

export default web3;