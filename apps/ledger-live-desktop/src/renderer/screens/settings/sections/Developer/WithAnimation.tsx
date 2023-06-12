import React, { useState, useCallback } from "react";
import { useHistory } from "react-router-dom";
import withAnimation from "~/renderer/components/withAnimation";
import { Alert, Text, Button, Flex } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import Animation from "~/renderer/animations";
import { DeviceModelId } from "@ledgerhq/types-devices";
import cart from "~/renderer/animations/cart";

const WithAnimation = () => {
  const [nonce, setNonce] = useState<number>(0);
  const [nonce2, setNonce2] = useState<number>(0);
  const history = useHistory();

  const onBack = useCallback(() => {
    history.push({ pathname: "/settings/developer" });
  }, [history]);

  return (
    <Flex flexDirection="column" p={5}>
      <Flex>
        <Button
          mb={5}
          ff="Inter|SemiBold"
          color="palette.text.shade100"
          fontSize={12}
          onClick={onBack}
        >
          {"<- Back"}
        </Button>
      </Flex>
      <Alert
        type="info"
        title={
          "Here's a list of usages for the withAnimation HOC that allows us to trigger confetti animations on both user actions or events."
        }
      />
      <Flex mt={5} p={2} flexDirection="column">
        <Flex flexDirection="row" mb={10}>
          <AnimationButton onClickAnimate onClick={() => {}} variant="main" outline>
            {"I throw red confetti"}
          </AnimationButton>
          <Flex ml={5}>
            <AnimationButton onClickAnimate blue onClick={() => {}} variant="main" outline>
              {"I throw blue confetti"}
            </AnimationButton>
          </Flex>
          <Flex ml={5}>
            <AnimationButton
              onClickAnimate
              animation={cart}
              onClick={() => {}}
              variant="main"
              outline
            >
              {"I show a cart thingie"}
            </AnimationButton>
          </Flex>
          <Flex ml={5}>
            <Button onClick={() => setNonce(x => ++x)} variant="main">
              {"On Animation"}
            </Button>
          </Flex>
          <Flex ml={5}>
            <Button onClick={() => setNonce2(x => ++x)} variant="main">
              {"On Text (but big!)"}
            </Button>
          </Flex>
        </Flex>
        <AnimationText wrapped={false} animationNonce={nonce2} animationSize={1000} mt={10}>
          {
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eu orci in nulla scelerisque maximus. Vivamus euismod auctor arcu vitae porta. Donec mattis mollis dignissim. Suspendisse vel arcu quis quam pretium aliquam. Vestibulum interdum pharetra erat at placerat. Duis fermentum fermentum massa, sed blandit nisl viverra quis. Proin sit amet lectus mollis, ullamcorper neque nec, porttitor ipsum. Etiam ullamcorper libero a lobortis sodales. Mauris eu arcu sit amet magna malesuada ultricies. Nulla tempus nibh arcu, at malesuada metus vehicula vitae. Praesent luctus iaculis suscipit. Ut ac augue urna. Nam feugiat accumsan augue id aliquet. Nunc pretium non turpis at feugiat. Nam accumsan lorem odio, faucibus varius mi scelerisque pellentesque. Vivamus suscipit dui id vehicula maximus. Nulla in orci sit amet nunc sagittis molestie. Fusce ornare odio et purus cursus hendrerit. Phasellus sem lectus, elementum a tempor quis, pharetra vel risus. Pellentesque rutrum porttitor placerat. Sed vel consectetur ligula. Phasellus libero nibh, cursus ac ullamcorper eu, vestibulum vitae nunc. Donec fringilla, elit vel fermentum dictum, massa urna posuere arcu, sed imperdiet massa turpis et odio."
          }
        </AnimationText>
        <AnimationFlex animationNonce={nonce}>
          <Animation
            animation={getDeviceAnimation(DeviceModelId.stax, "light", "plugAndPinCode") as object}
          />
        </AnimationFlex>
      </Flex>
    </Flex>
  );
};

/**
 * Just wrap whatever component and it should work out of the box.
 */
const AnimationButton = withAnimation(Button);
const AnimationText = withAnimation(Text);
const AnimationFlex = withAnimation(Flex);

export default withV3StyleProvider(WithAnimation);
