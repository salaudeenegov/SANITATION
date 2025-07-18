import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const useCardPaymentDetails = (props, t) => {
  const config = [
    {
      head: t("PAYMENT_CARD_HEAD"),
      headId: "paymentInfo",
      body: [
        {
          withoutLabel: true,
          type: "custom",
          populators: {
            name: "paymentModeDetails",
            customProps: {},
            defaultValue: {},
            component: (props, customProps) => <CardDetailsComponent onChange={props.onChange} value={props.value} {...customProps} />,
          },
        },
      ],
    },
  ];

  return { cardConfig: config };
};

const CardDetailsComponent = ({ ...props }) => {
  const { t } = useTranslation();
  const [transactionNumber, setTransactionNumber] = useState(props?.value?.transactionNumber);
  const [reTransanctionNumber, setReTransanctionNumber] = useState(props?.value?.reTransanctionNumber);
  const isFSM = window?.location.pathname.includes("FSM");

  useEffect(() => {
    if (props.onChange) {
      let errorObj = {};
      if (!transactionNumber) errorObj.transactionNumber = "ES_COMMON_TRANSANCTION_NO";
      if (!reTransanctionNumber) errorObj.reTransanctionNumber = "ES_COMMON_RE_TRANSANCTION_NO";
      props.onChange({ transactionNumber, reTransanctionNumber, errorObj });
    }
  }, [transactionNumber, reTransanctionNumber]);

  return (
    <React.Fragment>
      <div className="label-field-pair">
        <h2 className="card-label">{`${t("NOC_PAYMENT_TRANS_NO_LABEL")} *`}</h2>
        <div className="field">
          <div className="field-container">
            <input
              className="employee-card-input"
              value={transactionNumber}
              type="text"
              name="instrumentNumber"
              required
              onChange={(e) => setTransactionNumber(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="label-field-pair">
        <h2 className="card-label">{`${t("NOC_PAYMENT_RENTR_TRANS_LABEL")} *`}</h2>
        <div className="field">
          <div className="field-container">
            <input
              className="employee-card-input"
              value={reTransanctionNumber}
              type="text"
              name="instrumentNumber"
              required
              onChange={(e) => setReTransanctionNumber(e.target.value)}
            />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
