function initMap(){MOBILE&&$("#page-settings").page();var e=URL_PARAMS.param("base");e||(e="map");var t;switch(e){case"photo":var a=$('input[name="basemap"][value="photo"]').prop("checked",!0);MOBILE&&a.checkboxradio("refresh"),t=PHOTOBASE;break;case"map":var a=$('input[name="basemap"][value="map"]').prop("checked",!0);MOBILE&&a.checkboxradio("refresh"),t=MAPBASE;break;default:throw"Invalid basemap given?"}var r={attributionControl:!1,zoomControl:!0,dragging:!0,closePopupOnClick:!1,crs:L.CRS.EPSG3857,minZoom:MIN_ZOOM,maxZoom:MAX_ZOOM,layers:[t]},n=navigator.userAgent.match(/Android (4|5)/);if(n&&(r.fadeAnimation=!0,r.zoomAnimation=!0,r.markerZoomAnimation=!0),MAP=new L.Map("map_canvas",r),URL_PARAMS.param("x")&&URL_PARAMS.param("y")&&URL_PARAMS.param("z")){var i=parseFloat(URL_PARAMS.param("x")),o=parseFloat(URL_PARAMS.param("y")),s=parseInt(URL_PARAMS.param("z"));MAP.setView(L.latLng(o,i),s),MAP.addLayer(MARKER_TARGET),MARKER_TARGET.setLatLng(L.latLng(o,i))}else MAP.fitBounds(MAX_BOUNDS);if(L.control.scale().addTo(MAP),MAP.on("click",function(e){return ENABLE_MAPCLICK?$(".leaflet-popup").length?MAP.closePopup():void wmsGetFeatureInfoByPoint(e.layerPoint):void 0}),URL_PARAMS.param("type")&&URL_PARAMS.param("name")){var l={type:URL_PARAMS.param("type"),name:URL_PARAMS.param("name")};$.get("../ajax/exactnamesearch",l,function(e){if(!(e&&e.s&&e.w&&e.n&&e.e))return alert("Cound not find that feature.");var t=L.latLngBounds(L.latLng(e.s,e.w),L.latLng(e.n,e.e));MAP.fitBounds(t),e.lat&&e.lng?placeTargetMarker(e.lat,e.lng):e.wkt&&(HIGHLIGHT_LINE=lineWKTtoFeature(e.wkt,HIGHLIGHT_LINE_STYLE),MAP.addLayer(HIGHLIGHT_LINE))},"json")}if(URL_PARAMS.param("routefrom")&&URL_PARAMS.param("routeto")&&URL_PARAMS.param("routevia")){var c=URL_PARAMS.param("routefrom").split(",")[0],p=URL_PARAMS.param("routefrom").split(",")[1],d=URL_PARAMS.param("routeto").split(",")[0],g=URL_PARAMS.param("routeto").split(",")[1],u=URL_PARAMS.param("routevia"),_="to";MOBILE&&$("#page-getdirections").page(),$("#getdirections_disabled").hide(),$("#getdirections_enabled").show(),$("#directions_target_title").text(URL_PARAMS.param("routetitle")),$("#directions_via").val(URL_PARAMS.param("routevia")),MOBILE&&$("#directions_via").selectmenu("refresh"),$("#directions_type").val("geocode"),MOBILE&&$("#directions_type").selectmenu("refresh"),MOBILE?$("#directions_type_geocode_wrap").show():$("#directions_type").change(),$("#directions_address").val(URL_PARAMS.param("routefrom")),$("#directions_target_lat").val(d),$("#directions_target_lng").val(g),$("#directions_via").trigger("change"),$("#directions_address").val(URL_PARAMS.param("fromaddr")),$("#directions_reverse").val(URL_PARAMS.param("whichway")),$("#directions_via_bike").val(URL_PARAMS.param("routevia_bike")),setTimeout(function(){$("#directions_reverse").trigger("change")},1e3),$("#directions_type").val(URL_PARAMS.param("loctype")),getDirections(c,p,d,g,_,u)}$("#share_url").click(function(){$(this).select()}),MAP.on("moveend",updateShareUrl),MAP.on("zoomend",updateShareUrl),MAP.on("layerremove",updateShareUrl),MAP.on("layeradd",updateShareUrl),updateShareUrl()}function lineWKTtoFeature(e,t){var a=new Wkt.Wkt;return a.read(e),a.toObject(t)}function WSENtoBounds(e,t,a,r){return L.latLngBounds([[t,e],[r,a]])}function selectBasemap(e){switch(e){case"photo":MAP.hasLayer(MAPBASE)&&MAP.removeLayer(MAPBASE),MAP.hasLayer(PHOTOBASE)||MAP.addLayer(PHOTOBASE,!0),PHOTOBASE.bringToBack();break;case"map":MAP.hasLayer(PHOTOBASE)&&MAP.removeLayer(PHOTOBASE),MAP.hasLayer(MAPBASE)||MAP.addLayer(MAPBASE,!0),MAPBASE.bringToBack()}}function placeTargetMarker(e,t){MAP.addLayer(MARKER_TARGET),MARKER_TARGET.setLatLng(L.latLng(e,t))}function clearTargetMarker(){MAP.removeLayer(MARKER_TARGET)}function placeGPSMarker(e,t){MAP.addLayer(MARKER_GPS),MARKER_GPS.setLatLng(L.latLng(e,t))}function clearGPSMarker(){MAP.removeLayer(MARKER_GPS)}function placeCircle(e,t,a){MAP.removeLayer(CIRCLE),CIRCLE.setLatLng(L.latLng(e,t)),CIRCLE.setRadius(a),MAP.addLayer(CIRCLE)}function clearCircle(){CIRCLE.setLatLng(L.latLng(0,0)),CIRCLE.setRadius(1),MAP.removeLayer(CIRCLE)}function strToLatLng(e){var e=e.replace(/\s+$/,"").replace(/^\s+/,"");if(e.match(/^[\d\.\-\,\s]+$/)){var t=e.split(/[\s\,]+/);if(2==t.length&&(t[0]=parseFloat(t[0]),t[1]=parseFloat(t[1]),t[0]&&t[1])){var a,r;return t[0]<0?(a=t[1],r=t[0]):(a=t[0],r=t[1]),L.latLng([a,r])}}var n=e.match(/^N\s*(\d\d)\s+(\d\d\.\d\d\d)\s+W\s*(\d\d\d)\s+(\d\d\.\d\d\d)$/i);if(n){var i=parseInt(n[1]),o=parseInt(n[2]),s=parseInt(n[3]),l=parseInt(n[4]),a=i+o/60,r=-s-l/60;return L.latLng([a,r])}return null}function zoomToAddress(e){if(!e)return!1;var t={};t.address=e,t.bing_key=BING_API_KEY,t.bbox=GEOCODE_BIAS_BOX,$.get("../ajax/geocode",t,function(e){if(!e)return alert("We couldn't find that address or city.\nPlease try again.");var t=L.latLng(e.lat,e.lng);return MAX_BOUNDS.contains(t)?void switchToMap(function(){MAP.setView(t,16),placeTargetMarker(e.lat,e.lng);var a="";a+='<h3 class="popup_title">'+e.title+"</h3>",a+='<span class="fakelink zoom" title="'+e.title+'" lat="'+e.lat+'" lng="'+e.lng+'" w="'+e.w+'" s="'+e.s+'" e="'+e.e+'" n="'+e.n+'" onClick="zoomElementClick( $(this) );">Directions</span>';var r=new L.Popup;r.setLatLng(t),r.setContent(a),MAP.openPopup(r)}):alert("The only results we could find are too far away to zoom the map there.")},"json")}function wmsGetFeatureInfoByPoint(e){var t=20,a=MAP.layerPointToLatLng(new L.Point(e.x-t,e.y+t)),r=MAP.layerPointToLatLng(new L.Point(e.x+t,e.y-t)),n={w:a.lng,s:a.lat,e:r.lng,n:r.lat},i=MAP.layerPointToLatLng(new L.Point(e.x,e.y));wmsGetFeatureInfoByLatLngBBOX(n,i)}function wmsGetFeatureInfoByLatLng(e){var t={w:e.lng,s:e.lat,e:e.lng,n:e.lat},a=e;wmsGetFeatureInfoByLatLngBBOX(t,a)}function wmsGetFeatureInfoByLatLngBBOX(e,t){var a=e;a.zoom=MAP.getZoom(),$.get("../ajax/query",a,function(e){if(e){var a={};a.maxHeight=parseInt($("#map_canvas").height()-$("#toolbar").height()),a.maxWidth=parseInt($("#map_canvas").width());var r=new L.Popup(a);r.setLatLng(t),r.setContent(e),MAP.openPopup(r)}},"html")}function processGetDirectionsForm(){var e=$("#directions_reverse").val(),t=$("#directions_via").val();switch(t){case"hike":t="hike";break;case"bike":t=$("#directions_via_bike").val()}$("#directions_source_gid").val(""),$("#directions_source_type").val(""),$.ajaxSetup({async:!1});var a,r,n=$("#directions_type").val();switch(n){case"gps":a=LAST_KNOWN_LOCATION.lat,r=LAST_KNOWN_LOCATION.lng;break;case"geocode":var i=$("#directions_address").val();if(!i)return alert("Please enter an address, city, or landmark.");var o=/^(\d+\.\d+)\,(\-\d+\.\d+)$/.exec(i);if(o)a=parseFloat(o[1]),r=parseFloat(o[2]),getDirections(a,r,l,c,e,t);else{disableDirectionsButton();var s={};s.address=i,s.bing_key=BING_API_KEY,s.bbox=GEOCODE_BIAS_BOX,$.get("../ajax/geocode",s,function(e){if(enableDirectionsButton(),!e)return alert("We couldn't find that address or city.\nPlease try again.");if(a=e.lat,r=e.lng,!MAX_BOUNDS.contains(L.latLng(a,r))){var t="adr."+i,n="pos."+l+"_"+c,o={rtp:t+"~"+n},s="http://bing.com/maps/default.aspx?"+$.param(o),p=$("#directions_steps");return p.empty(),p.append($("<div></div>").html("The address you have chosen is outside of the covered area.<br/>Click the link below to go to Bing Maps for directions.")),void p.append($("<a></a>").text("Click here for directions from Bing Maps").prop("href",s).prop("target","_blank"))}},"json")}break;case"features":disableDirectionsButton();var s={};if(s.keyword=$("#directions_address").val(),s.limit=30,s.lat=MOBILE?LAST_KNOWN_LOCATION.lat:MAP.getCenter().lat,s.lng=MOBILE?LAST_KNOWN_LOCATION.lng:MAP.getCenter().lng,s.via=t,$.get("../ajax/keyword",s,function(e){if(enableDirectionsButton(),!e||!e.length)return alert("We couldn't find any matching landmarks.");for(var t=$("#directions_address").val().replace(/\W/g,"").toLowerCase(),n=0,i=e.length;i>n;n++){var o=e[n].name.replace(/\W/g,"").toLowerCase();if(o==t){e=[e[n]];break}}if(e.length>1)return a=null,r=null,void populateDidYouMean(e);var s=e[0].name.replace(/^\s*/,"").replace(/\s*$/,"");$("#directions_address").val(s),$("#directions_source_gid").val(e[0].gid),$("#directions_source_type").val(e[0].type),a=parseFloat(e[0].lat),r=parseFloat(e[0].lng)},"json"),!a||!r)return}var l=parseFloat($("#directions_target_lat").val()),c=parseFloat($("#directions_target_lng").val()),p=$("#directions_source_gid").val(),d=$("#directions_source_type").val();if("poi"==d||"reservation"==d||"building"==d||"trail"==d){var s={};s.type=d,s.gid=p,s.lat=l,s.lng=c,s.via=t,$.get("../ajax/geocode_for_directions",s,function(e){a=e.lat,r=e.lng,$("#directions_source_lat").val(e.lat),$("#directions_source_lng").val(e.lng)},"json")}var g=$("#directions_target_gid").val(),u=$("#directions_target_type").val();if("poi"==u||"reservation"==u||"building"==u||"trail"==u){var s={};s.type=u,s.gid=g,s.lat=a,s.lng=r,s.via=t,$.get("../ajax/geocode_for_directions",s,function(e){l=e.lat,c=e.lng,$("#directions_target_lat").val(e.lat),$("#directions_target_lng").val(e.lng)},"json")}return l&&c?($.ajaxSetup({async:!0}),void getDirections(a,r,l,c,e,t)):alert("Please close the directions panel, and pick a location.")}function populateDidYouMean(e){var t=$("#directions_steps");t.empty();var a=$("<li></li>").append($("<span></span>").addClass("ui-li-heading").text("Did you mean one of these?"));t.append(a);for(var r=0,n=e.length;n>r;r++){var i=e[r],o=i.name.replace(/^\s*/,"").replace(/\s*$/,""),a=$("<li></li>");a.append($("<span></span>").addClass("ui-li-heading").text(o)).attr("type",i.type).attr("gid",i.gid);var s=function(){$("#directions_address").val($(this).text()),$("#directions_source_gid").val($(this).attr("gid")),$("#directions_source_type").val($(this).attr("type")),$("#directions_button").click()};MOBILE?a.tap(s):a.click(s),a.css({cursor:"pointer"}),t.append(a)}MOBILE&&t.listview("refresh")}function getDirections(e,t,a,r,n,i){$("#directions_steps").empty(),disableDirectionsButton(),$("#directions_source_lat").val(e),$("#directions_source_lng").val(t);var o=$("#directions_prefer").val(),s={sourcelat:e,sourcelng:t,targetlat:a,targetlng:r,tofrom:n,via:i,prefer:o,bing_key:BING_API_KEY};$.get("../ajax/directions",s,function(e){if(enableDirectionsButton(),!e||!e.wkt){var t="Could not find directions.";return"hike"!=i&&(t+="\nTry a different type of trail, terrain, or difficulty."),alert(t)}renderDirectionsStructure(e)},"json")}function disableDirectionsButton(){var e=$("#directions_button");MOBILE?(e.button("disable"),e.closest(".ui-btn").find(".ui-btn-text").text(e.attr("value0"))):(e.prop("disabled",!0),e.val(e.attr("value0")))}function enableDirectionsButton(){var e=$("#directions_button");MOBILE?(e.button("enable"),e.closest(".ui-btn").find(".ui-btn-text").text(e.attr("value1"))):(e.prop("disabled",!1),e.val(e.attr("value1")))}function renderDirectionsStructure(e,t,a){a||(a={}),clearDirectionsLine();var r=lineWKTtoFeature(e.wkt,DIRECTIONS_LINE_STYLE),n=L.latLng(e.start.lat,e.start.lng),i=L.latLng(e.end.lat,e.end.lng);if(placeDirectionsLine(r,n,i),DIRECTIONS_LINE.extent=WSENtoBounds(e.bounds.west,e.bounds.south,e.bounds.east,e.bounds.north),!MOBILE||"page-map"==$.mobile.activePage.prop("id")){var o=DIRECTIONS_LINE.extent.pad(.15);MAP.fitBounds(o)}t||(t=$("#directions_steps")),t.empty();for(var s=0,l=e.steps.length;l>s;s++){var c=e.steps[s],p=$("<li></li>"),d=c.stepnumber?c.stepnumber+". "+(c.turnword?c.turnword:"")+" "+c.text:c.turnword+" "+c.text;if(p.append($("<span></span>").addClass("ui-li-heading").text(d)),c.distance&&c.duration&&"0"!=c.distance.substr(0,1)){var g=c.distance+", "+c.duration;p.append($("<span></span>").addClass("ui-li-desc").text(g))}t.append(p)}var u=$("<span></span>").addClass("ui-li-desc").html("");e.retries&&e.retries>3&&u.html("Route may be approximated.");var _=$("<span></span>").addClass("ui-li-heading").html("<b>Total:</b> "+e.totals.distance+", "+e.totals.duration);t.append($("<li></li>").append(_).append(u));var h=$("<li></li>").addClass("directions_functions");if(e.elevationprofile){var f=$("<img></img>").prop("title","Elevation Profile").prop("id","elevationprofile_button").addClass("fakelink").prop("src","/static/common/elevprofile.png");f.attr("value1","Elevation Profile").attr("value0","Loading"),f.tap(function(){openElevationProfileBySegments()}),h.append(f)}if(MOBILE){h.append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");var v=$("<img></img>").prop("title","Map").addClass("fakelink").prop("src","/static/common/map.png");v.tap(function(){switchToMap(function(){DIRECTIONS_LINE&&MAP.fitBounds(DIRECTIONS_LINE.extent)})}),h.append(v);var m=$("<img></img>").prop("title","Clear").addClass("fakelink").prop("src","/static/common/smallclear.png");m.tap(function(){$("#directions_steps").empty(),clearDirectionsLine()}),h.append(m)}if(!a.noshare){var A=$("<img></img>").prop("title","Share").addClass("fakelink").prop("id","share_route_button").prop("src","/static/common/share.png");A.click(function(){updateShareUrlByDirections(),MOBILE?$.mobile.changePage("#page-share"):($(".dialog").dialog("close"),$("#share").dialog("open"))}),h.append(A)}if(!MOBILE){var y=$("<img></img>").attr("title","Print").addClass("fakelink").prop("src","/static/common/print.png");y.click(function(){$("#button_print").click()}),h.append(y)}t.append(h),ELEVATION_PROFILE=[],e.elevationprofile&&(ELEVATION_PROFILE=e.elevationprofile),MOBILE&&(t.listview("refresh"),$(".directions_functions img:first").removeClass("ui-li-thumb"))}function clearDirectionsLine(){DIRECTIONS_LINE&&(MAP.removeLayer(DIRECTIONS_LINE),DIRECTIONS_LINE=null),MAP.hasLayer(MARKER_FROM)&&(MARKER_FROM.setLatLng(L.latLng(0,0)),MAP.removeLayer(MARKER_FROM)),MAP.hasLayer(MARKER_TO)&&(MARKER_TO.setLatLng(L.latLng(0,0)),MAP.removeLayer(MARKER_TO)),$("#directions_steps").empty(),$("#measure_steps").empty()}function placeDirectionsLine(e,t,a){DIRECTIONS_LINE=e,MAP.addLayer(DIRECTIONS_LINE),MARKER_FROM.setLatLng(t),MAP.addLayer(MARKER_FROM),MARKER_TO.setLatLng(a),MAP.addLayer(MARKER_TO),MARKER_FROM.dragging.disable(),MARKER_TO.dragging.disable()}function openElevationProfileBySegments(){if(ELEVATION_PROFILE){for(var e=[],t=[],a=0,r=ELEVATION_PROFILE.length;r>a;a++)e[e.length]=ELEVATION_PROFILE[a].x,t[t.length]=ELEVATION_PROFILE[a].y;e=e.join(","),t=t.join(","),$.post("../ajax/elevationprofilebysegments",{x:e,y:t},function(e){return 0!=e.indexOf("http")?alert(e):void showElevation(e)})}}function disableKeywordButton(){var e=$("#search_keyword_button");MOBILE?(e.button("disable"),e.closest(".ui-btn").find(".ui-btn-text").text(e.attr("value0"))):(e.prop("disabled",!0),e.val(e.attr("value0")))}function enableKeywordButton(){var e=$("#search_keyword_button");MOBILE?(e.button("enable"),e.closest(".ui-btn").find(".ui-btn-text").text(e.attr("value1"))):(e.prop("disabled",!1),e.val(e.attr("value1")))}function printMapPrepare(){$("#print_waiting").show(),$("#print_ready").hide()}function printMapDone(e){$("#print_waiting").hide(),e&&($("#print_link").prop("href",e),$("#print_ready").show())}function printMap(){var e=$("#print_comment").val(),t=$("#print_paper").val(),a="",r="",n="",i=PRINT_SIZES[t][0],o=PRINT_SIZES[t][1],s=MAP.latLngToLayerPoint(MAP.getCenter()),l=wgsToLocalSRS(MAP.layerPointToLatLng(new L.Point(s.x-i/2,s.y+o/2))),c=wgsToLocalSRS(MAP.layerPointToLatLng(new L.Point(s.x+i/2,s.y-o/2))),p=[l[0],l[1],c[0],c[1]],d={format_options:"dpi:300"},g=[];if(MAP.hasLayer(PHOTOBASE)){if(MAP.getZoom()<14)return alert("Before printing, zoom in closer.");g[g.length]={baseURL:"http://maps.clemetparks.com/proxy/ohioimagery",opacity:1,singleTile:!1,type:"WMS",layers:["0"],format:"image/png",styles:[""]}}if(MAP.hasLayer(MAPBASE)&&(g[g.length]={baseURL:"http://maps.clemetparks.com/gwms",opacity:1,singleTile:!0,type:"WMS",layers:["group_basemap"],format:"image/jpeg",styles:[""],customParams:d}),DIRECTIONS_LINE&&MAP.hasLayer(DIRECTIONS_LINE)){var u=[];for(var _ in DIRECTIONS_LINE._layers){for(var h=DIRECTIONS_LINE._layers[_],f=[],v=0,m=h._latlngs.length;m>v;v++)f[f.length]=wgsToLocalSRS([h._latlngs[v].lng,h._latlngs[v].lat]);u[u.length]=f}var A=DIRECTIONS_LINE_STYLE.opacity,y=DIRECTIONS_LINE_STYLE.color,M=3;g[g.length]={type:"Vector",name:"Directions Line",opacity:A,styles:{"default":{strokeColor:y,strokeWidth:M,strokeLinecap:"round"}},styleProperty:"style_index",geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"MultiLineString",coordinates:u}}]}};var E=ICON_FROM.options.iconUrl,R=wgsToLocalSRS(MARKER_FROM.getLatLng()),I=-10,P=0,T=15;g[g.length]={type:"Vector",name:"Target Marker",opacity:1,styleProperty:"style_index",styles:{"default":{externalGraphic:E,fillOpacity:1,pointRadius:T,graphicXOffset:I,graphicYOffset:P}},geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"Point",coordinates:R}}]}};var E=ICON_TO.options.iconUrl,R=wgsToLocalSRS(MARKER_TO.getLatLng()),I=-10,P=0,T=15;g[g.length]={type:"Vector",name:"Target Marker",opacity:1,styleProperty:"style_index",styles:{"default":{externalGraphic:E,fillOpacity:1,pointRadius:T,graphicXOffset:I,graphicYOffset:P}},geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"Point",coordinates:R}}]}},t+=" with directions";var S,O=$("#directions_reverse").val(),w="to"==O?"from":"to",b=$("#directions_target_title").text(),k=$("#directions_address").val(),C=$("#directions_via option:selected").text().toLowerCase();O&&w&&b&&k?(a="Directions\n"+O+" "+b+"\n"+w+" "+k+"\n"+C,S=$("#directions_steps li")):(a="Measurement directions",S=$("#measure_steps li"));var B=25;switch(t){case"Letter portrait with directions":B=40;break;case"Letter landscape with directions":B=31;break;case"Ledger portrait with directions":B=65;break;case"Ledger landscape with directions":B=45}r=[],n=[],S.each(function(){var e=$(this).find(".ui-li-heading").eq(0).text(),t=$(this).find(".ui-li-desc").eq(0).text(),a=e+"\n     "+t;r.length<B?r[r.length]=a:n[n.length]=a}),r=r.join("\n"),n=n.join("\n")}if(HIGHLIGHT_LINE&&MAP.hasLayer(HIGHLIGHT_LINE)){for(var u=[],N=HIGHLIGHT_LINE.getLatLngs(),_=0,x=N.length;x>_;_++){var G=[];for(vi=0,vl=N[_].length;vi<vl;vi++)G[G.length]=wgsToLocalSRS([N[_][vi].lng,N[_][vi].lat]);u[u.length]=G}var A=HIGHLIGHT_LINE_STYLE.opacity,y=HIGHLIGHT_LINE_STYLE.color,M=3;g[g.length]={type:"Vector",name:"Highlight Line",opacity:A,styles:{"default":{strokeColor:y,strokeWidth:M,strokeLinecap:"round"}},styleProperty:"style_index",geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"MultiLineString",coordinates:u}}]}};var H=$("#show_on_map").data("zoomelement").attr("type");if("loop"==H){var S=$("#moreinfo_steps li");t+=" with directions",a=$("#show_on_map").data("zoomelement").attr("title");var B=25;switch(t){case"Letter portrait with directions":B=40;break;case"Letter landscape with directions":B=31;break;case"Ledger portrait with directions":B=65;break;case"Ledger landscape with directions":B=45}r=[],n=[],S.each(function(){var e=$(this).find(".ui-li-heading").eq(0).text(),t=$(this).find(".ui-li-desc").eq(0).text(),a=e+"\n     "+t;r.length<B?r[r.length]=a:n[n.length]=a}),r=r.join("\n"),n=n.join("\n")}}if(MARKER_TARGET&&MAP.hasLayer(MARKER_TARGET)){var E=ICON_TARGET.options.iconUrl,R=wgsToLocalSRS(MARKER_TARGET.getLatLng()),I=-10,P=0,T=15;g[g.length]={type:"Vector",name:"Target Marker",opacity:1,styleProperty:"style_index",styles:{"default":{externalGraphic:E,fillOpacity:1,pointRadius:T,graphicXOffset:I,graphicYOffset:P}},geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"Point",coordinates:R}}]}}}var D={units:"feet",srs:"EPSG:3734",layout:t,dpi:300,layers:g,pages:[{bbox:p,rotation:"0",comment:e}],layersMerging:!0,page2title:a,page2text1:r,page2text2:n};printMapPrepare(),$.ajax({url:PRINT_URL,type:"POST",data:JSON.stringify(D),processData:!1,contentType:"application/json",success:function(e){var t=e.getURL;t=t.split("/"),t=t[t.length-1],t=PRINT_PICKUP_BASEURL+t,printMapDone(t)},error:function(){alert("Printing failed. Please try again."),printMapDone()}})}function wgsToLocalSRS(e){var t=new Proj4js.Proj("EPSG:4326"),a=new Proj4js.Proj("EPSG:3734"),r=e.lat?new Proj4js.Point(e.lng,e.lat):new Proj4js.Point(e[0],e[1]);return Proj4js.transform(t,a,r),[r.x,r.y]}function loadTwitter(){var e=$("#tweets");e.empty(),e.append($("<tr></tr>").append($("<td></td>").text("Loading...")));var t={};$.get("../ajax/fetch_tweets",t,function(t){e.empty();for(var a=0,r=t.length;r>a;a++){var n=t[a],i=$("<tr></tr>"),o=$("<td></td>").addClass("twitter_lhs"),s=$("<img></img>").prop("src",n.picture),l=$("<a></a>").prop("target","_blank").text(n.username).prop("href","http://twitter.com/"+n.username);o.append(s),o.append($("<br></br>")),o.append(l);var c=$("<td></td>").addClass("twitter_rhs"),p=$("<span></span>").html(n.prettydate+": "+n.content);c.append(p),i.append(o),i.append(c),e.append(i)}},"json")}function searchTrails(e){var t=$("#trailfinder_results");t.empty();var a=$("#trailfinder_go");MOBILE?($("#page-trailfinder .sortpicker").hide(),a.button("disable"),a.closest(".ui-btn").find(".ui-btn-text").text(a.attr("value0"))):(a.prop("disabled",!0),a.val(a.attr("value0"))),$.get("../ajax/search_trails",e,function(e){if(MOBILE?($("#page-trailfinder .sortpicker").show(),a.button("enable"),a.closest(".ui-btn").find(".ui-btn-text").text(a.attr("value1"))):(a.prop("disabled",!1),a.val(a.attr("value1"))),e.length)for(var r=0,n=e.length;n>r;r++){var i=e[r],o=$("<li></li>").addClass("zoom");o.attr("title",i.name),o.attr("gid",i.gid).attr("type",i.type).attr("w",i.w).attr("s",i.s).attr("e",i.e).attr("n",i.n).attr("lat",i.lat).attr("lng",i.lng),o.attr("backbutton","#page-trailfinder");var s=$("<div></div>").addClass("ui-btn-text");s.append($("<span></span>").addClass("ui-li-heading").text(i.name)),i.note&&s.append($("<span></span>").addClass("ui-li-desc").html(i.note)),MOBILE&&s.append($("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text("0 mi")),o.click(function(){zoomElementClick($(this))}),o.append(s),t.append(o)}else t.append($("<li></li>").text("No results."));MOBILE&&t.listview("refresh"),MOBILE&&sortLists(t)},"json")}function populateShareBox(){var e={uri:URL_PARAMS.attr("path"),querystring:SHARE_URL_STRING};$.get("../ajax/make_shorturl",e,function(e){if(!e)return alert("Unable to fetch a short URL.\nPlease try again.");var t=URL_PARAMS.attr("protocol")+"://"+URL_PARAMS.attr("host")+"/url/"+e;MOBILE?$("#share_url").text(t):$("#share_url").val(t)})}function updateShareUrl(){var e={};e.z=MAP.getZoom(),e.x=MAP.getCenter().lng,e.y=MAP.getCenter().lat,MAP.hasLayer(PHOTOBASE)&&(e.base="photo"),MAP.hasLayer(MAPBASE)&&(e.base="map"),SHARE_URL_STRING=$.param(e)}function updateShareUrlByFeature(e){var t={};t.type=e.attr("type"),t.name=e.attr("title"),SHARE_URL_STRING=$.param(t)}function updateShareUrlByDirections(){if($("#directions_source_lat").val()){var e={};MAP.hasLayer(PHOTOBASE)&&(e.base="photo"),MAP.hasLayer(MAPBASE)&&(e.base="map"),e.routevia=$("#directions_via").val(),e.routevia_bike=$("#directions_via_bike").val(),e.routefrom=$("#directions_source_lat").val()+","+$("#directions_source_lng").val(),e.routeto=$("#directions_target_lat").val()+","+$("#directions_target_lng").val(),e.routetitle=$("#directions_target_title").text(),e.whichway=$("#directions_reverse").val(),e.loctype=$("#directions_type").val(),e.fromaddr=$("#directions_address").val(),"trail"==e.routevia&&(e.routevia=$("#directions_via_trail").val()),SHARE_URL_STRING=$.param(e)}}function toggleWelcome(e){e?cookieSet("show_welcome",1):cookieDelete("show_welcome")}var MOBILE,ICON_TARGET=L.icon({iconUrl:"http://maps.clemetparks.com/static/common/marker-target.png",iconSize:[25,41],iconAnchor:[13,41]}),MARKER_TARGET=L.marker(L.latLng(0,0),{clickable:!1,draggable:!1,icon:ICON_TARGET}),ICON_GPS=L.icon({iconUrl:"http://maps.clemetparks.com/static/common/marker-gps.png",iconSize:[25,41],iconAnchor:[13,41]}),MARKER_GPS=L.marker(L.latLng(0,0),{clickable:!1,draggable:!1,icon:ICON_GPS}),ICON_FROM=L.icon({iconUrl:"http://maps.clemetparks.com/static/desktop/measure1.png",iconSize:[20,34],iconAnchor:[10,34]}),ICON_TO=L.icon({iconUrl:"http://maps.clemetparks.com/static/desktop/measure2.png",iconSize:[20,34],iconAnchor:[10,34]}),MARKER_FROM=L.marker(L.latLng(0,0),{clickable:!0,draggable:!0,icon:ICON_FROM}),MARKER_TO=L.marker(L.latLng(0,0),{clickable:!0,draggable:!0,icon:ICON_TO}),CIRCLE=new L.Circle(L.latLng(0,0),1),ELEVATION_PROFILE=null,DIRECTIONS_TARGET=L.latLng(0,0),DIRECTIONS_LINE=null,DIRECTIONS_LINE_STYLE={color:"#0000FF",weight:5,opacity:1,clickable:!1,smoothFactor:.25},HIGHLIGHT_LINE=null,HIGHLIGHT_LINE_STYLE={color:"#FF00FF",weight:3,opacity:.75,clickable:!1,smoothFactor:.25},URL_PARAMS=null,SHARE_URL_STRING=null,ENABLE_MAPCLICK=!0,SKIP_TO_DIRECTIONS=!1;L.LatLng.prototype.bearingTo=function(e){var t=L.LatLng.DEG_TO_RAD,a=L.LatLng.RAD_TO_DEG,r=this.lat*t,n=e.lat*t,i=(e.lng-this.lng)*t,o=Math.sin(i)*Math.cos(n),s=Math.cos(r)*Math.sin(n)-Math.sin(r)*Math.cos(n)*Math.cos(i),l=Math.atan2(o,s);return l=parseInt(l*a),l=(l+360)%360},L.LatLng.prototype.bearingWordTo=function(e){var t=this.bearingTo(e),a="";return t>=22&&67>=t?a="NE":t>=67&&112>=t?a="E":t>=112&&157>=t?a="SE":t>=157&&202>=t?a="S":t>=202&&247>=t?a="SW":t>=247&&292>=t?a="W":t>=292&&337>=t?a="NW":(t>=337||22>=t)&&(a="N"),a},jQuery.fn.tap?jQuery.fn.click=jQuery.fn.tap:jQuery.fn.tap=jQuery.fn.click,$(window).resize(function(){MAP.invalidateSize()}),$(window).load(function(){var e=function(){var e=$("#geocode_text").val();zoomToAddress(e)};$("#geocode_button").tap(e),$("#geocode_text").keydown(function(e){13==e.keyCode&&$("#geocode_button").tap()})}),$(window).load(function(){var e=function(){zoomElementClick($(this))};$(".zoom").tap(e);var t=function(){var e=$(this).data("zoomelement");if(e){var t=e.attr("w"),a=e.attr("s"),r=e.attr("e"),n=e.attr("n"),i=e.attr("lng"),o=e.attr("lat"),s=e.attr("type"),l=$(this).data("wkt");switchToMap(function(){var e=L.latLngBounds(L.latLng(a,t),L.latLng(n,r));e=e.pad(.15),MAP.fitBounds(e),("poi"==s||"loop"==s)&&placeTargetMarker(o,i),l&&(HIGHLIGHT_LINE&&(MAP.removeLayer(HIGHLIGHT_LINE),HIGHLIGHT_LINE=null),HIGHLIGHT_LINE=lineWKTtoFeature(l,HIGHLIGHT_LINE_STYLE),MAP.addLayer(HIGHLIGHT_LINE))})}};$("#show_on_map").tap(t)}),$(window).load(function(){$('input[type="radio"][name="basemap"]').change(function(){var e=$(this).val();selectBasemap(e)})}),$(window).load(function(){$("#getdirections_clear").click(function(){clearDirectionsLine(),$("#directions_steps").empty()}),$("#directions_via").change(function(){$("#directions_via_bike_wrap").hide();var e=$(this).val();switch(e){case"bike":$("#directions_via_bike_wrap").show();break;case"hike":break;case"car":}})}),$(window).load(function(){MOBILE&&$("#page-trailfinder").page(),$("#trailfinder_typeicons img").tap(function(){var e=$(this),t=e.attr("data-value");$('input[name="trailfinder_uses"]').removeAttr("checked").filter('[value="'+t+'"]').attr("checked","checked"),$("#trailfinder_typeicons img").each(function(){var t=$(this).prop("src");t=$(this).is(e)?t.replace("_off.png","_on.png"):t.replace("_on.png","_off.png"),$(this).prop("src",t)}),$("#trailfinder_go").click()}).first().tap(),$("#trailfinder_go").click(function(){var e={};e.reservation=$('select[name="trailfinder_reservation"]').val(),e.paved=$('select[name="trailfinder_paved"]').val(),e.uses=[],$('input[name="trailfinder_uses"]:checked').each(function(){e.uses[e.uses.length]=$(this).val()}),e.uses=e.uses.join(","),searchTrails(e)}),$('select[name="trailfinder_reservation"]').change(function(){$("#trailfinder_go").click()}),$('select[name="trailfinder_paved"]').change(function(){$("#trailfinder_go").click()})}),$(window).load(function(){MOBILE&&($("#page-settings").page(),$("#page-welcome").page());var e=cookieGet("show_welcome");e?($("#settings_show_welcome").prop("checked","checked"),MOBILE&&$("#settings_show_welcome").checkboxradio("refresh"),$("#show_welcome").prop("checked","checked"),MOBILE&&$("#show_welcome").checkboxradio("refresh")):($("#settings_show_welcome").removeAttr("checked"),MOBILE&&$("#settings_show_welcome").checkboxradio("refresh"),$("#show_welcome").prop("checked","checked"),MOBILE&&$("#show_welcome").checkboxradio("refresh")),$("#show_welcome").change(function(){toggleWelcome($(this).is(":checked"))}),$("#settings_show_welcome").change(function(){toggleWelcome($(this).is(":checked"))})}),$(window).load(function(){$("#share_feature").click(function(){var e=$("#show_on_map").data("zoomelement");e&&(updateShareUrlByFeature(e),MOBILE||$("#share").dialog("open"))})});
