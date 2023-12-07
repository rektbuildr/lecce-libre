import { useState, useCallback } from "react";


type Props = {
  hasNFTS: boolean;
};

export function useReceiveNFTsModal(props: Props) {
  const [isModalOpened, setModalOpened] = useState<boolean>(false);

  const openModal = useCallback(() => {
    
    setModalOpened(true);
  }, [props.hasNFTS]);

  const closeModal = useCallback(() => setModalOpened(false), [setModalOpened]);

  return {
    isModalOpened,
    openModal,
    closeModal,
  };
}
