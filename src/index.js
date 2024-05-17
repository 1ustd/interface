import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import store from "./store";
import {chainList} from './utils/config'


import "./asserts/css/tailwind.css";
import "./asserts/css/init.css";
import './config'

import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5/react";

// 1. Get projectId
const projectId = "454269b43ef322b9349e9336c5df2477";

// 2. Set chains
const networks = chainList

// 3. Create a metadata object
const metadata = {
  name: "oneU",
  description: "Win crypro lotteries with just One Usdt.",
  url: "https://1usdt.io", // origin must match your domain & subdomain
  icons: [""],
};

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: false, // true by default
  enableCoinbase: false
});

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: networks,
  projectId,
  allowUnsupportedChain: false,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  themeVariables: {
    "--w3m-font-family": "Poppins-Regular",
    "--w3m-font-size-master": "10px",
    "--w3m-z-index": 10000,
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
