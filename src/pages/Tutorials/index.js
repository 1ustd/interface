import { useState } from "react";
import { Link } from "react-router-dom";
import { Collapse } from "antd";
import { useTranslation } from "react-i18next";
function Tutorials() {
  const { t } = useTranslation();
  const qaList = [
    {
      key: "1",
      label: t("tutorials.QAs.title1"),
      children: <div>{t("tutorials.QAs.desc1")}</div>,
    },
    {
      key: "2",
      label: t("tutorials.QAs.title2"),
      children: <div>{t("tutorials.QAs.desc2")}</div>,
    },
    {
      key: "3",
      label: t("tutorials.QAs.title3"),
      children: <div>{t("tutorials.QAs.desc3")}</div>,
    },
    {
      key: "4",
      label: t("tutorials.QAs.title4"),
      children: <div>{t("tutorials.QAs.desc4")}</div>,
    },
    {
      key: "5",
      label: t("tutorials.QAs.title5"),
      children: <div>{t("tutorials.QAs.desc5")}</div>,
    },
  ];

  const onChange = (key) => {
    console.log(key);
  };

  return (
    <div className="_background1 _title">
      <div className="_background-tutorials">
        <div
          className="pt-20 pb-20 flex items-center justify-between _flexNo _paddingTB"
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
          }}
        >
          <div>
            <div className="text-5xl _lineHeight30 _referralTitle _size20">
            <p>{t("tutorials.title1")}</p>
            <p>{t("tutorials.title2")}</p>
            <p>{t("tutorials.title3")}</p>
            </div>

            <div
              className="flex items-center justify-between mt-10 _hiddenM"
              style={{ width: "400px" }}
            >
              <Link to="/">
                <button
                  className="_background-gradient2 h-10 pr-3 pl-3 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ width: "180px" }}
                >
                  {t("tutorials.PlayNow")}
                </button>
              </Link>
            </div>
          </div>

          <div className="_border rounded-3xl p-8 _background2 _marginLR _padding10 _marginTop _tutorialsInfo">
            <div className="_tutorialsInfoBox">
              <div className="pb-4 _title font-bold">{t("tutorials.HowParticipate")}</div>
              <div>
                <div className="flex items-start _backgroundLine">
                  <img
                    className="w-4 mr-3 mt-1"
                    src={require("../../asserts/img/point.png")}
                    alt=""
                  />
                  <div>
                    <p className="_title font-bold">{t("tutorials.Step1")}</p>
                    <p className="_text text-xs pt-2 pb-4">
                      {t("tutorials.StepDesc1")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start _backgroundLine">
                  <img
                    className="w-4 mr-3 mt-1"
                    src={require("../../asserts/img/point.png")}
                    alt=""
                  />
                  <div>
                    <p className="_title font-bold">{t("tutorials.Step2")}</p>
                    <p className="_text text-xs pt-2 pb-4">
                    {t("tutorials.StepDesc2")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <img
                    className="w-4 mr-3 mt-1"
                    src={require("../../asserts/img/point.png")}
                    alt=""
                  />
                  <div>
                    <p className="_title font-bold">{t("tutorials.Step3")}</p>
                    <p className="_text text-xs pt-2 pb-4">
                      {t("tutorials.StepDesc3")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{ maxWidth: "1180px" }}
          className="_marginLR _marginAuto0 _paddingB20"
        >
          <div className="text-2xl font-bold mb-6">{t("tutorials.Q&A")}</div>
          <div className="pb-20">
            <Collapse
              expandIconPosition={"end"}
              expandIcon={(value) => {
                return (
                  <img
                    style={{
                      width: "18px",
                      transform: value.isActive
                        ? "rotate(90deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s linear",
                    }}
                    src={require("../../asserts/img/right.png")}
                    alt=""
                  />
                );
              }}
              items={qaList}
              defaultActiveKey={["1"]}
              onChange={onChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tutorials;
