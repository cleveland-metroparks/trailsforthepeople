import React, { useState } from 'react';
import './App.css';
import { Link, Outlet, Navigate } from "react-router-dom";
import {
  Anchor,
  AppShell,
  Navbar,
  Header,
  MediaQuery,
  Burger,
  Divider,
  useMantineTheme,
} from '@mantine/core';

import { useAuth } from "./hooks/useAuth";
import { NavLinks, UserLinks } from './components/navLinks';

function App() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <AppShell
        padding="md"

        navbar={
          <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
            <NavLinks />
            <Divider my="sm" variant="dotted" />
            <UserLinks />
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

              <Anchor component={Link} to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '.625rem', textDecoration: 'none' }}>
                <img
                  src={`${process.env.PUBLIC_URL}/cm-logo-mark_only-no_margin-364x462.png`}
                  alt="CMP Logo"
                  style={{ height: '40px', width: 'auto' }}
                />
                <span style={{ color: 'black' }}>Maps Content Admin</span>
              </Anchor>
            </div>
          </Header>
        }

        styles={(theme) => ({
          main: {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : '',
          },
        })}
      >

      <Outlet />

    </AppShell>

  );
}

export default App;
