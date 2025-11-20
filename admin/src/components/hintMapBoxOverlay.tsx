import * as React from 'react';

import {useState} from 'react';
import {useControl} from 'react-map-gl/mapbox';
import {createPortal} from 'react-dom';

import type {IControl} from 'react-map-gl/mapbox';
import type {Map} from 'mapbox-gl';

// Based on template in https://docs.mapbox.com/mapbox-gl-js/api/markers/#icontrol
class OverlayControl implements IControl {
  _map: Map | null = null;
  _container: HTMLElement;
  _redraw: () => void;

  constructor(redraw: () => void) {
    this._redraw = redraw;
  }

  onAdd(map: Map) {
    this._map = map;
    map.on('move', this._redraw);
    this._container = document.createElement('div');
    this._redraw();
    return this._container;
  }

  onRemove(): void {
    this._container.remove();
    this._map.off('move', this._redraw);
    this._map = null;
  }

  getMap(): Map | null {
    return this._map;
  }

  getElement(): HTMLElement {
    return this._container;
  }
}

/**
 * A custom control that rerenders arbitrary React content whenever the camera changes
 */
function CustomOverlay(props: {children: React.ReactElement<{map?: Map}>}) {
  const [, setVersion] = useState(0);

  const ctrl = useControl<OverlayControl>(() => {
    const forceUpdate = () => setVersion(v => v + 1);
    return new OverlayControl(forceUpdate);
  });

  const map = ctrl.getMap();

  if (!map) return null;

  const childWithMap = React.cloneElement(props.children, {map} as any);

  return createPortal(childWithMap, ctrl.getElement());
}

export default React.memo(CustomOverlay);