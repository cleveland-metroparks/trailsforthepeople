import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { LoopsList, LoopEdit } from "./routes/loops";
import { MarkersList, MarkerEdit } from "./routes/markers";
import { HintMapsList, HintMapEdit } from "./routes/hintmaps";
import { AuditLogsList, AuditLogView } from "./routes/logs";

import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from 'react-query/devtools'

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
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="loops">
              <Route index element={<LoopsList />} />
              <Route path=":loopId" element={<LoopEdit />} />
            </Route>
            <Route path="markers">
              <Route index element={<MarkersList />} />
              <Route path=":markerId" element={<MarkerEdit />} />
            </Route>
            <Route path="hintmaps">
              <Route index element={<HintMapsList />} />
              <Route path=":hintmapId" element={<HintMapEdit />} />
            </Route>
            <Route path="logs">
              <Route index element={<AuditLogsList />} />
              <Route path=":logId" element={<AuditLogView />} />
            </Route>
            <Route
              path="*"
              element={
                <main style={{ padding: "1rem" }}>
                  <p>Not found</p>
                </main>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
