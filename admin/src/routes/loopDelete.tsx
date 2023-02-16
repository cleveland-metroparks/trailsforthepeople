import axios from 'axios';
import { redirect } from 'react-router-dom';

const loopsRootPath = '/loops';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL
});

export async function action({ params }) {
  const response = await apiClient.delete<any>("/trails/" + params.loopId);
  console.log('Delete Loop response:', response);
  return redirect(loopsRootPath);
}
