function token(state = {}, action) {
  switch (action.type) {
    case 'TOKEN_LOADED':
      return { ...state, loaded: true, contract: action.contract };
    case 'TOKEN_BALANCE_LOADED':
      return { ...state, balance: action.balance }
    default:
      return state;
  }
}

export default token;