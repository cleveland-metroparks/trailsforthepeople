import { Center, createStyles, Group, rem, Text, UnstyledButton } from '@mantine/core';
import { IconSelector, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

import type { Trail } from "../types/trail";
import type { Marker } from "../types/marker";
import type { HintMap } from "../types/hintmap";

// Table sort styles
// Derived from https://ui.mantine.dev/component/table-sort
const useStyles = createStyles((theme) => ({
  th: {
    padding: '0 !important',
  },

  control: {
    width: '100%',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    },
  },

  icon: {
    width: rem(21),
    height: rem(21),
    borderRadius: rem(21),
  },
}));

// Table row data; can be our major types
type RowData = Trail | Marker | HintMap | any;

// Comparison for sorting, for strings & numbers
export function compareTableItems(a: string | number, b: string | number, reversed: boolean) {
  if (a === b) {
    return 0;
  } else if ((a > b) || (b === null) || (b === undefined) || (b === '')) {
    return reversed ? -1 : 1;
  } else {
    return reversed ? 1 : -1;
  }
}

// Sort table data
export function sortTableData(
  data: RowData[],
  payload: { sortBy: keyof RowData | null; reversed: boolean; search: string },
  filterData: (data: RowData[], search: string) => RowData[]
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      return compareTableItems(a[sortBy], b[sortBy], payload.reversed);
    }),
    payload.search
  );
}

// Table header cell props
interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort(): void;
}

// Table header cell component
export function Th({ children, reversed, sorted, onSort }: ThProps) {
  const { classes } = useStyles();
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <th className={classes.th}>
    <UnstyledButton onClick={onSort} className={classes.control}>
      <Group position="apart">
        <Text fw={500} fz="sm">
          {children}
        </Text>
        <Center className={classes.icon}>
          <Icon size="0.9rem" stroke={1.5} />
        </Center>
      </Group>
    </UnstyledButton>
    </th>
  );
}