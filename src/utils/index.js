import { ethers } from "ethers";
import { chainList } from "./config";

export const shortStr = (address, first = 7, last = 5) => {
  if (address) {
    return address.slice(0, first) + "..." + address.slice(-last);
  } else {
    return address;
  }
};

export const formatNumber = (number) => {
  return number.replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
};

export function formate(time) {
  return `${time < 10 ? "0" : ""}${time}`;
}

export const computeCountdownInfo = (remainTime) => {
  if (remainTime * 1 <= 0) {
    return "00:00:00";
  }
  // 这里用了一个比较笨的方法，一个个进行计算，后续可以优化试试看
  const day = Math.floor(remainTime / (24 * 60 * 60));
  const hours = Math.floor((remainTime / (60 * 60)) % 24);
  const hoursStr = formate(hours);
  const minutes = Math.floor((remainTime / 60) % 60);
  const minutesStr = formate(minutes);
  const seconds = Math.floor(remainTime % 60);
  const secondsStr = formate(seconds);

  // 组合成需要返回的时间信息
  const timeInfo = `${day ? day + "days " : ""} ${
    hours ? hoursStr + ":" : "00:"
  }${minutes ? minutesStr + ":" : "00:"}${seconds ? secondsStr : "00"}`;

  return timeInfo;
};

/*
 *思路：每次随机从数组抽出一个数放进新的数组，然后将这个数从原数组中剔除，这个就不会抽到重复的数了
 */
export const makeRandomArr = (arrList, num) => {
  if (num > arrList.length) {
    return;
  }
  //    var tempArr=arrList.concat();
  var tempArr = arrList.slice(0);
  var newArrList = [];
  for (var i = 0; i < num; i++) {
    var random = Math.floor(Math.random() * (tempArr.length - 1));
    var arr = tempArr[random];
    tempArr.splice(random, 1);
    newArrList.push(arr);
  }
  return newArrList;
};

export const getNewTickets = (tickets, total = 100) => {
  if (Array.isArray(tickets)) {
    return tickets.map((item) => {
      let s = "";
      for (let i = 1; i < Math.log10(total * 10); i++) {
        s += "0";
      }
      return (s + item).slice(-1 * Math.log10(total * 10));
    });
  }
  if (typeof tickets == "number") {
    let s = "";
    for (let i = 1; i < Math.log10(total * 10); i++) {
      s += "0";
    }
    return (s + tickets).slice(-1 * Math.log10(total * 10));
  }
};

export function getContractPrice(contractAddress, abi, funcName, ...params) {
  const provider = new ethers.providers.InfuraProvider(
    "mainnet",
    "f9eae046939d4b969a42a377d109d17a"
  );
  const contract = new ethers.Contract(contractAddress, abi, provider);
  return new Promise((resolve, reject) => {
    contract[funcName](...params).then(
      (response) => {
        resolve(response);
      },
      (err) => {
        // 合约调用错误
        console.log(err);
        reject(err);
      }
    );
  });
}

export const checkNetWork = async () => {
  if (window.ethereum) {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const chainIdNow = parseInt(chainId, 16);
    const chainIdList = chainList.filter((list) => list.chainId == chainIdNow);
    return chainIdList.length ? true : false;
  } else {
    return false;
  }
};


export const netWorkNow = async () => {
  if (window.ethereum) {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const chainIdNow = parseInt(chainId, 16);
    const chainIdList = chainList.filter((list) => list.chainId == chainIdNow);
    return { infuraRpc: chainIdList[0].infuraRpc, chainId: chainIdNow };
  }
};

/**
 * 读取合约方法
 * @param {*} contractAddress 合约地址
 * @param {*} abi 合约对应的 abi 文件
 * @param {*} funcName 调用的合约方法名
 * @param  {...any} params 传入的参数
 * @returns promise
 */
