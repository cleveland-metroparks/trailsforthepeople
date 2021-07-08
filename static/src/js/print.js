 /**
 * print.js
 *
 * JS for printing functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

// printMap() is in common.js; it loads the various form values and POSTs them to MapFish, and receives back an URL.
// It then passes the URL to printMapDone(url) which is defined in desktop.js and mobile.js separately

/**
 *
 */
function printMapPrepare() {
    $('#print_waiting').show();
    $('#print_ready').hide();
}

/**
 *
 */
function printMapDone(url) {
    $('#print_waiting').hide();

    if (url) {
        $('#print_link').prop('href', url);
        $('#print_ready').show();
    }
}

/**
 *
 */
function printMap() {
    // their printing options
    var comment    = $('#print_comment').val();
    var paper      = $('#print_paper').val();
    var page2title  = ""; // the title for Page 2, if any
    var page2text1  = ""; // the text content for Page 2, if any, column 1 (left-hand)
    var page2text2  = ""; // the text content for Page 2, if any, column 2 (right-hand)

    // compose the bounding box of the print
    // we can't just use the map's bbox since the monitor and the "paper" aren't the same size,
    // so the resulting maps are completely dissimilar
    // strategy:
    
    
    

    // Map size for their chosen layout ("paper") so we know the target width & height
    var mapWidth  = PRINT_SIZES[paper][0];
    var mapHeight = PRINT_SIZES[paper][1];

    // Create a bounding box of the visible map area,
    // reprojecting to EPSG:3734 so the output looks good.
    var pixelCenter = MAP.project(MAP.getCenter()); // Get center as Point
    var sw = wgsToLocalSRS(MAP.unproject(new mapboxgljs.Point(pixelCenter.x - (mapWidth/2), pixelCenter.y + (mapHeight/2))));
    var ne = wgsToLocalSRS(MAP.unproject(new mapboxgljs.Point(pixelCenter.x + (mapWidth/2), pixelCenter.y - (mapHeight/2))));
    var projbbox = [sw[0], sw[1], ne[0], ne[1]];

    // the layers to include into the map: WMS, vectors for markers
    // we effectively emulate the OpenLayers-centric structure for each Layer
    /*
    {"baseURL":"http://labs.metacarta.com/wms/vmap0","opacity":1,"singleTile":false,"type":"WMS","layers":["basic"],"format":"image/jpeg","styles":[""],"customParams":{}},
    {"type":"Vector",
        "styles":{
            "1":{"externalGraphic":"http://openlayers.org/dev/img/marker-blue.png","strokeColor":"red","fillColor":"red","fillOpacity":0.7,"strokeWidth":2,"pointRadius":12}
        },
        "styleProperty":"_gx_style",
        "geoJson":{"type":"FeatureCollection",
        "features":[
            {"type":"Feature","id":"OpenLayers.Feature.Vector_52","properties":{"_gx_style":1},"geometry":{"type":"Polygon","coordinates":[[[15,47],[16,48],[14,49],[15,47]]]}},
            {"type":"Feature","id":"OpenLayers.Feature.Vector_61","properties":{"_gx_style":1},"geometry":{"type":"LineString","coordinates":[[15,48],[16,47],[17,46]]}},
            {"type":"Feature","id":"OpenLayers.Feature.Vector_64","properties":{"_gx_style":1},"geometry":{"type":"Point","coordinates":[16,46]}}]}
        ],
        "name":"vector","opacity":1}
    }
    */
    var wmsparams = {
        format_options : "dpi:300"
    };
    var layers = [];
    if ( MAP.hasLayer(AVAILABLE_LAYERS['photo']) ) {
        if ( MAP.getZoom() < 14 ) return alert("Before printing, zoom in closer.");

        // the photo base layer is a GeoServer cascade to a State of Ohio WMS service, but the Ohio WMS doesn't support large requests for printing
        // swap in the URL of a proxy service which fixes that
        layers[layers.length] = { baseURL:"http://maps.clevelandmetroparks.com/proxy/ohioimagery", opacity:1, singleTile:false, type:"WMS", layers:["0"], format:"image/png", styles:[""]  };
    }
    if ( MAP.hasLayer(AVAILABLE_LAYERS['photo']) || MAP.hasLayer(AVAILABLE_LAYERS['vector'])) {
        // the basemap is a tile service from TileStache, but printing can't do tile services
        // so we use the GeoServer WMS version, which does lack a bit in the image quality but does get the job done
        layers[layers.length] = { baseURL:"http://maps.clevelandmetroparks.com/gwms", opacity:1, singleTile:true, type:"WMS", layers:["group_basemap"], format:"image/jpeg", styles:[""], customParams:wmsparams };
        layers[layers.length] = { baseURL:"http://maps.clevelandmetroparks.com/gwms", opacity:1, singleTile:true, type:"WMS", layers:["cm:trails","cm:closures","cm:markers_other","cm:markers_swgh"], format:"image/png", styles:"", customParams:wmsparams };
    }

    // Directions line
    if (MAP.getLayer('directionsLine') && MAP.getSource('directionsLine')) {
        // Construct a list-of-lists multilinestring. Remember that OpenLayers and MFP do lng,lat instead of lat,lng
            // use non-API methods to iterate over the line components, collecting them into "vertices" to form a list of lists
        var vertices = [];
        // var line = MAP.getSource('directionsLine')._data.coordinates;
        for (var li in DIRECTIONS_LINE._layers) {
            var subline = DIRECTIONS_LINE._layers[li];
            var subverts = [];
            for (var i=0, l=subline._latlngs.length; i<l; i++) {
                subverts[subverts.length] = wgsToLocalSRS([subline._latlngs[i].lng, subline._latlngs[i].lat]);
            }
            vertices[vertices.length] = subverts;
        }

        // the styling is simply pulled from the styling constant
        var opacity = DIRECTIONS_LINE_STYLE.opacity;
        var color   = DIRECTIONS_LINE_STYLE.color;
        var weight  = 3;

        layers[layers.length] = {
            type:"Vector", name:"Directions Line", opacity:opacity,
            styles:{
                "default":{ strokeColor:color, strokeWidth:weight, strokeLinecap:"round" }
            },
            styleProperty:"style_index",
            geoJson:{
                type: "FeatureCollection",
                features:[
                    { type:"Feature", properties:{"style_index":"default"}, geometry:{ type:"MultiLineString", coordinates:vertices } }
                ]
            }
        };

        // now the Start marker, which will always be present if there's a line
        //var iconurl  = ICON_FROM.options.iconUrl;
        var iconurl  = ICON_FROM.options.iconUrl.replace('maps.clevelandmetroparks.com','10.0.0.23').replace('https:','http:');
        var projdot  = wgsToLocalSRS(MARKER_FROM.getLatLng());
        var iconxoff = -10; // offset to place the marker; MFP drifts it for some reason
        var iconyoff = 0; // offset to place the marker; MFP drifts it for some reason
        var iconsize = 15; // the scaling factor for the icon; like the xoff and yoff this is determined through trial and error
        // all of this is required: styleProperty and properties form the link to a style index, fillOpacity really works
        layers[layers.length] = {
            type:"Vector", name:"Target Marker", opacity:1.0,
            styleProperty: "style_index",
            styles:{
                "default":{ externalGraphic:iconurl, fillOpacity:1.0, pointRadius:iconsize, graphicXOffset: iconxoff, graphicYOffset: iconyoff }
            },
            geoJson:{
                type:"FeatureCollection",
                features:[
                    { type:"Feature", properties:{ style_index:"default" }, geometry:{ type:"Point", coordinates:projdot } }
                ]
            }
        };

        // and the End marker, which will always be present if there's a line; copied from the Start marker above
        //var iconurl  = ICON_TO.options.iconUrl;
        var iconurl  = ICON_TO.options.iconUrl.replace('maps.clevelandmetroparks.com','10.0.0.23').replace('https:','http:');
        var projdot  = wgsToLocalSRS(MARKER_TO.getLatLng());
        var iconxoff = -10; // offset to place the marker; MFP drifts it for some reason
        var iconyoff = 0; // offset to place the marker; MFP drifts it for some reason
        var iconsize = 15; // the scaling factor for the icon; like the xoff and yoff this is determined through trial and error
        // all of this is required: styleProperty and properties form the link to a style index, fillOpacity really works
        layers[layers.length] = {
            type:"Vector", name:"Target Marker", opacity:1.0,
            styleProperty: "style_index",
            styles:{
                "default":{ externalGraphic:iconurl, fillOpacity:1.0, pointRadius:iconsize, graphicXOffset: iconxoff, graphicYOffset: iconyoff }
            },
            geoJson:{
                type:"FeatureCollection",
                features:[
                    { type:"Feature", properties:{ style_index:"default" }, geometry:{ type:"Point", coordinates:projdot } }
                ]
            }
        };

        // and as an afterthought, the text directions: try the Directions first, then see if there are Measure directions
        paper += " with directions";
        var placename = $('#directions_target_title').text();
        var addrname  = $('#directions_address').val();
        var via       = $('#directions_via option:selected').text().toLowerCase();
        var steps;
        if (placename && addrname) {
            page2title = "Directions\n" + "from " + placename + "\n" + "to " + addrname + "\n" + via;
            steps = $('#directions_steps li');
        } else {
            page2title = "Measurement directions";
            steps = $('#measure_steps li');
        }

        // process the directions steps into a plain text output
        // first question: which paper layout, so how many directions fit onto a page, so how much do we pad the steps ot fit the page nicely?
        var maxstepsperpage = 25;
        switch (paper) {
            case 'Letter portrait with directions':
                maxstepsperpage = 40;
                break;
            case 'Letter landscape with directions':
                maxstepsperpage = 31;
                break;
            case 'Ledger portrait with directions':
                maxstepsperpage = 65;
                break;
            case 'Ledger landscape with directions':
                maxstepsperpage = 45;
                break;
        }
        page2text1 = [];
        page2text2 = [];

        steps.each(function () {
            var steptext = $(this).find('.ui-li-heading').eq(0).text();
            var timedist = $(this).find('.ui-li-desc').eq(0).text();
            var linetext = steptext + "\n" + "     " + timedist;
            if (page2text1.length < maxstepsperpage) page2text1[page2text1.length] = linetext;
            else                                     page2text2[page2text2.length] = linetext;
        });
        page2text1 = page2text1.join("\n");
        page2text2 = page2text2.join("\n");
    }

    // Highlight line
    if (HIGHLIGHT_LINE && MAP.hasLayer(HIGHLIGHT_LINE) ) {
        // the highlighting line, which we know to be a multilinestring
        // Remember that OpenLayers and MFP do lng,lat instead of lat,lng
        var vertices = [];
        var lines = HIGHLIGHT_LINE.getLatLngs();
        for (var li=0, ll=lines.length; li<ll; li++) {
            var thisline = [];
            for (vi=0, vl=lines[li].length; vi<vl; vi++) {
                thisline[thisline.length] = wgsToLocalSRS([ lines[li][vi].lng , lines[li][vi].lat ]);
            }
            vertices[vertices.length] = thisline;
        }

        // the styling is simply pulled from the styling constant
        var opacity = HIGHLIGHT_LINE_STYLE.opacity;
        var color   = HIGHLIGHT_LINE_STYLE.color;
        var weight  = 3;

        layers[layers.length] = {
            type:"Vector", name:"Highlight Line", opacity:opacity,
            styles:{
                "default":{ strokeColor:color, strokeWidth:weight, strokeLinecap:"round" }
            },
            styleProperty:"style_index",
            geoJson:{
                type: "FeatureCollection",
                features:[
                    { type:"Feature", properties:{"style_index":"default"}, geometry:{ type:"MultiLineString", coordinates:vertices } }
                ]
            }
        };

        // if we're adding the HIGHLIGHT_LINE then perhaps this is a Loop we're showing
        // in which case add the directions text
        // the View On Map button, as usual, is our clearinghouse for the "last item of interest"
        var whats_showing = $('#show_on_map').data('zoomelement').attr('type');
        if (whats_showing == 'loop') {
            var steps = $('#moreinfo_steps li');
            paper += " with directions";
            page2title = $('#show_on_map').data('zoomelement').attr('title');

            // process the directions steps into a plain text output
            // first question: which paper layout, so how many directions fit onto a page, so how much do we pad the steps ot fit the page nicely?
            var maxstepsperpage = 25;
            switch (paper) {
                case 'Letter portrait with directions':
                    maxstepsperpage = 40;
                    break;
                case 'Letter landscape with directions':
                    maxstepsperpage = 31;
                    break;
                case 'Ledger portrait with directions':
                    maxstepsperpage = 65;
                    break;
                case 'Ledger landscape with directions':
                    maxstepsperpage = 45;
                    break;
            }
            page2text1 = [];
            page2text2 = [];

            steps.each(function () {
                var steptext = $(this).find('.ui-li-heading').eq(0).text();
                var timedist = $(this).find('.ui-li-desc').eq(0).text();
                var linetext = steptext + "\n" + "     " + timedist;
                if (page2text1.length < maxstepsperpage) page2text1[page2text1.length] = linetext;
                else                                     page2text2[page2text2.length] = linetext;
            });
            page2text1 = page2text1.join("\n");
            page2text2 = page2text2.join("\n");
        }
    }

    // Marker
    if (MARKER_TARGET && MAP.hasLayer(MARKER_TARGET) ) {
        var iconurl  = ICON_TARGET.options.iconUrl;
        var projdot  = wgsToLocalSRS(MARKER_TARGET.getLatLng());
        var iconxoff = -10; // offset to place the marker; MFP drifts it for some reason
        var iconyoff = 0; // offset to place the marker; MFP drifts it for some reason
        var iconsize = 15; // the scaling factor for the icon; like the xoff and yoff this is determined through trial and error

        // all of this is required: styleProperty and properties form the link to a style index, fillOpacity really works
        layers[layers.length] = {
            type:"Vector", name:"Target Marker", opacity:1.0,
            styleProperty: "style_index",
            styles:{
                "default":{ externalGraphic:iconurl, fillOpacity:1.0, pointRadius:iconsize, graphicXOffset: iconxoff, graphicYOffset: iconyoff }
            },
            geoJson:{
                type:"FeatureCollection",
                features:[
                    { type:"Feature", properties:{ style_index:"default" }, geometry:{ type:"Point", coordinates:projdot } }
                ]
            }
        };
    }

    // finally done composing layers!
    // compose the client spec for MapFish Print
    var params = {
        "units":"feet",
        "srs":"EPSG:3734",
        "layout":paper,
        "dpi":300,
        "layers":layers,
        "pages": [
            { bbox:projbbox, rotation:"0", comment:comment }
        ],
        "layersMerging" : true,
        page2title:page2title, page2text1:page2text1, page2text2:page2text2
    };

    printMapPrepare(); // hide the Ready, show a Waiting spinner

    $.ajax({
        url: PRINT_URL, type:'POST',
        data: JSON.stringify(params), processData:false, contentType: 'application/json',
        success: function (reply) {
            // the returned URL has internal references, e.g. http://localhost/
            var url = reply.getURL;
            url = url.split('/'); url = url[url.length-1];
            url = PRINT_PICKUP_BASEURL + url;
            printMapDone(url); // hide the spinner, display a link, etc.
        },
        error: function (xhr,status,text) {
            alert("Printing failed. Please try again.");
            printMapDone(); // hide the spinner, display a link, etc.
        }
    });
}

/**
 * Reproject from WGS84 to Web Mercator, for printing.
 *
 * Specifically, reproject to EPSG:3734 -- NAD83 / Ohio North (ftUS)
 *
 * @param (LngLatLike) dot
 *
 * @return: a two-item list: [x,y] in Web Mercator coordinates
 */
function wgsToLocalSRS(dot) {
    var srsIn = new Proj4js.Proj('EPSG:4326');
    var srsOut = new Proj4js.Proj('EPSG:3734');
    var newDot;
    if (dot.lat && dot.lng) {
        newDot = new Proj4js.Point(dot.lng, dot.lat);
    } else {
        newDot = new Proj4js.Point(dot[0], dot[1]);
    }
    Proj4js.transform(srsIn, srsOut, newDot);
    return [newDot.x, newDot.y];
}
