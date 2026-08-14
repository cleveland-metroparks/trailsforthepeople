import axios from "axios";

// Allow individual requests to opt out of the 401 auto-redirect below
// (e.g. the boot-time "who am I" session check, where a 401 is expected).
declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

const skipLogin =
  (import.meta.env.VITE_SKIP_LOGIN || "").toLowerCase() === "true";

axios.defaults.withCredentials = !skipLogin;

export const mapsApiClient = axios.create({
  baseURL: import.meta.env.VITE_MAPS_API_BASE_URL,
  withCredentials: !skipLogin,
  headers: {
    Accept: "application/json",
  },
});

// Add an interceptor to attach the CSRF token to each request
mapsApiClient.interceptors.request.use(
  (config) => {
    if (!skipLogin) {
      // Get the CSRF token from the cookies
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      // Add it to the request headers,
      // decoding it first to change "%3D" to "="
      if (token) {
        config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle expired sessions
mapsApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 Unauthorized mid-session, the session has expired.
    // Redirect to login — unless the caller opted out (the boot-time session
    // check handles its own 401 via routing rather than a page reload), or
    // we're already on the login page (a failed sign-in is also a 401, and
    // reloading would swallow the error the login form is about to show).
    const rootPath = import.meta.env.VITE_ROOT_PATH || "";
    const loginPath = `${rootPath}/login`;
    const alreadyOnLogin =
      window.location.pathname === loginPath ||
      window.location.pathname.endsWith("/login");

    if (
      error.response?.status === 401 &&
      !skipLogin &&
      !error.config?.skipAuthRedirect &&
      !alreadyOnLogin
    ) {
      window.location.href = loginPath;
    }
    return Promise.reject(error);
  }
);
