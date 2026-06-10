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
import type { User } from "../types/user";

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
    return <Navigate to="/" />;
  }

  // Submit login to API
  const authLogin = async (username: string, password: string) => {
    try {
      // For Laravel Sanctum we need a CSRF cookie first, then we can log in.
      // Sanctum's SPA auth is tokenless (the session lives in an HttpOnly
      // cookie), so the login response itself carries nothing to store.
      await mapsApiClient.get<any>("/sanctum/csrf-cookie");
      await mapsApiClient.post<any>("/login", { username, password });

      // Fetch the authenticated user so we store the real user object — the
      // server, not the typed-in username, is the source of truth.
      const userResponse = await mapsApiClient.get<User>(
        import.meta.env.VITE_MAPS_API_BASE_PATH + "/user"
      );
      onLogin(userResponse.data);
    } catch (error: any) {
      console.error("API auth login error:", error);

      let msg = error.code + ": " + error.message;
      if (error.response && error.response.data && error.response.data.message) {
        msg += ": " + error.response.data.message;
      }

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
    </>
  );
}
