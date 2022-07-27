import axios from "axios";
import { useQuery } from "react-query";
import { Link, useParams } from "react-router-dom";
import { Table, Anchor } from '@mantine/core';
import { default as dayjs } from 'dayjs';

type HintMap = {
  id: number,
  title: string,
  image_filename_local: string,
  last_edited: string,
  last_refreshed: string,
  url_external: string
};

const apiClient = axios.create({
  baseURL: "https://maps-api-dev2.clevelandmetroparks.com/api/v1",
  headers: {
    "Content-type": "application/json",
  },
});

const getAllHintMaps = async () => {
  const response = await apiClient.get<any>("/hint_maps");
  return response.data.data;
}

function formatMapsHintMapLink(id: number) {
  return 'https://maps.clevelandmetroparks.com/static/images/hint_maps/hint-' + id + '.png';
}

//
export function HintMapEdit() {
  let params = useParams();
  return (
    <div>
      <h2>Hint Map {params.hintmapId}</h2>
    </div>
  );
}

//
export function HintMapsList() {
  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<HintMap[], Error>('hint_maps', getAllHintMaps);
  return (
    <div>
      <h2>Hint Maps</h2>

      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}

      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Title</th>
            <th>On maps server</th>
            <th>On Mapbox</th>
            <th>Date edited</th>
            <th>Date refreshed</th>
          </tr>
        </thead>

        <tbody>
        {data &&
          data.map(hint_map => (
            <tr key={hint_map.id}>
              <td>
                <Anchor
                  component={Link}
                  to={`/hintmaps/${hint_map.id}`}
                  key={hint_map.id}
                >
                  {hint_map.title}
                </Anchor>
              </td>
              <td><img src={formatMapsHintMapLink(hint_map.id)} width="100" height="100" /></td>
              <td><img src={hint_map.url_external} width="100" height="100" /></td>
              <td>{dayjs(hint_map.last_edited).format('YYYY-MM-DD HH:mm:ss Z')}</td>
              <td>{dayjs(hint_map.last_refreshed).format('YYYY-MM-DD HH:mm:ss Z')}</td>
            </tr>
          ))}
        </tbody>
      </Table>

    </div>
  );
}