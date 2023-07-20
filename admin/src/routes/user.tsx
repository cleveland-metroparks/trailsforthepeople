import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Code,
  CopyButton,
  Group,
  Modal,
  Table,
  Title,
  Text,
  TextInput,
  Tooltip
} from '@mantine/core';
import { Copy, Check } from 'tabler-icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useQuery } from "@tanstack/react-query";
import { showNotification } from '@mantine/notifications';
import { default as dayjs } from 'dayjs';

import { mapsApiClient } from "../components/mapsApi";
import { useAuth } from "../hooks/useAuth";

export type ApiAccessToken = {
  id: number,
  tokenable_type: string,
  tokenable_id: string,
  name: string,
  abilities: string,
  last_used_at: string, // timestamp
  created_at: string, // timestamp
  updated_at: string, // timestamp
};

// Get all tokens
const getAllTokens = async () => {
  const response = await mapsApiClient.get<any>("/tokens");
  return response.data.tokens;
}

/**
 * User Account component
 */
export function UserAccount() {
  const { user } = useAuth();

  const [openedModal, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [tokenCreatedContent, setTokenCreatedContent] = useState(null);

  const {
    isLoading: tokensIsLoading,
    isSuccess: tokensIsSuccess,
    isError: tokensIsError,
    data: tokensData,
    error: tokensError,
    refetch: tokensRefetch,
  } = useQuery<ApiAccessToken[], Error>(['tokens'], getAllTokens);

  const form = useForm({
    initialValues: {
      token_name: '',
    },
    validate: {
    },
  });

  // Request API token
  const requestToken = async (formValues) => {
    mapsApiClient.post<any>('/tokens/create', formValues)
    .then(function (createTokenResponse: any) {
      console.log('API token created successfully. Response:', createTokenResponse);
      showNotification({
        id: 'create-token-success',
        title: 'API token created',
        message: 'API token successfully created.',
        autoClose: false,
      });

      // Refresh the list of tokens @TODO
      tokensRefetch();

      // Show the new token to the user
      let newTokenModalContent = (
        <>
          <Text sx={{ marginBottom: '1em' }}>
            Make sure to record this now, as <Text span fw={700}>you won't be able to see it again!</Text>
          </Text>
          <Group>
            <Text>Token:</Text>
            <Code color="blue" sx={{ fontSize: '1.2em'}}>{createTokenResponse.data.token}</Code>
            <CopyButton value={createTokenResponse.data.token}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                  <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                    {copied ? <Check size="1rem" /> : <Copy size="1rem" />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </>
      );
      setTokenCreatedContent(newTokenModalContent);
      openModal();
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
      <Title order={2} sx={{marginBottom: '1em' }}>User account</Title>

      {tokensIsLoading && <div>Loading...</div>}

      {tokensIsError && (
        <div>{`There is a problem fetching the post data - ${tokensError.message}`}</div>
      )}

      <Text>Logged-in as: <Text span fw={700}>{user}</Text>.</Text>

      <Title order={3} sx={{margin: '1em 0'}}>API access tokens</Title>
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Tokenable ID</th>
            <th>Abilities</th>
            <th>Last used</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>

        <tbody>
        {tokensData &&
          tokensData.map(token => (
            <tr key={token.id}>
              <td>{token.tokenable_type}</td>
              <td>{token.tokenable_id}</td>
              <td>{token.name}</td>
              <td>{token.abilities}</td>
              <td>{
                (token.last_used_at === null)
                ? 'Never'
                : dayjs(token.last_used_at).format('YYYY-MM-DD HH:mm:ss Z')
                }</td>
              <td>{dayjs(token.created_at).format('YYYY-MM-DD HH:mm:ss Z')}</td>
              <td>{dayjs(token.updated_at).format('YYYY-MM-DD HH:mm:ss Z')}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Title order={3} sx={{marginTop: '1em'}}>Create a new token</Title>
      <form
        onSubmit={
          form.onSubmit((formValues) => {
            requestToken(formValues);
          })
        }
      >
        <Box sx={{ maxWidth: 800 }}>
          <TextInput
            label="Token name"
            placeholder="Briefly describe this token's use"
            autoComplete="token_name"
            required
            {...form.getInputProps('token_name')}
            sx={{marginTop: '1em'}}
          />
          <Button type="submit" sx={{ margin: '1em 0' }}>Create API token</Button>
        </Box>
      </form>

      <Modal
        opened={openedModal}
        onClose={closeModal}
        title="New token created"
        size="auto"
      >
        {tokenCreatedContent}
      </Modal>
    </>
  );
}