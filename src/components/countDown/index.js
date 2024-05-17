import { useInterval } from "ahooks";
import { computeCountdownInfo } from "../../utils";
import { useState } from "react";

const CountDown = (props) => {
  const { offsetTimestamp } = props;
  const [time, setTime] = useState(offsetTimestamp);

  useInterval(() => {
    setTime((time) => time - 1);
  }, 1000, { immediate: true });

  return <span>{computeCountdownInfo(time)}</span>;
};

export default CountDown;
