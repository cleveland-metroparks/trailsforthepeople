import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import {
  RouterProvider,
  Route,
  Navigate,
  createRoutesFromElements,
  createBrowserRouter
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { ProtectedRoute } from "./components/protectedRoute";
import { AuthLayout } from "./components/authLayout";
import { Home } from "./routes/home";
import { Login } from "./routes/login";
import { Logout } from "./routes/logout";
import { UserAccount } from "./routes/user";
import { ErrorScreen } from "./routes/errorScreen";

import { TrailList, loader as trailListLoader } from "./routes/trailList";
import { TrailEdit } from "./routes/trailEdit";
import { action as deleteTrailAction } from "./routes/trailDelete";

import { MarkerList, loader as markerListLoader } from "./routes/markerList";
import { MarkerEdit } from "./routes/markerEdit";
import { action as deleteMarkerAction } from "./routes/markerDelete";

import { HintMapList, loader as hintMapListLoader } from "./routes/hintMapList";
import { HintMapEdit } from "./routes/hintMapEdit";
import { action as deleteHintMapAction } from "./routes/hintMapDelete";

import { AuditLogsList, AuditLogView } from "./routes/logs";

import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

let REACT_APP_ROOT_PATH = process.env.REACT_APP_ROOT_PATH;

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
          <Route path="trails">
            <Route
              index
              element={<TrailList />}
              loader={trailListLoader(queryClient)}
            />
            <Route path=":trailId" element={<TrailEdit />} />
            <Route path=":trailId/delete" action={deleteTrailAction} />
          </Route>
          {/* Redirect from "loops/..." to "trails" */}
          <Route path="loops/*" element={<Navigate to="/trails" replace />} />
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
          <Route path="hint_maps">
            <Route
              index
              element={<HintMapList />}
              loader={hintMapListLoader(queryClient)}
            />
            <Route path=":hintMapId" element={<HintMapEdit />} />
            <Route path=":hintMapId/delete" action={deleteHintMapAction} />
          </Route>
          <Route path="logs">
            <Route index element={<AuditLogsList />} />
            <Route path=":logId" element={<AuditLogView />} />
          </Route>
          <Route path="user">
            <Route index element={<UserAccount />} />
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
const router = createBrowserRouter(routes, { basename: REACT_APP_ROOT_PATH });

//
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
        <MantineProvider withNormalizeCSS withGlobalStyles>
          <ModalsProvider>
              <Notifications />
              <RouterProvider router={router} />
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
