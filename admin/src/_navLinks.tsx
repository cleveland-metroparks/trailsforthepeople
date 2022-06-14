import React from 'react';

import { Route, MapPin, Map, FileText } from 'tabler-icons-react';
import { ThemeIcon, UnstyledButton, Group, Text } from '@mantine/core';

import { Link } from "react-router-dom";

interface NavLinkProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  urlPath: string;
}

function NavLink({ icon, color, label, urlPath }: NavLinkProps) {
  return (
    <UnstyledButton
      component={Link}
      to={urlPath}
      sx={(theme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,

        '&:hover': {
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        },
      })}
    >
      <Group>
        <ThemeIcon color={color} variant="light">
          {icon}
        </ThemeIcon>

        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

const data = [
  { icon: <Route size={16} />, color: 'blue', label: 'Loops', urlPath: 'loops' },
  { icon: <MapPin size={16} />, color: 'teal', label: 'Markers', urlPath: 'markers' },
  { icon: <Map size={16} />, color: 'violet', label: 'Hint Maps', urlPath: 'hintmaps' },
  { icon: <FileText size={16} />, color: 'grape', label: 'Logs', urlPath: 'logs' },
];

export function NavLinks() {
  const links = data.map((link) => <NavLink {...link} key={link.label} />);
  return <div>{links}</div>;
}