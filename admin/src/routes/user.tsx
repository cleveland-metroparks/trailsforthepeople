import { useState } from 'react';
import { useAuth } from "../hooks/useAuth";
import { ActionIcon, Box, Button, Code, CopyButton, Group, Modal, Table, Title, Text, TextInput, Tooltip } from '@mantine/core';
import { Copy, Check } from 'tabler-icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useQuery } from "@tanstack/react-query";
import { showNotification } from '@mantine/notifications';
import { default as dayjs } from 'dayjs';

import { mapsApiClient } from "../components/mapsApi";
import type { ApiAccessToken } from "../types/user";

// Get all tokens
const getUserTokens = async () => {
  const response = await mapsApiClient.get<any>("/tokens");

  var tokensData = response.data.tokens;

  // Format token props
  tokensData.forEach((token) => {
    // Dates
    if (token.last_used_at !== null) {
      token.last_user_at = dayjs(token.last_used_at).format('YYYY-MM-DD, h:mm:ss a')
    } else {
      token.last_used_at = "Never";
    }
    token.created_at = dayjs(token.created_at).format('YYYY-MM-DD, h:mm:ss a')
    token.updated_at = dayjs(token.updated_at).format('YYYY-MM-DD, h:mm:ss a')

    // Abilities array
    if (token.abilities.includes('*')) {
      token.abilities = 'All';
    } else {
      token.abilities = token.abilities.join(', ');
    }
  });

  return tokensData;
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
  } = useQuery<ApiAccessToken[], Error>(['tokens'], getUserTokens);

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
      // Build modal content with the token info
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

      // Refresh the list of tokens
      tokensRefetch();
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
      <Title order={2} sx={{marginBottom: '1em' }}>User: {user}</Title>

      {tokensIsLoading && <div>Loading...</div>}

      {tokensIsError && (
        <div>{`There is a problem fetching the post data - ${tokensError.message}`}</div>
      )}

      <Title order={3} sx={{margin: '1em 0 .5em'}}>API access tokens</Title>
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Token name</th>
            <th>Abilities</th>
            <th>Last used</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>

        <tbody>
          {tokensData && tokensData.map(token => (
            <tr key={token.id}>
              <td>{token.name}</td>
              <td>{token.abilities}</td>
              <td>{token.last_used_at}</td>
              <td>{token.created_at}</td>
              <td>{token.updated_at}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Title order={3} sx={{margin: '1em 0 .5em'}}>Create a new token</Title>
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
          />
          <Button type="submit" sx={{ margin: '1em 0' }}>Create API token</Button>
        </Box>
      </form>

      <Modal
        opened={openedModal}
        onClose={closeModal}
        title={<Title order={3}>New token created</Title>}
        size="auto"
      >
        {tokenCreatedContent}
      </Modal>
    </>
  );
}