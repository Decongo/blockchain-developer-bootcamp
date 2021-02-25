/* This file contains everything that interacts with the blockchain */
import { 
  web3Loaded,
  web3AccountLoaded,
  tokenLoaded,
  exchangeLoaded,
  cancelledOrdersLoaded,
  filledOrdersLoaded,
  allOrdersLoaded,
  orderCancelling,
  orderCancelled,
  orderFilling,
  orderFilled,
  etherBalanceLoaded,
  tokenBalanceLoaded,
  exchangeEtherBalanceLoaded,
  exchangeTokenBalanceLoaded,
  balancesLoaded,
  balancesLoading,
  buyOrderMaking,
  sellOrderMaking,
  orderMade,
  etherDeposited,
  etherWithdrawn,
  tokenDeposited,
  tokenWithdrawn
} from './actions'
import Web3 from 'web3'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import { ETHER_ADDRESS } from '../helpers'


export const loadWeb3 = (dispatch) => {
  const web3 = new Web3(Web3.givenProvider || 'http://localhost:7575');
  dispatch(web3Loaded(web3));
  return web3;
}

export const loadAccount = async (web3, dispatch) => {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  dispatch(web3AccountLoaded(account));
  return account;
}

export const loadToken = async (web3, networkId, dispatch) => {
  try {
    const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address);
    dispatch(tokenLoaded(token));
    return token;
  }
  catch (error) {
    return console.error('Error loading token contract:', error);
  }
}

export const loadExchange = async (web3, networkId, dispatch) => {
  try {
    const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address);
    dispatch(exchangeLoaded(exchange));
    return exchange;
  }
  catch (error) {
    return null;
  }
}

export const loadAllOrders = async (exchange, dispatch) => {
  // fetch cancelled orders with "Cancel" event stream
  const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest' });
  // format cancelled orders
  const cancelledOrders = cancelStream.map(event => event.returnValues);
  // add cancelled orders to redux store
  dispatch(cancelledOrdersLoaded(cancelledOrders));

  // fetch filled orders with the "Trade" event stream
  const tradeStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest' });
  // format filled orders
  const filledOrders = tradeStream.map(event => event.returnValues);
  // add filled orders to redux state
  dispatch(filledOrdersLoaded(filledOrders));

  // fetch all orders with "Cancel" event stream
  const orderStream = await exchange.getPastEvents('Order', { fromBlock: 0, toBlock: 'latest' });
  // format all orders
  const allOrders = orderStream.map(event => event.returnValues);
  // add all orders to redux store
  dispatch(allOrdersLoaded(allOrders));
}

export const cancelOrder = (dispatch, exchange, order, account) => {
  exchange.methods.cancelOrder(order.id).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(orderCancelling())
    })
    .on('error', error => {
      console.log(error);
      window.alert('There was an error.');
    })
}

// Determines what actions to take when events are emiited from the smart contract
export const subscribeToEvents = async (exchange, dispatch) => {
  exchange.events.Cancel({}, (error, event) => {
    dispatch(orderCancelled(event.returnValues))
  });

  exchange.events.Trade({}, (error, event) => {
    dispatch(orderFilled(event.returnValues))
  });

  exchange.events.Deposit({}, (error, event) => {
    dispatch(balancesLoaded());
  });

  exchange.events.Withdraw({}, (error, event) => {
    dispatch(balancesLoaded());
  });

  exchange.events.Order({}, (error, event) => {
    dispatch(orderMade(event.returnValues));
  });
}

export const fillOrder = (dispatch, exchange, order, account) => {
  exchange.methods.fillOrder(order.id).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(orderFilling())
    })
    .on('error', error => {
      console.log(error);
      window.alert('There was an error.');
    })
}

export const loadBalances = async (dispatch, web3, exchange, token, account) => {
  // Ether balance in wallet
  const etherBalance = await web3.eth.getBalance(account);
  dispatch(etherBalanceLoaded(etherBalance));

  // Token balance in wallet
  const tokenBalance = await token.methods.balanceOf(account).call();
  dispatch(tokenBalanceLoaded(tokenBalance));

  // Ether balance in exchange
  const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call();
  dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance));

   // Token balance in exchange
   const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call();
   dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance));

   // Trigger all balances loaded
   dispatch(balancesLoaded());
}

export const depositEther = (dispatch, exchange, web3, amount, account) => {
  const amountInWei = web3.utils.toWei(amount, 'ether');
  exchange.methods.depositEther().send({ from: account, value: amountInWei })
    .on('transactionHash', hash => {
      dispatch(balancesLoading());
      dispatch(etherDeposited(amountInWei));
    })
    .on('error', error => {
      console.log(error);
      window.alert('There was an error.');
    })
}

export const withdrawEther = (dispatch, exchange, web3, amount, account) => {
  const amountInWei = web3.utils.toWei(amount, 'ether');
  exchange.methods.withdrawEther(amountInWei).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(balancesLoading())
      dispatch(etherWithdrawn(amountInWei))
    })
    .on('error', error => {
      console.log(error);
      window.alert('There was an error.');
    });
}

export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
  const amountInWei = web3.utils.toWei(amount, 'ether');

  token.methods.approve(exchange.options.address, amountInWei).send({ from: account })
    .on('transactionHash', hash => {
      exchange.methods.depositToken(token.options.address, amountInWei).send({ from: account })
        .on('transactionHash', hash => {
          dispatch(balancesLoading());
          dispatch(tokenDeposited(amountInWei));
        })
    })
    .on('error', error => {
      console.error(error);
      window.alert('There was an error.');
    })
}

export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
  const amountInWei = web3.utils.toWei(amount, 'ether');

  exchange.methods.withdrawToken(token.options.address, amountInWei).send({ from: account })
    .on('transactionHash', hash => {
      dispatch(balancesLoading());
      dispatch(tokenWithdrawn(amountInWei));
    })
    .on('error', error => {
      console.error(error);
      window.alert('There was an error.');
    })
}

export const makeBuyOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = token.options.address;
  const amountGet = web3.utils.toWei(order.amount, 'ether');
  const tokenGive = ETHER_ADDRESS;
  const amountGive = web3.utils.toWei((order.amount * order.price).toString(), 'ether')

  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
    .on('transactionHash', (hash) => {
      dispatch(buyOrderMaking())
    })
    .on('error', (error) => {
      console.error(error);
      window.alert('There was an error!');
    })
}

export const makeSellOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = ETHER_ADDRESS;
  const amountGet = web3.utils.toWei((order.amount * order.price).toString(), 'ether');
  const tokenGive = token.options.address;
  const amountGive = web3.utils.toWei(order.amount, 'ether')

  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
    .on('transactionHash', (hash) => {
      dispatch(sellOrderMaking())
    })
    .on('error', (error) => {
      console.error(error);
      window.alert('There was an error!');
    })
}