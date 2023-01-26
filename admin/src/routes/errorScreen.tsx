import { useRouteError, isRouteErrorResponse } from "react-router-dom";

import { Title, Text } from '@mantine/core';

export function ErrorScreen() {
  const error = useRouteError();

  console.error("Error:", error);

  let messageText = '';
  if (isRouteErrorResponse(error)) {
    messageText = error.status + ' ' + error.statusText;
  } else if (error instanceof Error) {
    messageText = error.message;
  } else {
    messageText = "Unknown Error";
  }

  return (
    <>
      <Title order={2}>Oops!</Title>
      <Text sx={{marginTop: '1em'}}>Sorry, an error has occurred:</Text>
      <Text fs="italic" sx={{marginTop: '1em'}}>{ messageText }</Text>
    </>
  );
}