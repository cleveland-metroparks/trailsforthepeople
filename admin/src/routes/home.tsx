import React, { useState } from 'react';
import { Link } from "react-router-dom";
import {
  Flex,
  Title,
  Text,
  Anchor,
  AppShell,
  Header,
} from '@mantine/core';

import { Login } from "../routes/login";

import { NavButtons } from '../_navLinks';

export function Home() {
  const [token, setToken] = useState(null);

  console.log("Bearer access token:", token);
    if (!token) {
      return (
        <AppShell
            padding="md"

            header={
              <Header height={70} p="md">
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Anchor component={Link} to="/">
                    Maps Content Admin
                  </Anchor>
                </div>
              </Header>
            }

            styles={(theme) => ({
              main: {
                backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : ''
              },
            })}
          >

          <Login setToken={setToken} />

        </AppShell>
      );
    }

    return (
      <>
        <Title sx={{margin: '4em 0 0'}} align="center" order={1}>
          Maps Content Admin
        </Title>

        <Text
          ta="center"
          fz={{base: 'lg', sm: 'xl'}}
          sx={{margin: '2em 0 3em'}}
        >
          For the Cleveland Metroparks <strong>maps</strong> and <strong>trails</strong> <Anchor href="http://maps.clevelandmetroparks.com/">web app</Anchor> & <Anchor href="https://maps-api.clevelandmetroparks.com/api/docs#/">API</Anchor>.
        </Text>

        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap={{ base: 'sm', sm: 'lg' }}
          justify={{ sm: 'center' }}
          sx={{margin: '3em'}}
          >
          <NavButtons />
        </Flex>
      </>
  );
}