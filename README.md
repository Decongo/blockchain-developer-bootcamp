# DecongoCoin Decentralized Exchange

## Overview

This project is an extension of the Dapp University Blockchain Developer Bootcamp capstone project. It exists for educational purposes only.

The DecongoCoin Decentralized Exchange (DC DEX) is exactly what it sounds like - a decentralized platform for trading DecongoCoin. 

DecongoCoin is a crypto currency built on the Ethereum platform. More technically, it is an ERC20 token. It holds no value, and most likely never will, since it exists only on the local machines of those who decide to build this project. To my knowledge, that is only me. It also exists on the Kovan Testnet, but again, I think that I'm the only person who has interacted with these smart contracts.

## Installation

### Ganache
Get it from the [website.](https://www.trufflesuite.com/ganache)

### Node.js
Get version 10.16.3 from the [website](https://nodejs.org/en/download/) or using your favorite package manager.

### Truffle
```
npm install -g truffle@5.1.65
```

### Clone this repository
```
git clone https://github.com/Decongo/blockchain-developer-bootcamp.git
```

### Install Dependencies
```
cd blockchain-developer-bootcamp
npm install
```

### Devtools
You can download the React and Redux devtools through your browser's extension manager. I like the extensions in Chrome and FireFox, so I recommend using either of those two browsers.

## Important Commands

### Test Smart Contract
```
truffle test
```

### Compile Smart Contract
```
truffle compile
```

### Pre-populate Contract Data
```
truffle exec scripts/seed-exchange.js
```

### Deploy Smart Contract to Ganache
```
truffle migrate --reset
```

### Run Development Server
```
npm run start
```

## Notes

I highly recommend that you use the versions of the following tools as listed below.

* Truffle version 5.1.65
* Solidity version 0.5.16
* Node version 10.16.3
* Web3.js version 1.2.9

I have experienced compatibility issues in the past due to updates to Truffle and Node, so be aware of that.

