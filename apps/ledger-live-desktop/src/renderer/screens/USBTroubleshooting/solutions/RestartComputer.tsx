import React from "react";
import { useTranslation } from "react-i18next";
import { Wrapper, Illustration, Number, Title, Content, BulletRowIcon } from "./shared";
import Box from "~/renderer/components/Box";
import BulletRow from "~/renderer/components/BulletRow";
import Text from "~/renderer/components/Text";
import illustration from "~/renderer/images/USBTroubleshooting/illus3.png";
const RestartComputerSolution = ({ number = 1 }: { number?: number }) => {
  const { t } = useTranslation();
  const bullets = [
    t("connectTroubleshooting.steps.2.restart.bullets.0"),
    t("connectTroubleshooting.steps.2.restart.bullets.1"),
    t("connectTroubleshooting.steps.2.restart.bullets.2"),
  ];
  return (
    <Wrapper>
      <Number>
        {t("connectTroubleshooting.solution", {
          number,
        })}
      </Number>
      <Title>{t("connectTroubleshooting.steps.2.restart.title")}</Title>
      <Content>
        <Illustration image={illustration} />
        <Box flex={2}>
          <Text mb={3} ff="Inter|SemiBold" color="palette.text.shade90" fontSize={5}>
            {t("connectTroubleshooting.followSteps")}
          </Text>
          {bullets.map((bullet, i) => (
            <BulletRow
              key={i}
              step={{
                icon: <BulletRowIcon>{i + 1}</BulletRowIcon>,
                desc: (
                  <Text ff="Inter|Medium" fontSize={4}>
                    {bullet}
                  </Text>
                ),
              }}
            />
          ))}
        </Box>
      </Content>
    </Wrapper>
  );
};
export default RestartComputerSolution;
