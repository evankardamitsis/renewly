'use client'
import {Divider, Stack, Title} from "@mantine/core";

export default function Home() {


  return (
      <Stack bg={"black"} w="100%" h="100dvh" justify="center" align="center">
          <Title fz={68} c={"yellow"}>Coming Soon</Title>
          <Divider />
        <Title c="white">Renewly</Title>
        <Title c={"white"} order={2}>A new way to boost productivity</Title>
      </Stack>

  );
}
