import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { carouselVisibilitySelector } from "~/renderer/reducers/settings";
import { setCarouselVisibility } from "~/renderer/actions/settings";

import Switch from "~/renderer/components/Switch";
import { CAROUSEL_NONCE } from "~/renderer/components/Carousel";
const CarouselVisibility = () => {
  const dispatch = useDispatch();
  const carouselVisibility = useSelector(carouselVisibilitySelector);
  const onSetCarouselVisibility = useCallback(
    (checked: boolean) => dispatch(setCarouselVisibility(checked ? 0 : CAROUSEL_NONCE)),
    [dispatch],
  );
  return (
    <>
      
      <Switch
        isChecked={carouselVisibility !== CAROUSEL_NONCE}
        onChange={onSetCarouselVisibility}
        data-test-id="settings-carousel-switch-button"
      />
    </>
  );
};
export default CarouselVisibility;
