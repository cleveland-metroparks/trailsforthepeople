import { Text, Space } from '@mantine/core';
import { default as dayjs } from 'dayjs';

interface AuthorshipProps {
  date_created?: string;
  creator_username?: string;
  date_modified?: string;
  modifier_username?: string;
}

export function Authorship({
  date_created,
  creator_username,
  date_modified,
  modifier_username
}: AuthorshipProps) {
  return (
    <>
      {date_created && (
        <Text fz="sm">
          Created: <Text span c="dimmed">
            {dayjs(date_created).format('dddd, MMMM D, YYYY [at] h:mma')}
          </Text>
        </Text>
      )}
      {creator_username && (
        <Text fz="sm">
          by: <Text span c="dimmed">{creator_username}</Text>
        </Text>
      )}

      {((date_created || creator_username) && (date_modified || modifier_username)) && (
        <Space h="xs" />
      )}

      {date_modified && (
        <Text fz="sm">
          Modified: <Text span c="dimmed">
            {dayjs(date_modified).format('dddd, MMMM D, YYYY [at] h:mma')}
          </Text>
        </Text>
      )}
      {modifier_username && (
        <Text fz="sm">
          by: <Text span c="dimmed">{modifier_username}</Text>
        </Text>
      )}
    </>
  );
}