export async function getContract(
  walletProvider,
  contractAddress,
  abi,
  funcName,
  ...params
) {
  const isTrueNetWork = await checkNetWork();
  const { infuraRpc } = await netWorkNow();
  const provider =
    walletProvider && isTrueNetWork
      ? new ethers.providers.Web3Provider(walletProvider)
      : new ethers.providers.JsonRpcProvider(infuraRpc);
  const contract = new ethers.Contract(contractAddress, abi, provider);
  return new Promise((resolve, reject) => {
    contract[funcName](...params).then(
      (response) => {
        resolve(response);
      },
      (err) => {
        // 合约调用错误
        console.log(err);
        reject(err);
      }
    );
  });
}

/**
 * 写入合约方法
 * @param {*} contractAddress 合约地址
 * @param {*} abi 合约对应的 abi 文件
 * @param {*} funcName 调用的合约方法名
 * @param  {...any} params 传入的参数
 * @returns promise
 */
export async function getWriteContract(
  walletProvider,
  contractAddress,
  abi,
  funcName,
  ...params
) {
  const { infuraRpc } = await netWorkNow();
  const provider = walletProvider
    ? new ethers.providers.Web3Provider(walletProvider)
    : new ethers.providers.JsonRpcProvider(infuraRpc);
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const contractWithSigner = contract.connect(provider.getSigner());
  return new Promise((resolve, reject) => {
    contractWithSigner[funcName](...params).then(
      (response) => {
        resolve(response);
      },
      (err) => {
        reject(err);
      }
    );
  });
}

/**
 * 读取合约方法（loading）
 * @param {*} contractAddress 合约地址
 * @param {*} abi 合约对应的 abi 文件
 * @param {*} funcName 调用的合约方法名
 * @param  {...any} params 传入的参数
 * @returns promise
 */
export async function getContractLoad(
  walletProvider,
  contractAddress,
  abi,
  funcName,
  ...params
) {
  const { infuraRpc } = await netWorkNow();
  const provider = walletProvider
    ? new ethers.providers.Web3Provider(walletProvider)
    : new ethers.providers.JsonRpcProvider(infuraRpc);
  const contract = new ethers.Contract(contractAddress, abi, provider);
  return new Promise((resolve, reject) => {
    contract[funcName](...params).then(
      (response) => {
        let timer = setInterval(() => {
          provider
            .getTransactionReceipt(response.hash)
            .then((receipt) => {
              if (receipt) {
                if (receipt.logs.length) {
                  setTimeout(() => {
                    resolve(response);
                  }, 2000);
                } else {
                  // 链上交互失败
                  reject(601);
                }
                clearInterval(timer);
              }
            })
            .catch((err) => {
              // 合约链上交互方法调用错误
              console.log(err);
              reject(604);
            });
        }, 1000);
      },
      (err) => {
        // 合约调用错误
        console.log(err);
        reject(605);
      }
    );
  });
}

/**
 * 写入合约方法 (loading)
 * @param {*} contractAddress 合约地址
 * @param {*} abi 合约对应的 abi 文件
 * @param {*} funcName 调用的合约方法名
 * @param  {...any} params 传入的参数
 * @returns promise
 */
export async function getWriteContractLoad(
  walletProvider,
  contractAddress,
  abi,
  funcName,
  ...params
) {
  const { infuraRpc } = await netWorkNow();
  const provider = walletProvider
    ? new ethers.providers.Web3Provider(walletProvider)
    : new ethers.providers.JsonRpcProvider(infuraRpc);
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const contractWithSigner = contract.connect(provider.getSigner());
  return new Promise((resolve, reject) => {
    contractWithSigner[funcName](...params).then(
      (response) => {
        let timer = setInterval(() => {
          provider
            .getTransactionReceipt(response.hash)
            .then((receipt) => {
              if (receipt) {
                if (receipt.logs.length) {
                  setTimeout(() => {
                    resolve(response);
                  }, 2000);
                } else {
                  // 链上交互失败
                  reject(601);
                }
                clearInterval(timer);
              }
            })
            .catch((err) => {
              // 合约链上交互方法调用错误
              console.log(err);
              reject(604);
            });
        }, 1000);
      },
      (err) => {
        reject(err);
      }
    );
  });
}
export { chainList } from "./config";
