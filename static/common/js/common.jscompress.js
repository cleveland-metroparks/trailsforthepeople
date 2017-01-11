function initMap(){MOBILE&&$("#pane-settings").page();var a=URL_PARAMS.param("base");a||(a="vector");var b;switch(a){case"photo":var c=$('input[name="basemap"][value="photo"]').prop("checked",!0);MOBILE&&c.checkboxradio("refresh"),b=LAYER_MAPBOX_SAT;break;case"map":var c=$('input[name="basemap"][value="map"]').prop("checked",!0);MOBILE&&c.checkboxradio("refresh"),b=LAYER_MAPBOX_MAP;break;case"vector":var c=$('input[name="basemap"][value="vector"]').prop("checked",!0);MOBILE&&c.checkboxradio("refresh"),b=LAYER_MAPBOX_GL_MAP;break;default:throw"Invalid basemap given?"}var d={attributionControl:!1,zoomControl:!0,dragging:!0,closePopupOnClick:!1,crs:L.CRS.EPSG3857,minZoom:MIN_ZOOM,maxZoom:MAX_ZOOM,layers:[b]},e=navigator.userAgent.match(/Android (4|5)/);if(e&&(d.fadeAnimation=!0,d.zoomAnimation=!0,d.markerZoomAnimation=!0),MAP=new L.Map("map_canvas",d),URL_PARAMS.param("x")&&URL_PARAMS.param("y")&&URL_PARAMS.param("z")){var f=parseFloat(URL_PARAMS.param("x")),g=parseFloat(URL_PARAMS.param("y")),h=parseInt(URL_PARAMS.param("z"));MAP.setView(L.latLng(g,f),h),MAP.addLayer(MARKER_TARGET),MARKER_TARGET.setLatLng(L.latLng(g,f))}else MAP.fitBounds(MAX_BOUNDS);if(L.control.scale().addTo(MAP),MAP.on("click",function(a){if(ENABLE_MAPCLICK)return $(".leaflet-popup").length?MAP.closePopup():void wmsGetFeatureInfoByPoint(a.layerPoint)}),URL_PARAMS.param("type")&&URL_PARAMS.param("name")){var i={type:URL_PARAMS.param("type"),name:URL_PARAMS.param("name")};$.get("../ajax/exactnamesearch",i,function(a){if(!(a&&a.s&&a.w&&a.n&&a.e))return alert("Cound not find that feature.");var b=L.latLngBounds(L.latLng(a.s,a.w),L.latLng(a.n,a.e));MAP.fitBounds(b),a.lat&&a.lng?placeTargetMarker(a.lat,a.lng):a.wkt&&(HIGHLIGHT_LINE=lineWKTtoFeature(a.wkt,HIGHLIGHT_LINE_STYLE),MAP.addLayer(HIGHLIGHT_LINE))},"json")}if(URL_PARAMS.param("routefrom")&&URL_PARAMS.param("routeto")&&URL_PARAMS.param("routevia")){var j=URL_PARAMS.param("routefrom").split(",")[0],k=URL_PARAMS.param("routefrom").split(",")[1],l=URL_PARAMS.param("routeto").split(",")[0],m=URL_PARAMS.param("routeto").split(",")[1],n=URL_PARAMS.param("routevia"),o="to";MOBILE&&$("#pane-getdirections").page(),$("#getdirections_disabled").hide(),$("#getdirections_enabled").show(),$("#directions_target_title").text(URL_PARAMS.param("routetitle")),$("#directions_via").val(URL_PARAMS.param("routevia")),MOBILE&&$("#directions_via").selectmenu("refresh"),$("#directions_type").val("geocode"),MOBILE&&$("#directions_type").selectmenu("refresh"),MOBILE?$("#directions_type_geocode_wrap").show():$("#directions_type").change(),$("#directions_address").val(URL_PARAMS.param("routefrom")),$("#directions_target_lat").val(l),$("#directions_target_lng").val(m),$("#directions_via").trigger("change"),$("#directions_address").val(URL_PARAMS.param("fromaddr")),$("#directions_reverse").val(URL_PARAMS.param("whichway")),$("#directions_via_bike").val(URL_PARAMS.param("routevia_bike")),setTimeout(function(){$("#directions_reverse").trigger("change")},1e3),$("#directions_type").val(URL_PARAMS.param("loctype")),getDirections(j,k,l,m,o,n)}$("#share_url").click(function(){$(this).select()}),MAP.on("moveend",updateShareUrl),MAP.on("zoomend",updateShareUrl),MAP.on("layerremove",updateShareUrl),MAP.on("layeradd",updateShareUrl),updateShareUrl()}function lineWKTtoFeature(a,b){var c=new Wkt.Wkt;return c.read(a),c.toObject(b)}function WSENtoBounds(a,b,c,d){return L.latLngBounds([[b,a],[d,c]])}function selectBasemap(a){for(active_layer=AVAILABLE_LAYERS[a],i=0;i<ALL_LAYERS.length;i++)ALL_LAYERS[i]==active_layer?(MAP.hasLayer(ALL_LAYERS[i])||MAP.addLayer(ALL_LAYERS[i],!0),"vector"!=a&&active_layer.bringToBack()):MAP.hasLayer(ALL_LAYERS[i])&&MAP.removeLayer(ALL_LAYERS[i])}function placeTargetMarker(a,b){MAP.addLayer(MARKER_TARGET),MARKER_TARGET.setLatLng(L.latLng(a,b))}function clearTargetMarker(){MAP.removeLayer(MARKER_TARGET)}function placeGPSMarker(a,b){MAP.addLayer(MARKER_GPS),MARKER_GPS.setLatLng(L.latLng(a,b))}function clearGPSMarker(){MAP.removeLayer(MARKER_GPS)}function placeCircle(a,b,c){MAP.removeLayer(CIRCLE),CIRCLE.setLatLng(L.latLng(a,b)),CIRCLE.setRadius(c),MAP.addLayer(CIRCLE)}function clearCircle(){CIRCLE.setLatLng(L.latLng(0,0)),CIRCLE.setRadius(1),MAP.removeLayer(CIRCLE)}function strToLatLng(a){var a=a.replace(/\s+$/,"").replace(/^\s+/,"");if(a.match(/^[\d\.\-\,\s]+$/)){var b=a.split(/[\s\,]+/);if(2==b.length&&(b[0]=parseFloat(b[0]),b[1]=parseFloat(b[1]),b[0]&&b[1])){var c,d;return b[0]<0?(c=b[1],d=b[0]):(c=b[0],d=b[1]),L.latLng([c,d])}}var e=a.match(/^N\s*(\d\d)\s+(\d\d\.\d\d\d)\s+W\s*(\d\d\d)\s+(\d\d\.\d\d\d)$/i);if(e){var f=parseInt(e[1]),g=parseInt(e[2]),h=parseInt(e[3]),i=parseInt(e[4]),c=f+g/60,d=-h-i/60;return L.latLng([c,d])}return null}function zoomToAddress(a){if(!a)return!1;var b={};b.address=a,b.bing_key=BING_API_KEY,b.bbox=GEOCODE_BIAS_BOX,$.get("../ajax/geocode",b,function(a){if(!a)return alert("We couldn't find that address or city.\nPlease try again.");var b=L.latLng(a.lat,a.lng);return MAX_BOUNDS.contains(b)?void switchToMap(function(){MAP.setView(b,16),placeTargetMarker(a.lat,a.lng);var c="";c+='<h3 class="popup_title">'+a.title+"</h3>",c+='<span class="fakelink zoom" title="'+a.title+'" lat="'+a.lat+'" lng="'+a.lng+'" w="'+a.w+'" s="'+a.s+'" e="'+a.e+'" n="'+a.n+'" onClick="zoomElementClick( $(this) );">Directions</span>';var d=new L.Popup;d.setLatLng(b),d.setContent(c),MAP.openPopup(d)}):alert("The only results we could find are too far away to zoom the map there.")},"json")}function wmsGetFeatureInfoByPoint(a){var b=20,c=MAP.layerPointToLatLng(new L.Point(a.x-b,a.y+b)),d=MAP.layerPointToLatLng(new L.Point(a.x+b,a.y-b)),e={w:c.lng,s:c.lat,e:d.lng,n:d.lat},f=MAP.layerPointToLatLng(new L.Point(a.x,a.y));wmsGetFeatureInfoByLatLngBBOX(e,f)}function wmsGetFeatureInfoByLatLng(a){var b={w:a.lng,s:a.lat,e:a.lng,n:a.lat},c=a;wmsGetFeatureInfoByLatLngBBOX(b,c)}function wmsGetFeatureInfoByLatLngBBOX(a,b){var c=a;c.zoom=MAP.getZoom(),$.get("../ajax/query",c,function(a){if(a){var c={};c.maxHeight=parseInt($("#map_canvas").height()),c.maxWidth=parseInt($("#map_canvas").width());var d=new L.Popup(c);d.setLatLng(b),d.setContent(a),MAP.openPopup(d)}},"html")}function processGetDirectionsForm(){var a=$("#directions_reverse").val(),b=$("#directions_via").val();switch(b){case"hike":b="hike";break;case"bike":b=$("#directions_via_bike").val()}$("#directions_source_gid").val(""),$("#directions_source_type").val(""),$.ajaxSetup({async:!1});var c,d,e=$("#directions_type").val();switch(e){case"gps":c=LAST_KNOWN_LOCATION.lat,d=LAST_KNOWN_LOCATION.lng;break;case"geocode":var f=$("#directions_address").val();if(!f)return alert("Please enter an address, city, or landmark.");var g=/^(\d+\.\d+)\,(\-\d+\.\d+)$/.exec(f);if(g)c=parseFloat(g[1]),d=parseFloat(g[2]),getDirections(c,d,i,j,a,b);else{disableDirectionsButton();var h={};h.address=f,h.bing_key=BING_API_KEY,h.bbox=GEOCODE_BIAS_BOX,$.get("../ajax/geocode",h,function(a){if(enableDirectionsButton(),!a)return alert("We couldn't find that address or city.\nPlease try again.");if(c=a.lat,d=a.lng,!MAX_BOUNDS.contains(L.latLng(c,d))){var b="adr."+f,e="pos."+i+"_"+j,g={rtp:b+"~"+e},h="http://bing.com/maps/default.aspx?"+$.param(g),k=$("#directions_steps");return k.empty(),k.append($("<div></div>").html("The address you have chosen is outside of the covered area.<br/>Click the link below to go to Bing Maps for directions.")),void k.append($("<a></a>").text("Click here for directions from Bing Maps").prop("href",h).prop("target","_blank"))}},"json")}break;case"features":disableDirectionsButton();var h={};if(h.keyword=$("#directions_address").val(),h.limit=30,h.lat=MOBILE?LAST_KNOWN_LOCATION.lat:MAP.getCenter().lat,h.lng=MOBILE?LAST_KNOWN_LOCATION.lng:MAP.getCenter().lng,h.via=b,$.get("../ajax/keyword",h,function(a){if(enableDirectionsButton(),!a||!a.length)return alert("We couldn't find any matching landmarks.");for(var b=$("#directions_address").val().replace(/\W/g,"").toLowerCase(),e=0,f=a.length;e<f;e++){var g=a[e].name.replace(/\W/g,"").toLowerCase();if(g==b){a=[a[e]];break}}if(a.length>1)return c=null,d=null,void populateDidYouMean(a);var h=a[0].name.replace(/^\s*/,"").replace(/\s*$/,"");$("#directions_address").val(h),$("#directions_source_gid").val(a[0].gid),$("#directions_source_type").val(a[0].type),c=parseFloat(a[0].lat),d=parseFloat(a[0].lng)},"json"),!c||!d)return}var i=parseFloat($("#directions_target_lat").val()),j=parseFloat($("#directions_target_lng").val()),k=$("#directions_source_gid").val(),l=$("#directions_source_type").val();if("poi"==l||"reservation"==l||"building"==l||"trail"==l){var h={};h.type=l,h.gid=k,h.lat=i,h.lng=j,h.via=b,$.get("../ajax/geocode_for_directions",h,function(a){c=a.lat,d=a.lng,$("#directions_source_lat").val(a.lat),$("#directions_source_lng").val(a.lng)},"json")}var m=$("#directions_target_gid").val(),n=$("#directions_target_type").val();if("poi"==n||"reservation"==n||"building"==n||"trail"==n){var h={};h.type=n,h.gid=m,h.lat=c,h.lng=d,h.via=b,$.get("../ajax/geocode_for_directions",h,function(a){i=a.lat,j=a.lng,$("#directions_target_lat").val(a.lat),$("#directions_target_lng").val(a.lng)},"json")}return i&&j?($.ajaxSetup({async:!0}),void getDirections(c,d,i,j,a,b)):alert("Please close the directions panel, and pick a location.")}function populateDidYouMean(a){var b=$("#directions_steps");b.empty();var c=$("<li></li>").append($("<span></span>").addClass("ui-li-heading").text("Did you mean one of these?"));b.append(c);for(var d=0,e=a.length;d<e;d++){var f=a[d],g=f.name.replace(/^\s*/,"").replace(/\s*$/,""),c=$("<li></li>");c.append($("<span></span>").addClass("ui-li-heading").text(g)).attr("type",f.type).attr("gid",f.gid);var h=function(){$("#directions_address").val($(this).text()),$("#directions_source_gid").val($(this).attr("gid")),$("#directions_source_type").val($(this).attr("type")),$("#directions_button").click()};MOBILE?c.tap(h):c.click(h),c.css({cursor:"pointer"}),b.append(c)}MOBILE&&b.listview("refresh")}function getDirections(a,b,c,d,e,f){$("#directions_steps").empty(),disableDirectionsButton(),$("#directions_source_lat").val(a),$("#directions_source_lng").val(b);var g=$("#directions_prefer").val(),h={sourcelat:a,sourcelng:b,targetlat:c,targetlng:d,tofrom:e,via:f,prefer:g,bing_key:BING_API_KEY};$.get("../ajax/directions",h,function(a){if(enableDirectionsButton(),!a||!a.wkt){var b="Could not find directions.";return"hike"!=f&&(b+="\nTry a different type of trail, terrain, or difficulty."),alert(b)}renderDirectionsStructure(a)},"json")}function disableDirectionsButton(){var a=$("#directions_button");MOBILE?(a.button("disable"),a.closest(".ui-btn").find(".ui-btn-text").text(a.attr("value0"))):(a.prop("disabled",!0),a.val(a.attr("value0")))}function enableDirectionsButton(){var a=$("#directions_button");MOBILE?(a.button("enable"),a.closest(".ui-btn").find(".ui-btn-text").text(a.attr("value1"))):(a.prop("disabled",!1),a.val(a.attr("value1")))}function renderDirectionsStructure(a,b,c){c||(c={}),clearDirectionsLine();var d=lineWKTtoFeature(a.wkt,DIRECTIONS_LINE_STYLE),e=L.latLng(a.start.lat,a.start.lng),f=L.latLng(a.end.lat,a.end.lng);placeDirectionsLine(d,e,f),DIRECTIONS_LINE.extent=WSENtoBounds(a.bounds.west,a.bounds.south,a.bounds.east,a.bounds.north);var g=DIRECTIONS_LINE.extent.pad(.15);MAP.fitBounds(g),b||(b=$("#directions_steps")),b.empty();for(var h=0,i=a.steps.length;h<i;h++){var j=a.steps[h],k=$("<li></li>"),l=j.stepnumber?j.stepnumber+". "+(j.turnword?j.turnword:"")+" "+j.text:j.turnword+" "+j.text;if(k.append($("<span></span>").addClass("ui-li-heading").text(l)),j.distance&&j.duration&&"0"!=j.distance.substr(0,1)){var m=j.distance+", "+j.duration;k.append($("<span></span>").addClass("ui-li-desc").text(m))}b.append(k)}var n=$("<span></span>").addClass("ui-li-desc").html("");a.retries&&a.retries>3&&n.html("Route may be approximated.");var o=$("<span></span>").addClass("ui-li-heading").html("<b>Total:</b> "+a.totals.distance+", "+a.totals.duration);b.append($("<li></li>").append(o).append(n));var p=$("<div></div>").addClass("directions_functions");if(a.elevationprofile){var q=$("<a></a>").addClass("ui-btn").addClass("ui-btn-inline").addClass("ui-corner-all").prop("id","elevationprofile_button").text("Elevation Profile");q.attr("value1","Elevation Profile").attr("value0","Loading"),q.tap(function(){openElevationProfileBySegments()}),p.append(q)}var r=$("<a></a>").addClass("ui-btn").addClass("ui-btn-inline").addClass("ui-corner-all").text("Clear");if(r.tap(function(){$("#directions_steps").empty(),clearDirectionsLine(),$(".directions_functions").empty()}),p.append(r),!c.noshare){var s=$("<a></a>").addClass("ui-btn").addClass("ui-btn-inline").addClass("ui-corner-all").prop("id","share_route_button").text("Share");s.click(function(){updateShareUrlByDirections(),populateShareBox(),sidebar.open("pane-share")}),p.append(s)}if(!MOBILE){var t=$("<a></a>").addClass("ui-btn").addClass("ui-btn-inline").addClass("ui-corner-all").text("Print");t.click(function(){$("#button_print").click()}),p.append(t)}b.after(p),ELEVATION_PROFILE=[],a.elevationprofile&&(ELEVATION_PROFILE=a.elevationprofile),MOBILE&&(b.listview("refresh"),$(".directions_functions img:first").removeClass("ui-li-thumb"))}function clearDirectionsLine(){DIRECTIONS_LINE&&(MAP.removeLayer(DIRECTIONS_LINE),DIRECTIONS_LINE=null),MAP.hasLayer(MARKER_FROM)&&(MARKER_FROM.setLatLng(L.latLng(0,0)),MAP.removeLayer(MARKER_FROM)),MAP.hasLayer(MARKER_TO)&&(MARKER_TO.setLatLng(L.latLng(0,0)),MAP.removeLayer(MARKER_TO)),$("#directions_steps").empty(),$("#measure_steps").empty()}function placeDirectionsLine(a,b,c){DIRECTIONS_LINE=a,MAP.addLayer(DIRECTIONS_LINE),MARKER_FROM.setLatLng(b),MAP.addLayer(MARKER_FROM),MARKER_TO.setLatLng(c),MAP.addLayer(MARKER_TO),MARKER_FROM.dragging.disable(),MARKER_TO.dragging.disable()}function openElevationProfileBySegments(){if(ELEVATION_PROFILE){for(var a=[],b=[],c=0,d=ELEVATION_PROFILE.length;c<d;c++)a[a.length]=ELEVATION_PROFILE[c].x,b[b.length]=ELEVATION_PROFILE[c].y;a=a.join(","),b=b.join(","),$.post("../ajax/elevationprofilebysegments",{x:a,y:b},function(a){return 0!=a.indexOf("http")?alert(a):void showElevation(a)})}}function disableKeywordButton(){var a=$("#search_keyword_button");MOBILE?(a.button("disable"),a.closest(".ui-btn").find(".ui-btn-text").text(a.attr("value0"))):(a.prop("disabled",!0),a.val(a.attr("value0")))}function enableKeywordButton(){var a=$("#search_keyword_button");MOBILE?(a.button("enable"),a.closest(".ui-btn").find(".ui-btn-text").text(a.attr("value1"))):(a.prop("disabled",!1),a.val(a.attr("value1")))}function printMapPrepare(){$("#print_waiting").show(),$("#print_ready").hide()}function printMapDone(a){$("#print_waiting").hide(),a&&($("#print_link").prop("href",a),$("#print_ready").show())}function printMap(){var a=$("#print_comment").val(),b=$("#print_paper").val(),c="",d="",e="",f=PRINT_SIZES[b][0],g=PRINT_SIZES[b][1],h=MAP.latLngToLayerPoint(MAP.getCenter()),i=wgsToLocalSRS(MAP.layerPointToLatLng(new L.Point(h.x-f/2,h.y+g/2))),j=wgsToLocalSRS(MAP.layerPointToLatLng(new L.Point(h.x+f/2,h.y-g/2))),k=[i[0],i[1],j[0],j[1]],l={format_options:"dpi:300"},m=[];if(MAP.hasLayer(AVAILABLE_LAYERS.photo)){if(MAP.getZoom()<14)return alert("Before printing, zoom in closer.");m[m.length]={baseURL:"http://maps.clevelandmetroparks.com/proxy/ohioimagery",opacity:1,singleTile:!1,type:"WMS",layers:["0"],format:"image/png",styles:[""]}}if((MAP.hasLayer(AVAILABLE_LAYERS.photo)||MAP.hasLayer(AVAILABLE_LAYERS.vector))&&(m[m.length]={baseURL:"http://maps.clevelandmetroparks.com/gwms",opacity:1,singleTile:!0,type:"WMS",layers:["group_basemap"],format:"image/jpeg",styles:[""],customParams:l},m[m.length]={baseURL:"http://maps.clevelandmetroparks.com/gwms",opacity:1,singleTile:!0,type:"WMS",layers:["cm:trails","cm:closures","cm:markers_other","cm:markers_swgh"],format:"image/png",styles:"",customParams:l}),DIRECTIONS_LINE&&MAP.hasLayer(DIRECTIONS_LINE)){var n=[];for(var o in DIRECTIONS_LINE._layers){for(var p=DIRECTIONS_LINE._layers[o],q=[],r=0,s=p._latlngs.length;r<s;r++)q[q.length]=wgsToLocalSRS([p._latlngs[r].lng,p._latlngs[r].lat]);n[n.length]=q}var t=DIRECTIONS_LINE_STYLE.opacity,u=DIRECTIONS_LINE_STYLE.color,v=3;m[m.length]={type:"Vector",name:"Directions Line",opacity:t,styles:{default:{strokeColor:u,strokeWidth:v,strokeLinecap:"round"}},styleProperty:"style_index",geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"MultiLineString",coordinates:n}}]}};var w=ICON_FROM.options.iconUrl.replace("maps.clevelandmetroparks.com","10.0.0.23").replace("https:","http:"),x=wgsToLocalSRS(MARKER_FROM.getLatLng()),y=-10,z=0,A=15;m[m.length]={type:"Vector",name:"Target Marker",opacity:1,styleProperty:"style_index",styles:{default:{externalGraphic:w,fillOpacity:1,pointRadius:A,graphicXOffset:y,graphicYOffset:z}},geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"Point",coordinates:x}}]}};var w=ICON_TO.options.iconUrl.replace("maps.clevelandmetroparks.com","10.0.0.23").replace("https:","http:"),x=wgsToLocalSRS(MARKER_TO.getLatLng()),y=-10,z=0,A=15;m[m.length]={type:"Vector",name:"Target Marker",opacity:1,styleProperty:"style_index",styles:{default:{externalGraphic:w,fillOpacity:1,pointRadius:A,graphicXOffset:y,graphicYOffset:z}},geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"Point",coordinates:x}}]}},b+=" with directions";var B,C=$("#directions_reverse").val(),D="to"==C?"from":"to",E=$("#directions_target_title").text(),F=$("#directions_address").val(),G=$("#directions_via option:selected").text().toLowerCase();C&&D&&E&&F?(c="Directions\n"+C+" "+E+"\n"+D+" "+F+"\n"+G,B=$("#directions_steps li")):(c="Measurement directions",B=$("#measure_steps li"));var H=25;switch(b){case"Letter portrait with directions":H=40;break;case"Letter landscape with directions":H=31;break;case"Ledger portrait with directions":H=65;break;case"Ledger landscape with directions":H=45}d=[],e=[],B.each(function(){var a=$(this).find(".ui-li-heading").eq(0).text(),b=$(this).find(".ui-li-desc").eq(0).text(),c=a+"\n     "+b;d.length<H?d[d.length]=c:e[e.length]=c}),d=d.join("\n"),e=e.join("\n")}if(HIGHLIGHT_LINE&&MAP.hasLayer(HIGHLIGHT_LINE)){for(var n=[],I=HIGHLIGHT_LINE.getLatLngs(),o=0,J=I.length;o<J;o++){var K=[];for(vi=0,vl=I[o].length;vi<vl;vi++)K[K.length]=wgsToLocalSRS([I[o][vi].lng,I[o][vi].lat]);n[n.length]=K}var t=HIGHLIGHT_LINE_STYLE.opacity,u=HIGHLIGHT_LINE_STYLE.color,v=3;m[m.length]={type:"Vector",name:"Highlight Line",opacity:t,styles:{default:{strokeColor:u,strokeWidth:v,strokeLinecap:"round"}},styleProperty:"style_index",geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"MultiLineString",coordinates:n}}]}};var M=$("#show_on_map").data("zoomelement").attr("type");if("loop"==M){var B=$("#moreinfo_steps li");b+=" with directions",c=$("#show_on_map").data("zoomelement").attr("title");var H=25;switch(b){case"Letter portrait with directions":H=40;break;case"Letter landscape with directions":H=31;break;case"Ledger portrait with directions":H=65;break;case"Ledger landscape with directions":H=45}d=[],e=[],B.each(function(){var a=$(this).find(".ui-li-heading").eq(0).text(),b=$(this).find(".ui-li-desc").eq(0).text(),c=a+"\n     "+b;d.length<H?d[d.length]=c:e[e.length]=c}),d=d.join("\n"),e=e.join("\n")}}if(MARKER_TARGET&&MAP.hasLayer(MARKER_TARGET)){var w=ICON_TARGET.options.iconUrl,x=wgsToLocalSRS(MARKER_TARGET.getLatLng()),y=-10,z=0,A=15;m[m.length]={type:"Vector",name:"Target Marker",opacity:1,styleProperty:"style_index",styles:{default:{externalGraphic:w,fillOpacity:1,pointRadius:A,graphicXOffset:y,graphicYOffset:z}},geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"Point",coordinates:x}}]}}}var N={units:"feet",srs:"EPSG:3734",layout:b,dpi:300,layers:m,pages:[{bbox:k,rotation:"0",comment:a}],layersMerging:!0,page2title:c,page2text1:d,page2text2:e};printMapPrepare(),$.ajax({url:PRINT_URL,type:"POST",data:JSON.stringify(N),processData:!1,contentType:"application/json",success:function(a){var b=a.getURL;b=b.split("/"),b=b[b.length-1],b=PRINT_PICKUP_BASEURL+b,printMapDone(b)},error:function(a,b,c){alert("Printing failed. Please try again."),printMapDone()}})}function wgsToLocalSRS(a){var b=new Proj4js.Proj("EPSG:4326"),c=new Proj4js.Proj("EPSG:3734"),d=a.lat?new Proj4js.Point(a.lng,a.lat):new Proj4js.Point(a[0],a[1]);return Proj4js.transform(b,c,d),[d.x,d.y]}function loadTwitter(){var a=$("#tweets");a.empty(),a.append($("<tr></tr>").append($("<td></td>").text("Loading...")));var b={};$.get("../ajax/fetch_tweets",b,function(b){a.empty();for(var c=0,d=b.length;c<d;c++){var e=b[c],f=$("<tr></tr>"),g=$("<td></td>").addClass("twitter_lhs"),h=$("<img></img>").prop("src",e.picture),i=$("<a></a>").prop("target","_blank").text(e.username).prop("href","http://twitter.com/"+e.username);g.append(h),g.append($("<br></br>")),g.append(i);var j=$("<td></td>").addClass("twitter_rhs"),k=$("<span></span>").html(e.prettydate+": "+e.content);j.append(k),f.append(g),f.append(j),a.append(f)}},"json")}function trailfinderUpdate(){var a={};a.reservation=$('select[name="trailfinder_reservation"]').val(),a.paved=$('select[name="trailfinder_paved"]').val(),a.uses=[],$('input[name="trailfinder_uses"]:checked').each(function(){a.uses[a.uses.length]=$(this).val()}),a.uses=a.uses.join(","),searchTrails(a)}function searchTrails(a){var b=$("#trailfinder_results");b.empty(),$.get("../ajax/search_trails",a,function(a){if(a.length)for(var c=0,d=a.length;c<d;c++){var e=a[c],f=$("<li></li>").addClass("zoom");f.attr("title",e.name).attr("gid",e.gid).attr("type",e.type).attr("w",e.w).attr("s",e.s).attr("e",e.e).attr("n",e.n).attr("lat",e.lat).attr("lng",e.lng),f.attr("backbutton","#pane-trailfinder"),link=$("<a></a>"),link.attr("class","ui-btn ui-btn-text"),f.append(link),f.click(function(){zoomElementClick($(this))}),link.append($("<h4></h4>").addClass("ui-li-heading").text(e.name)),e.note&&link.append($("<span></span>").addClass("ui-li-desc").html(e.note)),link.append($("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text("0 mi")),f.append(link),b.append(f)}else b.append($("<li></li>").text("No results."));MOBILE&&b.listview("refresh"),MOBILE&&sortLists(b)},"json")}function populateShareBox(){var a={uri:URL_PARAMS.attr("path"),querystring:SHARE_URL_STRING};$.get("../ajax/make_shorturl",a,function(a){if(!a)return alert("Unable to fetch a short URL.\nPlease try again.");var b=URL_PARAMS.attr("protocol")+"://"+URL_PARAMS.attr("host")+"/url/"+a;$("#share_url").text(b)})}function updateShareUrl(){var a={};a.z=MAP.getZoom(),a.x=MAP.getCenter().lng,a.y=MAP.getCenter().lat,MAP.hasLayer(LAYER_MAPBOX_SAT)&&(a.base="photo"),MAP.hasLayer(LAYER_MAPBOX_MAP)&&(a.base="map"),SHARE_URL_STRING=$.param(a)}function updateShareUrlByFeature(a){var b={};b.type=a.attr("type"),b.name=a.attr("title"),SHARE_URL_STRING=$.param(b)}function updateShareUrlByDirections(){if($("#directions_source_lat").val()){var a={};MAP.hasLayer(AVAILABLE_LAYERS.photo)?a.base="photo":MAP.hasLayer(AVAILABLE_LAYERS.vector)?a.base="vector":MAP.hasLayer(AVAILABLE_LAYERS.map)&&(a.base="map"),a.routevia=$("#directions_via").val(),a.routevia_bike=$("#directions_via_bike").val(),a.routefrom=$("#directions_source_lat").val()+","+$("#directions_source_lng").val(),a.routeto=$("#directions_target_lat").val()+","+$("#directions_target_lng").val(),a.routetitle=$("#directions_target_title").text(),a.whichway=$("#directions_reverse").val(),a.loctype=$("#directions_type").val(),a.fromaddr=$("#directions_address").val(),"trail"==a.routevia&&(a.routevia=$("#directions_via_trail").val()),SHARE_URL_STRING=$.param(a)}}function toggleWelcome(a){a?cookieSet("show_welcome",1):cookieDelete("show_welcome")}var MOBILE,ICON_TARGET=L.icon({iconUrl:"/static/common/images/markers/marker-target.png",iconSize:[25,41],iconAnchor:[13,41]}),MARKER_TARGET=L.marker(L.latLng(0,0),{clickable:!1,draggable:!1,icon:ICON_TARGET}),ICON_GPS=L.icon({iconUrl:"/static/common/images/markers/marker-gps.png",iconSize:[25,41],iconAnchor:[13,41]}),MARKER_GPS=L.marker(L.latLng(0,0),{clickable:!1,draggable:!1,icon:ICON_GPS}),ICON_FROM=L.icon({iconUrl:"/static/desktop/measure1.png",iconSize:[20,34],iconAnchor:[10,34]}),ICON_TO=L.icon({iconUrl:"/static/desktop/measure2.png",iconSize:[20,34],iconAnchor:[10,34]}),MARKER_FROM=L.marker(L.latLng(0,0),{clickable:!0,draggable:!0,icon:ICON_FROM}),MARKER_TO=L.marker(L.latLng(0,0),{clickable:!0,draggable:!0,icon:ICON_TO}),CIRCLE=new L.Circle(L.latLng(0,0),1),ELEVATION_PROFILE=null,DIRECTIONS_TARGET=L.latLng(0,0),DIRECTIONS_LINE=null,DIRECTIONS_LINE_STYLE={color:"#0000FF",weight:5,opacity:1,clickable:!1,smoothFactor:.25},HIGHLIGHT_LINE=null,HIGHLIGHT_LINE_STYLE={color:"#FF00FF",weight:3,opacity:.75,clickable:!1,smoothFactor:.25},URL_PARAMS=null,SHARE_URL_STRING=null,ENABLE_MAPCLICK=!0,SKIP_TO_DIRECTIONS=!1;L.LatLng.prototype.bearingTo=function(a){var b=L.LatLng.DEG_TO_RAD,c=L.LatLng.RAD_TO_DEG,d=this.lat*b,e=a.lat*b,f=(a.lng-this.lng)*b,g=Math.sin(f)*Math.cos(e),h=Math.cos(d)*Math.sin(e)-Math.sin(d)*Math.cos(e)*Math.cos(f),i=Math.atan2(g,h);return i=parseInt(i*c),i=(i+360)%360},L.LatLng.prototype.bearingWordTo=function(a){var b=this.bearingTo(a),c="";return b>=22&&b<=67?c="NE":b>=67&&b<=112?c="E":b>=112&&b<=157?c="SE":b>=157&&b<=202?c="S":b>=202&&b<=247?c="SW":b>=247&&b<=292?c="W":b>=292&&b<=337?c="NW":(b>=337||b<=22)&&(c="N"),c},jQuery.fn.tap?jQuery.fn.click=jQuery.fn.tap:jQuery.fn.tap=jQuery.fn.click,$(window).resize(function(){MAP.invalidateSize()}),$(window).load(function(){var a=function(){var a=$("#geocode_text").val();zoomToAddress(a)};$("#geocode_button").tap(a),$("#geocode_text").keydown(function(a){13==a.keyCode&&$("#geocode_button").tap()})}),$(window).load(function(){var a=function(){zoomElementClick($(this))};$(".zoom").tap(a);var b=function(){var a=$(this).data("zoomelement");if(a){var b=a.attr("w"),c=a.attr("s"),d=a.attr("e"),e=a.attr("n"),f=a.attr("lng"),g=a.attr("lat"),h=a.attr("type"),i=$(this).data("wkt");switchToMap(function(){var a=L.latLngBounds(L.latLng(c,b),L.latLng(e,d));a=a.pad(.15),MAP.fitBounds(a),"poi"!=h&&"loop"!=h||placeTargetMarker(g,f),i&&(HIGHLIGHT_LINE&&(MAP.removeLayer(HIGHLIGHT_LINE),HIGHLIGHT_LINE=null),HIGHLIGHT_LINE=lineWKTtoFeature(i,HIGHLIGHT_LINE_STYLE),MAP.addLayer(HIGHLIGHT_LINE))})}};$("#show_on_map").tap(b)}),$(window).load(function(){$('input[type="radio"][name="basemap"]').change(function(){var a=$(this).val();selectBasemap(a)})}),$(window).load(function(){$("#getdirections_clear").click(function(){clearDirectionsLine(),$("#directions_steps").empty()}),$("#directions_via").change(function(){$("#directions_via_bike_wrap").hide();var a=$(this).val();switch(a){case"bike":$("#directions_via_bike_wrap").show();break;case"hike":break;case"car":}})}),$(window).load(function(){$("#trailfinder_typeicons img").tap(function(){var a=$(this),b=a.attr("data-value");$('input[name="trailfinder_uses"]').removeAttr("checked").filter('[value="'+b+'"]').attr("checked","checked"),$("#trailfinder_typeicons img").each(function(){var b=$(this).prop("src");b=$(this).is(a)?b.replace("_off.png","_on.png"):b.replace("_on.png","_off.png"),$(this).prop("src",b)}),trailfinderUpdate()}),$("#trailfinder_go").click(function(){trailfinderUpdate()}),$('select[name="trailfinder_reservation"]').change(function(){trailfinderUpdate()}),$('select[name="trailfinder_paved"]').change(function(){trailfinderUpdate()})}),$(window).load(function(){MOBILE&&($("#pane-settings").page(),$("#pane-welcome").page());var a=cookieGet("show_welcome");a?($("#settings_show_welcome").prop("checked","checked"),MOBILE&&$("#settings_show_welcome").checkboxradio("refresh"),$("#show_welcome").prop("checked","checked"),MOBILE&&$("#show_welcome").checkboxradio("refresh")):($("#settings_show_welcome").removeAttr("checked"),MOBILE&&$("#settings_show_welcome").checkboxradio("refresh"),$("#show_welcome").prop("checked","checked"),MOBILE&&$("#show_welcome").checkboxradio("refresh")),$("#show_welcome").change(function(){toggleWelcome($(this).is(":checked"))}),$("#settings_show_welcome").change(function(){toggleWelcome($(this).is(":checked"))})}),$(window).load(function(){$("#share_feature").click(function(){var a=$("#show_on_map").data("zoomelement");a&&(updateShareUrlByFeature(a),populateShareBox(),sidebar.open("pane-share"))})});