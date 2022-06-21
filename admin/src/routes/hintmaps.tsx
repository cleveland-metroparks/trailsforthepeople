import axios from "axios";
import { useQuery } from "react-query";
import { Table } from '@mantine/core';

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

export default function HintMaps() {
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
            {/*<th>ID</th>*/}
            <th>On maps</th>
            <th>On Mapbox</th>
            {/*<th>image_filename_local</th>*/}
            <th>Edited</th>
            <th>Refreshed</th>
          </tr>
        </thead>
        <tbody>
        {data &&
          data.map(hint_map => (
            <tr key={hint_map.id}>
              <td>{hint_map.title}</td>
              {/*<td>{hint_map.id}</td>*/}
              <td><img src={formatMapsHintMapLink(hint_map.id)} width="100" height="100" /></td>
              <td><img src={hint_map.url_external} width="100" height="100" /></td>
              {/*<td>{hint_map.image_filename_local}</td>*/}
              <td>{hint_map.last_edited}</td>
              <td>{hint_map.last_refreshed}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}