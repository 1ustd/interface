import { useEffect, useState, createRef, useRef, useCallback } from "react";
import {
  useWeb3ModalProvider,
  useWeb3Modal,
  useWeb3ModalAccount,
} from "@web3modal/ethers5/react";
import {
  Select,
  Progress,
  Popover,
  Modal,
  Button,
  Skeleton,
  Carousel,
  notification,
} from "antd";
import {
  getContract,
  getContractPrice,
  getWriteContractLoad,
  shortStr,
  makeRandomArr,
  chainList,
  getNewTickets,
  checkNetWork,
} from "../../utils";
import { useSelector } from "react-redux";
import poolManagerAbi from "../../asserts/abi/poolManagerAbi.json";
import erc20Abi from "../../asserts/abi/erc20Abi.json";
import aggregatorV3InterfaceABI from "../../asserts/abi/aggregatorV3InterfaceAbi.json";

import { ethers } from "ethers";
import moment from "moment";
import CountDown from "../../components/countDown";
import Footer from "../../components/footer";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useInterval, useTimeout } from "ahooks";
import JSConfetti from "js-confetti";
import { useTranslation } from "react-i18next";

function Lottery() {
  const { t } = useTranslation();
  const { chainId } = useWeb3ModalAccount();
  const chainInfo = chainId
    ? chainList.filter((list) => list.chainId == chainId)[0]
    : chainList[0];

  const { walletProvider } = useWeb3ModalProvider();
  const { open } = useWeb3Modal();

  const descList = [
    {
      imgUrl: require("../../asserts/img/square.png"),
    },
    {
      imgUrl: require("../../asserts/img/frame.png"),
    },
    {
      imgUrl: require("../../asserts/img/scales.png"),
    },
  ];

  const [tab, setTab] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const setTabFun = (index) => {
    index ? navigate("/?reward") : navigate("/");
    setTab(index);
  };

  useEffect(() => {
    if (location.search == "?reward") {
      setTab(1);
    } else {
      setTab(0);
    }
  }, [location]);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRewardOpen, setIsRewardOpen] = useState(false);
  const [USDTAddress, setUSDTAddress] = useState("");
  const [USDTDecimals, setUSDTDecimals] = useState("6");
  const [USDTSymbol, setUSDTSymbol] = useState("USDT");

  // opening效果
  const [openingRound, setOpeningRound] = useState({});

  const [noWon, setNoWon] = useState(false);

  const [pools, setPools] = useState([]);

  const setShowMoreInfoFun = (index) => {
    const newArr = pools.map((list, ind) => {
      if (index == ind) {
        list.showMore = !list.showMore;
        setRememberSelect((select) => {
          select[ind].showMore = !select[ind].showMore;
          return select;
        });
        return list;
      } else {
        return list;
      }
    });

    setPools(newArr);
  };

  const poolManager = useSelector((state) => state.poolManager);
  const address = useSelector((state) => state.address);

  const [loading, setLoading] = useState(true);

  const [rows, setRows] = useState(2);

  const [accountBalance, setAccountBalance] = useState(0);

  const getPrice = async (address) => {
    const decimals = await getContractPrice(
      address,
      aggregatorV3InterfaceABI,
      "decimals"
    );
    const price = await getContractPrice(
      address,
      aggregatorV3InterfaceABI,
      "latestRoundData"
    );
    const realPrice = ethers.utils.formatUnits(
      price.answer.toString(),
      decimals
    );
    return realPrice;
  };

  const PriceItem = (props) => {
    const { list } = props;
    const price =
      prices[
        list.prize * 1 >= 10000
          ? 0
          : list.prize * 1 < 10000 && list.prize * 1 >= 1000
          ? 1
          : 2
      ];
    const ImgUrl = () => {
      if (list.prize * 1 >= 10000) {
        return require(`../../asserts/img/BTC.png`);
      }
      if (list.prize * 1 < 10000 && list.prize * 1 >= 1000) {
        return require(`../../asserts/img/ETH.png`);
      }
      if (list.prize * 1 < 1000) {
        return require(`../../asserts/img/SOL.png`);
      }
    };
    return (
      <>
        <span className="mr-1 _title _white opacity-80">
          ≈ {price * 1 > 0 ? ((list.prize * 1) / price).toFixed(8) : "--"}
        </span>
        <img className="w-4" src={ImgUrl()} />
      </>
    );
  };

  const [prices, setPrices] = useState([]);

  const getPriceList = async () => {
    // BTC
    const btcPrice = await getPrice(
      "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c"
    );
    // ETH
    const ethPrice = await getPrice(
      "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
    );

    // SOL
    const solPrice = await getPrice(
      "0x4ffC43a60e009B551865A93d232E33Fce9f01507"
    );

    setPrices([btcPrice, ethPrice, solPrice]);
  };

  useEffect(() => {
    getPriceList();
  }, []);

  const getAccountBalance = async () => {
    const usdt = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "usdt"
    );
    const decimals = await getContract(
      walletProvider,
      usdt,
      erc20Abi,
      "decimals"
    );
    const balanceOf = await getContract(
      walletProvider,
      usdt,
      erc20Abi,
      "balanceOf",
      address
    );

    getAllowance(usdt);

    const balance = ethers.utils.formatUnits(balanceOf, decimals) * 1;
    setAccountBalance(balance);
  };

  useEffect(() => {
    address && poolManager ? getAccountBalance() : setAccountBalance(0);
  }, [address, poolManager]);

  useInterval(
    () => {
      address && poolManager ? getAccountBalance() : setAccountBalance(0);
    },
    5000,
    { immediate: true }
  );

  const [rememberSelect, setRememberSelect] = useState([]);

  const upDataSelectRound = async () => {
    const allPools = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getAllPoolIds"
    );
    const newRememberSelect = [];
    if (allPools.length > 0) {
      for (let i = 0; i < allPools.length; i++) {
        const pool = await getContract(
          walletProvider,
          poolManager,
          poolManagerAbi,
          "getPoolInfo",
          allPools[i]
        );
        const roundInformation = {
          contractAddress: allPools[i].toString(),
          selectRound: pool.currentRound.toString(),
          showMore: false,
        };
        newRememberSelect.push(roundInformation);
      }
    }
    setRememberSelect(newRememberSelect);
    // 初始化select后 执行
    getPoolList();
  };
  useEffect(() => {
    poolManager && upDataSelectRound();
  }, [poolManager]);

  const [rememberOldTickets, setRememberOldTickets] = useState(-1);
  const [isWonOpen, setIsWonOpen] = useState(false);

  const getStatus = (pool, selectedRound, roundInfo) => {
    if (roundInfo.startTime.toString() * 1 > nowDate) {
      return 1;
    }
    if (
      roundInfo.startTime.toString() * 1 < nowDate &&
      roundInfo.endTime.toString() * 1 > nowDate
    ) {
      return 2;
    }
    if (roundInfo.endTime.toString() * 1 < nowDate) {
      if (roundInfo.winNumber * 1 > 0) {
        return 3;
      } else {
        if (roundInfo.vrfRequestId.toString() * 1 == 0) {
          return 5;
        } else {
          setOpeningRound({
            poolId: pool,
            round: selectedRound,
            winNumber: 0,
          });
          return 4;
        }
      }
    }
  };
  const getParticipationRecordsByPoolRound = async (poolId, round) => {
    const participationRecordsByPoolRound = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getParticipationRecordsByPoolRound",
      address,
      poolId,
      round
    );
    return participationRecordsByPoolRound;
  };

  const openingRoundFun = async () => {
    if (openingRound.poolId) {
      const records = await getParticipationRecordsByPoolRound(
        openingRound.poolId,
        openingRound.round
      );
      if (records.length * 1 > 0) {
        const roundInfo = await getContract(
          walletProvider,
          poolManager,
          poolManagerAbi,
          "getRoundInfo",
          openingRound.poolId,
          openingRound.round
        );

        if (roundInfo.winNumber * 1 > 0) {
          const wonAccount = await getContract(
            walletProvider,
            poolManager,
            poolManagerAbi,
            "getTicketOwner",
            openingRound.poolId,
            openingRound.round,
            roundInfo.winNumber
          );
          const getPoolInfo = await getContract(
            walletProvider,
            poolManager,
            poolManagerAbi,
            "getPoolInfo",
            openingRound.poolId
          );
          setOpeningRound({
            poolId: openingRound.poolId,
            round: openingRound.round,
            winNumber: roundInfo.winNumber,
            totalTickets: getPoolInfo.totalTickets.toString() * 1,
            prize:
              ethers.utils.formatUnits(getPoolInfo.prize, USDTDecimals) * 1,
          });

          if (wonAccount.toLowerCase() !== address.toLowerCase()) {
            setNoWon(true);
          } else {
            if (roundInfo.winNumber * 1 !== rememberOldTickets) {
              const jsConfetti = new JSConfetti();
              jsConfetti
                .addConfetti({
                  // emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸', '🐎'],
                  confettiColors: [
                    "#FDB630",
                    "#32F7B0",
                    "#3BCB97",
                    "#0F87D0",
                    "#FD3B86",
                    "#FECD3F",
                  ],
                  // confettiRadius: 6,
                  confettiNumber: 2000,
                })
                .then(() => {
                  setIsWonOpen(true);
                });
            }
          }
          setRememberOldTickets(roundInfo.winNumber * 1);
          epochChange(openingRound.round * 1 + 1, openingRound.poolId);
        } else {
          setRememberOldTickets(0);
        }
      } else {
        setRememberOldTickets(-1);
        const roundInfo = await getContract(
          walletProvider,
          poolManager,
          poolManagerAbi,
          "getRoundInfo",
          openingRound.poolId,
          openingRound.round
        );
        if (roundInfo.winNumber * 1 > 0) {
          setOpeningRound({});
          epochChange(openingRound.round * 1 + 1, openingRound.poolId);
        }
      }
    }
  };

  useInterval(() => {
    poolManager && openingRoundFun();
  }, 3000);

  const getPoolList = async () => {
    console.log("poolManager", poolManager);
    // 获取所有池子的信息
    const pools = [];
    const allPools = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getAllPoolIds"
    );
    setRows(allPools.length);

    // 获取usdt信息
    const usdt = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "usdt"
    );

    setUSDTAddress(usdt);

    const symbol = await getContract(walletProvider, usdt, erc20Abi, "symbol");

    setUSDTSymbol(symbol);

    const decimals = await getContract(
      walletProvider,
      usdt,
      erc20Abi,
      "decimals"
    );

    setUSDTDecimals(decimals.toString());
    if (allPools.length > 0) {
      for (let i = 0; i < allPools.length; i++) {
        const pool = await getContract(
          walletProvider,
          poolManager,
          poolManagerAbi,
          "getPoolInfo",
          allPools[i]
        );

        const roundInfos = await getContract(
          walletProvider,
          poolManager,
          poolManagerAbi,
          "getRoundInfo",
          allPools[i],
          rememberSelect[i]?.selectRound || pool.currentRound
        );

        const resetPool = {
          USDTAddress: usdt,
          contractAddress: allPools[i],
          currentRound: pool.currentRound.toString(),
          pricePerTicket: ethers.utils.formatUnits(
            pool.pricePerTicket,
            decimals
          ),
          prize: ethers.utils.formatUnits(pool.prize, decimals),
          roundDuration: pool.roundDuration.toString(),
          roundGapTime: pool.roundGapTime.toString(),
          totalTickets: pool.totalTickets.toString(),
          showMore: rememberSelect[i]?.showMore || false,
          rewardSymbol: symbol,
          roundInfo: {
            endTime: roundInfos.endTime.toString(),
            status: getStatus(
              allPools[i],
              rememberSelect[i]?.selectRound,
              roundInfos
            ),
            isClaimed: roundInfos.isClaimed,
            leftTickets: roundInfos.leftTickets.toString(),
            startTime: roundInfos.startTime.toString(),
            vrfRequestId: roundInfos.vrfRequestId.toString(),
            winNumber: roundInfos.winNumber.toString(),
          },
        };

        pools.push(resetPool);
      }
    }

    setLoading(false);

    setPools(pools);
  };

  useEffect(() => {
    poolManager && getPoolList();
  }, [poolManager]);

  useInterval(() => {
    poolManager && getPoolList();
  }, 5000);

  const epochOptions = (list) => {
    const options = [];
    for (let i = 1; i <= list * 1; i++) {
      let option = {
        value: i,
        label: i == list ? t("lottery.CurrentRound") : i,
      };
      options.push(option);
    }
    return options.reverse();
  };

  const epochChange = async (value, poolId) => {
    const roundInfo = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getRoundInfo",
      poolId,
      value
    );

    const realRoundInfo = {
      endTime: roundInfo.endTime.toString(),
      status: getStatus(poolId, value, roundInfo),
      isClaimed: roundInfo.isClaimed,
      leftTickets: roundInfo.leftTickets.toString(),
      startTime: roundInfo.startTime.toString(),
      vrfRequestId: roundInfo.vrfRequestId.toString(),
      winNumber: roundInfo.winNumber.toString(),
    };

    const newPool = pools.map((pool) => {
      if (pool.contractAddress == poolId) {
        pool.roundInfo = realRoundInfo;
      }
      return pool;
    });
    setPools(newPool);

    const newRememberSelect = rememberSelect.map((select) => {
      if (select.contractAddress == poolId) {
        select.selectRound = value.toString();
      }
      return select;
    });
    setRememberSelect(newRememberSelect);
  };

  const [selectPool, setSelectPool] = useState({});

  const [ticketAmount, setTicketAmount] = useState("");

  const [buyLoading, setBuyLoading] = useState(false);

  const [api, contextHolder] = notification.useNotification({
    placement: "topRight",
    duration: 3,
    maxCount: 10,
  });

  // get allowance
  const [allowance, setAllowance] = useState(false);
  const getAllowance = async (USDTAddress) => {
    const allowance = await getContract(
      walletProvider,
      USDTAddress,
      erc20Abi,
      "allowance",
      address,
      poolManager
    );
    setAllowance(allowance.toString() * 1 > 0);
  };

  //approve ticket contract
  const [approveLoading, setApproveLoading] = useState(false);

  const approveTicketFun = async (usdtAddress) => {
    if (!address) {
      setIsShareOpen(false);
      return open();
    }
    if (!(await checkNetWork())) {
      return open({ view: "Networks" });
    }
    setApproveLoading(true);
    await getWriteContractLoad(
      walletProvider,
      usdtAddress,
      erc20Abi,
      "approve",
      poolManager,
      ethers.constants.MaxUint256
    )
      .then((res) => {
        getAllowance(USDTAddress);
        setApproveLoading(false);
        api["success"]({
          message: t("lottery.ApproveSuccess"),
        });
      })
      .catch((err) => {
        setApproveLoading(false);
        api["error"]({
          message: t("lottery.ApproveFail"),
        });
        console.log(err);
      });
  };

  const getRealTickets = async (selectPool, amount) => {
    const soldTickets = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getSoldTickets",
      selectPool.contractAddress,
      selectPool.currentRound
    );

    const arr = [...new Array(selectPool.totalTickets * 1).keys()]
      .map((i) => i + 1)
      .filter((list) => !soldTickets.includes(list));

    return makeRandomArr(arr, amount);
  };

  const buyTicketFun = async (selectPool, amount) => {
    if (!address) {
      setIsShareOpen(false);
      return open();
    }

    if (!(await checkNetWork())) {
      return open({ view: "Networks" });
    }

    const reg = /^[1-9]\d*$/;

    if (!reg.test(ticketAmount * 1)) {
      return api["error"]({
        message: t("lottery.EnterCorrectAmount"),
      });
    }

    if (amount * 1 > accountBalance * 1) {
      return api["error"]({
        message: t("lottery.InsufficientBalance"),
      });
    }

    if (amount * 1 > selectPool.roundInfo.leftTickets * 1) {
      return api["error"]({
        message: t("lottery.NotEnoughTicketsRemaining"),
      });
    }

    const realTickets = await getRealTickets(selectPool, amount);

    setBuyLoading(true);

    // let overrides = {
    //   gasLimit: 1000000,
    //   gasPrice: ethers.utils.parseUnits("10", "gwei"),
    // };
    await getWriteContractLoad(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "buyTickets",
      selectPool.contractAddress,
      selectPool.currentRound,
      realTickets
      // overrides
    )
      .then((res) => {
        setBuyLoading(false);
        setTicketAmount("");
        api["success"]({
          message: t("lottery.BuySuccess"),
        });
        getPoolList();
        getParticipationRecords();
        getAccountBalance();
        setTimeout(() => {
          setIsShareOpen(false);
        }, 2000);
      })
      .catch((err) => {
        setBuyLoading(false);
        api["error"]({
          message: t("lottery.BuyFail"),
        });
        setTimeout(() => {
          setIsShareOpen(false);
        }, 2000);
        console.log(err);
      });
  };

  const nowDate = Math.floor(new Date().getTime() / 1000);

  const maxBuyFun = () => {
    if (address) {
      if (accountBalance / selectPool?.pricePerTicket >= 1) {
        return setTicketAmount(
          Math.min(
            Math.floor(accountBalance / selectPool?.pricePerTicket),
            selectPool?.roundInfo?.leftTickets
          )
        );
      } else {
        setTicketAmount(0);
      }
    } else {
      setTicketAmount(selectPool?.roundInfo?.leftTickets);
    }
  };
  // 获取总奖励数
  const [wonParticipationRecords, setWonParticipationRecords] = useState({
    totalPrizes: 0,
    records: [],
  });
  const getWonParticipationRecords = async () => {
    const wonParticipationRecords = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getWonParticipationRecords",
      address
    );
    setWonParticipationRecords({
      totalPrizes:
        ethers.utils.formatUnits(
          wonParticipationRecords.totalPrizes,
          USDTDecimals
        ) * 1,
      records: wonParticipationRecords.records,
    });
  };

  // 获取参与奖励
  const [unclaimedPrizes, setUnclaimedPrizes] = useState(0);
  const [unclaimedOriginInfo, setUnclaimedOriginInfo] = useState([]);
  const [unclaimedInfo, setUnclaimedInfo] = useState([]);
  const getUnclaimedPrizes = async () => {
    const unclaimed = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getUnclaimedPrizes",
      address
    );
    setUnclaimedPrizes(
      ethers.utils.formatUnits(unclaimed.totalPrizes, USDTDecimals) * 1
    );

    setUnclaimedOriginInfo([unclaimed.poolIds, unclaimed.roundIds]);

    const unclaimedInformation = [];
    unclaimed.poolIds.length > 0 &&
      unclaimed.poolIds.map((poolId, ind) => {
        unclaimed.roundIds.map((roundId, index) => {
          if (ind === index) {
            unclaimedInformation.push({
              poolId: poolId,
              roundId: roundId.toString(),
            });
          }
        });
      });
    setUnclaimedInfo(unclaimedInformation);
  };

  // 获取参与记录
  const [participationRecords, setParticipationRecords] = useState([]);

  const getParticipationRecords = async () => {
    const participationRecords = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getAllParticipationRecords",
      address
    );
    const newRecords = [];
    for (let i = 0; i < participationRecords.length; i++) {
      const { winShowNumber, totalShowTickets } = await getWinnerNumber(
        participationRecords[i].poolId,
        participationRecords[i].roundId.toString()
      );
      const newList = {
        poolId: participationRecords[i].poolId,
        roundId: participationRecords[i].roundId.toString(),
        tickets: participationRecords[i].tickets,
        ticketsCount: participationRecords[i].ticketsCount.toString(),
        timestamp: participationRecords[i].timestamp.toString(),
        winNumber: winShowNumber,
        totalTickets: totalShowTickets,
      };

      newRecords.push(newList);
    }

    setParticipationRecords(newRecords.reverse());
  };

  const getWinnerNumber = async (poolId, roundId) => {
    const { winNumber } = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getRoundInfo",
      poolId,
      roundId
    );
    const { totalTickets } = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "getPoolInfo",
      poolId
    );

    const winShowNumber = getNewTickets(
      winNumber * 1,
      totalTickets.toString() * 1
    );
    const totalShowTickets = totalTickets.toString() * 1;
    return { winShowNumber, totalShowTickets };
  };

  useEffect(() => {
    address && poolManager
      ? getParticipationRecords()
      : setParticipationRecords([]);
    address && poolManager ? getUnclaimedPrizes() : setUnclaimedPrizes(0);
    address && poolManager
      ? getWonParticipationRecords()
      : setWonParticipationRecords({ totalPrizes: 0, records: [] });
  }, [address, poolManager]);

  useInterval(
    () => {
      address && poolManager
        ? getParticipationRecords()
        : setParticipationRecords([]);
    },
    5000,
    { immediate: true }
  );

  useInterval(
    () => {
      address && poolManager ? getUnclaimedPrizes() : setUnclaimedPrizes(0);
      address && poolManager
        ? getWonParticipationRecords()
        : setWonParticipationRecords({ totalPrizes: 0, records: [] });
    },
    5000,
    { immediate: true }
  );

  useEffect(() => {
    if (unclaimedPrizes * 1 > 0) {
      const jsConfetti = new JSConfetti();
      jsConfetti
        .addConfetti({
          // emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸', '🐎'],
          confettiColors: [
            "#FDB630",
            "#32F7B0",
            "#3BCB97",
            "#0F87D0",
            "#FD3B86",
            "#FECD3F",
          ],
          // confettiRadius: 6,
          confettiNumber: 2000,
        })
        .then(() => {
          setIsWonOpen(true);
        });
    }
  }, [unclaimedPrizes]);

  // claim prize
  const [claimLoading, setClaimLoading] = useState(false);

  const claimPrizes = async () => {
    if (!(await checkNetWork())) {
      return open({ view: "Networks" });
    }
    setClaimLoading(true);
    await getWriteContractLoad(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "claimPrizes",
      address,
      unclaimedOriginInfo[0],
      unclaimedOriginInfo[1]
    )
      .then((res) => {
        setClaimLoading(false);
        getUnclaimedPrizes();
        getWonParticipationRecords();
        api["success"]({
          message: t("referral.ClaimSuccess"),
        });
      })
      .catch((err) => {
        setClaimLoading(false);
        api["error"]({
          message: t("referral.ClaimFail"),
        });
        console.log(err);
      });
  };

  const switchStatus = (value) => {
    switch (value) {
      case 1:
        return t("lottery.WaitingForStart");
      case 2:
        return t("lottery.OnGoing");
      case 3:
        return t("lottery.Ended");
      case 4:
        return t("lottery.DrawingInProgress");
      case 5:
        return t("lottery.WaitingForDraw");
    }
  };

  const clickBuyBtnFun = async (list) => {
    if (!address) {
      return open();
    }

    if (!(await checkNetWork())) {
      return open({ view: "Networks" });
    }
    setIsShareOpen(true);
    setSelectPool(list);
    setTicketAmount("");
  };

  const clickLotteryDraw = async (list, index) => {
    if (!address) {
      return open();
    }
    if (!(await checkNetWork())) {
      return open({ view: "Networks" });
    }
    setRememberSelect((state) => {
      state[index].loading = true;
      return state;
    });
    await getWriteContractLoad(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "drawEndedRoundAndOpenNewRound",
      list.contractAddress
    )
      .then((res) => {
        setRememberSelect((state) => {
          state[index].loading = false;
          return state;
        });
        api["success"]({
          message: t("lottery.InstantDrawingSuccess"),
        });
      })
      .catch((err) => {
        setRememberSelect((state) => {
          state[index].loading = false;
          return state;
        });
        api["error"]({
          message: t("lottery.InstantDrawingFailed"),
        });
        console.log(err);
      });
  };

  const [selectTickets, setSelectTickets] = useState([]);

  const [carouselIndex, setCarouselIndex] = useState(0);

  const onChangeCarousel = (value) => {
    setCarouselIndex(value);
  };

  const transferFun = (list) => {
    let numArr = Array.from(list?.toString()).map(Number);
    return numArr;
  };

  const carouselRef = createRef();

  const goToNextSlide = () => {
    if (carouselIndex !== selectTickets.length - 1) {
      carouselRef.current.next();
    }
  };

  const goToPrevSlide = () => {
    if (carouselIndex !== 0) {
      carouselRef.current.prev();
    }
  };

  const stickyRef = useRef(null);
  const [top, setTop] = useState(0);
  const [stickyShow, setStickyShow] = useState(false);
  const scrollTopFun = () => {
    const scrollTop = document.documentElement.scrollTop;
    setStickyShow(scrollTop > top);
  };

  useEffect(() => {
    setTop(stickyRef.current.offsetTop);
    window.addEventListener("scroll", scrollTopFun);
    return () => window.removeEventListener("scroll", scrollTopFun);
  });

  return (
    <div className="_background1 _background-home text-center">
      <div className="_background-home2">
        <div className="text-white">
          <div className="text-5xl font-bold _title _size35 pt-24 _hiddenM">
            {t("lottery.title")}
          </div>
          <div className="text-5xl font-bold _title _size35 pt-24 _hiddenP">
            <p>{t("lottery.title1")}</p>
            <p>{t("lottery.title2")}</p>
          </div>
          <div className="text-sm mt-5 _title _hiddenM">
            {t("lottery.navTitle")}
          </div>
          <div className="text-sm mt-5 _title _hiddenP pr-2 pl-2">
            <p>{t("lottery.navTitle1")}</p>
            <p>{t("lottery.navTitle2")}</p>
          </div>
          <div className="flex items-start justify-around _widthP _marginAuto _widthM _size12">
            {descList.map((list, index) => {
              return (
                <div key={index} className="w-3/12 text-center _widthM-30">
                  <div className="flex items-center justify-center">
                    <img className="w-16" src={list.imgUrl} alt="" />
                  </div>
                  <div className="mt-5 mb-2 font-bold _title">
                    {t(`lottery.descList.title${index + 1}`)}
                  </div>
                  <div className="text-sm _nav-title _hiddenM">
                    {t(`lottery.descList.desc${index + 1}`)}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="_border px-6 rounded-xl _widthP _marginAuto0 _widthM _borderNo _paddingNo"
            ref={stickyRef}
          >
            <div className="h-16 mt-4 mb-2">
              <div className={`_background4 ${stickyShow ? "sticky" : ""}`}>
                <div className="flex items-center justify-center text-lg _justA z-50 h-16">
                  <div className="_tabsBg text-sm font-bold">
                    <button
                      className={`${!tab ? "_tabActive" : "_text"} py-3 w-40`}
                      onClick={() => setTabFun(0)}
                    >
                      {t("lottery.tabs.OngoingLotteries")}
                    </button>
                    <button
                      onClick={() => setTabFun(1)}
                      className={`${tab ? "_tabActive" : "_text"}  py-3 w-40`}
                    >
                      {t("lottery.tabs.MyReward")}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {!tab ? (
              <div className="">
                {pools.map((list, index) => {
                  return (
                    <div
                      key={index}
                      className="rounded-xl p-6 _background-gradient4 mb-6 relative"
                    >
                      <div
                        className={`text-white _roundStatus _roundStatus${list?.roundInfo?.status}`}
                      >
                        {switchStatus(list?.roundInfo?.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="_text text-xs">
                          <span className="pr-2">{t("lottery.Round")}</span>
                          <Select
                            popupClassName="epochSelect"
                            className="w-20 h-6 _backgroundNo"
                            defaultValue={list.currentRound}
                            value={
                              rememberSelect[index]?.selectRound ||
                              list.currentRound
                            }
                            onChange={(value) =>
                              epochChange(value, list.contractAddress)
                            }
                            overlayClassName="dropdown-class"
                            options={epochOptions(list.currentRound)}
                            suffixIcon={
                              <img
                                style={{ width: "10px", marginRight: "10px" }}
                                src={require("../../asserts/img/down.png")}
                                alt=""
                              />
                            }
                          />
                          <span className="pl-2 _hiddenM">
                            {t("lottery.NextRoundStartAt")}:{" "}
                            {moment(
                              list?.roundInfo?.endTime * 1000 +
                                list?.roundGapTime * 1000
                            ).format("YYYY-MM-DD HH:mm:ss")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start _text text-sm mt-5 text-left _homeListM">
                        <div className="w-40 h-24 flex flex-col justify-between">
                          <div>{t("lottery.RewardPool")}</div>
                          <div className="flex items-center _center text-3xl _title _pt-20  _active font-bold">
                            <span className="green">
                              {(list?.prize * 1).toLocaleString()}
                            </span>
                            <img
                              className="w-7 ml-2"
                              src={require("../../asserts/img/USDT.png")}
                            />
                          </div>
                          <div className="w-full flex items-center text-sm _pt-10 _pb-10 _center">
                            <PriceItem list={list} />
                          </div>
                        </div>
                        <div className="w-40 h-24 flex flex-col justify-between _hiddenM ml-8">
                          <div className="_title leading-4">
                            {moment(list?.roundInfo?.endTime * 1000).format(
                              "YYYY-MM-DD HH:mm:ss"
                            )}
                          </div>
                          <div className="text-xs leading-4">
                            {t("lottery.EndTime")}
                          </div>
                          <div
                            className={`_title mt-2 leading-4 ${
                              list?.roundInfo?.winNumber * 1 !== 0 &&
                              "_winNumber"
                            }`}
                          >
                            {list?.roundInfo?.winNumber * 1 == 0
                              ? t("lottery.ToBeDrawn")
                              : getNewTickets(
                                  list?.roundInfo?.winNumber * 1,
                                  list.totalTickets * 1
                                )}
                          </div>
                          <div className="text-xs leading-4">
                            {t("lottery.WinningNumber")}
                          </div>
                        </div>
                        <div className="_hiddenP pt-4 mt-4 pb-4 mb-8 _borderLine _hiddenM">
                          <div className="flex item-center justify-between h-6">
                            <div className="text-xs">
                              {t("lottery.EndTime")}
                            </div>
                            <div className="_title">
                              {moment(list?.roundInfo?.endTime * 1000).format(
                                "YYYY-MM-DD HH:mm:ss"
                              )}
                            </div>
                          </div>
                          <div className="flex item-center justify-between h-6 _hiddenM">
                            <div className="text-xs">
                              {t("lottery.WinningNumber")}
                            </div>
                            <div className="_title">
                              {list?.roundInfo?.winNumber * 1 == 0
                                ? "--"
                                : getNewTickets(
                                    list?.roundInfo?.winNumber * 1,
                                    list.totalTickets * 1
                                  )}
                            </div>
                          </div>
                        </div>
                        <div className="w-96 h-24 flex flex-col justify-between _title ml-8">
                          <div className="_hiddenM flex items-center justify-between">
                            <span className="_text">
                              {t("lottery.WinUSDT", {
                                number: list?.prize * 1,
                              })}{" "}
                              <span className="orange"></span>
                            </span>
                            <Popover
                              content={list.contractAddress}
                              placement="top"
                              trigger="hover"
                              overlayClassName="_popover"
                              className="_hiddenM"
                            >
                              <button className="text-left _text ml-2 underline decoration-slate-400 decoration-1 _popoverBtn">
                                {t("lottery.PoolId")}
                              </button>
                            </Popover>
                            {/* <span className="_tip-yellow pl-1">
                              {list?.pricePerTicket * 1}
                              <span className="pl-1">{list?.rewardSymbol}</span>
                            </span> */}
                          </div>
                          <div>
                            <Progress
                              status={"normal"}
                              percent={
                                (100 *
                                  (list?.totalTickets * 1 -
                                    list?.roundInfo?.leftTickets * 1)) /
                                list?.totalTickets
                              }
                              // strokeColor={
                              //   "linear-gradient(90deg, #CE00FF 0%, #7F00FF 100%)"
                              // }
                              trailColor={"rgba(163,159,173, 0.2)"}
                            />
                          </div>
                          <div className="flex items-center justify-between _pt-10">
                            <span>
                              {t("lottery.TicketsPurchased")}:
                              <span className="_active pl-2">
                                {list?.totalTickets * 1 -
                                  list?.roundInfo?.leftTickets * 1}
                              </span>
                            </span>
                            <span>
                              {t("lottery.TotalTickets")}: {list?.totalTickets}
                            </span>
                          </div>
                        </div>
                        <div
                          className="h-24 flex flex-col justify-between ml-auto"
                          // style={{ minWidth: "200px" }}
                        >
                          {contextHolder}
                          <div className="text-right">
                            <Button
                              loading={
                                list?.roundInfo?.status * 1 == 5 &&
                                rememberSelect[index]?.loading
                              }
                              disabled={
                                ![2, 5].includes(list?.roundInfo?.status * 1)
                              }
                              className={`rounded-full p-2 w-40 h-10 _title _listBtn ${
                                list?.roundInfo?.status * 1 == 4 && "beatBox"
                              }`}
                              onClick={() => {
                                if (list?.roundInfo?.status * 1 == 2) {
                                  clickBuyBtnFun(list);
                                }
                                if (list?.roundInfo?.status * 1 == 5) {
                                  clickLotteryDraw(list, index);
                                }
                              }}
                            >
                              {[1, 2].includes(list?.roundInfo?.status * 1) &&
                                t("lottery.BuyTickets")}
                              {list?.roundInfo?.status * 1 == 3 &&
                                t("lottery.Drawn")}
                              {list?.roundInfo?.status * 1 == 4 &&
                                t("lottery.LotteryDrawing")}
                              {list?.roundInfo?.status * 1 == 5 &&
                                t("lottery.InstantDrawing")}
                            </Button>
                          </div>
                          <div className="_title _justB text-center">
                            <span>
                              {list?.roundInfo?.status == 2 && (
                                <>
                                  {t("lottery.TimeToEnd")}:{" "}
                                  <CountDown
                                    offsetTimestamp={Math.abs(
                                      list?.roundInfo?.endTime - nowDate
                                    )}
                                  />
                                </>
                              )}
                              {list?.roundInfo?.status == 1 && (
                                <>
                                  {t("lottery.StartTime")}:{" "}
                                  <CountDown
                                    offsetTimestamp={Math.abs(
                                      list?.roundInfo?.startTime - nowDate
                                    )}
                                  />
                                </>
                              )}
                              {list?.roundInfo?.status == 3 && (
                                <>
                                  {t("lottery.TimeToEnd")}:{" "}
                                  {moment(
                                    list?.roundInfo?.endTime * 1000
                                  ).format("MM-DD HH:mm:ss")}
                                </>
                              )}
                              {[4, 5].includes(list?.roundInfo?.status) && (
                                <>
                                  {t("lottery.TimeToEnd")}: {"00:00:00"}
                                </>
                              )}
                            </span>
                            <button
                              className="_hiddenP _yellow font-bold"
                              onClick={() => setShowMoreInfoFun(index)}
                            >
                              {t("lottery.MoreView")}
                            </button>
                          </div>
                          {list.showMore && (
                            <div className="_hiddenP _orderInfo">
                              <div>
                                <span>{t("lottery.EndTime")}</span>
                                <span className="text-white">
                                  {moment(
                                    list?.roundInfo?.endTime * 1000
                                  ).format("YYYY-MM-DD HH:mm:ss")}
                                </span>
                              </div>
                              <div>
                                <span>{t("lottery.WinningNumber")}</span>
                                <span
                                  className={`_title ${
                                    list?.roundInfo?.winNumber * 1 !== 0 &&
                                    "_winNumber"
                                  }`}
                                >
                                  {list?.roundInfo?.winNumber * 1 == 0
                                    ? t("lottery.ToBeDrawn")
                                    : getNewTickets(
                                        list?.roundInfo?.winNumber * 1,
                                        list.totalTickets * 1
                                      )}
                                </span>
                              </div>
                              <div>
                                <span>{t("lottery.PoolId")}</span>
                                <Popover
                                  content={list.contractAddress}
                                  placement="topRight"
                                  trigger="click"
                                  overlayClassName="_popover"
                                >
                                  <button className="text-left text-xs text-white underline decoration-slate-400 decoration-1 _popoverBtn">
                                    {shortStr(list.contractAddress)}
                                  </button>
                                </Popover>
                              </div>
                              <div>
                                <span>{t("lottery.NextRoundStartAt")}</span>
                                <span className="text-white">
                                  {moment(
                                    list?.roundInfo?.endTime * 1000 +
                                      list?.roundGapTime * 1000
                                  ).format("YYYY-MM-DD HH:mm:ss")}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="pl-2 _hiddenP _hiddenM">
                            {t("lottery.NextRoundStartAt")}:{" "}
                            {moment(
                              list?.roundInfo?.endTime * 1000 +
                                list?.roundGapTime * 1000
                            ).format("YYYY-MM-DD HH:mm:ss")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Skeleton
                  active
                  loading={loading}
                  title={false}
                  paragraph={{ rows: rows }}
                ></Skeleton>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between _flex-col">
                  <div className="_background2 rounded-xl p-6 _w100">
                    <div className="flex items-center">
                      <img
                        className="w-6 mr-2"
                        src={require("../../asserts/img/USDT.png")}
                        alt=""
                      />
                      <span className="text-2xl font-bold">
                        {address
                          ? parseFloat(
                              (wonParticipationRecords?.totalPrizes).toFixed(2)
                            ).toLocaleString()
                          : "--"}{" "}
                        {USDTSymbol}
                      </span>
                    </div>
                    <div className="_nav-title text-sm text-left pt-4">
                      {t("lottery.TotalReward")}
                    </div>
                  </div>
                  <div className="_w100 _mt-5">
                    <div className="flex items-center justify-between _background2 rounded-xl p-6">
                      <div>
                        <div className="flex items-center">
                          <img
                            className="w-6 mr-2"
                            src={require("../../asserts/img/USDT.png")}
                            alt=""
                          />
                          <span className="text-2xl font-bold">
                            {address
                              ? (unclaimedPrizes * 1).toLocaleString()
                              : "--"}{" "}
                            {USDTSymbol}
                          </span>
                        </div>
                        <div className="_nav-title text-sm text-left pt-4">
                          {t("lottery.UnclaimedReward")}
                        </div>
                      </div>
                      {contextHolder}
                      <Button
                        loading={claimLoading}
                        disabled={!unclaimedPrizes * 1 > 0}
                        onClick={claimPrizes}
                        className="rounded-full _background-gradient2 text-white h-12 pl-16 pr-16"
                      >
                        {t("lottery.Claim")}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-left mt-8">
                  <div className="pt-4 pb-4 _borderT font-bold">
                    {t("lottery.History")}
                  </div>
                </div>
                <div className="max-h-80 mb-2 overflow-auto">
                  <table className="w-full text-left _table _hiddenM">
                    <thead className="text-sm h-10 ">
                      <tr className="_nav-title _tableTitle">
                        <th className="font-thin">{t("lottery.Pool")}</th>
                        <th className="font-thin">{t("lottery.Round")}</th>
                        <th className="font-thin">
                          {t("lottery.PurchasedTickets")}
                        </th>
                        <th className="font-thin">
                          {t("lottery.WinningNumber")}
                        </th>
                        <th className="font-thin">
                          {t("lottery.PurchaseTime")}
                        </th>
                        <th className="text-right font-thin">
                          {t("lottery.YourLotteryNumber")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {participationRecords.length > 0 &&
                        participationRecords.map((list, index) => {
                          return (
                            <tr className="h-14" key={index}>
                              <td>
                                <Popover
                                  content={list?.poolId}
                                  placement="topLeft"
                                  trigger="hover"
                                  overlayClassName="_popover"
                                  className="_hiddenM"
                                >
                                  <span className="underline decoration-white cursor-pointer">
                                    {shortStr(list?.poolId)}
                                  </span>
                                </Popover>
                              </td>
                              <td>{list?.roundId?.toString()}</td>
                              <td>{list?.ticketsCount?.toString()}</td>
                              <td>
                                <span className="_active">
                                  {list?.winNumber * 1 == 0
                                    ? "--"
                                    : list?.winNumber}
                                </span>
                              </td>
                              <td>
                                {moment(
                                  list?.timestamp?.toString() * 1000
                                ).format("YYYY-MM-DD HH:mm:ss")}
                              </td>
                              <td className="text-right">
                                <Button
                                  className="tableBtn min-w-24"
                                  onClick={() => {
                                    setSelectTickets(
                                      getNewTickets(
                                        list?.tickets,
                                        list?.totalTickets
                                      )
                                    );
                                    setIsRewardOpen(true);
                                  }}
                                >
                                  {t("lottery.Check")}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {participationRecords.length == 0 && (
                    <div className="text-center w-full h-56 flex flex-col items-center justify-center _tip">
                      <img
                        className="w-16"
                        src={require("../../asserts/img/noData.png")}
                      />
                      <div className="mt-2 text-sm">{t("lottery.NoData")}</div>
                    </div>
                  )}
                </div>
                <div className="_hiddenP">
                  <div className="text-sm">
                    {participationRecords &&
                      participationRecords.map((list, index) => {
                        return (
                          <div key={index} className="mb-8 mt-4">
                            <div
                              className="flex items-center justify-between"
                              key={list?.ticket}
                            >
                              <span>
                                <Popover
                                  content={list?.poolId}
                                  placement="topRight"
                                  trigger="hover"
                                  overlayClassName="_popover"
                                >
                                  <span className="underline decoration-white cursor-pointer">
                                    {shortStr(list?.poolId)}
                                  </span>
                                </Popover>
                              </span>
                              <span>
                                {t("lottery.WinningNumber")}{" "}
                                <span className="_active">
                                  {list?.winNumber * 1 == 0
                                    ? "--"
                                    : list?.winNumber}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between font-thin mt-2">
                              <span>
                                {t("lottery.Round")} {list?.roundId}
                              </span>
                              <span>
                                {list?.ticketsCount} {t("lottery.Tickets")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between _nav-title font-thin mt-2">
                              <span>
                                {moment(list?.timestamp * 1000).format(
                                  "YYYY-MM-DD HH:mm:ss"
                                )}
                              </span>
                              <span
                                onClick={() => {
                                  setSelectTickets(
                                    getNewTickets(
                                      list?.tickets,
                                      list?.totalTickets
                                    )
                                  );
                                  setIsRewardOpen(true);
                                }}
                                className="_active"
                              >
                                {t("lottery.CheckNumber")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
          {!tab && (
            <div
              className="h-16 _background2 rounded-xl mx-auto mt-8 text-sm flex items-center justify-between px-4 _widthM"
              style={{ maxWidth: "1100px" }}
            >
              <span className="text-left">{t("lottery.TrustedContract")}</span>
              <a
                href={`${chainInfo?.explorerUrl}/address/${poolManager}#code`}
                target="_blank"
                className="flex items-center"
              >
                <span className="_text _hiddenM">{poolManager}</span>
                <span className="_title _hiddenP underline">
                  {shortStr(poolManager)}
                </span>
                <button className="border rounded-xl px-3 py-1 ml-2 _borderS text-sm _hiddenM">
                  {t("lottery.Details")}
                </button>
              </a>
            </div>
          )}
        </div>
      </div>

      <Modal
        title={t("lottery.BuyTickets")}
        centered
        destroyOnClose={true}
        open={isShareOpen}
        onCancel={() => setIsShareOpen(false)}
        footer={false}
        width={420}
        closeIcon={
          <img
            className="w-6 mt-3 mr-2"
            src={require("../../asserts/img/closeModal.png")}
            alt=""
          />
        }
      >
        <div className="text-white flex items-center justify-between font-bold">
          <span>{t("lottery.Tickets")}</span>
          <span>
            1 {t("lottery.Ticket")} = {selectPool.pricePerTicket * 1}{" "}
            {USDTSymbol}
          </span>
        </div>
        <div
          className="w-full h-12 rounded-xl text-white pl-4 pr-4 text-sm mt-3 flex items-center justify-between"
          style={{ background: "rgba(42, 37, 57, 1)" }}
        >
          <input
            value={ticketAmount}
            onChange={(value) => setTicketAmount(value.target.value)}
            className="outline-none bg-transparent w-4/5 _inputStyle"
            placeholder={t("lottery.EnterAmount")}
          />
          <button className="_yellow text-base" onClick={maxBuyFun}>
            {t("lottery.Max")}
          </button>
        </div>
        <div className="flex items-center justify-between flex-wrap mt-3 _nav-title">
          <span>
            {t("lottery.RemainingTickets")}:{" "}
            <span className="_active">
              {" "}
              {selectPool?.roundInfo?.leftTickets}
            </span>
          </span>
          <span>
            {t("lottery.Balance")}: {accountBalance} {selectPool?.rewardSymbol}
          </span>
        </div>
        {contextHolder}

        {!address ? (
          <Button
            className="w-full h-12 mt-6 _background-gradient2 text-white rounded-full text-base pt-2 pb-2 pl-5 pr-5"
            onClick={() => {
              setIsShareOpen(false);
              open();
            }}
          >
            {t("lottery.ConnectWallet")}
          </Button>
        ) : (
          <>
            {allowance ? (
              <Button
                loading={buyLoading}
                className="w-full h-12 mt-6 _background-gradient2 text-white rounded-full text-base font-bold pt-2 pb-2 pl-5 pr-5"
                onClick={() => buyTicketFun(selectPool, ticketAmount)}
              >
                {t("lottery.Buy")}
              </Button>
            ) : (
              <Button
                loading={approveLoading}
                className="w-full h-12 mt-6 _background-gradient2 text-white rounded-full text-base font-bold pt-2 pb-2 pl-5 pr-5"
                onClick={() => approveTicketFun(selectPool.USDTAddress)}
              >
                {t("lottery.Approve")}
              </Button>
            )}
          </>
        )}

        <div className="text-center mt-5 mb-5 font-bold text-sm">
          {t("lottery.EndTime")}: {""}
          <CountDown
            offsetTimestamp={Math.abs(selectPool?.roundInfo?.endTime - nowDate)}
          />
        </div>
        <div className="text-left _nav-title text-xs">
          {t("lottery.BuyDesc")}
        </div>
      </Modal>

      <Modal
        title={t("lottery.YourLotteryNumber")}
        centered
        destroyOnClose={true}
        open={isRewardOpen}
        onCancel={() => setIsRewardOpen(false)}
        footer={false}
        closeIcon={
          <img
            className="w-6 mt-3 mr-2"
            src={require("../../asserts/img/closeModal.png")}
            alt=""
          />
        }
        width={420}
        className="text-center"
      >
        <Carousel
          afterChange={onChangeCarousel}
          infinite={false}
          dots={false}
          ref={carouselRef}
          className="w-10/12 mx-auto h-52 _carouselBox"
        >
          {selectTickets &&
            selectTickets.map((list) => {
              return (
                <div
                  key={list}
                  className="text-white h-56 flex items-center justify-center _backgroundTickets p-6"
                >
                  <div className="_yellow block text-center text-lg">
                    {t("lottery.LotteryNumber")}
                  </div>
                  <div className="text-center mt-4 text-6xl flex items-center justify-center">
                    {transferFun(list).map((number, index) => {
                      return (
                        <span
                          key={index}
                          className="w-14 rounded-lg mx-1 px-1 py-2 box-border font-bold"
                          style={{ background: "rgba(255, 255, 255, 0.2)" }}
                        >
                          {number}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </Carousel>
        <div className="w-11/12 flex item-center justify-between absolute left-4 _carouselBtn">
          <button
            className={`bg-neutral-600 rounded-full w-7 h-7 text-xl ${
              carouselIndex <= 0
                ? "text-gray-500 hover:bg-neutral-600"
                : "text-white hover:bg-violet-600"
            }`}
            onClick={goToPrevSlide}
          >
            {"<"}
          </button>
          <button
            className={`bg-neutral-600 rounded-full w-7 h-7 text-xl  ${
              carouselIndex >= selectTickets.length - 1
                ? "text-gray-500 hover:bg-neutral-600"
                : "text-white hover:bg-violet-600"
            }`}
            onClick={goToNextSlide}
          >
            {">"}
          </button>
        </div>
        <div className="text-center _nav-title">
          {t("lottery.TotalNumbers", { number: selectTickets.length })}
        </div>
      </Modal>

      <Modal
        title={t("lottery.Congratulations")}
        centered
        destroyOnClose={true}
        open={isWonOpen}
        onCancel={() => {
          setIsWonOpen(false);
          setOpeningRound({});
        }}
        footer={false}
        zIndex={1}
        closeIcon={
          <img
            className="w-6 mt-3 mr-2"
            src={require("../../asserts/img/closeModal.png")}
            alt=""
          />
        }
        width={380}
      >
        <div className="text-center">
          <img
            className="w-32 mx-auto"
            src={require("../../asserts/img/Congratulations.png")}
            alt=""
          />
          {openingRound.prize ? (
            <div className="flex flex-wrap items-center justify-between mt-10 _title _flexM2">
              <div className="flex-auto">
                {t("lottery.YouGot")}{" "}
                <span className="_active">{openingRound.prize}</span>{" "}
                {USDTSymbol}!
              </div>
              <div className="flex-auto">
                {t("lottery.WinningNumber")}:{" "}
                <span className="_active">
                  {getNewTickets(
                    openingRound.winNumber * 1,
                    openingRound.totalTickets * 1
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              {t("lottery.Unclaimed", { unclaimedPrizes })}
            </div>
          )}

          <Link
            to="/?reward"
            onClick={() => {
              setIsWonOpen(false);
              setOpeningRound({});
            }}
          >
            <button className="w-full _borderS rounded-full _background-gradient2 py-3 mt-6 font-bold">
              {t("referral.GoToClaim")}
            </button>
          </Link>
        </div>
      </Modal>

      <Modal
        title={t("lottery.Unfortunately")}
        centered
        destroyOnClose={true}
        open={noWon}
        onCancel={() => {
          setNoWon(false);
          setOpeningRound({});
        }}
        footer={false}
        zIndex={1}
        closeIcon={
          <img
            className="w-6 mt-3 mr-2"
            src={require("../../asserts/img/closeModal.png")}
            alt=""
          />
        }
        width={380}
      >
        <div className="text-center">
          <img
            className="w-32 mx-auto"
            src={require("../../asserts/img/noWon.png")}
            alt=""
          />
          <div className="flex flex-wrap items-center justify-between mt-10 _title _flexM2">
            <div className="flex-auto">{t("lottery.BetterLuckNextTime")}</div>
            <div className="flex-auto">
              {t("lottery.WinningNumber")}:{" "}
              <span className="_active">
                {getNewTickets(
                  openingRound.winNumber * 1,
                  openingRound.totalTickets * 1
                )}
              </span>
            </div>
          </div>
          <button
            className="w-full _borderS rounded-full _background-gradient2 py-3 mt-6 font-bold"
            onClick={() => {
              setNoWon(false);
              setOpeningRound({});
            }}
          >
            {t("lottery.Close")}
          </button>
        </div>
      </Modal>
      {stickyShow && (
        <button
          onClick={() =>
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: "smooth",
            })
          }
          className="_hiddenP fixed bottom-10 right-8 bg-gray-900 w-9 h-9 rounded-full flex items-center justify-center border border-neutral-500"
        >
          <img className="w-3.5" src={require("../../asserts/img/upTop.png")} />
        </button>
      )}
      <Footer />
    </div>
  );
}

export default Lottery;
