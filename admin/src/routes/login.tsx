import {
  Container,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Title,
  Text,
  Anchor,
} from "@mantine/core";
import { Navigate } from "react-router";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";

import { mapsApiClient } from "../components/mapsApi";
import { useAuth } from "../hooks/useAuth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { landingPath, type User } from "../types/user";
import { version } from "../../package.json";

const skipAuthRedirect = { skipAuthRedirect: true };

function loginErrorMessage(error: any): string {
  const status = error?.response?.status;
  const data = error?.response?.data;

  const fieldErrors = data?.errors
    ? Object.values(data.errors)
        .flat()
        .find((value) => typeof value === "string")
    : undefined;
  if (typeof fieldErrors === "string") {
    return fieldErrors;
  }

  if (
    typeof data?.message === "string" &&
    data.message &&
    data.message !== "Unauthenticated."
  ) {
    return data.message;
  }

  if (status === 401 || status === 422) {
    return "Invalid username or password.";
  }

  if (typeof error?.message === "string" && error.message) {
    return error.message;
  }

  return "Login failed. Please try again.";
}

/**
 * Login screen
 */
export function Login() {
  useDocumentTitle("Login");

  const skipLogin =
    (import.meta.env.VITE_SKIP_LOGIN || "").toLowerCase() === "true";
  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {},
  });

  const { user, onLogin } = useAuth();

  if (user || skipLogin) {
    return <Navigate to={landingPath(user)} replace />;
  }

  // Submit login to API
  const authLogin = async (username: string, password: string) => {
    try {
      // For Laravel Sanctum we need a CSRF cookie first, then we can log in.
      // Sanctum's SPA auth is tokenless (the session lives in an HttpOnly
      // cookie), so the login response itself carries nothing to store.
      // skipAuthRedirect: a 401 here is a failed sign-in, not a mid-session
      // expiry — don't let the interceptor reload the page and hide the error.
      await mapsApiClient.get<any>("/sanctum/csrf-cookie", skipAuthRedirect);
      await mapsApiClient.post<any>(
        "/login",
        { username, password },
        skipAuthRedirect
      );

      // Fetch the authenticated user so we store the real user object — the
      // server, not the typed-in username, is the source of truth.
      const userResponse = await mapsApiClient.get<User>(
        import.meta.env.VITE_MAPS_API_BASE_PATH + "/user",
        skipAuthRedirect
      );
      onLogin(userResponse.data);
    } catch (error: any) {
      console.error("API auth login error:", error);

      const msg = loginErrorMessage(error);

      showNotification({
        id: "login-error",
        title: "Login Error",
        message: msg,
        autoClose: false,
        color: "red",
      });
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          margin: "4em 0 0",
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}/cm-logo-mark_only-no_margin-364x462.png`}
          alt="CMP Logo"
          style={{ height: "60px", width: "auto" }}
        />
        <Title order={1}>Maps Content Admin</Title>
      </div>

      <Text ta="center" fz={{ base: "lg", sm: "xl" }} my="xl" mb="xl">
        For the Cleveland Metroparks <strong>maps</strong> and{" "}
        <strong>trails</strong>{" "}
        <Anchor href="https://maps.clevelandmetroparks.com/">web app</Anchor> &{" "}
        <Anchor href="https://maps-api.clevelandmetroparks.com/api/docs#/">
          API
        </Anchor>
        .
      </Text>

      <Container size={250} mt="xl">
        <Title order={2} mb="xs" ta="left">
          Sign in
        </Title>

        <form
          onSubmit={form.onSubmit((values) => {
            authLogin(values.username, values.password);
          })}
        >
          <TextInput
            label="Username"
            placeholder="Username"
            autoComplete="username"
            required
            {...form.getInputProps("username")}
          />

          <PasswordInput
            mt="md"
            placeholder="Password"
            label="Password"
            autoComplete="current-password"
            required
            {...form.getInputProps("password")}
          />

          <Group justify="flex-end" mt="md">
            <Button type="submit">Login</Button>
          </Group>
        </form>
      </Container>

      <Text size="xs" c="dimmed" ta="center" mt="xl">
        v{version}
      </Text>
    </>
  );
}
