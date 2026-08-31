import React from "react";

import {
  IconRoute,
  IconMapPin,
  IconFileText,
  IconRefresh,
  IconUser,
  IconLogout,
} from "@tabler/icons-react";
import {
  ThemeIcon,
  UnstyledButton,
  Button,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import { Link } from "react-router";
import styles from "./navLinks.module.css";
import { useAuth } from "../hooks/useAuth";
import { isGisUser } from "../types/user";

interface NavLinkProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  urlPath: string;
  showLabel?: boolean;
}

const navLinksData = [
  { icon: <IconRoute />, color: "blue", label: "Trails", urlPath: "trails" },
  { icon: <IconMapPin />, color: "teal", label: "Markers", urlPath: "markers" },
  { icon: <IconFileText />, color: "grape", label: "Logs", urlPath: "logs" },
  {
    icon: <IconRefresh />,
    color: "orange",
    label: "Fulcrum",
    urlPath: "fulcrum",
  },
];

const userLinksData = [
  { icon: <IconUser />, color: "gray", label: "User", urlPath: "user" },
  { icon: <IconLogout />, color: "gray", label: "Logout", urlPath: "logout" },
];

const GIS_ONLY_PATHS = new Set(["trails", "markers", "logs"]);

function visibleNavLinks(isGis: boolean) {
  if (isGis) {
    return navLinksData;
  }
  return navLinksData.filter((link) => !GIS_ONLY_PATHS.has(link.urlPath));
}

// For the sidebar menu link buttons
function NavLink({
  icon,
  color,
  label,
  urlPath,
  showLabel = true,
}: NavLinkProps) {
  const button = (
    <UnstyledButton
      component={Link}
      to={urlPath}
      className={styles.navLink}
      aria-label={label}
    >
      <Group
        gap={showLabel ? "sm" : 0}
        justify={showLabel ? "flex-start" : "center"}
        wrap="nowrap"
      >
        <ThemeIcon color={color} variant="light">
          {icon}
        </ThemeIcon>
        {showLabel && <Text size="sm">{label}</Text>}
      </Group>
    </UnstyledButton>
  );

  if (showLabel) {
    return button;
  }

  return (
    <Tooltip label={label} position="right" withArrow>
      {button}
    </Tooltip>
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
export function NavLinks({ showLabels = true }: { showLabels?: boolean }) {
  const { user } = useAuth();
  const links = visibleNavLinks(isGisUser(user)).map((link) => (
    <NavLink {...link} key={link.label} showLabel={showLabels} />
  ));
  return <>{links}</>;
}

// Sidebar menu link buttons
export function UserLinks({ showLabels = true }: { showLabels?: boolean }) {
  const { user } = useAuth();
  const isGis = isGisUser(user);
  const links = userLinksData
    .filter((link) => isGis || link.urlPath !== "user")
    .map((link) => (
      <NavLink {...link} key={link.label} showLabel={showLabels} />
    ));
  return <>{links}</>;
}

// Home page buttons
export function NavButtons() {
  const { user } = useAuth();
  const links = visibleNavLinks(isGisUser(user)).map((link) => (
    <NavButton {...link} key={link.label} />
  ));
  return <>{links}</>;
}
