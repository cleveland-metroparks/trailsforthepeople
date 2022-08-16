import { useState } from 'react';
import axios from "axios";
import { useQuery } from "react-query";
import { Box } from '@mantine/core';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type ElevationProfilePoint = {x: number, y: number};
type ElevationProfileArray = Array<ElevationProfilePoint>;

type LoopProfile = {
  id: number,
  elevation_profile: ElevationProfileArray
};

//
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

interface LoopProfileProps {
  loopId:  number;
}

//
export function LoopProfileChart(props: LoopProfileProps) {
  let loopId = props.loopId ? props.loopId.toString() : '';
  const [profileData, setProfileData] = useState(Array<ElevationProfilePoint>);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
          display: false,
      },
      responsive: true,
      scales: {
        y: {
            title: {
              display: true,
              text: 'Elevation (feet)',
              color: '#000'
            }
        },
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Distance (miles)',
            color: '#000'
          },
          ticks: {
            min: 0,
            precision: 2
          },
        },
      },
      title: {
        display: true,
        text: 'Elevation Profile',
      },
    },
  };

  let chartData = {
    datasets: [
      {
        label: 'Elevation Prfofile',
        data: profileData,
        pointRadius: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 2,
        fill: false
      }
    ],
  };

  // Get loop geometry from API
  const getLoopProfile = async (id: string) => {
    const response = await apiClient.get<any>("/trail_profiles/" + id);

    setProfileData(response.data.data.elevation_profile);

    return response.data.data;
  }

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<LoopProfile, Error>(['loop_profile', loopId], () => getLoopProfile(loopId));

  return (
    <div>
      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the loop - ${error.message}`}</div>
      )}

      {data &&
        <Box sx={{ maxWidth: 800 }}>
          <Line options={chartOptions} data={chartData} />
        </Box>
      }
    </div>
  );
}