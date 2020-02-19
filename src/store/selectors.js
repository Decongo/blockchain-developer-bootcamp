import { get, reject, groupBy, maxBy, minBy } from 'lodash';
import { createSelector } from 'reselect'
import moment from 'moment'
import { ETHER_ADDRESS, tokens, ether, GREEN, RED } from '../helpers.js'

const account = state => get(state, 'web3.account');
export const accountSelector = createSelector(account, a => a);

const tokenLoaded = state => get(state, 'token.loaded', false);
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl);

const exchangeLoaded = state => get(state, 'exchange.loaded', false);
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el);

const contractsLoaded = state => tokenLoaded(state) && exchangeLoaded(state);

const exchange = state => get(state, 'exchange.contract');
export const exchangeSelector = createSelector(exchange, e => e);

export const contractsLoadedSelector = createSelector(
  tokenLoaded, 
  exchangeLoaded, 
  (tl, el) => tl && el
);

// All orders
const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false);
const allOrders = state => get(state, 'exchange.allOrders.data', []);

// Cancelled orders
const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false);
export const cancelledOrdersLoadedSelector  = createSelector(cancelledOrdersLoaded, loaded => loaded);

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', []);
export const cancelledOrdersSelector  = createSelector(cancelledOrders, o => o);

// Filled orders
const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false);
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state => get(state, 'exchange.filledOrders.data', []);
export const filledOrdersSelector = createSelector(
  filledOrders,
  orders => {
    // sort orders by date ascending for price comparison
    orders = orders.sort((a, b) => a.timestamp - b.timestamp);

    // decorate the orders
    orders = decorateFilledOrders(orders);

    // sort orders by date descending for display
    orders = orders.sort((a, b) => b.timestamp - a.timestamp);
    console.log(orders);
    return orders;
  }
)

const decorateFilledOrders = orders => {
  // track previousOrder to compare history
  let previousOrder = orders[0];
  return (
    orders.map(order => {
      order = decorateOrder(order);
      order = decorateFilledOrder(order, previousOrder);
      previousOrder = order // update previous order once it's decorated
      return order;
    })
  )
}

const decorateOrder = order => {
  let etherAmount, tokenAmount;
  if (order.tokenGive == ETHER_ADDRESS) {
    etherAmount = order.amountGive;
    tokenAmount = order.amountGet;
  } else {
    etherAmount = order.amountGet;
    tokenAmount = order.amountGive;
  }

  // calculate token price to 5 decimal places
  const precision = 100000;
  let tokenPrice = etherAmount / tokenAmount;
  tokenPrice = Math.round(tokenPrice * precision) / precision;

  return ({
    ...order,
    etherAmount: ether(etherAmount),
    tokenAmount: tokens(tokenAmount),
    tokenPrice,
    formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D')
  })
}

const decorateFilledOrder = (order, previousOrder) => {
  return ({
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
  })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
  // show green price if only one order exists
  if (previousOrder.id === orderId) return GREEN;

  // show gree price if order price higher than previous order
  // show red price if order price lower that previous order
  if (previousOrder.tokenPrice <= tokenPrice) return GREEN; // success
  else return RED; // danger
}

const openOrders = state => {
  const all = allOrders(state);
  const cancelled = cancelledOrders(state);
  const filled = filledOrders(state);

  const openOrders = reject(all, order => {
    const orderCancelled = cancelled.some(o => o.id === order.id);
    const orderFilled = filled.some(o => o.id === order.id);
    return orderFilled || orderCancelled;
  });

  return openOrders;
}

const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state);
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded);


// create order book
export const orderBookSelector = createSelector(
  openOrders,
  orders => {
    // decorate orders
    orders = decorateOrderBookOrders(orders)
    // group oerders by "orderType"
    orders = groupBy(orders, 'orderType');
    // fetch buy orders
    const buyOrders = get(orders, 'buy', [])
    // sort buy orders by token price
    orders = {
      ...orders,
      buyOrders: buyOrders.sort((a, b) => b.tokenPrice = a.tokenPrice)
    }
    
    // fetch sell orders
    const sellOrders = get(orders, 'sell', [])
    // sort sell orders by token price
    orders = {
      ...orders,
      sellOrders: sellOrders.sort((a, b) => b.tokenPrice = a.tokenPrice)
    }
    return orders
  }

)

