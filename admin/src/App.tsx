import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

import {
  AppShell,
  Navbar,
  Header,
  Footer,
  Aside,
  Text,
  MediaQuery,
  Burger,
  useMantineTheme,
} from '@mantine/core';

import { NavLinks } from './_navLinks';

function App() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);

  return (

    <AppShell
      padding="md"

      navbar={
        <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
          <NavLinks></NavLinks>
        </Navbar>
      }

      header={
        <Header height={70} p="md">
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>

            <Text>Maps Content Admin</Text>
          </div>
        </Header>
      }

      styles={(theme) => ({
        main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
      })}

    >
      <Text>Main content goes here.</Text>
    </AppShell>

  );
}

export default App;
