L.Control.ScaleBar = L.Class.extend({

    onAdd: function (map) {
        this._pixelwidth = 100;

        this._map = map;
        this._maptrigger_move = this._map.on('moveend', this._update, this);
        this._maptrigger_zoom = this._map.on('zoomend', this._update, this);

        this._container = L.DomUtil.create('div', 'leaflet-control-scalebar');
        this._container.style.overflow =  'hidden';
        this._container.style.width  = this._pixelwidth + 'px';
        this._container.style.height =  '15px';
        this._container.style.backgroundColor =  'white';
        this._container.style.borderColor =  'black';
        this._container.style.borderStyle =  'solid';
        this._container.style.borderWidth =  '0 5px 0 5px';
        this._container.style.fontSize =  '8pt';
        this._container.style.textAlign =  'center';

        this._update();
    },

    onRemove: function (map) {
        map.off('moveend', this._maptrigger_move, this);
        map.off('zoomend', this._maptrigger_zoom, this);
    },

    getPosition: function () {
        return L.Control.Position.BOTTOM_LEFT;
    },

    getContainer: function () {
        return this._container;
    },

    _update: function () {
        if (!this._map) return;

        // find the horizontal midpoint of the top and bottom sides of the map viewport
        // old method used the right and left. bad move: those are the sides that stretch as latitude changes!
        var bounds = this._map.getBounds();
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        var halflng  = ( sw.lng + ne.lng ) / 2.0;
        var midBottom = new L.LatLng(ne.lat,halflng);
        var midTop    = new L.LatLng(sw.lat,halflng);

        // find the distance between those two points (meters) and divide by the map's pixel width,
        // and we have the meters-per-pixel at the moment
        var mwidth   = midTop.distanceTo(midBottom);
        var pxheight = this._map.getSize().y;
        var mperpx   = mwidth / pxheight;

        // now we know the distance represented by our scalebar, which is this._pixelwidth pixels wide
        var meters    = this._pixelwidth * mperpx;
        var feet      = meters * 3.2808399;
        var miles     = meters * 0.000621371192;
        var feet_txt  = Math.round(feet) + ' ft';
        var miles_txt = miles.toFixed(2) + ' mi';
        //console.log([meters,feet,miles]);

        // make up some text and assign it
        var unitstext = feet < 1320 ? feet_txt : miles_txt;
        this._container.innerHTML = unitstext;
    }

});
