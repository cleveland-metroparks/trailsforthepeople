/*
 * parse 4 coordinates into a LatLngBounds
 * params:
 * - w, the minimum longitude (west boundary)
 * - s, the minimum latitude (south boundary)
 * - e, the maximum longitude (east boundary)
 * - n, the maximum latitude (north boundary)
 * returns:
 * - an instance of L.LanLngBounds
 *
 * The supported options depends on the type of feature found   http://leaflet.cloudmade.com/reference.html#path
 */
L.WSENtoBounds = function (w,s,e,n) {
    var sw = new L.LatLng(s,w);
    var ne = new L.LatLng(n,e);
    var feature = new L.LatLngBounds(sw,ne);
    return feature;
};




/*
 * parse Well Known Text (WKT) and return a PolyLine, MultiPolyline, et cetera
 * params:
 * - wkt, String WKT to be parsed
 * - options, object to be passed to the new feature as it is constructed.
 * returns:
 * - an instance of a L.Path subclass, e.g. L.Polyline
 *
 * The supported options depends on the type of feature found   http://leaflet.cloudmade.com/reference.html#path
 */
L.WKTtoFeature = function (wkt,options) {
    // really, this is a wrapper to the WKTtoFeature.parse* functions
    wkt = wkt.replace(/^\s*/g,'').replace(/\s*$/,'');
    if (wkt.indexOf('LINESTRING') == 0)      return L.WKTtoFeature.parseLinestring(wkt,options);
    if (wkt.indexOf('MULTILINESTRING') == 0) return L.WKTtoFeature.parseMultiLinestring(wkt,options);
    if (wkt.indexOf('MULTIPOLYGON') == 0) return L.WKTtoFeature.parseMultiPolygon(wkt,options);
};


L.WKTtoFeature.parseLinestring = function (wkt,options) {
    // split on , to get vertices. handle possible spaces after commas
    var verts = wkt.replace(/^LINESTRING\s*\(/, '').replace(/\)$/, '').split(/,\s*/);

    // collect vertices into a line
    var line = [];
    for (var vi=0, vl=verts.length; vi<vl; vi++) {
        var lng = parseFloat( verts[vi].split(" ")[0] );
        var lat = parseFloat( verts[vi].split(" ")[1] );
        line[line.length] = new L.LatLng(lat,lng);
    }

    // all set, return the Polyline with the user-supplied options/style
    var feature = new L.Polyline(line, options);
    return feature;
}


L.WKTtoFeature.parseMultiLinestring = function (wkt,options) {
    // some text fixes, strip the header and trailer
    wkt = wkt.replace(/^MULTILINESTRING\s*\(/, '').replace(/\)$/, '');

    // split by () content to get linestrings, split linestrings by commas to get vertices
    var multiline = [];
    var getLineStrings = /\((.+?)\)/g;
    var getVerts = /,\s*/g;
    while (lsmatch = getLineStrings.exec(wkt)) {
        var line = [];
        var verts = lsmatch[1].split(getVerts);
        for (var i=0; i<verts.length; i++) {
            var lng = parseFloat( verts[i].split(" ")[0] );
            var lat = parseFloat( verts[i].split(" ")[1] );
            line[line.length] = new L.LatLng(lat,lng);
        }
        multiline[multiline.length] = line;
    }

    // all set, return the MultiPolyline with the user-supplied options/style
    var feature = new L.MultiPolyline(multiline, options);
    return feature;
}


L.WKTtoFeature.parseMultiPolygon = function (wkt,options) {
    // some text fixes, strip the header and trailer
    wkt = wkt.replace(/^MULTIPOLYGON\s*\(/, '').replace(/\)$/, '');

    // split by () content to get polygons, split each polygon by commas to get vertices
    var multipoly = [];
    var getPolygons = /\(+(.+?)\)+/g;
    var getVerts = /,\s*/g;
    while (lsmatch = getPolygons.exec(wkt)) {
        var poly = [];
        var verts = lsmatch[1].split(getVerts);
        for (var i=0; i<verts.length; i++) {
            var lng = parseFloat( verts[i].split(" ")[0] );
            var lat = parseFloat( verts[i].split(" ")[1] );
            poly[poly.length] = new L.LatLng(lat,lng);
        }
        multipoly[multipoly.length] = poly;
    }

    // all set, return the MultiPolyline with the user-supplied options/style
    var feature = new L.MultiPolygon(multipoly, options);
    return feature;
}




/***** the WKT generators do not work, maybe some day if we care */

L.FeatureToWKT = function (feature) {
};


L.FeatureToWKT.generateLinestring = function (feature) {
    for (var li=0, ll=routestruct.vertices.length; li<ll; li++) {
        wkt[wkt.length] = routestruct.vertices[li].lng + ' ' + routestruct.vertices[li].lat;
    }
    wkt = 'LINESTRING(' + wkt.join(",") + ')';
};


L.FeatureToWKT.generateMultiLinestring = function (feature) {
    for (var li=0, ll=routestruct.lines.length; li<ll; li++) {
        var segment = [];
        for (var vi=0, vl=routestruct.lines[li].length; vi<vl; vi++) {
            var vert = routestruct.lines[li][vi];
            segment[segment.length] = vert.lng + ' ' + vert.lat;
        }
        wkt[wkt.length] = '(' + segment.join(",") + ')';
    }
    wkt = 'MULTILINESTRING(' + wkt.join(",") + ')';
};

