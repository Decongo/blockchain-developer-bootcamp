import { combineReducers } from 'redux'
import web3 from './web3Reducer.js'
import token from './tokenReducer.js'
import exchange from './exchangeReducer.js'

const rootReducer = combineReducers({
  web3,
  token,
  exchange
});

export default rootReducer;