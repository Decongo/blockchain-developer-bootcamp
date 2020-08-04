import React, { Component } from 'react';
import { connect } from 'react-redux'
import './App.css';
import Navbar from './Navbar'
import Content from './Content'
import { 
  loadWeb3, 
  loadAccount, 
  loadToken, 
  loadExchange 
} from '../store/interactions'
import { contractsLoadedSelector } from '../store/selectors'

class App extends Component {

  componentWillMount() {
    this.loadBlockchainData(this.props.dispatch);    
  }

  async loadBlockchainData(dispatch) {
    const web3 = loadWeb3(dispatch);
    console.log('web3 loaded');
    await window.ethereum.enable();
    let network = await web3.eth.net.getNetworkType();
    console.log('network:', network);
    const networkId = await web3.eth.net.getId();
    console.log('networkID:', networkId);
    
    await loadAccount(web3, dispatch);

    const token = await loadToken(web3, networkId, dispatch);

    if (!token) {
      window.alert('Token smart contract not deployed to the current network. Please select another network with Metamask');
    }
    const exchange = await loadExchange(web3, networkId, dispatch);
    if (!exchange) {
      window.alert('Exchange smart contract not deployed to the current network. Please select another network with Metamask');
    }
  }

  render() {
    return (
      <div className="App">
        <Navbar />
        { this.props.contractsLoaded ? <Content /> : <div className='content'></div> }
        
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App);
