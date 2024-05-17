import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
} from "@web3modal/ethers5/react";
import {
  shortStr,
  getContract,
  getWriteContractLoad,
  chainList,
  checkNetWork,
} from "../../utils";
import { Drawer, notification, Button, Modal, Popover } from "antd";
import { useSelector, useDispatch } from "react-redux";
import poolManagerAbi from "../../asserts/abi/poolManagerAbi.json";
import inviteAbi from "../../asserts/abi/inviteAbi.json";
import erc20Abi from "../../asserts/abi/erc20Abi.json";
import { ethers } from "ethers";
import { useInterval } from "ahooks";
import { useTranslation } from "react-i18next";
import { resources } from "../../config";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const logoIcon = require("../../asserts/img/logo.png");
  const { address, chainId, isConnected } = useWeb3ModalAccount();

  const { walletProvider } = useWeb3ModalProvider();

  const { open } = useWeb3Modal();

  // const { switchNetwork } = useSwitchNetwork();

  // useEffect(() => {
  //   isConnected && chainId && switchNetwork(chainList.filter(list=> list.chainId == chainId)[0].chainId);
  // }, [chainId, isConnected]);

  const selectNetworkIcon = (chainId) => {
    return chainList.filter((list) => list.chainId == chainId)[0];
  };

  const [openDrawer, setOpenDrawer] = useState(false);

  const showDrawer = () => {
    setOpenDrawer(true);
  };

  const onClose = () => {
    setOpenDrawer(false);
    setShowList(false);
  };

  // get userID fun
  const dispatch = useDispatch();
  const inviteContract = useSelector((state) => state.inviteContract);

  const reModalOpen = useSelector(
    (state) => state.reModalOpen,
    (pre, next) => pre === next
  );

  const getUserId = async () => {
    const userId = await getContract(
      walletProvider,
      inviteContract,
      inviteAbi,
      "getUserId",
      address
    );
    dispatch({ type: "CHANGE_USER", payload: userId.toString() });
  };

  useEffect(() => {
    // get userId
    address && chainId
      ? getUserId()
      : dispatch({ type: "CHANGE_USER", payload: "--" });
    // save address
    dispatch({ type: "CHANGE_ADDRESS", payload: address });
  }, [address, chainId]);

  const [code, setCode] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  const userId = useSelector((state) => state.userId);

  const [openUserAccount, setOpenUserAccount] = useState(false);

  const [api, contextHolder] = notification.useNotification({
    placement: "topRight",
    duration: 3,
    top: openUserAccount ? 320 : 0,
    maxCount: 10,
    zIndex: 100000,
  });

  const inviteCode = location.search.split("?code=")[1] * 1;
  const [openTips, setOpenTips] = useState(true);

  const inviteFun = () => {
    if (isConnected) {
      if (inviteCode * 1 > 0) {
        if (userId * 1 <= 0) {
          setCode(inviteCode);
          dispatch({ type: "CHANGE_REMODAL", payload: true });
        } else {
          setOpenTips(true);
          if (openTips) {
            notification.open({
              message: t("header.hadRegister"),
              duration: 3,
            });
          }
          dispatch({ type: "CHANGE_REMODAL", payload: false });
          setOpenTips(false);
        }
      }
    } else {
      if (inviteCode * 1 > 0) {
        setCode(inviteCode);
        dispatch({ type: "CHANGE_REMODAL", payload: true });
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      inviteFun();
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [isConnected, address, inviteCode, openTips, userId]);

  // user signup
  const signUp = () => {
    setSignUpLoading(true);
    getWriteContractLoad(
      walletProvider,
      inviteContract,
      inviteAbi,
      "signUp",
      code ? code * 1 : 0
    )
      .then((res) => {
        setSignUpLoading(false);
        getUserId();
        setCode("");
        api["success"]({ message: t("header.bindSuccess") });
        setTimeout(() => {
          setOpenTips(false);
          dispatch({ type: "CHANGE_REMODAL", payload: false });
        }, 2000);
      })
      .catch((err) => {
        setSignUpLoading(false);
        api["error"]({ message: t("header.bindFail") });
        console.log(err);
      });
  };

  const handleOpenChange = (newOpen) => {
    setOpenUserAccount(newOpen);
  };

  const { disconnect } = useDisconnect();

  const [ETHBalance, setETHBalance] = useState("--");
  const [USDTBalance, setUSDTBalance] = useState("--");
  const getBalance = async () => {
    const ethersProvider = new ethers.providers.Web3Provider(walletProvider);
    const balanceOf = await ethersProvider.getBalance(address);
    const balance = parseFloat(
      (ethers.utils.formatUnits(balanceOf, 18) * 1).toFixed(3)
    );
    setETHBalance(balance);
  };

  const poolManager = useSelector((state) => state.poolManager);

  const getUSDTBalance = async () => {
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
    const balance = parseFloat(
      (ethers.utils.formatUnits(balanceOf, decimals) * 1).toFixed(3)
    );
    setUSDTBalance(balance);
  };

  useEffect(() => {
    address && chainId ? getBalance() : setETHBalance("--");
    address && chainId ? getUSDTBalance() : setUSDTBalance("--");
  }, [address, chainId]);

  useInterval(
    () => {
      address ? getBalance() : setETHBalance("--");
      address ? getUSDTBalance() : setUSDTBalance("--");
    },
    5000,
    { immediate: true }
  );

  const AccountContent = () => {
    const copy = (address) => {
      api["success"]({ message: t("referral.CopiedSuccess") });
      navigator.clipboard.writeText(address);
    };
    return (
      <div className="font-medium">
        {contextHolder}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 cursor-pointer">
          <div className="flex items-center" onClick={() => copy(address)}>
            <img
              className="w-7"
              src={require("../../asserts/img/connect.png")}
              alt=""
            />
            <span className="px-2">{shortStr(address)}</span>

            <img
              className="w-4 cursor-pointer"
              src={require("../../asserts/img/copy.png")}
              alt=""
            />
          </div>
          <div
            className="rounded-xl _background3 p-2 flex items-center justify-center closeWallet"
            onClick={() => {
              setOpenUserAccount(false);
              disconnect();
            }}
          ></div>
        </div>
        <div>
          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center">
              <img
                className="w-6"
                src={require("../../asserts/img/USDT.png")}
                alt=""
              />
              <span className="ml-2">USDT</span>
            </div>
            <div>{USDTBalance}</div>
          </div>
          <div className="flex items-center justify-between mt-5 pb-5 border-b border-zinc-800">
            <div className="flex items-center">
              <img
                className="w-6"
                src={require("../../asserts/img/ETH.png")}
                alt=""
              />
              <span className="ml-2">ETH</span>
            </div>
            <div>{ETHBalance}</div>
          </div>
        </div>
        <div className="text-center">
          <a
            href="https://www.okx.com/zh-hans/web3/dex-swap/bridge#inputChain=1&inputCurrency=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&outputChain=42161&outputCurrency=0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"
            target="_black"
          >
            <button className="mt-5 w-full h-11 rounded-xl _borderS2 _background-gradient6">
              {t("header.BridgeAndSwap")}
            </button>
          </a>
        </div>
      </div>
    );
  };

  const [openCommunity, setOpenCommunity] = useState(false);
  const OpenCommunityChange = (newOpen) => {
    setOpenCommunity(newOpen);
  };
  const Community = () => {
    return (
      <>
        <div className="p-2 border-b border-neutral-800 font-bold">
          <a
            href="https://discord.com"
            target="_blank"
            className="flex items-center py-2 pl-4 pr-8 rounded-xl cursor-pointer list"
          >
            <img
              className="w-5 mr-2"
              src={require("../../asserts/img/Discord.png")}
              alt=""
            />
            Discord
          </a>
        </div>
        <div className="p-2 border-b border-neutral-800 font-bold">
          <a
            href="https://twitter.com"
            target="_blank"
            className="flex items-center py-2 pl-4 pr-8 rounded-xl cursor-pointer list"
          >
            <img
              className="w-5 mr-2"
              src={require("../../asserts/img/Twitter.png")}
              alt=""
            />
            Twitter
          </a>
        </div>
        <div className="p-2 font-bold">
          <a
            href="https://github.com/1ustd"
            target="_blank"
            className="flex items-center py-2 pl-4 pr-8 rounded-xl cursor-pointer list"
          >
            <img
              className="w-5 mr-2"
              src={require("../../asserts/img/Github.png")}
              alt=""
            />
            Github
          </a>
        </div>
      </>
    );
  };

  const [openLang, setOpenLang] = useState(false);
  const langOpenChange = (value) => {
    setOpenLang(value);
  };

  const [currentLang, setCurrentLang] = useState(i18n.language);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, [window.innerWidth]);

  const LangList = () => {
    const langArr = [];
    for (let key in resources) {
      langArr.push(key);
    }

    return (
      <div className="cursor-pointer">
        {langArr.map((list, index) => {
          return (
            <div key={list}>
              {!isMobile ? (
                <div className="text-center _langList">
                  <button
                    className={`rounded-md px-2 h-8 m-2 ${
                      i18n.language == list && "active"
                    }`}
                    onClick={() => {
                      setOpenLang(false);
                      setCurrentLang(list);
                      i18n.changeLanguage(list);
                      window.localStorage.setItem("lang", list);
                    }}
                  >
                    {showLang(list)}
                  </button>
                </div>
              ) : (
                <div className="text-left _text text-sm">
                  <div
                    className={
                      "flex item-center justify-between rounded-md px-4 h-8 m-2"
                    }
                    onClick={() => {
                      setOpenLang(false);
                      setCurrentLang(list);
                      i18n.changeLanguage(list);
                      window.localStorage.setItem("lang", list);
                    }}
                  >
                    <span>{showLang(list)}</span>
                    {i18n.language == list && (
                      <img
                        className="w-5 h-5"
                        src={require("../../asserts/img/selected.png")}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const showLang = (lang) => {
    switch (lang) {
      case "en":
        return "English";
      case "ko":
        return "한국인";
      case "vi":
        return "Tiếng Việt";
      case "zh-TW":
        return "繁體中文";
      default:
        return "English";
    }
  };

  const [showList, setShowList] = useState(false);

  const [faucetModalOpen, setFaucetModalOpen] = useState(false);

  const [mintLoading, setMintLoading] = useState(false);
  const mintUSDT = async () => {
    if (!(await checkNetWork())) {
      return open({ view: "Networks" });
    }
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
    setMintLoading(true);

    await getWriteContractLoad(
      walletProvider,
      usdt,
      erc20Abi,
      "mint",
      ethers.utils.parseUnits("1000", decimals)
    )
      .then((res) => {
        setMintLoading(false);
        api["success"]({ message: t("header.getSuccess") });
        setTimeout(() => {
          setFaucetModalOpen(false);
        }, 2000);
      })
      .catch((err) => {
        setMintLoading(false);
        api["error"]({ message: t("header.getFail") });
      });
  };

  return (
    <div className="h-18 flex items-center justify-between pl-5 pr-5 border-spacing-1 text-white _background1 _line relative">
      <div>
        <Link to="">
          <img className="h-5 mt-6 mb-6" src={logoIcon} alt="" />
        </Link>
      </div>

      <div
        className="flex items-center font-medium _hiddenM"
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translate(-50%)",
        }}
      >
        <Link
          className={`ml-6 mr-6 ${
            location.pathname === "/" ? "_active" : "_title"
          }`}
          to="/"
        >
          {t("header.Lottery")}
        </Link>
        <Link
          className={`ml-6 mr-6 ${
            location.pathname === "/referral" ? "_active" : "_title"
          }`}
          to="/referral"
        >
          {t("header.Referral")}
        </Link>
        <Link
          className={`ml-6 mr-6 ${
            location.pathname === "/tutorials" ? "_active" : "_title"
          }`}
          to="/tutorials"
        >
          {t("header.Tutorials")}
        </Link>

        <Popover
          content={<Community />}
          trigger="click"
          placement="bottom"
          arrow={false}
          color={"#1C172A"}
          open={openCommunity}
          onOpenChange={OpenCommunityChange}
          overlayClassName="communityList"
        >
          <button className="px-6 cursor-pointer flex items-center">
            <span>{t("header.Community")}</span>
            <img
              className={`w-3 ml-1 mt-0.5 ${
                openCommunity ? "rotate-180" : "animate-bounce"
              }`}
              src={require("../../asserts/img/down.png")}
              alt=""
            />
          </button>
        </Popover>
      </div>
      <div className="flex items-center">
        {chainId == 11155111 && (
          <button
            className="_border rounded-full p-2 text-sm mr-2 flex items-center"
            onClick={() => {
              isConnected ? setFaucetModalOpen(true) : open();
            }}
          >
            <img
              className="h-5"
              src={require("../../asserts/img/faucets.png")}
              alt=""
            />
            {/* <span className="ml-2 _hiddenM">{t("header.Faucets")}</span> */}
          </button>
        )}
        {isConnected && (
          <button
            className={`rounded-full p-2 text-sm mr-2 flex items-center border ${
              !selectNetworkIcon(chainId) ? "border-red-700" : "_border"
            }`}
            onClick={() => open({ view: "Networks" })}
          >
            {selectNetworkIcon(chainId) ? (
              <img
                className="w-5"
                src={selectNetworkIcon(chainId)?.url}
                alt=""
              />
            ) : (
              <>
                <img
                  className="w-5 _hiddenP"
                  src={require("../../asserts/img/warning.png")}
                  alt=""
                />

                <Popover
                  content={t("header.NetworkUnsupported")}
                  trigger="hover"
                  placement="bottom"
                  color={"#1C172A"}
                  overlayClassName="wrongNetwork"
                >
                  <span className="px-2 text-red-500 _hiddenM">
                    {t("header.WrongNetwork")}
                  </span>
                </Popover>
              </>
            )}
          </button>
        )}

        <button
          className={`_border rounded-full p-2 md:pl-4 md:pr-4 text-sm ${
            address ? "_borderW" : "_borderS pl-4 pr-4"
          }`}
        >
          {address ? (
            <Popover
              content={<AccountContent />}
              trigger="click"
              placement="bottomRight"
              arrow={false}
              color={"#1C172A"}
              open={openUserAccount}
              onOpenChange={handleOpenChange}
              overlayClassName="accountInfo"
            >
              <div className="flex items-center justify-between">
                <img
                  className="w-5"
                  src={require("../../asserts/img/connect.png")}
                  alt=""
                />
                <span className="pl-2 _hiddenM">{shortStr(address, 5, 4)}</span>
                <img
                  className="w-3 ml-2 mt-0.5 _hiddenM"
                  src={require("../../asserts/img/walletDown.png")}
                  alt=""
                />
              </div>
            </Popover>
          ) : (
            <span onClick={() => open()}>{t("lottery.ConnectWallet")}</span>
          )}
        </button>
        <button
          className="flex items-center justify-center _borderW rounded-full p-2 ml-2 _hiddenP"
          onClick={showDrawer}
        >
          <img
            style={{ transform: openDrawer ? "rotate(90deg)" : "rotate(0deg)" }}
            className="w-5"
            src={require("../../asserts/img/menu.png")}
            alt=""
          />
        </button>
        <div className="_hiddenM">
          <Popover
            content={<LangList />}
            trigger="click"
            placement="bottomRight"
            arrow={false}
            color={"#1C172A"}
            open={openLang}
            onOpenChange={langOpenChange}
            overlayClassName="langList _hiddenM"
          >
            <button className="_border rounded-full p-2 text-sm ml-2 flex items-center _hiddenM">
              <img
                className="w-5"
                src={require("../../asserts/img/lang.png")}
                alt=""
              />
            </button>
          </Popover>
        </div>
      </div>
      <Drawer
        width={"80vw"}
        closeIcon={false}
        onClose={onClose}
        open={openDrawer}
      >
        <div className="drawerTitle">
          <img
            className="h-5 mt-6 mb-6"
            src={require("../../asserts/img/logo.png")}
            alt=""
          />
          <img
            className="w-5 mr-1"
            src={require("../../asserts/img/drawerClose.png")}
            onClick={onClose}
            alt=""
          />
        </div>
        <div className="text-lg">
          <p className="pt-5 pb-5" onClick={onClose}>
            <Link
              className={`ml-6 mr-6 flex items-center justify-between ${
                location.pathname === "/" && location.search === ""
                  ? "_active"
                  : ""
              }`}
              to="/"
            >
              <span>{t("header.Lottery")}</span>
              <img
                className="w-4"
                src={require("../../asserts/img/drawerRight.png")}
                alt=""
              />
            </Link>
          </p>

          <p className="pt-5 pb-5" onClick={onClose}>
            <Link
              className={`ml-6 mr-6  flex items-center justify-between ${
                location.pathname === "/referral" ? "_active" : ""
              }`}
              to="/referral"
            >
              <span>{t("header.Referral")}</span>
              <img
                className="w-4"
                src={require("../../asserts/img/drawerRight.png")}
                alt=""
              />
            </Link>
          </p>
          <p className="pt-5 pb-5" onClick={onClose}>
            <Link
              className={`ml-6 mr-6  flex items-center justify-between ${
                location.pathname === "/tutorials" ? "_active" : ""
              }`}
              to="/tutorials"
            >
              <span>{t("header.Tutorials")}</span>
              <img
                className="w-4"
                src={require("../../asserts/img/drawerRight.png")}
                alt=""
              />
            </Link>
          </p>
          <p className="pt-5 pb-5" onClick={onClose}>
            <Link
              className={`ml-6 mr-6 flex items-center justify-between ${
                location.pathname === "/" && location.search === "?reward"
                  ? "_active"
                  : ""
              }`}
              to="/?reward"
            >
              <span>{t("lottery.tabs.MyReward")}</span>
              <img
                className="w-4"
                src={require("../../asserts/img/drawerRight.png")}
                alt=""
              />
            </Link>
          </p>
          <p
            className="pt-5 pb-5"
            onClick={() => setShowList((state) => (state = !state))}
          >
            <div className="ml-6 mr-6 flex items-center justify-between">
              <span>{t("header.Language")}</span>
              <div className="flex items-center">
                <span className="text-sm _text">{showLang(currentLang)}</span>
                <img
                  className={`w-4 ml-1 ${showList && "rotate-90"}`}
                  src={require("../../asserts/img/drawerRight.png")}
                  alt=""
                />
              </div>
            </div>
          </p>
          {showList && <LangList />}
        </div>

        <div className="flex items-center justify-around absolute bottom-8 w-full">
          <div
            className="rounded-xl w-1/4 h-12"
            style={{ background: "#2a2539" }}
          >
            <a
              target="_blank"
              href="https://discord.com"
              className="w-full h-full flex items-center justify-center"
            >
              <img
                className="w-5"
                src={require("../../asserts/img/discordM.png")}
                alt=""
              />
            </a>
          </div>
          <div
            className="rounded-xl w-1/4 h-12"
            style={{ background: "#2a2539" }}
          >
            <a
              target="_blank"
              href="https://twitter.com"
              className="w-full h-full flex items-center justify-center"
            >
              <img
                className="w-5"
                src={require("../../asserts/img/twitterM.png")}
                alt=""
              />
            </a>
          </div>
          <div
            className="rounded-xl w-1/4 h-12"
            style={{ background: "#2a2539" }}
          >
            <a
              target="_blank"
              href="https://github.com/1ustd"
              className="w-full h-full flex items-center justify-center"
            >
              <img
                className="w-5"
                src={require("../../asserts/img/githubM.png")}
                alt=""
              />
            </a>
          </div>
        </div>
      </Drawer>
      <Modal
        title={t("header.JoinUs")}
        destroyOnClose={true}
        centered
        maskClosable={false}
        open={reModalOpen}
        onCancel={() => {
          dispatch({ type: "CHANGE_REMODAL", payload: false });
          setCode("");
          navigate();
        }}
        footer={false}
        closeIcon={
          <img
            className="w-6 mt-3 mr-2"
            src={require("../../asserts/img/closeModal.png")}
            alt=""
          />
        }
        width={420}
        zIndex={3000}
      >
        <p className="mt-5 _nav-title">{t("header.JoinUsDesc")}</p>
        <div>
          <input
            value={code}
            onChange={(value) => setCode(value.target.value)}
            className="w-full h-12 rounded-xl outline-none text-white pl-4 pr-4 text-sm mt-5"
            style={{ background: "rgba(42, 37, 57, 1)" }}
            placeholder={t("header.EnterInviteCode")}
          />
        </div>
        {contextHolder}
        <Button
          className="w-full h-12 mt-5 _background-gradient2 text-white rounded-full text-sm pt-2 pb-2 pl-5 pr-5 border-0"
          loading={signUpLoading}
          onClick={() => {
            address ? signUp() : open();
          }}
        >
          {address ? t("header.SignUp") : t("lottery.ConnectWallet")}
        </Button>
      </Modal>
      <Modal
        title={t("header.OneUSDTTestnetFaucet")}
        destroyOnClose={true}
        centered
        maskClosable={true}
        open={faucetModalOpen}
        onCancel={() => {
          setFaucetModalOpen(false);
        }}
        footer={false}
        closeIcon={
          <img
            className="w-6 mt-2 mr-2"
            src={require("../../asserts/img/closeModal.png")}
            alt=""
          />
        }
        width={430}
        zIndex={3000}
      >
        <div
          className={`flex items-center justify-around text-center ${
            currentLang == "ko" && "_flex-col h-auto"
          }`}
        >
          <div
            className={`h-40 flex flex-col items-center justify-between ${
              currentLang == "ko" && "w-full"
            }`}
          >
            <div
              className="flex items-center justify-center rounded-full w-14 h-14"
              style={{ boxShadow: "0px 3px 6px 0px #A301FF inset" }}
            >
              <img
                className="w-10"
                src={require("../../asserts/img/ETH.png")}
                alt=""
              />
            </div>
            <div className="w-11/12 text-xs _title opacity-80 my-4">
              {t("header.TestnetFaucetDesc1")}
            </div>
            <a
              target="_blank"
              href="https://www.alchemy.com/faucets/ethereum-sepolia"
            >
              <button className="_borderS1 rounded-full px-4 py-2 font-bold">
                {t("header.GetETH")}
              </button>
            </a>
          </div>
          <div
            className={`h-40 flex flex-col items-center justify-between ${
              currentLang == "ko" && "_mt-6"
            }`}
          >
            <div
              className="flex items-center justify-center rounded-full w-14 h-14"
              style={{ boxShadow: "0px 3px 6px 0px #A301FF inset" }}
            >
              <img
                className="w-10"
                src={require("../../asserts/img/USDT.png")}
                alt=""
              />
            </div>
            <div className="w-11/12 text-xs _title opacity-80 my-4">
              {t("header.TestnetFaucetDesc2")}
            </div>
            {contextHolder}
            <Button
              loading={mintLoading}
              className="_background-gradient2 rounded-full px-4 h-10 font-bold"
              onClick={mintUSDT}
            >
              {t("header.GetUSDT")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Header;
