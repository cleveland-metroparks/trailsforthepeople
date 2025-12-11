import React, { useState } from "react";
import "./App.css";
import { Link, Outlet, Navigate } from "react-router";
import {
  Anchor,
  AppShell,
  Burger,
  Divider,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import { useAuth } from "./hooks/useAuth";
import { NavLinks, UserLinks } from "./components/navLinks";

function App() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [opened, setOpened] = useState(false);
  const { user } = useAuth();
  const isMobile = !useMediaQuery("(min-width: 768px)");

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <AppShell
      padding="md"
      navbar={{
        width: { sm: 200, lg: 300 },
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      header={{ height: 70 }}
    >
      <AppShell.Navbar p="md">
        <NavLinks />
        <Divider my="sm" variant="dotted" />
        <UserLinks />
      </AppShell.Navbar>

      <AppShell.Header p="md">
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          {isMobile && (
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              size="sm"
              color={theme.colors.gray[6]}
              mr="xl"
            />
          )}

          <Anchor
            component={Link}
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginLeft: ".625rem",
              textDecoration: "none",
            }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/cm-logo-mark_only-no_margin-364x462.png`}
              alt="CMP Logo"
              style={{ height: "40px", width: "auto" }}
            />
            <span style={{ color: "black" }}>Maps Content Admin</span>
          </Anchor>
        </div>
      </AppShell.Header>

      <AppShell.Main
        style={{
          backgroundColor: colorScheme === "dark" ? theme.colors.dark[8] : "",
        }}
      >
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
