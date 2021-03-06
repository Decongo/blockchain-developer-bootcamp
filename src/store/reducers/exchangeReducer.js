import { calculateNewBalance } from '../../helpers.js'


function exchange(state = {}, action) {
  let index, data;
  switch (action.type) {
    case 'EXCHANGE_LOADED':
      return { ...state, loaded: true, contract: action.contract };
    case 'CANCELLED_ORDERS_LOADED':
      return { ...state, cancelledOrders: { loaded: true, data: action.cancelledOrders } };
    case 'FILLED_ORDERS_LOADED':
      return { ...state, filledOrders: { loaded: true, data: action.filledOrders } };
    case 'ALL_ORDERS_LOADED':
      return { ...state, allOrders: { loaded: true, data: action.allOrders } };

    case 'ORDER_CANCELLING':
      return { ...state, orderCancelling: true };
    case 'ORDER_CANCELLED':
      return {
        ...state,
        orderCancelling: false,
        cancelledOrders: {
          ...state.cancelledOrders,
          data: [
            ...state.cancelledOrders.data,
            action.order
          ]
        }
      }

    case 'ORDER_FILLING':
      return { ...state, orderFilling: true };
    case 'ORDER_FILLED':
      // prevent duplicate orders
      index = state.filledOrders.data.findIndex(order => order.id === action.order.id);
      if (index === -1) {
        data = [ ...state.filledOrders.data, action.order ]
      } else {
        data = state.filledOrders.data;
      }
      return {
        ...state,
        orderFilling: false,
        filledOrders: {
          ...state.filledOrders,
          data
        }
      };

    case 'BALANCES_LOADING':
      return { ...state, balancesLoading: true };
    case 'BALANCES_LOADED':
      return { ...state, balancesLoading: false };
    case 'EXCHANGE_ETHER_BALANCE_LOADED':
      return { ...state, etherBalance: action.balance };
    case 'EXCHANGE_TOKEN_BALANCE_LOADED':
      return { ...state, tokenBalance: action.balance };

    case 'ETHER_DEPOSIT_AMOUNT_CHANGED':
      return isNaN(Number(action.amount)) ? state : { ...state, etherDepositAmount: action.amount };
    case 'ETHER_WITHDRAW_AMOUNT_CHANGED':
      return isNaN(Number(action.amount)) ? state : { ...state, etherWithdrawAmount: action.amount };
    case 'TOKEN_DEPOSIT_AMOUNT_CHANGED':
      return isNaN(Number(action.amount)) ? state : { ...state, tokenDepositAmount: action.amount };
    case 'TOKEN_WITHDRAW_AMOUNT_CHANGED':
      return isNaN(Number(action.amount)) ? state : { ...state, tokenWithdrawAmount: action.amount };
      
    case 'BUY_ORDER_AMOUNT_CHANGED':
      return { ...state, buyOrder: { ...state.buyOrder, amount: action.amount } };
    case 'BUY_ORDER_PRICE_CHANGED':
      return { ...state, buyOrder: { ...state.buyOrder, price: action.price } };
    case 'BUY_ORDER_MAKING':
      return { ...state, buyOrder: { ...state.buyOrder, amount: null, price: null, making: true } };
    case 'ORDER_MADE':
      // Prevent duplicate orders
      index = state.allOrders.data.findIndex(order => order.id === action.order.id);
      if (index === -1) data = [...state.allOrders.data, action.order];
      else data = state.allOrders.data;

      return {
        ...state,
        allOrders: {
          ...state.allOrders,
          data
        },
        buyOrder: {
          ...state.buyOrder,
          making: false
        },
        sellOrder: {
          ...state.sellOrder,
          making: false
        }
      }
    case 'SELL_ORDER_AMOUNT_CHANGED':
      return { ...state, sellOrder: { ...state.sellOrder, amount: action.amount } };
    case 'SELL_ORDER_PRICE_CHANGED':
      return { ...state, sellOrder: { ...state.sellOrder, price: action.price } };
    case 'SELL_ORDER_MAKING':
      return { ...state, sellOrder: { ...state.sellOrder, amount: null, price: null, making: true } };
      
    case 'ETHER_DEPOSITED':
      return { ...state, etherBalance: calculateNewBalance(state.etherBalance, action.amount, 'add') };
    case 'ETHER_WITHDRAWN':
      return { ...state, etherBalance: calculateNewBalance(state.etherBalance, action.amount, 'sub') };
    case 'TOKEN_DEPOSITED':
      return { ...state, tokenBalance: calculateNewBalance(state.tokenBalance, action.amount, 'add') };
    case 'TOKEN_WITHDRAWN':
      return { ...state, tokenBalance: calculateNewBalance(state.tokenBalance, action.amount, 'sub') };
    default:
      return state;
  }
}

export default exchange;