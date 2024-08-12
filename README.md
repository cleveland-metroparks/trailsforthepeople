trailsforthepeople
==================

![trailsforthepeople](https://raw.github.com/cleveland-metroparks/trailsforthepeople/master/static/images/misc/app-teaser.png)

A web application for exploring the parks, trails, and amenities of the [Cleveland Metroparks'](https://www.clevelandmetroparks.com/) extensive system of nature preserves in Greater Cleveland, Ohio.


Background
----------

The Cleveland Metroparks network spans over 23,000 acres (9,300 ha) and includes over 300 miles (480 km) of walking, bicycle, and horse trails as well as numerous picnic areas, nature education centers, golf courses, and countless fishing spots, and the Cleveland Metroparks Zoo.

The app provides park users with an easy way to find picnic areas, trailheads, amenities, and discover new healthy outdoor opportunities, and to navigate to park amenitieis and over trails in the network.

The app was initially funded by [Southwest General Health Center](https://www.swgeneral.com//) and originally developed by [GreenInfo Network](https://www.greeninfo.org/), and is currently developed and maintained by Jeff Schuler of [Substrate](https://www.websubstrate.com/) for the Metroparks.

The web application has evolved from a back-end CodeIgniter PHP-based web application – backed by a PostGIS (PostgreSQL) database and pgRouting geospatial routing – to a purely front-end JavaScript app that consumes data from the Metroparks' maps API, a separate app and repository that the back-end has been split into.


Running
-----------------

Clone the repo into a web-accessible directory and load that URL in a web browser.


Developing
---------------------

Primary app code is in /static/src/js, and Sass styling in /static/src/scss.


Building
---------------------

Install project library includes Grunt and the other necessary build tools:

````
npm install
````

Run grunt to "compile", concatenate, and minify JS & Sass.

````
grunt
````

JS and Sass (in /static/src) will be built into /static/dist. The (single-page) app at /index.html includes these built resources.

Running grunt with:

````
grunt all
````

will also build some custom map embed JavaScript for inclusion on specific pages on Cleveland Metroparks' main website.