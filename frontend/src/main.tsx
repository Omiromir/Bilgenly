import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router";
import App from "./app/App.tsx";
import "./styles/index.css";
import React from "react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
            <App />
    </BrowserRouter>
  </React.StrictMode>,
);
