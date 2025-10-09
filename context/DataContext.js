// context/DataContext.js
import React, { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabase";
import { AuthContext } from "./AuthContext";
import { initializeRevenueCat, syncSubscriptionStatus, fetchProStatus } from "../utils/subscriptions";

export const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { session, authReady } = useContext(AuthContext);
  const [dataReady, setDataReady] = useState(false);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!authReady) return; // wait until session is ready
    if (!session?.user) {
      setDataReady(true);
      return;
    }

    const loadData = async () => {
      try {
        await initializeRevenueCat(session.user.id);
        await syncSubscriptionStatus();
        const status = await fetchProStatus();
        setIsPro(status?.isPro || false);

        const { data: cat } = await supabase
          .from("categories")
          .select("*")
          .or(`user_id.eq.${session.user.id},is_default.eq.true`);
        setCategories(cat || []);

        const { data: ann } = await supabase
          .from("annoyances")
          .select("*")
          .order("created_at", { ascending: false });
        setAnalytics(ann || []);

      } catch (err) {
        console.error("Data preload error:", err);
      } finally {
        setDataReady(true);
      }
    };

    loadData();
  }, [authReady, session]);

  return (
    <DataContext.Provider value={{ categories, analytics, isPro, dataReady }}>
      {children}
    </DataContext.Provider>
  );
};
