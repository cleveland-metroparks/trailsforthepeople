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

import { mapsApiClient } from "../components/mapsApi";
import { useAuth } from "../hooks/useAuth";

/**
 * Login screen
 */
export function Login(): JSX.Element {
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
    const csrfResponse = await mapsApiClient.get<any>('/sanctum/csrf-cookie')
    .then(function (csrfResponse: any) {
      console.log('CSRF cookie response:', csrfResponse);
      // Then we can login
      const loginResponse = mapsApiClient.post<any>("/login", {
        username: username,
        password: password,
      })
      .then(function (loginResponse: any) {
        console.log('API auth login response:', loginResponse);
        onLogin(loginResponse.data.data);
      })
      .catch(function (error) {
        console.log('API auth login error:', error);
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