import axios from "axios";
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

import { useAuth } from "../hooks/useAuth";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
});

//
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
    return <Navigate to="/" />;
  }

  // Submit login to API
  const authLogin = async (username: string, password: string) => {
    const response = await apiClient.post<any>("/ldap_login", {
      username: username,
      password: password,
    })
    .then(function (response: any) {
      console.log('API auth login response:', response);
      onLogin(response.data.data);
    })
    .catch(function (error) {
      console.log('API auth login error:', error);
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
        For the Cleveland Metroparks <strong>maps</strong> and <strong>trails</strong> <Anchor href="http://maps.clevelandmetroparks.com/">web app</Anchor> & <Anchor href="https://maps-api.clevelandmetroparks.com/api/docs#/">API</Anchor>.
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