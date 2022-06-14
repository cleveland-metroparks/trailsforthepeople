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
          <Text>Application navigation</Text>
        </Navbar>
      }

      aside={
        <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
          <Aside p="md" hiddenBreakpoint="sm" width={{ sm: 200, lg: 300 }}>
            <Text>Application right sidebar</Text>
          </Aside>
        </MediaQuery>
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

            <Text>Maps Admin Back-end</Text>
          </div>
        </Header>
      }

      styles={(theme) => ({
        main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
      })}

      footer={
        <Footer height={60} p="md">
          This is the footer
        </Footer>
      }

    >
      <Text>Main content goes here.</Text>
    </AppShell>

  );
}

export default App;
