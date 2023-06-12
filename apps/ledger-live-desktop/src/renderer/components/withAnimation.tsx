import Lottie from "react-lottie";
import { Flex } from "@ledgerhq/react-ui";
import styled from "styled-components";
import React, { Fragment, useCallback, useState } from "react";
import confetti from "~/renderer/animations/confetti";

const Wrapper = styled.div`
  position: relative;
  pointer-events: none;
  & > * {
    pointer-events: auto;
  }
`;

const CenterMe = styled.div<{ blue?: boolean }>`
  // The lottie should be untouchable, render only once
  // be centered on the wrapping children and beautiful.
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  pointer-events: none;
  z-index: 9999;
  svg {
    filter: hue-rotate(${p => `${p.blue ? 180 : 0}deg`});
  }
`;

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (arg0: any) => any;
  // When the value is truthy we will trigger the animation as it changes, this allows us to
  // display centered on a random component via proxy just by changing the prop
  animationNonce?: number;
  blue?: boolean; // Hue rotate (wip)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animation?: any; // Override the animation
  // Trigger animationwhen the user clicks, this could be extended to other events but
  // it's essentially a wrapper over the listener to increase the trigger nonce.
  onClickAnimate?: boolean;
  // Some elements want to be wrapped, like buttons, some dont like to be wrapped.
  wrapped?: boolean;
  // Defaulting to 440, allow for smaller or larger animations.
  animationSize?: number;
};

const withAnimation = <T,>(Component: React.ComponentType<T>) => {
  const WrappedComponent = (props: T & Props) => {
    const {
      animationSize = 200,
      blue,
      wrapped = true,
      onClick,
      onClickAnimate,
      animationNonce = 0,
      animation = confetti,
      ...rest
    } = props;
    const [nonce, setNonce] = useState(animationNonce);
    const wrappedOnClick = useCallback(() => {
      setNonce(nonce => ++nonce);
    }, []);

    const MaybeFlex = wrapped ? Flex : Fragment;
    return (
      <MaybeFlex key={animationNonce}>
        <Wrapper>
          <CenterMe blue={blue}>
            {nonce || animationNonce ? (
              <Lottie
                key={`key_${nonce}_${animationNonce}`}
                style={{ width: animationSize, height: animationSize }}
                isClickToPauseDisabled
                ariaRole="animation"
                options={{
                  loop: false,
                  autoplay: true,
                  animationData: animation,
                }}
              />
            ) : null}
          </CenterMe>
          <Component {...rest} onClick={onClickAnimate ? wrappedOnClick : onClick} />
        </Wrapper>
      </MaybeFlex>
    );
  };
  return WrappedComponent;
};

export default withAnimation;
