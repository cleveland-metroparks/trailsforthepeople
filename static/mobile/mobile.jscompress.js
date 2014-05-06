function disableClicksMomentarily(){disableClicks();setTimeout(enableClicks,1500)}function disableClicks(){if(!MAP)return;ENABLE_MAPCLICK=false;MAP.dragging.removeHooks();MAP.touchZoom.removeHooks()}function enableClicks(){if(!MAP)return;ENABLE_MAPCLICK=true;MAP.dragging.addHooks();MAP.touchZoom.addHooks()}function switchToMap(e){$.mobile.changePage("#page-map");if(e)setTimeout(e,1e3)}function updateNearYouNow(){$("#page-radar").page();var e=$("#alerts");for(var t=0,n=ALL_POIS.length;t<n;t++){var r=ALL_POIS[t];var i=L.latLng(r.lat,r.lng);r.meters=LAST_KNOWN_LOCATION.distanceTo(i);r.miles=r.meters/1609.344;r.feet=r.meters*3.2808399;r.range=r.feet>900?r.miles.toFixed(1)+" mi":r.feet.toFixed(0)+" ft";r.bearing=LAST_KNOWN_LOCATION.bearingWordTo(i)}ALL_POIS.sort(function(e,t){return e.meters-t.meters});var s=ALL_POIS.slice(0,25);e.empty();for(var t=0,n=s.length;t<n;t++){var r=s[t];var o=$("<li></li>").addClass("zoom").addClass("ui-li-has-count");o.attr("title",r.title);o.attr("category",r.categories);o.attr("type","poi").attr("gid",r.gid);o.attr("w",r.w).attr("s",r.s).attr("e",r.e).attr("n",r.n);o.attr("lat",r.lat).attr("lng",r.lng);var u=$("<div></div>").addClass("ui-btn-text");u.append($("<span></span>").addClass("ui-li-heading").text(r.title));u.append($("<span></span>").addClass("ui-li-desc").text(r.categories));u.append($("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text(r.range+" "+r.bearing));o.tap(function(){zoomElementClick($(this))});o.append(u);e.append(o)}e.listview("refresh")}function checkRadar(e,t,n){t=parseFloat(t);var r=[];for(var i=0,s=ALL_POIS.length;i<s;i++){var o=ALL_POIS[i];var u=e.distanceTo(L.latLng(o.lat,o.lng));if(u>t)continue;if(n){var a=o.categories.split("; ");var f=false;for(var l=0,c=a.length;l<c;l++){for(var h=0,p=n.length;h<p;h++){if(n[h]==a[l]){f=true;break}}}if(!f)continue}var d=u/1609.344;var v=u*3.2808399;var m=v>900?d.toFixed(1)+" mi":v.toFixed(0)+" ft";r[r.length]={gid:o.gid,title:o.title,range:m}}var g=false;for(var i=0,s=r.length;i<s;i++){var y=parseInt(r[i].gid);if(LAST_BEEP_IDS.indexOf(y)==-1){g=true;break}}LAST_BEEP_IDS=[];for(var i=0,s=r.length;i<s;i++){var y=parseInt(r[i].gid);LAST_BEEP_IDS[LAST_BEEP_IDS.length]=y}LAST_BEEP_IDS.sort();if(g){document.getElementById("alert_beep").play();var b=[];for(var i=0,s=r.length;i<s;i++){b[b.length]=r[i].title+", "+r[i].range}setTimeout(function(){alert(b.join("\n"))},1e3)}}function showPhoto(e){$("#photo").prop("src",e);$.mobile.changePage("#page-photo")}function showElevation(e){$("#elevation").prop("src",e);$.mobile.changePage("#page-elevationprofile")}function searchByKeyword(e){var t=$("#keyword_results");t.empty();var n=$("<span></span>").addClass("ui-li-heading").text(" Run a Bing address search");var r=$("<span></span>").addClass("ui-li-desc").text("search as an address or landmark");var i=$("<li></li>").addClass("zoom").append(n).append(r).appendTo(t);i.data("address",e);i.click(function(){zoomToAddress($(this).data("address"))});i.attr("title"," Address search");i.data("meters",-1);disableKeywordButton();$("#page-search .sortpicker").hide();$.get("../ajax/keyword",{keyword:e,limit:100},function(e){enableKeywordButton();$("#page-search .sortpicker").show();if(!e.length){$("<li></li>").text("No Cleveland Metroparks results found.").appendTo(t);return}for(var n=0,r=e.length;n<r;n++){var i=e[n];var s=$("<span></span>").addClass("ui-li-heading").text(i.name);var o=$("<span></span>").addClass("ui-li-desc").text(i.description);var u=$("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text("0 mi");var a=$("<div></div>").addClass("ui-btn-text").append(s).append(o).append(u);var f=$("<li></li>").addClass("zoom").addClass("ui-li-has-count").append(a);f.attr("backbutton","#page-keyword");f.attr("w",i.w);f.attr("s",i.s);f.attr("e",i.e);f.attr("n",i.n);f.attr("lat",i.lat);f.attr("lng",i.lng);f.attr("type",i.type);f.attr("gid",i.gid);f.attr("title",i.name);t.append(f);f.tap(function(){zoomElementClick($(this))})}t.listview("refresh");sortLists(t)},"json")}function zoomElementClick(e){if(!ENABLE_MAPCLICK)return;disableClicksMomentarily();var t=e.attr("type");var n=e.attr("gid");$("#show_on_map").data("zoomelement",e);$("#directions_target_lat").val(e.attr("lat"));$("#directions_target_lng").val(e.attr("lng"));$("#directions_target_type").val(e.attr("type"));$("#directions_target_gid").val(e.attr("gid"));$("#directions_target_title").text(e.attr("title"));$.mobile.changePage("#page-info");var r=e.attr("backbutton");if(!r)r="#page-find";$("#page-info .ui-header .ui-btn-left").prop("href",r);$("#getdirections_disabled").hide();$("#getdirections_enabled").show();$("#show_on_map").data("wkt",null);$("#info-content").text("Loading...");if(t&&n){var i={};i.type=t;i.gid=n;i.lat=LAST_KNOWN_LOCATION.lat;i.lng=LAST_KNOWN_LOCATION.lng;$.get("../ajax/moreinfo",i,function(e){$("#info-content").html(e);var t=$("#info-content").find("div.wkt");if(t){$("#show_on_map").data("wkt",t.text());t.remove()}if(SKIP_TO_DIRECTIONS){$("#directions_car").click();SKIP_TO_DIRECTIONS=false}},"html")}else{$("#info-content").html($("<h1></h1>").text(e.attr("title")));$("#directions_car").click()}}function filterLoops(){$("#loops_list li").show();var e={};e.filter_type=$("#loops_filter_type").val();e.filter_paved=$("#loops_filter_paved").val();e.minseconds=60*parseInt($("#loops_filter_duration_min").val());e.maxseconds=60*parseInt($("#loops_filter_duration_max").val());e.minfeet=5280*parseInt($("#loops_filter_distance_min").val());e.maxfeet=5280*parseInt($("#loops_filter_distance_max").val());e.reservation=$("#loops_filter_reservation").val();var t=$("#loops_filter_button");t.button("disable");t.closest(".ui-btn").find(".ui-btn-text").text(t.attr("value0"));$.get("../ajax/search_loops",e,function(e){t.button("enable");t.closest(".ui-btn").find(".ui-btn-text").text(t.attr("value1"));var n=$("#loops_list");n.empty();if(!e||!e.length)return alert("No matches found.");for(var r=0,i=e.length;r<i;r++){var s=e[r];var o=$("<li></li>").addClass("zoom").addClass("ui-li-has-count");o.attr("backbutton","#page-loops-search");o.attr("type","loop");o.attr("title",s.title);o.attr("gid",s.gid);o.attr("w",s.w);o.attr("s",s.s);o.attr("e",s.e);o.attr("n",s.n);o.attr("lat",s.lat);o.attr("lng",s.lng);var u=$("<div></div>").addClass("ui-btn-text");u.append($("<span></span>").addClass("ui-li-heading").text(s.title));u.append($("<span></span>").addClass("ui-li-desc").html(s.distance+" &nbsp;&nbsp; "+s.duration));u.append($("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text("0 mi"));o.append(u);n.append(o);o.tap(function(){zoomElementClick($(this))})}$("#page-loops-search .sortpicker").show();n.listview("refresh");sortLists(n)},"json")}function sortLists(e){if(!e){e=$(":jqmData(role='page'):visible ul.distance_sortable").eq(0);if(!e.length)return}e.find(".zoom_distance").each(function(){var e=$(this).parent().parent();var t=L.latLng(e.attr("lat"),e.attr("lng"));var n=LAST_KNOWN_LOCATION.distanceTo(t);var r=LAST_KNOWN_LOCATION.bearingWordTo(t);var i=n/1609.344;var s=n*3.2808399;var o=s>900?i.toFixed(1)+" mi":s.toFixed(0)+" ft";o+=" "+r;$(this).text(o);e.data("meters",n)});switch(DEFAULT_SORT){case"distance":e.children("li").sort(function(e,t){return $(e).data("meters")>$(t).data("meters")?1:-1});break;case"alphabetical":e.children("li").sort(function(e,t){return $(e).attr("title")>$(t).attr("title")?1:-1});break}}function toggleGPS(){AUTO_CENTER_ON_LOCATION?toggleGPSOff():toggleGPSOn()}function toggleGPSOn(){AUTO_CENTER_ON_LOCATION=true;$("#mapbutton_gps img").prop("src","/static/mobile/mapbutton_gps_on.png")}function toggleGPSOff(){AUTO_CENTER_ON_LOCATION=false;$("#mapbutton_gps img").prop("src","/static/mobile/mapbutton_gps_off.png")}var LAST_BEEP_IDS=[];var ALL_POIS=[];var MOBILE=true;var LAST_KNOWN_LOCATION=L.latLng(41.3953,-81.673);var AUTO_CENTER_ON_LOCATION=false;var DEFAULT_SORT="distance";$(window).bind("orientationchange pageshow resize",function(){var e=$(":jqmData(role='page'):visible");var t=$(":jqmData(role='header'):visible");var n=$(":jqmData(role='content'):visible");var r=$(window).height();var i=r-t.outerHeight();e.height(i+1);$(":jqmData(role='content')").first().height(i);if($("#map_canvas").is(":visible")){$("#map_canvas").height(i);if(MAP)MAP.invalidateSize()}});$(document).bind("pagebeforechange",function(e,t){disableClicksMomentarily()});$(document).bind("pagebeforechange",function(e,t){if(typeof t.toPage!="string")return;var n=$.mobile.path.parseUrl(t.toPage);if(n.hash.search(/^#browse-items/)==-1)return;var r=n.hash.replace(/.*category=/,"");e.preventDefault();$("#page-browse-results").page();t.options.dataUrl=n.href.replace(/#.+$/,"#browse-items?category="+r);$.mobile.changePage("#page-browse-results",t.options);var i=$("#browse_results");i.empty();var s=$('#page-browse-results div[data-role="header"] h1');s.text("Loading...");var o="#page-browse";if(r.indexOf("pois_usetype_")==0)o="#page-browse-pois-activity";if(r.indexOf("pois_reservation_")==0)o="#page-browse-pois-reservation";if(r.indexOf("loops_res_")==0)o="#page-browse-loops-byres";var u=$('#page-browse-results  div[data-role="header"] a:eq(0)');u.prop("href",o);var a=o;if(r)a="#browse-items?category="+r;$.get("../ajax/browse_items",{category:r},function(e){s.text(e.title);for(var t=0,n=e.results.length;t<n;t++){var r=e.results[t];var o=$("<li></li>").addClass("zoom");o.attr("title",r.name);o.attr("gid",r.gid).attr("type",r.type).attr("w",r.w).attr("s",r.s).attr("e",r.e).attr("n",r.n).attr("lat",r.lat).attr("lng",r.lng);o.attr("backbutton",a);var u=$("<div></div>").addClass("ui-btn-text");u.append($("<span></span>").addClass("ui-li-heading").text(r.name));if(r.note){u.append($("<span></span>").addClass("ui-li-desc").html(r.note))}u.append($("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text("0 mi"));o.tap(function(){zoomElementClick($(this))});o.append(u);i.append(o)}i.listview("refresh");sortLists(i)},"json")});$(document).bind("pagebeforechange",function(e,t){if(typeof t.toPage!="string")return;var n=$.mobile.path.parseUrl(t.toPage);if(n.hash!="#page-share")return;populateShareBox()});$(document).ready(function(){$("#share_facebook").tap(function(){var e=$("#share_url").val();e="http://www.facebook.com/share.php?u="+encodeURIComponent(e);$("#share_facebook").prop("href",e);return true});$("#share_twitter").tap(function(){var e=$("#share_url").val();e="http://twitter.com/home?status="+encodeURIComponent(e);$("#share_twitter").prop("href",e);return true})});$(document).bind("pagebeforechange",function(e,t){if(typeof t.toPage!="string")return;var n=$.mobile.path.parseUrl(t.toPage);if(n.hash!="#page-radar")return;updateNearYouNow()});$(document).bind("pagebeforechange",function(e,t){if(typeof t.toPage!="string")return;var n=$.mobile.path.parseUrl(t.toPage);if(n.hash!="#page-info")return;var r=$("#show_on_map").data("zoomelement");if(r)return;$.mobile.changePage("#page-browse");return false});$(document).bind("pagechange",function(e,t){sortLists()});$(window).load(function(){URL_PARAMS=$.url();MIN_ZOOM=10;initMap();setTimeout(function(){$("#toolbar").show();$("#splashscreen").hide()},5e3);var e=cookieGet("show_welcome");if(URL_PARAMS.attr("query"))e=false;if(URL_PARAMS.attr("fragment"))e=false;if(e){$.mobile.changePage("#page-welcome")}MAP.on("locationfound",function(e){LAST_KNOWN_LOCATION=e.latlng;placeGPSMarker(e.latlng.lat,e.latlng.lng);if(AUTO_CENTER_ON_LOCATION){var t=MAX_BOUNDS.contains(e.latlng);if(t){MAP.panTo(e.latlng);if(MAP.getZoom()<12)MAP.setZoom(16)}else{MAP.fitBounds(MAX_BOUNDS)}}sortLists();updateNearYouNow();if($("#radar_enabled").is(":checked")){var n=$("#radar_radius").val();var r=[];$('input[name="radar_category"]:checked').each(function(){r[r.length]=$(this).val()});placeCircle(e.latlng.lat,e.latlng.lng,n);checkRadar(e.latlng,n,r)}var i=e.latlng.lat;var s=e.latlng.lng;var o=i<0?"S":"N";var u=s<0?"W":"E";var a=Math.abs(parseInt(i));var f=Math.abs(parseInt(s));var l=(60*(Math.abs(i)-Math.abs(parseInt(i)))).toFixed(3);var c=(60*(Math.abs(s)-Math.abs(parseInt(s)))).toFixed(3);var h=o+" "+a+" "+l+" "+u+" "+f+" "+c;$("#gps_location").text(h)});if(!URL_PARAMS.attr("query")){AUTO_CENTER_ON_LOCATION=true;var t=function(e){AUTO_CENTER_ON_LOCATION=false;MAP.off("locationfound",t)};MAP.on("locationfound",t)}MAP.locate({watch:true,enableHighAccuracy:true})});$(window).load(function(){$("div.sortpicker span").tap(function(){DEFAULT_SORT=$(this).attr("value");sortLists()})});$(window).load(function(){$("#toolbar a.button").click(function(){if(!ENABLE_MAPCLICK)return false})});$(window).load(function(){$("#browse_keyword_button").tap(function(){$.mobile.changePage("#page-search");$("#search_keyword").val($("#browse_keyword").val());$("#search_keyword_button").tap()});$("#browse_keyword").keydown(function(e){if(e.keyCode==13)$("#browse_keyword_button").tap()});$("#search_keyword_button").tap(function(){var e=$("#search_keyword").val();searchByKeyword(e)});$("#search_keyword").keydown(function(e){if(e.keyCode==13)$("#search_keyword_button").tap()})});$(window).load(function(){function e(){var e=LAST_KNOWN_LOCATION;var t=e.lat;var n=e.lng;var r=t<0?"S":"N";var i=n<0?"W":"E";var s=Math.abs(parseInt(t));var o=Math.abs(parseInt(n));var u=(60*(Math.abs(t)-Math.abs(parseInt(t)))).toFixed(3);var a=(60*(Math.abs(n)-Math.abs(parseInt(n)))).toFixed(3);$("#dd_lng").val(n);$("#dd_lat").val(t);$("#dm_lat_deg").val(s);$("#dm_lng_deg").val(o);$("#dm_lat_min").val(parseInt(u));$("#dm_lng_min").val(parseInt(a));$("#dm_lat_dmin").val(Math.round(1e3*(u-parseInt(u))));$("#dm_lng_dmin").val(Math.round(1e3*(a-parseInt(a))))}function t(e,t){try{var n=L.latLng(e,t)}catch(r){return alert("The coordinates are valid.")}if(!MAX_BOUNDS.contains(n))return alert("That location is outside of the mapping area.");switchToMap(function(){MAP.setView(n,16);placeTargetMarker(e,t)})}$("#lonlat_dm_load_button").tap(e);$("#lonlat_dd_load_button").tap(e);$("#lonlat_dd_button").tap(function(){var e=parseFloat($("#dd_lat").val());var n=parseFloat($("#dd_lng").val());t(e,n)});$("#lonlat_dm_button").tap(function(){var e=parseInt($("#dm_lat_deg").val());var n=parseInt($("#dm_lat_min").val());var r=parseInt($("#dm_lat_dmin").val());var i=e+(n+r*.001)/60;var s=parseInt($("#dm_lng_deg").val());var o=parseInt($("#dm_lng_min").val());var u=parseInt($("#dm_lng_dmin").val());var a=s+(o+u*.001)/60;a=-a;t(i,a)})});$(window).load(function(){$.get("../ajax/load_pois",{},function(e){for(var t=0,n=e.length;t<n;t++){ALL_POIS[ALL_POIS.length]=e[t]}updateNearYouNow()},"json")});$(window).load(function(){$("#radar_enabled").change(function(){var e=$(this).is(":checked");e?$("#radar_config").show():$("#radar_config").hide();if(!e){$("#alerts li").slice(0,25).show();$("#alerts li").slice(25).hide();clearCircle()}});$("#gps_center").tap(function(){switchToMap(function(){MAP.fire("locationfound",{latlng:LAST_KNOWN_LOCATION})})})});$(window).load(function(){$.get("../ajax/autocomplete_keywords",{},function(e){$("#browse_keyword").autocomplete({target:$("#browse_keyword_autocomplete"),source:e,callback:function(e){var t=$(e.currentTarget);$("#browse_keyword").val(t.text());$("#browse_keyword").autocomplete("clear");$("#browse_keyword_button").click()},minLength:3,matchFromStart:false});$("#search_keyword").autocomplete({target:$("#search_keyword_autocomplete"),source:e,callback:function(e){var t=$(e.currentTarget);$("#search_keyword").val(t.text());$("#search_keyword").autocomplete("clear");$("#search_keyword_button").click()},minLength:3,matchFromStart:false})},"json")});$(window).load(function(){$("#directions_hike").tap(function(){$("#directions_via").val("hike");$("#directions_via").trigger("change");$("#page-getdirections").page();$("#directions_via").selectmenu("refresh");$.mobile.changePage("#page-getdirections")});$("#directions_bike").tap(function(){$("#directions_via").val("bike");$("#directions_via").trigger("change");$("#page-getdirections").page();$("#directions_via").selectmenu("refresh");$.mobile.changePage("#page-getdirections")});$("#directions_bridle").tap(function(){$("#directions_via").val("bridle");$("#directions_via").trigger("change");$("#page-getdirections").page();$("#directions_via").selectmenu("refresh");$.mobile.changePage("#page-getdirections")});$("#directions_car").tap(function(){$("#directions_via").val("car");$("#directions_via").trigger("change");$("#page-getdirections").page();$("#directions_via").selectmenu("refresh");$.mobile.changePage("#page-getdirections")});$("#directions_bus").tap(function(){$("#directions_via").val("bus");$("#directions_via").trigger("change");$("#page-getdirections").page();$("#directions_via").selectmenu("refresh");$.mobile.changePage("#page-getdirections")});$("#directions_type").change(function(){var e=$(this).val();var t=$("#directions_type_geocode_wrap");if(e=="gps")t.hide();else t.show()});$("#directions_reverse").change(function(){var e=$(this).val()=="to"?"from":"to";$("#directions_type option").each(function(){var t=$(this).text();t=e+" "+t.replace(/^to /,"").replace(/^from /,"");$(this).text(t)});$("#directions_type").selectmenu("refresh",true)});$("#directions_button").tap(function(){$("#directions_steps").empty();processGetDirectionsForm()});$("#directions_address").keydown(function(e){if(e.keyCode==13)$("#directions_button").tap()});$("#change_directions_target2").tap(function(){$.mobile.changePage("#page-find");SKIP_TO_DIRECTIONS=true})});$(window).load(function(){$("#page-loops-search").page();$("#loops_typeicons img").tap(function(){var e=$(this);var t=e.attr("data-value");$("#loops_filter_type").val(t).trigger("change");$("#loops_typeicons img").each(function(){var t=$(this).prop("src");if($(this).is(e)){t=t.replace("_off.png","_on.png")}else{t=t.replace("_on.png","_off.png")}$(this).prop("src",t)})}).first().tap();$("#loops_filter_distancepicker img").tap(function(){var e=$(this);var t=e.attr("data-min");var n=e.attr("data-max");$("#loops_filter_distance_min").val(t);$("#loops_filter_distance_max").val(n);$("#loops_filter_distancepicker img").each(function(){var t=$(this).prop("src");if($(this).is(e)){t=t.replace("_off.png","_on.png")}else{t=t.replace("_on.png","_off.png")}$(this).prop("src",t)});filterLoops()}).first().tap();$("#loops_filter_distance_min").change();$("#loops_filter_distance_max").change();$("#loops_filter_duration_min").change();$("#loops_filter_duration_max").change();$("#loops_filter_button").tap(filterLoops);$("#loops_filter_type").change(function(){var e=$(this).val();switch(e){case"hike":$(".time_estimate").hide();$(".time_hike").show();$(".time_estimate_prefix").hide();break;case"bridle":$(".time_estimate").hide();$(".time_bridle").show();$(".time_estimate_prefix").hide();break;case"bike":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"bike_Novice":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"bike_Beginner":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"bike_Intermediate":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"bike_Advanced":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"mountainbike":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"exercise":$(".time_estimate").hide();$(".time_hike").show();$(".time_estimate_prefix").hide();break;default:$(".time_estimate").show();$(".time_estimate_prefix").show();break}filterLoops()})})