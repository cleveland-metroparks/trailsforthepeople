import { Flex, Title, Text, Anchor, Divider } from "@mantine/core";

import { NavButtons, UserLinks } from "../components/navLinks";

export function Home() {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          margin: "4em 0 0",
        }}
      >
        <img
          src={`${process.env.PUBLIC_URL}/cm-logo-mark_only-no_margin-364x462.png`}
          alt="CMP Logo"
          style={{ height: "60px", width: "auto" }}
        />
        <Title order={1}>Maps Content Admin</Title>
      </div>

      <Text ta="center" fz={{ base: "lg", sm: "xl" }} my="xl" mb="xl">
        For the Cleveland Metroparks <strong>maps</strong> and{" "}
        <strong>trails</strong>{" "}
        <Anchor href="https://maps.clevelandmetroparks.com/">web app</Anchor> &{" "}
        <Anchor href="https://maps-api.clevelandmetroparks.com/api/docs#/">
          API
        </Anchor>
        .
      </Text>

      <Flex
        direction={{ base: "column", md: "row" }}
        gap={{ base: "sm", sm: "lg" }}
        justify={{ sm: "center" }}
        my="xl"
        mb="xl"
      >
        <NavButtons />
      </Flex>

      <Divider my="sm" variant="dotted" />

      <UserLinks />
    </>
  );
}
