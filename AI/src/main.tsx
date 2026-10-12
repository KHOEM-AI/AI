import React from "react";
import ReactDOM from "react-dom/client";
import "./lib/installInputGuard";
import Gate from "./Gate";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Gate />
  </React.StrictMode>
);