const decorateOrderBookOrders = orders => {
  return (
    orders.map(order => {
      order = decorateOrder(order);
      order = decorateOrderBookOrder(order);
      return order;
    })
  )
}

const decorateOrderBookOrder = order => {
  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell';
  return ({
    ...order,
    orderType,
    orderTypeClass: ( orderType === 'buy' ? GREEN : RED ),
    orderFIllClass: ( orderType === 'buy' ? 'sell' : 'buy' )
  });
}



/* 
* Filled Orders 
*/
export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded);

export const myFilledOrdersSelector = createSelector(
  account,
  filledOrders,
  (account, orders) => {
    // find our orders
    orders = orders.filter(o => o.user === account || o.userFill === account)
    // sort date ascending
    orders = orders.sort((a, b) => a.timestamp = b.timestamp);
    // decorate orders - add display attributes
    orders = decorateMyFilledOrders(orders, account);
    return orders;
  }
)

const decorateMyFilledOrders = (orders, account) => {
  return (
    orders.map(order => {
      order = decorateOrder(order);
      order = decorateMyFilledOrder(order, account);
      return order;
    })
  )
}

const decorateMyFilledOrder = (order, account) => {
  const myOrder = order.user === account;

  let orderType;
  if (myOrder) {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell';
  } else {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy';
  }

  return ({
    ...order, 
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderSign: (orderType === 'buy' ? '+' : '-')
  });
}


/* 
* Open orders
*/
export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded);

export const myOpenOrdersSelector = createSelector(
  account,
  openOrders,
  (account, orders) => {
    // Filter orders created by current account
    orders = orders.filter(o => o.user === account);
    // Decorate orders - add display attributes
    orders = decorateMyOpenOrders(orders);
    // Sort orders by date descending
    orders = orders.sort((a, b) => b.timestamp - a.timestamp);
    return orders;
  }
)

const decorateMyOpenOrders = (orders, account) => {
  return (
    orders.map(order => {
      order = decorateOrder(order);
      order = decorateMyOpenOrder(order, account);
      return order;
    })
  )
}

const decorateMyOpenOrder = (order, account) => {
  let orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell';

  return ({
    ...order, 
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED)
  })
}

/*
* Price Chart
*/
export const priceChartLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded);
export const priceChartSelector = createSelector(
  filledOrders,
  orders => {
    // Sort orders by date descending
    orders = orders.sort((a, b) => b.timestamp - a.timestamp);
    // Decorate orders - add display attributes
    orders = orders.map(o => decorateOrder(o));
    // Get last two orders for final price and price change
    let secondLastOrder, lastOrder;
    [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length);
    // Get last order price
    const lastPrice = get(lastOrder, 'tokenPrice', 0);
    // Get second last order price
    const secondLastPrice = get(secondLastPrice, 'tokenPrice', 0); 
    
    return ({
      lastPrice,
      lastPriceChange: lastPrice >= secondLastPrice ? '+' : '-',
      series: [{
        data: buildGraphData(orders)
      }]
    })
  }
)

const buildGraphData = orders => {
  // Group the orders by hour for the graph
  orders = groupBy(orders, o => moment.unix(o.timestamp).startOf('hour').format());
  // Get each hour where data exists
  const hours = Object.keys(orders);
  // Build the graph series
  const graphData = hours.map(hour => {
    // Fetch all the orders from current hour
    const group = orders[hour];
    // Calculate price values for open, high, low, and close
    const open = group[0];  // First order
    const high = maxBy(group, 'tokenPrice');  // High price
    const low = minBy(group, 'tokenPrice'); // Low price
    const closed = group[group.length - 1]  // Last order

    return ({
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, closed.tokenPrice, ]
    });
  });
  return graphData;
}

const orderCancelling = state => get(state, 'exchange.orderCancelling', false);
export const orderCancellingSelector = createSelector(orderCancelling, status => status);