import { Title, Box, Text } from '@mantine/core';

import { NavButtons } from '../_navLinks';

export function Home() {
  return (
    <>
      <Title order={2}>Home</Title>
      <Text sx={{margin: '1em 0'}}>Maps content backend administration for Cleveland Metroparks.</Text>
      <Box sx={{margin: '1em 0'}}>
        <NavButtons />
      </Box>
    </>
  );
}