import {
  Button,
  Title,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';

import { mapsApiClient } from "../components/mapsApi";
import { useAuth } from "../hooks/useAuth";

/**
 * User Account component
 */
export function UserAccount() {
  const { user, onLogout } = useAuth();

  const form = useForm({
    initialValues: {
    },
    validate: {
    },
  });

  // Request API token
  const requestToken = async () => {
    mapsApiClient.post<any>('/tokens/create', {})
    .then(function (createTokenResponse: any) {
      console.log('API token created successfully. Response:', createTokenResponse);
      showNotification({
        id: 'create-token-success',
        title: 'API token created',
        message: 'API token successfully created.',
        autoClose: false,
      });
    })
    .catch(function (error) {
      console.log('Create API token error:', error);

      let msg = error.code + ': ' + error.message;
      if (error.response && error.response.data && error.response.data.message) {
        msg += ": " + error.response.data.message;
      }

      showNotification({
        id: 'create-token-error',
        title: 'Create Token Error',
        message: msg,
        autoClose: false,
        color: 'red',
      });
    });
  }

  return (
    <>
      <Title order={2} sx={{ margin: '0 0 1em' }}>User account</Title>
      <Text>Logged-in as: <Text span fw={700}>{user}</Text>.</Text>

      <form onSubmit={form.onSubmit((values) => {
          requestToken();
        })}>
        <Button type="submit" sx={{ margin: '1em 0' }}>Create API token</Button>
      </form>
    </>
  );
}