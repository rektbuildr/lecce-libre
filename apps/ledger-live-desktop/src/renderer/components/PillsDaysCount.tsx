import React from "react";
import Pills from "~/renderer/components/Pills";
import { useTimeRange } from "~/renderer/actions/settings";


export default function PillsDaysCount() {
  const [selected, onChange, options] = useTimeRange();

  return (
    <>
      
      <Pills items={options} activeKey={selected} onChange={onChange} bordered />
    </>
  );
}
