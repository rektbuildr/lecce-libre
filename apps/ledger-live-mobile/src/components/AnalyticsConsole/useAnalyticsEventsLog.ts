import { useState, useCallback, useEffect, useRef } from "react";
import { map } from "rxjs/operators";
import { LoggableEventRenderable } from "./types";

export default function useAnalyticsEventsLog(limit = 40) {
  const id = useRef(0);
  const [items, setItems] = useState<LoggableEventRenderable[]>([]);
  const addItem = useCallback(
    (item: LoggableEventRenderable) => {
      setItems(currentItems => [...currentItems.slice(-(limit - 1)), item]);
    },
    [limit],
  );


  return {
    items,
  };
}
