import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { NotificationsProvider } from '@mantine/notifications';
import {
  RouterProvider,
  Route,
  createRoutesFromElements,
  createBrowserRouter,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { ProtectedRoute } from "./components/protectedRoute";
import { AuthLayout } from "./components/authLayout";
import { Home } from "./routes/home";
import { Login } from "./routes/login";
import { Logout } from "./routes/logout";
import { LoopList, loader as loopListLoader } from "./routes/loopList";
import { LoopEdit } from "./routes/loopEdit";
import { action as deleteLoopAction } from "./routes/loopDelete";
import { MarkerList, loader as markerListLoader } from "./routes/markerList";
import { MarkerEdit } from "./routes/markerEdit";
// import { MarkerDelete, action as deleteMarkerAction } from "./routes/markerDelete";
import { action as deleteMarkerAction } from "./routes/markerDelete";
import { HintMapsList, HintMapEdit } from "./routes/hintmaps";
import { AuditLogsList, AuditLogView } from "./routes/logs";
import { ErrorScreen } from "./routes/errorScreen";

import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

let PATH = process.env.REACT_APP_ROOT_PATH;

//
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

//
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

//
const routes = createRoutesFromElements(
  <>
    <Route
      element={<AuthLayout />}
    >
      <Route index element={<Home />} />
      <Route path="home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="login" element={<Login />} />
      <Route path="logout" element={<Logout />} />
      <Route
        path="/"
        element={<App />}
        errorElement={<ErrorScreen />}
      >
        <Route errorElement={<ErrorScreen />}>
          <Route path="loops">
            <Route
              index
              element={<LoopList />}
              loader={loopListLoader(queryClient)}
            />
            <Route path=":loopId" element={<LoopEdit />} />
            <Route path=":loopId/delete" action={deleteLoopAction} />
          </Route>
          <Route path="markers">
            <Route
              index
              element={<MarkerList />}
              loader={markerListLoader(queryClient)}
            />
            <Route path=":markerId" element={<MarkerEdit />} />
            {/* <Route path=":markerId/delete" action={deleteMarkerAction} element={<MarkerDelete onDelete />} /> */}
            <Route path=":markerId/delete" action={deleteMarkerAction} />
          </Route>
          <Route path="hintmaps">
            <Route index element={<HintMapsList />} />
            <Route path=":hintmapId" element={<HintMapEdit />} />
          </Route>
          <Route path="logs">
            <Route index element={<AuditLogsList />} />
            <Route path=":logId" element={<AuditLogView />} />
          </Route>
          {/* <Route
            path="*"
            element={
              <main style={{ padding: "1rem" }}>
                <p>Not found</p>
              </main>
            }
          /> */}
        </Route>
      </Route>
    </Route>
  </>
);

//
const router = createBrowserRouter(routes, { basename: PATH });

//
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
        <MantineProvider withNormalizeCSS withGlobalStyles>
          <ModalsProvider>
            <NotificationsProvider>
              <RouterProvider router={router} />
            </NotificationsProvider>
          </ModalsProvider>
        </MantineProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
