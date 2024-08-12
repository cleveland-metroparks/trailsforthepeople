// import React, { useState } from 'react';
// import { useParams, Navigate, redirect } from 'react-router-dom';
import { redirect } from 'react-router-dom';
// import { showNotification, updateNotification } from '@mantine/notifications';

import { mapsApiClient } from "../components/mapsApi";

const markersRootPath = '/markers';

// interface props {
//   onDelete: () => void;
// }

export async function action({ params }) {
  const response = await mapsApiClient.delete<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/markers/" + params.markerId);
  console.log('Delete Marker response:', response);
  return redirect(markersRootPath);
  // return <Navigate to={markersRootPath} replace={true} />
}

// export function MarkerDelete({ onDelete }) {
//   const { markerId } = useParams();
//   const [isDeleting, setIsDeleting] = useState(false);
//   // const [error, setError] = useState<string | null>(null);

//   const deleteMarker = async () => {
//     setIsDeleting(true);
//     showNotification({
//       id: 'delete-marker',
//       loading: true,
//       title: 'Deleting marker',
//       message: 'One moment',
//       autoClose: false,
//       withCloseButton: false,
//     });

//     try {
//       const response = await mapsApiClient.delete<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/markers/" + markerId);
//       onDelete();
//       const deletedMsg = `Marker (ID: ${markerId}) deleted`;
//       updateNotification({
//         id: 'delete-marker',
//         loading: false,
//         title: deletedMsg,
//         message: '',
//         autoClose: 5000,
//       });
//       // queryClient.invalidateQueries({ queryKey: ['marker'] });
//       console.log(deletedMsg + ':', response);
//     } catch (error) {
//       // setError(error.message);
//       const errMsg = error.name + ': ' + error.message + ' (' + error.code + ')';
//       updateNotification({
//         id: 'delete-marker',
//         loading: false,
//         color: 'red',
//         title: 'Error deleting marker',
//         message: errMsg,
//         autoClose: false,
//       });
//       setIsDeleting(false);
//       console.error("Error deleting marker:", error);
//     } finally {
//       console.log("FINALLY");
//       setIsDeleting(false);
//     }
//   };

//   // deleteMarker();
//   return <Navigate to={markersRootPath} replace={true} />

//   // return (
//   //   <>
//   //     <Text>Are you sure you want to delete this marker?</Text>
//   //   </>
//   // );
// };
