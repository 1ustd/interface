import Header from "./components/header";
import React, { useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lottery from "./pages/Lottery";
import Referral from "./pages/Referral";
import Tutorials from "./pages/Tutorials";
import Discord from "./pages/Discord";
import Terms from "./pages/Terms";
import Policy from "./pages/Policy";
import { useWeb3ModalAccount } from "@web3modal/ethers5/react";
import { chainList } from "./utils/config";
import { useDispatch } from "react-redux";

function App() {
  const { chainId } = useWeb3ModalAccount();
  const dispatch = useDispatch();

  const checkChain = async () => {
    if (window.ethereum) {
      if (chainId) {
        chainList.map((chain) => {
          if (chain.chainId == chainId) {
            dispatch({
              type: "CHANGE_INVITE_CONTRACT",
              payload: chain.inviteContract,
            });
            dispatch({
              type: "CHANGE_POOL_MANAGER",
              payload: chain.poolManager,
            });
          }
        });
      } else {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const chainIdNow = parseInt(chainId, 16);
        chainList.map((chain) => {
          if (chain.chainId == chainIdNow) {
            dispatch({
              type: "CHANGE_INVITE_CONTRACT",
              payload: chain.inviteContract,
            });
            dispatch({
              type: "CHANGE_POOL_MANAGER",
              payload: chain.poolManager,
            });
          }
        });
      }
    }
  }

  useLayoutEffect(()=>{
    checkChain()
  }, [chainId]);

  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <div className="content">
          <Routes>
            <Route path="/" element={<Lottery />}></Route>
            <Route path="/referral" element={<Referral />}></Route>
            <Route path="/tutorials" element={<Tutorials />}></Route>
            <Route path="/discord" element={<Discord />}></Route>
            <Route path="/terms" element={<Terms />}></Route>
            <Route path="/policy" element={<Policy />}></Route>
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
