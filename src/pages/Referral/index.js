import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { notification, Button, Modal } from "antd";
import { getContract, getWriteContractLoad, checkNetWork } from "../../utils";
import {
  useWeb3ModalProvider,
  useWeb3Modal,
  useWeb3ModalAccount,
} from "@web3modal/ethers5/react";
import poolManagerAbi from "../../asserts/abi/poolManagerAbi.json";
import inviteAbi from "../../asserts/abi/inviteAbi.json";
import erc20Abi from "../../asserts/abi/erc20Abi.json";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import { useInterval } from "ahooks";
import { useTranslation } from "react-i18next";

function Referral() {
  const { t } = useTranslation();
  const { walletProvider } = useWeb3ModalProvider();
  const union = require("../../asserts/img/union.png");
  const address = useSelector((state) => state.address);
  const userId = useSelector((state) => state.userId);
  const inviteContract = useSelector((state) => state.inviteContract);

  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification({
    placement: "topRight",
    duration: 3,
    maxCount: 10,
  });
  const { open } = useWeb3Modal();

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
    address && inviteContract && getUserId();
  }, [address, inviteContract]);

  const [signUpLoading, setSignUpLoading] = useState(false);
  const copyInfo = (msg) => {
    if (!address) {
      return open();
    }
    if (userId * 1 > 0) {
      api["success"]({ message: t("referral.CopiedSuccess") });
      navigator.clipboard.writeText(msg);
    } else {
      setSignUpLoading(true);
      getWriteContractLoad(
        walletProvider,
        inviteContract,
        inviteAbi,
        "signUp",
        0
      )
        .then((res) => {
          setSignUpLoading(false);
          api["success"]({ message: t("referral.GetCodeSuccess") });
          getUserId();
        })
        .catch((err) => {
          setSignUpLoading(false);
          api["error"]({ message: t("referral.GetCodeFail") });
          console.log(err);
        });
    }
  };

  const BindFun = () => {
    if (!address) {
      return open();
    }
    if (userId * 1 > 0) {
      notification.open({
        message: t("header.hadRegister"),
        duration: 5,
      });
    } else {
      dispatch({ type: "CHANGE_REMODAL", payload: true });
    }
  };

  const poolManager = useSelector((state) => state.poolManager);

  // get ReferralReward
  const [rewardAccumulated, setRewardAccumulated] = useState(0);
  const [rewardAccrued, setRewardAccrued] = useState(0);
  const [usdtSymbol, setUsdtSymbol] = useState("USDT");
  const referralRewardAccumulated = async () => {
    // 获取usdt信息
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
    const symbol = await getContract(walletProvider, usdt, erc20Abi, "symbol");
    setUsdtSymbol(symbol);

    const rewardAccumulated = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "referralRewardAccumulated",
      address
    );
    setRewardAccumulated(
      ethers.utils.formatUnits(rewardAccumulated, decimals) * 1
    );

    const rewardAccrued = await getContract(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "referralRewardAccured",
      address
    );
    setRewardAccrued(ethers.utils.formatUnits(rewardAccrued, decimals) * 1);
  };

  useEffect(() => {
    address && inviteContract && referralRewardAccumulated();
  }, [address, inviteContract]);

  useInterval(
    () => {
      address && inviteContract &&  referralRewardAccumulated();
    },
    2000,
    { immediate: true }
  );

  // collectReferralReward
  const [rewardLoading, setRewardLoading] = useState(false);
  const collectReferralReward = async () => {
    if (!(await checkNetWork())) {
      return open({ view: "Networks" });
    }
    setRewardLoading(true);
    await getWriteContractLoad(
      walletProvider,
      poolManager,
      poolManagerAbi,
      "collectReferralReward",
      address
    )
      .then((res) => {
        setRewardLoading(false);
        api["success"]({
          message: t("referral.ClaimSuccess"),
        });
        referralRewardAccumulated();
      })
      .catch((err) => {
        setRewardLoading(false);
        api["error"]({
          message: t("referral.ClaimFail"),
        });
        console.log(err);
      });
  };

  const [childrenCountOf, setChildrenCountOf] = useState(0);
  //获取参与人数
  const getChildrenCountOf = async () => {
    const childrenCountOf = await getContract(
      walletProvider,
      inviteContract,
      inviteAbi,
      "childrenCountOf",
      userId
    );
    setChildrenCountOf(childrenCountOf.toString());
  };

  useInterval(
    () => {
      address && userId > 0 && inviteContract ? getChildrenCountOf() : setChildrenCountOf("--");
    },
    2000,
    { immediate: true }
  );

  const [isWonOpen, setIsWonOpen] = useState(false);

  useEffect(() => {
    setIsWonOpen(rewardAccrued * 1 > 0);
  }, [rewardAccrued]);

  return (
    <div className="_background1 _title">
      <div className="_background-referral">
        <div
          className="pt-20 pb-20 flex items-center justify-between _referralHome _paddingTB"
          style={{ backgroundImage: `url(${union})` }}
        >
          <div className="_tipsBox _marginLR">
            <div className="text-5xl _referralTitle _size20 _lineHeight30">
              <p>{t("referral.title1")}</p>
              <p>{t("referral.title2")}</p>
            </div>
            <div className="flex items-center justify-center _hiddenP">
              <img
                style={{ width: "300px", marginTop: "20px" }}
                src={require("../../asserts/img/reward.png")}
                alt=""
              />
            </div>
            <div className="mt-10 _marginAutoM" style={{ maxWidth: "500px" }}>
              <div className="flex items-center justify-between">
                <div className="font-bold">{t("referral.InviteFriends")}</div>
                {/* <div className="flex items-center justify-between">
                  <span className="_text">{t("referral.InviteCode")}:</span>
                  <span className="mx-2 _active">
                    {userId * 1 > 0 ? userId : "--"}
                  </span>
                  <img
                    onClick={() => copyInfo(userId)}
                    className="w-4 cursor-pointer"
                    src={require("../../asserts/img/copyS.png")}
                  />
                </div> */}
              </div>
              <div className="flex items-center justify-between mt-3 border rounded-md _borderS1 relative text-nowrap">
                <span className="px-4 py-3 leading-5 text-sm">{`${
                  window.location.origin
                }?code=${userId * 1 > 0 ? userId : "--"}`}</span>
                <Button
                  loading={signUpLoading}
                  onClick={() =>
                    copyInfo(`${window.location.origin}?code=${userId}`)
                  }
                  className="px-4 _background-gradient2 absolute rounded-none rounded-r-md"
                  style={{ top: "-1px", right: "-1px", height: "46px" }}
                >
                  {!address
                    ? t("referral.ConnectWallet")
                    : userId * 1 <= 0
                    ? t("referral.GetCode")
                    : t("referral.CopyLink")}
                </Button>
              </div>
              {/* <div className="flex items-center justify-between mt-4">
                <span>{t('referral.BindCode')}</span>
                <button className="_active" onClick={() => BindFun()}>
                {t('referral.GoToBind')}{">"}{" "}
                </button>
              </div> */}
            </div>
          </div>
          <div className="pr-4 _hiddenM">
            <img
              style={{ width: "352px" }}
              src={require("../../asserts/img/reward.png")}
              alt=""
            />
          </div>
        </div>
        <div>
          <div
            className="_tipsBox mt-10 _marginLR"
            style={{
              maxWidth: "1182px",
              margin: "0 auto",
            }}
          >
            <div className="_tipsTitle text-lg mb-6">
              {t("referral.MyComission")}
            </div>
            <div className="text-xs _text ">
              <div className="rounded-xl px-5 py-12 _background-gradient5 _M100 _border flex items-center text-center _flexM">
                <div className="w-3/12 border-r border-zinc-800">
                  <div className="text-2xl _active font-bold">
                    {childrenCountOf}
                  </div>
                  <p className="pt-4 text-xs">{t("referral.Friends")}</p>
                </div>
                <div className="w-4/12 flex items-center justify-center border-r border-zinc-800">
                  <div className="">
                    <div className="flex items-center">
                      <img
                        className="w-8 pr-2"
                        src={require("../../asserts/img/USDT.png")}
                        alt=""
                      />
                      <span className="text-2xl text-white font-bold">
                        {userId > 0
                          ? parseFloat(
                              (rewardAccumulated - rewardAccrued).toFixed(2)
                            )
                          : "--"}{" "}
                        {usdtSymbol}
                      </span>
                    </div>
                    <p className="pt-4 text-xs">
                      {t("referral.ClaimedComission")}
                    </p>
                  </div>
                </div>
                <div className="w-5/12 flex items-end justify-center">
                  <div className="">
                    <div className="flex items-center">
                      <img
                        className="w-8 pr-2"
                        src={require("../../asserts/img/USDT.png")}
                        alt=""
                      />
                      <span className="text-2xl text-white font-bold">
                        {userId > 0 ? rewardAccrued : "--"} {usdtSymbol}
                      </span>
                    </div>
                    <p className="pt-4 text-xs">
                      {t("referral.UnclaimedComission")}
                    </p>
                  </div>
                  {contextHolder}
                  <Button
                    disabled={!rewardAccrued}
                    loading={rewardLoading}
                    onClick={collectReferralReward}
                    className="_background-gradient2 h-10 pr-12 pl-12 rounded-full flex items-center justify-center text-sm text-white ml-10"
                  >
                    {t("lottery.Claim")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="_tipsBox"
          style={{
            maxWidth: "1182px",
            margin: "0 auto",
            marginTop: "50px",
            paddingBottom: "100px",
            overflow: "hidden",
          }}
        >
          <div className="_tipsTitle text-lg">{t("referral.Tips")}</div>
          <div className="text-xs _text flex items-start justify-between mt-6 relative pb-10 pt-10 _tips _background-gradient5 rounded-xl _border">
            <div className="w-1/4 flex flex-col items-center _tipDiv">
              <img
                className="w-16 text-center"
                src={require("../../asserts/img/i1.png")}
                alt=""
              />
              <div className="text-center mt-4 _desc">{t("referral.Tip1")}</div>
            </div>
            <div className="w-1/4 flex flex-col items-center _tipDiv">
              <img
                className="w-16"
                src={require("../../asserts/img/i2.png")}
                alt=""
              />
              <div className="text-center mt-4 _desc">{t("referral.Tip2")}</div>
            </div>
            <div className="w-1/4 flex flex-col items-center _tipDiv _paddingBNo">
              <img
                className="w-16"
                src={require("../../asserts/img/i3.png")}
                alt=""
              />
              <div className="text-center mt-4 _desc">{t("referral.Tip3")}</div>
            </div>
            <div
              className="absolute flex items-center _hiddenM"
              style={{ width: "22%", left: "20%", top: "36%" }}
            >
              <img
                style={{ width: "300px", height: "1px" }}
                src={require("../../asserts/img/line.png")}
                alt=""
              />
              <img
                className="ml-1"
                style={{ width: "5px" }}
                src={require("../../asserts/img/icon.png")}
                alt=""
              />
            </div>
            <div
              className="absolute flex items-center _hiddenM"
              style={{ width: "22%", right: "20%", top: "36%" }}
            >
              <img
                style={{ width: "300px", height: "1px" }}
                src={require("../../asserts/img/line.png")}
                alt=""
              />
              <img
                className="ml-1"
                style={{ width: "5px" }}
                src={require("../../asserts/img/icon.png")}
                alt=""
              />
            </div>
          </div>
        </div>
      </div>
      <Modal
        title={t("referral.YouGotDeserve")}
        centered
        destroyOnClose={true}
        open={isWonOpen}
        onCancel={() => setIsWonOpen(false)}
        footer={false}
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
          <div className="_active text-4xl font-bold">
            {rewardAccrued} {usdtSymbol}
          </div>
          <div className="mt-2 _title">{t("referral.YourCommission")}</div>
          <div className="mt-6 _text">{t("referral.YourCommissionDesc")}</div>
          <Link
            to="/referral"
            onClick={() => {
              setIsWonOpen(false);
            }}
          >
            <button className="w-full _borderS rounded-full _background-gradient2 py-3 mt-6 font-bold">
              {t("referral.GoToClaim")}
            </button>
          </Link>
        </div>
      </Modal>
    </div>
  );
}

export default Referral;
