import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Loops from "./routes/loops";
import Markers from "./routes/markers";
import HintMaps from "./routes/hintmaps";
import Logs from "./routes/logs";

import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient({
   defaultOptions: {
     queries: {
       refetchOnWindowFocus: false,
     },
   },
 });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="loops" element={<Loops />} />
            <Route path="markers" element={<Markers />} />
            <Route path="hintmaps" element={<HintMaps />} />
            <Route path="logs" element={<Logs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
