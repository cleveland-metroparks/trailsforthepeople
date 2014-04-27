function initMap(){function f(){console.log(["zoom",MAP.getZoom()]);console.log(["center",MAP.getCenter()]);console.log(["bounds",MAP.getBounds()])}function l(){var e=72;var t=1/.0254000508001016;var n=t*1e3;var r=MAP.getBounds().getSouthWest();var i=MAP.getBounds().getNorthEast();var s=(r.lng+i.lng)/2;var o=L.latLng(r.lat,s);var u=L.latLng(i.lat,s);var a=u.distanceTo(o);var f=MAP.getSize().x;var l=a/f/1e3;var c=Math.round((l||1e-6)*n*e);c*=2;c=1e3*Math.round(c/1e3);console.log(["zoom & scale",MAP.getZoom(),c])}if(MOBILE)$("#page-settings").page();var e=MAPBASE;switch(URL_PARAMS.param("base")){case"photo":var t=$('input[name="basemap"][value="photo"]');t.prop("checked",true);if(MOBILE)t.checkboxradio("refresh");e=PHOTOBASE;break;case"map":break}var n={attributionControl:false,zoomControl:true,dragging:true,closePopupOnClick:false,crs:L.CRS.EPSG3857,minZoom:MIN_ZOOM,maxZoom:MAX_ZOOM,layers:[e]};var r=navigator.userAgent.match(/Android (4|5)/);if(r){n.fadeAnimation=true;n.zoomAnimation=true;n.markerZoomAnimation=true}MAP=new L.Map("map_canvas",n);if(URL_PARAMS.param("x")&&URL_PARAMS.param("y")&&URL_PARAMS.param("z")){var i=parseFloat(URL_PARAMS.param("x"));var s=parseFloat(URL_PARAMS.param("y"));var o=parseInt(URL_PARAMS.param("z"));MAP.setView(L.latLng(s,i),o);MAP.addLayer(MARKER_TARGET);MARKER_TARGET.setLatLng(L.latLng(s,i))}else{MAP.fitBounds(MAX_BOUNDS)}for(var u=0,a=OVERLAYS.length;u<a;u++){MAP.addLayer(OVERLAYS[u])}L.control.scale().addTo(MAP);MAP.on("click",function(e){if(!ENABLE_MAPCLICK)return;if($(".leaflet-popup").length){return MAP.closePopup()}wmsGetFeatureInfoByPoint(e.layerPoint)});if(URL_PARAMS.param("type")&&URL_PARAMS.param("name")){var c={type:URL_PARAMS.param("type"),name:URL_PARAMS.param("name")};$.get("../ajax/exactnamesearch",c,function(e){if(!e||!e.s||!e.w||!e.n||!e.e)return alert("Cound not find that feature.");var t=L.latLngBounds(L.latLng(e.s,e.w),L.latLng(e.n,e.e));MAP.fitBounds(t);if(e.lat&&e.lng){placeTargetMarker(e.lat,e.lng)}else if(e.wkt){HIGHLIGHT_LINE=lineWKTtoFeature(e.wkt,HIGHLIGHT_LINE_STYLE);MAP.addLayer(HIGHLIGHT_LINE)}},"json")}if(URL_PARAMS.param("routefrom")&&URL_PARAMS.param("routeto")&&URL_PARAMS.param("routevia")){var h=URL_PARAMS.param("routefrom").split(",")[0];var p=URL_PARAMS.param("routefrom").split(",")[1];var d=URL_PARAMS.param("routeto").split(",")[0];var v=URL_PARAMS.param("routeto").split(",")[1];var m=URL_PARAMS.param("routevia");var g="to";if(MOBILE)$("#page-getdirections").page();$("#getdirections_disabled").hide();$("#getdirections_enabled").show();$("#directions_target_title").text(URL_PARAMS.param("routetitle"));$("#directions_via").val(URL_PARAMS.param("routevia"));if(MOBILE)$("#directions_via").selectmenu("refresh");$("#directions_type").val("geocode");if(MOBILE)$("#directions_type").selectmenu("refresh");if(MOBILE)$("#directions_type_geocode_wrap").show();else $("#directions_type").change();$("#directions_address").val(URL_PARAMS.param("routefrom"));$("#directions_target_lat").val(d);$("#directions_target_lng").val(v);$("#directions_via").trigger("change");$("#directions_address").val(URL_PARAMS.param("fromaddr"));$("#directions_reverse").val(URL_PARAMS.param("whichway"));$("#directions_via_bike").val(URL_PARAMS.param("routevia_bike"));setTimeout(function(){$("#directions_reverse").trigger("change")},1e3);$("#directions_type").val(URL_PARAMS.param("loctype"));getDirections(h,p,d,v,g,m)}$("#share_url").click(function(){$(this).select()});MAP.on("moveend",updateShareUrl);MAP.on("zoomend",updateShareUrl);MAP.on("layerremove",updateShareUrl);MAP.on("layeradd",updateShareUrl);updateShareUrl()}function lineWKTtoFeature(e,t){var n=new Wkt.Wkt;n.read(e);return n.toObject(t)}function WSENtoBounds(e,t,n,r){return L.latLngBounds([[t,e],[r,n]])}function selectBasemap(e){switch(e){case"photo":if(MAP.hasLayer(MAPBASE))MAP.removeLayer(MAPBASE);if(!MAP.hasLayer(PHOTOBASE))MAP.addLayer(PHOTOBASE,true);PHOTOBASE.bringToBack();break;case"map":if(MAP.hasLayer(PHOTOBASE))MAP.removeLayer(PHOTOBASE);if(!MAP.hasLayer(MAPBASE))MAP.addLayer(MAPBASE,true);MAPBASE.bringToBack();break}}function placeTargetMarker(e,t){MAP.addLayer(MARKER_TARGET);MARKER_TARGET.setLatLng(L.latLng(e,t))}function clearTargetMarker(){MAP.removeLayer(MARKER_TARGET)}function placeGPSMarker(e,t){MAP.addLayer(MARKER_GPS);MARKER_GPS.setLatLng(L.latLng(e,t))}function clearGPSMarker(){MAP.removeLayer(MARKER_GPS)}function placeCircle(e,t,n){MAP.removeLayer(CIRCLE);CIRCLE.setLatLng(L.latLng(e,t));CIRCLE.setRadius(n);MAP.addLayer(CIRCLE)}function clearCircle(){CIRCLE.setLatLng(L.latLng(0,0));CIRCLE.setRadius(1);MAP.removeLayer(CIRCLE)}function zoomToAddress(e){if(!e)return false;var t={};t.address=e;t.bing_key=BING_API_KEY;t.bbox=GEOCODE_BIAS_BOX;$.get("../ajax/geocode",t,function(e){if(!e)return alert("We couldn't find that address or city.\nPlease try again.");var t=L.latLng(e.lat,e.lng);switchToMap(function(){MAP.setView(t,16);placeTargetMarker(e.lat,e.lng);var n="";n+='<h3 class="popup_title">'+e.title+"</h3>";n+='<span class="fakelink zoom" title="'+e.title+'" lat="'+e.lat+'" lng="'+e.lng+'" w="'+e.w+'" s="'+e.s+'" e="'+e.e+'" n="'+e.n+'" onClick="zoomElementClick( $(this) );">Directions</span>';var r=new L.Popup;r.setLatLng(t);r.setContent(n);MAP.openPopup(r)})},"json")}function wmsGetFeatureInfoByPoint(e){var t=20;var n=MAP.layerPointToLatLng(new L.Point(e.x-t,e.y+t));var r=MAP.layerPointToLatLng(new L.Point(e.x+t,e.y-t));var i={w:n.lng,s:n.lat,e:r.lng,n:r.lat};var s=MAP.layerPointToLatLng(new L.Point(e.x,e.y));wmsGetFeatureInfoByLatLngBBOX(i,s)}function wmsGetFeatureInfoByLatLng(e){var t={w:e.lng,s:e.lat,e:e.lng,n:e.lat};var n=e;wmsGetFeatureInfoByLatLngBBOX(t,n)}function wmsGetFeatureInfoByLatLngBBOX(e,t){var n=e;n.zoom=MAP.getZoom();$.get("../ajax/query",n,function(e){if(!e)return;var n={};n.maxHeight=parseInt($("#map_canvas").height()-$("#toolbar").height());n.maxWidth=parseInt($("#map_canvas").width());var r=new L.Popup(n);r.setLatLng(t);r.setContent(e);MAP.openPopup(r)},"html")}function processGetDirectionsForm(){var e=$("#directions_reverse").val();var t=$("#directions_via").val();switch(t){case"hike":t="hike";break;case"bike":t=$("#directions_via_bike").val();break}$("#directions_source_gid").val("");$("#directions_source_type").val("");$.ajaxSetup({async:false});var n,r;var i=$("#directions_type").val();switch(i){case"gps":n=LAST_KNOWN_LOCATION.lat;r=LAST_KNOWN_LOCATION.lng;break;case"geocode":var s=$("#directions_address").val();if(!s)return alert("Please enter an address, city, or landmark.");var o=/^(\d+\.\d+)\,(\-\d+\.\d+)$/.exec(s);if(o){n=parseFloat(o[1]);r=parseFloat(o[2]);getDirections(n,r,a,f,e,t)}else{disableDirectionsButton();var u={};u.address=s;u.bing_key=BING_API_KEY;u.bbox=GEOCODE_BIAS_BOX;$.get("../ajax/geocode",u,function(e){enableDirectionsButton();if(!e)return alert("We couldn't find that address or city.\nPlease try again.");n=e.lat;r=e.lng;if(!MAX_BOUNDS.contains(L.latLng(n,r))){var t="adr."+s;var i="pos."+a+"_"+f;var o={rtp:t+"~"+i};var u="http://bing.com/maps/default.aspx"+"?"+$.param(o);var l=$("#directions_steps");l.empty();l.append($("<div></div>").html("The address you have chosen is outside of the covered area.<br/>Click the link below to go to Bing Maps for directions."));l.append($("<a></a>").text("Click here for directions from Bing Maps").prop("href",u).prop("target","_blank"));return}},"json")}break;case"features":disableDirectionsButton();var u={};u.keyword=$("#directions_address").val();u.limit=30;u.lat=MOBILE?LAST_KNOWN_LOCATION.lat:MAP.getCenter().lat;u.lng=MOBILE?LAST_KNOWN_LOCATION.lng:MAP.getCenter().lng;u.via=t;$.get("../ajax/keyword",u,function(e){enableDirectionsButton();if(!e||!e.length)return alert("We couldn't find any matching landmarks.");var t=$("#directions_address").val().replace(/\W/g,"").toLowerCase();for(var i=0,s=e.length;i<s;i++){var o=e[i].name.replace(/\W/g,"").toLowerCase();if(o==t){e=[e[i]];break}}if(e.length>1){n=null;r=null;populateDidYouMean(e);return}var u=e[0].name.replace(/^\s*/,"").replace(/\s*$/,"");$("#directions_address").val(u);$("#directions_source_gid").val(e[0].gid);$("#directions_source_type").val(e[0].type);n=parseFloat(e[0].lat);r=parseFloat(e[0].lng)},"json");if(!n||!r)return;break}var a=parseFloat($("#directions_target_lat").val());var f=parseFloat($("#directions_target_lng").val());var l=$("#directions_source_gid").val();var c=$("#directions_source_type").val();if(c=="poi"||c=="reservation"||c=="building"||c=="trail"){var u={};u.type=c;u.gid=l;u.lat=a;u.lng=f;u.via=t;$.get("../ajax/geocode_for_directions",u,function(e){n=e.lat;r=e.lng},"json")}var h=$("#directions_target_gid").val();var p=$("#directions_target_type").val();if(p=="poi"||p=="reservation"||p=="building"||p=="trail"){var u={};u.type=p;u.gid=h;u.lat=n;u.lng=r;u.via=t;$.get("../ajax/geocode_for_directions",u,function(e){a=e.lat;f=e.lng},"json")}if(!a||!f)return alert("Please close the directions panel, and pick a location.");$.ajaxSetup({async:true});getDirections(n,r,a,f,e,t)}function populateDidYouMean(e){var t=$("#directions_steps");t.empty();var n=$("<li></li>").append($("<span></span>").addClass("ui-li-heading").text("Did you mean one of these?"));t.append(n);for(var r=0,i=e.length;r<i;r++){var s=e[r];var o=s.name.replace(/^\s*/,"").replace(/\s*$/,"");var n=$("<li></li>");n.append($("<span></span>").addClass("ui-li-heading").text(o)).attr("type",s.type).attr("gid",s.gid);var u=function(){$("#directions_address").val($(this).text());$("#directions_source_gid").val($(this).attr("gid"));$("#directions_source_type").val($(this).attr("type"));$("#directions_button").click()};if(MOBILE)n.tap(u);else n.click(u);n.css({cursor:"pointer"});t.append(n)}if(MOBILE)t.listview("refresh")}function getDirections(e,t,n,r,i,s){$("#directions_steps").empty();disableDirectionsButton();$("#directions_source_lat").val(e);$("#directions_source_lng").val(t);var o=$("#directions_prefer").val();var u={sourcelat:e,sourcelng:t,targetlat:n,targetlng:r,tofrom:i,via:s,prefer:o,bing_key:BING_API_KEY};$.get("../ajax/directions",u,function(e){enableDirectionsButton();if(!e||!e.wkt){var t="Could not find directions.";if(s!="hike")t+="\nTry a different type of trail, terrain, or difficulty.";return alert(t)}renderDirectionsStructure(e)},"json")}function disableDirectionsButton(){var e=$("#directions_button");if(MOBILE){e.button("disable");e.closest(".ui-btn").find(".ui-btn-text").text(e.attr("value0"))}else{e.prop("disabled",true);e.val(e.attr("value0"))}}function enableDirectionsButton(){var e=$("#directions_button");if(MOBILE){e.button("enable");e.closest(".ui-btn").find(".ui-btn-text").text(e.attr("value1"))}else{e.prop("disabled",false);e.val(e.attr("value1"))}}function renderDirectionsStructure(e,t,n){if(!n)n={};clearDirectionsLine();var r=lineWKTtoFeature(e.wkt,DIRECTIONS_LINE_STYLE);var i=L.latLng(e.start.lat,e.start.lng);var s=L.latLng(e.end.lat,e.end.lng);placeDirectionsLine(r,i,s);DIRECTIONS_LINE.extent=WSENtoBounds(e.bounds.west,e.bounds.south,e.bounds.east,e.bounds.north);if(!MOBILE||$.mobile.activePage.prop("id")=="page-map"){var o=DIRECTIONS_LINE.extent.pad(.15);MAP.fitBounds(o)}if(!t)t=$("#directions_steps");t.empty();for(var u=0,a=e.steps.length;u<a;u++){var f=e.steps[u];var l=$("<li></li>");var c=f.stepnumber?f.stepnumber+". "+(f.turnword?f.turnword:"")+" "+f.text:f.turnword+" "+f.text;l.append($("<span></span>").addClass("ui-li-heading").text(c));if(f.distance&&f.duration&&f.distance.substr(0,1)!="0"){var h=f.distance+", "+f.duration;l.append($("<span></span>").addClass("ui-li-desc").text(h))}t.append(l)}var p=$("<span></span>").addClass("ui-li-desc").html("");if(e.retries&&e.retries>3){p.html("Route may be approximated.")}var d=$("<span></span>").addClass("ui-li-heading").html("<b>Total:</b> "+e.totals.distance+", "+e.totals.duration);t.append($("<li></li>").append(d).append(p));var v=$("<li></li>").addClass("directions_functions");if(e.elevationprofile){var m=$("<img></img>").prop("title","Elevation Profile").prop("id","elevationprofile_button").addClass("fakelink").prop("src","/static/common/elevprofile.png");m.attr("value1","Elevation Profile").attr("value0","Loading");m.tap(function(){openElevationProfileBySegments()});v.append(m)}if(MOBILE){v.append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");var g=$("<img></img>").prop("title","Map").addClass("fakelink").prop("src","/static/common/map.png");g.tap(function(){switchToMap(function(){if(DIRECTIONS_LINE)MAP.fitBounds(DIRECTIONS_LINE.extent)})});v.append(g);var y=$("<img></img>").prop("title","Clear").addClass("fakelink").prop("src","/static/common/smallclear.png");y.tap(function(){$("#directions_steps").empty();clearDirectionsLine()});v.append(y)}if(!n.noshare){var b=$("<img></img>").prop("title","Share").addClass("fakelink").prop("id","share_route_button").prop("src","/static/common/share.png");b.click(function(){updateShareUrlByDirections();if(MOBILE){$.mobile.changePage("#page-share")}else{$(".dialog").dialog("close");$("#share").dialog("open")}});v.append(b)}if(!MOBILE){var w=$("<img></img>").attr("title","Print").addClass("fakelink").prop("src","/static/common/print.png");w.click(function(){$("#button_print").click()});v.append(w)}t.append(v);ELEVATION_PROFILE=[];if(e.elevationprofile){ELEVATION_PROFILE=e.elevationprofile}if(MOBILE){t.listview("refresh");$(".directions_functions img:first").removeClass("ui-li-thumb")}}function clearDirectionsLine(){if(DIRECTIONS_LINE){MAP.removeLayer(DIRECTIONS_LINE);DIRECTIONS_LINE=null}if(MAP.hasLayer(MARKER_FROM)){MARKER_FROM.setLatLng(L.latLng(0,0));MAP.removeLayer(MARKER_FROM)}if(MAP.hasLayer(MARKER_TO)){MARKER_TO.setLatLng(L.latLng(0,0));MAP.removeLayer(MARKER_TO)}$("#directions_steps").empty();$("#measure_steps").empty()}function placeDirectionsLine(e,t,n){DIRECTIONS_LINE=e;MAP.addLayer(DIRECTIONS_LINE);MARKER_FROM.setLatLng(t);MAP.addLayer(MARKER_FROM);MARKER_TO.setLatLng(n);MAP.addLayer(MARKER_TO);MARKER_FROM.dragging.disable();MARKER_TO.dragging.disable()}function openElevationProfileBySegments(){if(!ELEVATION_PROFILE)return;var e=[];var t=[];for(var n=0,r=ELEVATION_PROFILE.length;n<r;n++){e[e.length]=ELEVATION_PROFILE[n].x;t[t.length]=ELEVATION_PROFILE[n].y}e=e.join(",");t=t.join(",");$.post("../ajax/elevationprofilebysegments",{x:e,y:t},function(e){if(e.indexOf("http")!=0)return alert(e);showElevation(e)})}function disableKeywordButton(){var e=$("#search_keyword_button");if(MOBILE){e.button("disable");e.closest(".ui-btn").find(".ui-btn-text").text(e.attr("value0"))}else{e.prop("disabled",true);e.val(e.attr("value0"))}}function enableKeywordButton(){var e=$("#search_keyword_button");if(MOBILE){e.button("enable");e.closest(".ui-btn").find(".ui-btn-text").text(e.attr("value1"))}else{e.prop("disabled",false);e.val(e.attr("value1"))}}function printMapPrepare(){$("#print_waiting").show();$("#print_ready").hide()}function printMapDone(e){$("#print_waiting").hide();if(e){$("#print_link").prop("href",e);$("#print_ready").show()}}function printMap(){var e=$("#print_comment").val();var t=$("#print_paper").val();var n="";var r="";var i="";var s=PRINT_SIZES[t][0];var o=PRINT_SIZES[t][1];var u=MAP.latLngToLayerPoint(MAP.getCenter());var a=wgsToLocalSRS(MAP.layerPointToLatLng(new L.Point(u.x-s/2,u.y+o/2)));var f=wgsToLocalSRS(MAP.layerPointToLatLng(new L.Point(u.x+s/2,u.y-o/2)));var l=[a[0],a[1],f[0],f[1]];var c={format_options:"dpi:300"};var h=[];if(MAP.hasLayer(PHOTOBASE)){if(MAP.getZoom()<14)return alert("Before printing, zoom in closer.");h[h.length]={baseURL:"http://maps.clemetparks.com/proxy/ohioimagery",opacity:1,singleTile:false,type:"WMS",layers:["0"],format:"image/png",styles:[""]}}if(MAP.hasLayer(MAPBASE)){h[h.length]={baseURL:"http://maps.clemetparks.com/gwms",opacity:1,singleTile:true,type:"WMS",layers:["group_basemap"],format:"image/jpeg",styles:[""],customParams:c}}for(var p=0,d=OVERLAYS.length;p<d;p++){var v=OVERLAYS[p];var m=v.options.layers.split(",");var g=1;var y="http://maps.clemetparks.com/wms";if(v.options.id=="labels"){y="http://maps.clemetparks.com/gwms"}h[h.length]={baseURL:y,opacity:g,singleTile:true,type:"WMS",layers:m,format:"image/png",styles:[""],customParams:c}}if(DIRECTIONS_LINE&&MAP.hasLayer(DIRECTIONS_LINE)){var b=[];for(var w in DIRECTIONS_LINE._layers){var E=DIRECTIONS_LINE._layers[w];var S=[];for(var p=0,d=E._latlngs.length;p<d;p++){S[S.length]=wgsToLocalSRS([E._latlngs[p].lng,E._latlngs[p].lat])}b[b.length]=S}var g=DIRECTIONS_LINE_STYLE.opacity;var x=DIRECTIONS_LINE_STYLE.color;var T=3;h[h.length]={type:"Vector",name:"Directions Line",opacity:g,styles:{"default":{strokeColor:x,strokeWidth:T,strokeLinecap:"round"}},styleProperty:"style_index",geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"MultiLineString",coordinates:b}}]}};var N=ICON_FROM.options.iconUrl;var C=wgsToLocalSRS(MARKER_FROM.getLatLng());var k=-10;var A=0;var O=15;h[h.length]={type:"Vector",name:"Target Marker",opacity:1,styleProperty:"style_index",styles:{"default":{externalGraphic:N,fillOpacity:1,pointRadius:O,graphicXOffset:k,graphicYOffset:A}},geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"Point",coordinates:C}}]}};var N=ICON_TO.options.iconUrl;var C=wgsToLocalSRS(MARKER_TO.getLatLng());var k=-10;var A=0;var O=15;h[h.length]={type:"Vector",name:"Target Marker",opacity:1,styleProperty:"style_index",styles:{"default":{externalGraphic:N,fillOpacity:1,pointRadius:O,graphicXOffset:k,graphicYOffset:A}},geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"Point",coordinates:C}}]}};t+=" with directions";var M=$("#directions_reverse").val();var _=M=="to"?"from":"to";var D=$("#directions_target_title").text();var P=$("#directions_address").val();var H=$("#directions_via option:selected").text().toLowerCase();var B;if(M&&_&&D&&P){n="Directions\n"+M+" "+D+"\n"+_+" "+P+"\n"+H;B=$("#directions_steps li")}else{n="Measurement directions";B=$("#measure_steps li")}var j=25;switch(t){case"Letter portrait with directions":j=40;break;case"Letter landscape with directions":j=31;break;case"Ledger portrait with directions":j=65;break;case"Ledger landscape with directions":j=45;break}r=[];i=[];B.each(function(){var e=$(this).find(".ui-li-heading").eq(0).text();var t=$(this).find(".ui-li-desc").eq(0).text();var n=e+"\n"+"     "+t;if(r.length<j)r[r.length]=n;else i[i.length]=n});r=r.join("\n");i=i.join("\n")}if(HIGHLIGHT_LINE&&MAP.hasLayer(HIGHLIGHT_LINE)){var b=[];if(HIGHLIGHT_LINE.getLatLngs){var F=HIGHLIGHT_LINE.getLatLngs();for(var p=0,d=F.length;p<d;p++){b[b.length]=wgsToLocalSRS([F[p].lng,F[p].lat])}b=[b]}else{for(var w in HIGHLIGHT_LINE._layers){var E=HIGHLIGHT_LINE._layers[w];var S=[];for(var p=0,d=E._latlngs.length;p<d;p++){S[S.length]=wgsToLocalSRS([E._latlngs[p].lng,E._latlngs[p].lat])}b[b.length]=S}}var g=HIGHLIGHT_LINE_STYLE.opacity;var x=HIGHLIGHT_LINE_STYLE.color;var T=3;h[h.length]={type:"Vector",name:"Highlight Line",opacity:g,styles:{"default":{strokeColor:x,strokeWidth:T,strokeLinecap:"round"}},styleProperty:"style_index",geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"MultiLineString",coordinates:b}}]}};var I=$("#show_on_map").data("zoomelement").attr("type");if(I=="loop"){var B=$("#moreinfo_steps li");t+=" with directions";n=$("#show_on_map").data("zoomelement").attr("title");var j=25;switch(t){case"Letter portrait with directions":j=40;break;case"Letter landscape with directions":j=31;break;case"Ledger portrait with directions":j=65;break;case"Ledger landscape with directions":j=45;break}r=[];i=[];B.each(function(){var e=$(this).find(".ui-li-heading").eq(0).text();var t=$(this).find(".ui-li-desc").eq(0).text();var n=e+"\n"+"     "+t;if(r.length<j)r[r.length]=n;else i[i.length]=n});r=r.join("\n");i=i.join("\n")}}if(MARKER_TARGET&&MAP.hasLayer(MARKER_TARGET)){var N=ICON_TARGET.options.iconUrl;var C=wgsToLocalSRS(MARKER_TARGET.getLatLng());var k=-10;var A=0;var O=15;h[h.length]={type:"Vector",name:"Target Marker",opacity:1,styleProperty:"style_index",styles:{"default":{externalGraphic:N,fillOpacity:1,pointRadius:O,graphicXOffset:k,graphicYOffset:A}},geoJson:{type:"FeatureCollection",features:[{type:"Feature",properties:{style_index:"default"},geometry:{type:"Point",coordinates:C}}]}}}var q={units:"feet",srs:"EPSG:3734",layout:t,dpi:300,layers:h,pages:[{bbox:l,rotation:"0",comment:e}],layersMerging:true,page2title:n,page2text1:r,page2text2:i};printMapPrepare();$.ajax({url:PRINT_URL,type:"POST",data:JSON.stringify(q),processData:false,contentType:"application/json",success:function(e){var t=e.getURL;t=t.split("/");t=t[t.length-1];t=PRINT_PICKUP_BASEURL+t;printMapDone(t)},error:function(e,t,n){alert("Printing failed. Please try again.");printMapDone()}})}function wgsToLocalSRS(e){var t=new Proj4js.Proj("EPSG:4326");var n=new Proj4js.Proj("EPSG:3734");var r=e.lat?new Proj4js.Point(e.lng,e.lat):new Proj4js.Point(e[0],e[1]);Proj4js.transform(t,n,r);return[r.x,r.y]}function loadTwitter(){var e=$("#tweets");e.empty();e.append($("<tr></tr>").append($("<td></td>").text("Loading...")));var t={};$.get("../ajax/fetch_tweets",t,function(t){e.empty();for(var n=0,r=t.length;n<r;n++){var i=t[n];var s=$("<tr></tr>");var o=$("<td></td>").addClass("twitter_lhs");var u=$("<img></img>").prop("src",i.picture);var a=$("<a></a>").prop("target","_blank").text(i.username).prop("href","http://twitter.com/"+i.username);o.append(u);o.append($("<br></br>"));o.append(a);var f=$("<td></td>").addClass("twitter_rhs");var l=$("<span></span>").html(i.prettydate+": "+i.content);f.append(l);s.append(o);s.append(f);e.append(s)}},"json")}function searchTrails(e){var t=$("#trailfinder_results");t.empty();var n=$("#trailfinder_go");if(MOBILE){$("#page-trailfinder .sortpicker").hide();n.button("disable");n.closest(".ui-btn").find(".ui-btn-text").text(n.attr("value0"))}else{n.prop("disabled",true);n.val(n.attr("value0"))}$.get("../ajax/search_trails",e,function(e){if(MOBILE){$("#page-trailfinder .sortpicker").show();n.button("enable");n.closest(".ui-btn").find(".ui-btn-text").text(n.attr("value1"))}else{n.prop("disabled",false);n.val(n.attr("value1"))}if(e.length){for(var r=0,i=e.length;r<i;r++){var s=e[r];var o=$("<li></li>").addClass("zoom");o.attr("title",s.name);o.attr("gid",s.gid).attr("type",s.type).attr("w",s.w).attr("s",s.s).attr("e",s.e).attr("n",s.n).attr("lat",s.lat).attr("lng",s.lng);o.attr("backbutton","#page-trailfinder");var u=$("<div></div>").addClass("ui-btn-text");u.append($("<span></span>").addClass("ui-li-heading").text(s.name));if(s.note){u.append($("<span></span>").addClass("ui-li-desc").html(s.note))}if(MOBILE){u.append($("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text("0 mi"))}o.click(function(){zoomElementClick($(this))});o.append(u);t.append(o)}}else{t.append($("<li></li>").text("No results."))}if(MOBILE)t.listview("refresh");if(MOBILE)sortLists(t)},"json")}function populateShareBox(){var e={uri:URL_PARAMS.attr("path"),querystring:SHARE_URL_STRING};$.get("../ajax/make_shorturl",e,function(e){if(!e)return alert("Unable to fetch a short URL.\nPlease try again.");var t=URL_PARAMS.attr("protocol")+"://"+URL_PARAMS.attr("host")+"/url/"+e;$("#share_url").val(t)})}function updateShareUrl(){var e={};e.z=MAP.getZoom();e.x=MAP.getCenter().lng;e.y=MAP.getCenter().lat;if(MAP.hasLayer(PHOTOBASE))e.base="photo";if(MAP.hasLayer(MAPBASE))e.base="map";SHARE_URL_STRING=$.param(e)}function updateShareUrlByFeature(e){var t={};t.type=e.attr("type");t.name=e.attr("title");SHARE_URL_STRING=$.param(t)}function updateShareUrlByDirections(){if(!$("#directions_source_lat").val())return;var e={};e.routevia=$("#directions_via").val();e.routevia_bike=$("#directions_via_bike").val();e.routefrom=$("#directions_source_lat").val()+","+$("#directions_source_lng").val();e.routeto=$("#directions_target_lat").val()+","+$("#directions_target_lng").val();e.routetitle=$("#directions_target_title").text();e.whichway=$("#directions_reverse").val();e.loctype=$("#directions_type").val();e.fromaddr=$("#directions_address").val();if(e.routevia=="trail")e.routevia=$("#directions_via_trail").val();SHARE_URL_STRING=$.param(e)}function toggleWelcome(e){if(e){cookieSet("show_welcome",1)}else{cookieDelete("show_welcome")}}var MOBILE;var ICON_TARGET=L.icon({iconUrl:"http://maps.clemetparks.com/static/common/marker-target.png",iconSize:[25,41],iconAnchor:[13,41]});var MARKER_TARGET=L.marker(L.latLng(0,0),{clickable:false,draggable:false,icon:ICON_TARGET});var ICON_GPS=L.icon({iconUrl:"http://maps.clemetparks.com/static/common/marker-gps.png",iconSize:[25,41],iconAnchor:[13,41]});var MARKER_GPS=L.marker(L.latLng(0,0),{clickable:false,draggable:false,icon:ICON_GPS});var ICON_FROM=L.icon({iconUrl:"http://maps.clemetparks.com/static/desktop/measure1.png",iconSize:[20,34],iconAnchor:[10,34]});var ICON_TO=L.icon({iconUrl:"http://maps.clemetparks.com/static/desktop/measure2.png",iconSize:[20,34],iconAnchor:[10,34]});var MARKER_FROM=L.marker(L.latLng(0,0),{clickable:true,draggable:true,icon:ICON_FROM});var MARKER_TO=L.marker(L.latLng(0,0),{clickable:true,draggable:true,icon:ICON_TO});var CIRCLE=new L.Circle(L.latLng(0,0),1);var ELEVATION_PROFILE=null;var DIRECTIONS_TARGET=L.latLng(0,0);var DIRECTIONS_LINE=null;var DIRECTIONS_LINE_STYLE={color:"#0000FF",weight:5,opacity:1,clickable:false,smoothFactor:.25};var HIGHLIGHT_LINE=null;var HIGHLIGHT_LINE_STYLE={color:"#FF00FF",weight:3,opacity:.75,clickable:false,smoothFactor:.25};var URL_PARAMS=null;var SHARE_URL_STRING=null;var ENABLE_MAPCLICK=true;var SKIP_TO_DIRECTIONS=false;L.LatLng.prototype.bearingTo=function(e){var t=L.LatLng.DEG_TO_RAD;var n=L.LatLng.RAD_TO_DEG;var r=this.lat*t;var i=e.lat*t;var s=(e.lng-this.lng)*t;var o=Math.sin(s)*Math.cos(i);var u=Math.cos(r)*Math.sin(i)-Math.sin(r)*Math.cos(i)*Math.cos(s);var a=Math.atan2(o,u);a=parseInt(a*n);a=(a+360)%360;return a};L.LatLng.prototype.bearingWordTo=function(e){var t=this.bearingTo(e);var n="";if(t>=22&&t<=67)n="NE";else if(t>=67&&t<=112)n="E";else if(t>=112&&t<=157)n="SE";else if(t>=157&&t<=202)n="S";else if(t>=202&&t<=247)n="SW";else if(t>=247&&t<=292)n="W";else if(t>=292&&t<=337)n="NW";else if(t>=337||t<=22)n="N";return n};if(!jQuery.fn.tap){jQuery.fn.tap=jQuery.fn.click}else{jQuery.fn.click=jQuery.fn.tap}$(window).resize(function(){MAP.invalidateSize()});$(window).load(function(){var e=function(){var e=$("#geocode_text").val();zoomToAddress(e)};$("#geocode_button").tap(e);$("#geocode_text").keydown(function(e){if(e.keyCode==13)$("#geocode_button").tap()})});$(window).load(function(){var e=function(){zoomElementClick($(this))};$(".zoom").tap(e);var t=function(){var e=$(this).data("zoomelement");if(e){var t=e.attr("w");var n=e.attr("s");var r=e.attr("e");var i=e.attr("n");var s=e.attr("lng");var o=e.attr("lat");var u=e.attr("type");var a=$(this).data("wkt");switchToMap(function(){var e=L.latLngBounds(L.latLng(n,t),L.latLng(i,r));e=e.pad(.15);MAP.fitBounds(e);if(u=="poi"||u=="loop")placeTargetMarker(o,s);if(a){if(HIGHLIGHT_LINE){MAP.removeLayer(HIGHLIGHT_LINE);HIGHLIGHT_LINE=null}HIGHLIGHT_LINE=lineWKTtoFeature(a,HIGHLIGHT_LINE_STYLE);MAP.addLayer(HIGHLIGHT_LINE)}})}};$("#show_on_map").tap(t)});$(window).load(function(){$('input[type="radio"][name="basemap"]').change(function(){var e=$(this).val();selectBasemap(e)})});$(window).load(function(){$("#getdirections_clear").click(function(){clearDirectionsLine();$("#directions_steps").empty()});$("#directions_via").change(function(){$("#directions_via_bike_wrap").hide();var e=$(this).val();switch(e){case"bike":$("#directions_via_bike_wrap").show();break;case"hike":break;case"car":break;default:break}})});$(window).load(function(){if(MOBILE)$("#page-trailfinder").page();$("#trailfinder_go").click(function(){var e={};e.reservation=$('select[name="trailfinder_reservation"]').val();e.paved=$('select[name="trailfinder_paved"]').val();e.uses=[];$('input[name="trailfinder_uses"]:checked').each(function(){e.uses[e.uses.length]=$(this).val()});e.uses=e.uses.join(",");searchTrails(e)})});$(window).load(function(){if(MOBILE){$("#page-settings").page();$("#page-welcome").page()}var e=cookieGet("show_welcome");if(e){$("#settings_show_welcome").prop("checked","checked");if(MOBILE)$("#settings_show_welcome").checkboxradio("refresh");$("#show_welcome").prop("checked","checked");if(MOBILE)$("#show_welcome").checkboxradio("refresh")}else{$("#settings_show_welcome").removeAttr("checked");if(MOBILE)$("#settings_show_welcome").checkboxradio("refresh");$("#show_welcome").prop("checked","checked");if(MOBILE)$("#show_welcome").checkboxradio("refresh")}$("#show_welcome").change(function(){toggleWelcome($(this).is(":checked"))});$("#settings_show_welcome").change(function(){toggleWelcome($(this).is(":checked"))})});$(window).load(function(){$("#share_feature").click(function(){var e=$("#show_on_map").data("zoomelement");if(!e)return;updateShareUrlByFeature(e);if(!MOBILE)$("#share").dialog("open")})});var hash=new L.Hash(map)
