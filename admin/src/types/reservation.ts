// @TODO: Get this list from the DB
export const reservationList = [
    '',
    'Acacia Reservation',
    'Bedford Reservation',
    'Big Creek Reservation',
    'Bradley Woods Reservation',
    'Brecksville Reservation',
    'Brookside Reservation',
    'Cleveland Metroparks Zoo',
    'Euclid Creek Reservation',
    'Garfield Park Reservation',
    'Hinckley Reservation',
    'Huntington Reservation',
    'Lakefront Reservation',
    'Mill Stream Run Reservation',
    'North Chagrin Reservation',
    'Ohio & Erie Canal Reservation',
    'Rocky River Reservation',
    'South Chagrin Reservation',
    'Washington Reservation',
    'West Creek Reservation',
];

export const reservationListSelectOptions = reservationList.map(cat => ({
    value: cat,
    label: (cat !== '' && cat != null) ? cat : '(none)',
}));