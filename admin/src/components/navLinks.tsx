import React from "react";

import {
  IconRoute,
  IconMapPin,
  IconFileText,
  IconUser,
  IconLogout,
} from "@tabler/icons-react";
import { ThemeIcon, UnstyledButton, Button, Group, Text } from "@mantine/core";
import { Link } from "react-router";
import styles from "./navLinks.module.css";

interface NavLinkProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  urlPath: string;
}

const navLinksData = [
  { icon: <IconRoute />, color: "blue", label: "Trails", urlPath: "trails" },
  { icon: <IconMapPin />, color: "teal", label: "Markers", urlPath: "markers" },
  { icon: <IconFileText />, color: "grape", label: "Logs", urlPath: "logs" },
];

const userLinksData = [
  { icon: <IconUser />, color: "gray", label: "User", urlPath: "user" },
  { icon: <IconLogout />, color: "gray", label: "Logout", urlPath: "logout" },
];

// For the sidebar menu link buttons
function NavLink({ icon, color, label, urlPath }: NavLinkProps) {
  return (
    <UnstyledButton component={Link} to={urlPath} className={styles.navLink}>
      <Group>
        <ThemeIcon color={color} variant="light">
          {icon}
        </ThemeIcon>
        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

// For the home page buttons
function NavButton({ icon, color, label, urlPath }: NavLinkProps) {
  return (
    <Button
      variant="light"
      color={color}
      size="xl"
      component={Link}
      to={urlPath}
    >
      <Group>
        <ThemeIcon color={color} variant="light">
          {icon}
        </ThemeIcon>
        <Text size="xl">{label}</Text>
      </Group>
    </Button>
  );
}

// Sidebar menu link buttons
export function NavLinks() {
  const links = navLinksData.map((link) => (
    <NavLink {...link} key={link.label} />
  ));
  return <>{links}</>;
}

// Sidebar menu link buttons
export function UserLinks() {
  const links = userLinksData.map((link) => (
    <NavLink {...link} key={link.label} />
  ));
  return <>{links}</>;
}

// Home page buttons
export function NavButtons() {
  const links = navLinksData.map((link) => (
    <NavButton {...link} key={link.label} />
  ));
  return <>{links}</>;
}
