import {
  Container,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Title,
  Text,
  Anchor,
} from '@mantine/core';
import { Navigate } from "react-router-dom";
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';

import { mapsApiClient } from "../components/mapsApi";
import { useAuth } from "../hooks/useAuth";

/**
 * Login screen
 */
export function Login() {
  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
    },
  });

  const { user, onLogin } = useAuth();

  if (user) {
    console.log(user);
    return <Navigate to="/" />;
  }

  // Submit login to API
  const authLogin = async (username: string, password: string) => {
    // For Laravel Sanctum we need to get a CSRF cookie first
    mapsApiClient.get<any>('/sanctum/csrf-cookie')
    .then(function (csrfResponse: any) {
      console.log('CSRF cookie response:', csrfResponse);
      // Then we can login
      mapsApiClient.post<any>("/login", {
        username: username,
        password: password,
      })
      .then(function (loginResponse: any) {
        console.log('API auth login response:', loginResponse);
        // Since Laravel Sanctum's SPA authentication is tokenless,
        // there's no response data to store in the browser
        // onLogin(loginResponse.data.data);
        onLogin(username);
      })
      .catch(function (error) {
        console.log('API auth login error:', error);

        let msg = error.code + ': ' + error.message;
        if (error.response && error.response.data && error.response.data.message) {
          msg += ": " + error.response.data.message;
        }

        showNotification({
          id: 'login-error',
          title: 'Login Error',
          message: msg,
          autoClose: false,
          color: 'red',
        });
      });
    });
  }

  return (
    <>
      <Title order={1} sx={{margin: '4em 0 0'}} align="center">
        Maps Content Admin
      </Title>

      <Text
        ta="center"
        fz={{base: 'lg', sm: 'xl'}}
        sx={{margin: '2em 0 3em'}}
      >
        For the Cleveland Metroparks <strong>maps</strong> and <strong>trails</strong> <Anchor href="https://maps.clevelandmetroparks.com/">web app</Anchor> & <Anchor href="https://maps-api.clevelandmetroparks.com/api/docs#/">API</Anchor>.
      </Text>

      <Container size={250} sx={{marginTop: '2em'}}>

        <Title order={2} sx={{margin: '0 0 .5em'}} align="left">Sign in</Title>

        <form onSubmit={form.onSubmit((values) => {
          authLogin(values.username, values.password);
        })}>

          <TextInput
            label="Username"
            placeholder="Username"
            autoComplete="username"
            required
            {...form.getInputProps('username')}
          />

          <PasswordInput sx={{marginTop: '1em'}}
            placeholder="Password"
            label="Password"
            autoComplete="current-password"
            required
            {...form.getInputProps('password')}
          />

          <Group position="right" mt="md">
            <Button type="submit">Login</Button>
          </Group>

        </form>
      </Container>
    </>
  );
}