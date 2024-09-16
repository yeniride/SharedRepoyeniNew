import React, { useEffect, useContext } from "react";
import CircularLoading from "../components/CircularLoading";
import { useSelector, useDispatch } from "react-redux";
import { FirebaseContext } from "common";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import moment from "moment/min/moment-with-locales";

function AuthLoading(props) {
  const { api } = useContext(FirebaseContext);
  const { t } = useTranslation();
  const {
    fetchUser,
    fetchCarTypes,
    fetchSettings,
    fetchBookings,
    fetchCancelReasons,
    fetchPromos,
    fetchDriverEarnings,
    fetchUsers,
    fetchNotifications,
    fetchEarningsReport,
    signOut,
    fetchWithdraws,
    fetchPaymentMethods,
    fetchLanguages,
    monitorProfileChanges
  } = api;
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const languagedata = useSelector((state) => state.languagedata);
  const settingsdata = useSelector((state) => state.settingsdata);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch, fetchSettings]);

  useEffect(() => {
    if (languagedata.langlist) {
      for (const value of Object.values(languagedata.langlist)) {
        if (value.default === true) {
          i18n.addResourceBundle(
            value.langLocale,
            "translations",
            value.keyValuePairs
          );
          i18n.changeLanguage(value.langLocale);
          moment.locale(value.dateLocale);
        }
      }
      dispatch(fetchUser());
    }
  }, [languagedata, dispatch, fetchUser]);

  useEffect(() => {
    if (settingsdata.settings) {
      dispatch(fetchLanguages());
      dispatch(fetchCarTypes());
      document.title = settingsdata.settings.appName;
    }
  }, [settingsdata.settings, dispatch, fetchLanguages, fetchCarTypes]);

  useEffect(() => {
    if (auth.info) {
      if (auth.info.profile) {
        let role = auth.info.profile.usertype;
        if (role === "rider") {
          dispatch(fetchBookings(auth.info.uid, role));
          dispatch(fetchPaymentMethods());
          dispatch(fetchCancelReasons());
          dispatch(fetchUsers());
        } else if (role === "driver") {
          dispatch(fetchBookings(auth.info.uid, role));
          dispatch(fetchWithdraws());
          dispatch(fetchPaymentMethods());
          dispatch(monitorProfileChanges());
        } else if (role === "admin") {
          dispatch(fetchUsers());
          dispatch(fetchBookings(auth.info.uid, role));
          dispatch(fetchPromos());
          dispatch(fetchDriverEarnings(auth.info.uid, role));
          dispatch(fetchNotifications());
          dispatch(fetchEarningsReport());
          dispatch(fetchCancelReasons());
          dispatch(fetchWithdraws());
          dispatch(fetchPaymentMethods());
        } else if (role === "fleetadmin") {
          dispatch(fetchUsers());
          dispatch(fetchBookings(auth.info.uid, role));
          dispatch(fetchDriverEarnings(auth.info.uid, role));
        } else {
          alert(t("not_valid_user_type"));
          dispatch(signOut());
        }
      } else {
        alert(t("user_issue_contact_admin"));
        dispatch(signOut());
      }
    }
  }, [
    auth.info,
    dispatch,
    fetchBookings,
    fetchCancelReasons,
    fetchDriverEarnings,
    fetchEarningsReport,
    fetchNotifications,
    fetchPromos,
    fetchUsers,
    fetchWithdraws,
    signOut,
    fetchPaymentMethods,
    monitorProfileChanges,
    t,
  ]);

  return settingsdata.loading ? (
    <CircularLoading />
  ) : settingsdata.settings ? (
    auth.loading || !languagedata.langlist ? (
      <CircularLoading />
    ) : (
      props.children
    )
  ) : (
    <div>
      <span>No Database Settings found</span>
  </div>
  );
}

export default AuthLoading;
