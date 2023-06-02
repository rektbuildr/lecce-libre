import React, { useCallback, ReactNode, useEffect, useState, useRef } from "react";
import isEqual from "lodash/isEqual";
import semver from "semver";
import { useDispatch, useSelector } from "react-redux";
import { FeatureFlagsProvider } from "@ledgerhq/live-common/featureFlags/index";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { getAll, getValue } from "firebase/remote-config";
import { getEnv } from "@ledgerhq/live-common/env";
import { formatToFeatureId, useFirebaseRemoteConfig } from "./FirebaseRemoteConfig";
import { overriddenFeatureFlagsSelector } from "../reducers/settings";
import { setOverriddenFeatureFlag, setOverriddenFeatureFlags } from "../actions/settings";

let callCount = 0;
let callSumMs = 0;
let startDate = 0;
function on() {
  startDate = performance.now();
  callCount += 1;
}
function off() {
  callSumMs += performance.now() - startDate;
  console.log("average: ", callSumMs / callCount, "sum: ", callSumMs, callCount);
}

// const getFeatureWrapped = useCallback(
//   (...args) => {
//     on();
//     const res = getFeature(...args);
//     off();
//     return res;
//   },
//   [getFeature],
// );

const checkFeatureFlagVersion = (feature: Feature) => {
  if (
    feature.enabled &&
    feature.desktop_version &&
    !semver.satisfies(__APP_VERSION__, feature.desktop_version, { includePrerelease: true })
  ) {
    return {
      enabledOverriddenForCurrentDesktopVersion: true,
      ...feature,
      enabled: false,
    };
  }
  return feature;
};

type Props = {
  children?: ReactNode;
};

type AllValuesFirebaseId = Record<string, Feature>;
type AllValuesFormattedIds = { [key in FeatureId]?: Feature };

export const FirebaseFeatureFlagsProvider = ({ children }: Props): JSX.Element => {
  const remoteConfig = useFirebaseRemoteConfig();

  const allValuesFirebaseIdRef = useRef<AllValuesFirebaseId>({});
  const allValuesFormattedIdRef = useRef<AllValuesFormattedIds>({});

  useEffect(() => {
    if (remoteConfig) {
      const allFeatures = getAll(remoteConfig);
      const allValuesFirebaseId: AllValuesFirebaseId = {};
      const allValuesFormattedIds: AllValuesFormattedIds = {};
      Object.entries(allFeatures).forEach(([key, value]) => {
        try {
          const parsedValue = (JSON.parse(value.asString()) as unknown) as Feature;
          allValuesFirebaseId[key] = parsedValue;
          allValuesFormattedIds[formatToFeatureId(key)] = parsedValue;
        } catch (e) {
          console.error(e);
        }
      });
      allValuesFirebaseIdRef.current = allValuesFirebaseId;
      allValuesFormattedIdRef.current = allValuesFormattedIds;
    }
  }, [remoteConfig]);

  const localOverrides = useSelector(overriddenFeatureFlagsSelector);
  const dispatch = useDispatch();

  const getAllFlags = useCallback(
    (): Record<string, Feature> => allValuesFirebaseIdRef.current,
    [],
  );

  const isFeature = useCallback((key: string): boolean => {
    try {
      const value = allValuesFirebaseIdRef.current[key];
      return Boolean(value);
    } catch (error) {
      console.error(`Failed to check if feature "${key}" exists`);
      return false;
    }
  }, []);

  const getFeature = useCallback(
    (key: FeatureId, allowOverride = true): Feature | null => {
      try {
        // Nb prioritize local overrides
        if (allowOverride && localOverrides[key]) {
          return checkFeatureFlagVersion(localOverrides[key]);
        }

        const envFlags = getEnv("FEATURE_FLAGS") as { [key in FeatureId]?: Feature } | undefined;
        if (allowOverride && envFlags) {
          const feature = envFlags[key];
          if (feature)
            return {
              ...feature,
              overridesRemote: true,
              overriddenByEnv: true,
            };
        }

        const feature = allValuesFormattedIdRef.current[key];

        return feature ? checkFeatureFlagVersion(feature) : null;
      } catch (error) {
        console.error(`Failed to retrieve feature "${key}"`, error);
        return null;
      }
    },
    [localOverrides],
  );

  const getFeatureWrapped = useCallback(
    (...args) => {
      on();
      const res = getFeature(...args);
      off();
      return res;
    },
    [getFeature],
  );

  const overrideFeature = useCallback(
    (key: FeatureId, value: Feature): void => {
      const actualRemoteValue = getFeature(key, false);
      if (!isEqual(actualRemoteValue, value)) {
        const { overriddenByEnv, ...pureValue } = value; // eslint-disable-line
        const overridenValue = { ...pureValue, overridesRemote: true };
        dispatch(setOverriddenFeatureFlag(key, overridenValue));
      } else {
        dispatch(setOverriddenFeatureFlag(key, undefined));
      }
    },
    [dispatch, getFeature],
  );

  const resetFeature = (key: FeatureId): void => {
    dispatch(setOverriddenFeatureFlag(key, undefined));
  };

  const resetFeatures = (): void => {
    dispatch(setOverriddenFeatureFlags({}));
  };

  return (
    <FeatureFlagsProvider
      isFeature={isFeature}
      getFeature={getFeatureWrapped}
      overrideFeature={overrideFeature}
      resetFeature={resetFeature}
      resetFeatures={resetFeatures}
      getAllFlags={getAllFlags}
    >
      {children}
    </FeatureFlagsProvider>
  );
};
