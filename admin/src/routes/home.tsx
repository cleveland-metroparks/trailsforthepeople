import { Flex, Title, Text, Anchor } from '@mantine/core';

import { NavButtons } from '../_navLinks';

export function Home() {
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