var MAP=null,BBOX_SOUTHWEST=L.latLng(41.11816,-82.08504),BBOX_NORTHEAST=L.latLng(41.70009,-81.28029),MAX_BOUNDS=L.latLngBounds(BBOX_SOUTHWEST,BBOX_NORTHEAST),MIN_ZOOM=11,MAX_ZOOM=18,GEOCODE_BIAS_BOX="41.202048178648,-81.9627793163304,41.5885467839419,-81.386224018357",PRINT_URL="/pdf/create.json",PRINT_PICKUP_BASEURL="/pdf/",BING_API_KEY="AjBuYw8goYn_CWiqk65Rbf_Cm-j1QFPH-gGfOxjBipxuEB2N3n9yACKu5s8Dl18N",PRINT_SIZES={"Letter portrait":[580,714],"Letter landscape":[762,526],"Ledger portrait":[744,1126],"Ledger landscape":[1178,690]},PHOTOBASE=new L.TileLayer("//maps.clevelandmetroparks.com/tilestache/tilestache.cgi/satphoto_mobilestack/{z}/{x}/{y}.jpg",{name:"photo",subdomains:"123"}),MAPBASE=new L.TileLayer("//maps.clevelandmetroparks.com/tilestache/tilestache.cgi/basemap_mobilestack/{z}/{x}/{y}.jpg",{name:"terrain",subdomains:"123"});const MAPBOX_TOKEN="pk.eyJ1IjoiY2xldmVsYW5kLW1ldHJvcGFya3MiLCJhIjoiWHRKaDhuRSJ9.FGqNSOHwiCr2dmTH2JTMAA";L.mapbox.accessToken=MAPBOX_TOKEN;const MAPBOX_MAP_URL_FRAG="cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn";var MAPBOXBASE=L.tileLayer("https://api.mapbox.com/styles/v1/"+MAPBOX_MAP_URL_FRAG+"/tiles/{z}/{x}/{y}?access_token="+L.mapbox.accessToken,{tileSize:512,zoomOffset:-1,attribution:'© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'});