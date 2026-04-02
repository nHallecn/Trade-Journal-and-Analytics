import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { AddTrade } from "./components/AddTrade";
import { TradeHistory } from "./components/TradeHistory";
import { Analytics } from "./components/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "add-trade", Component: AddTrade },
      { path: "history", Component: TradeHistory },
      { path: "analytics", Component: Analytics },
    ],
  },
]);
