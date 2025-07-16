import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat, transformExtent } from 'ol/proj';
import {
  ScaleLine,
  OverviewMap,
  ZoomToExtent,
  FullScreen,
  defaults as defaultControls
} from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke } from 'ol/style';

import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import LayerSwitcher from 'ol-layerswitcher';
import LayerGroup from 'ol/layer/Group';
import Overlay from "ol/Overlay";


// Definición de extensiones
const extentWGS84 = [-16, 35.0, 10, 44];
const extent3857 = transformExtent(extentWGS84, 'EPSG:4326', 'EPSG:3857');

const extentACorunaWGS84 = [-9.0, 42.0, -8.0, 44.0];
const extentACoruna3857 = transformExtent(extentACorunaWGS84, 'EPSG:4326', 'EPSG:3857');


// Capa base OSM
const osm = new TileLayer({
  type: 'base',
  title: 'OpenStreetMap',
  visible: true,
  source: new OSM(),
  attributions: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

// Capa vectorial del Camino de Santiago
const CaminoSantiago = new VectorLayer({
  title: 'Camino de Santiago',
  visible: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: './data/caminos_santiago.geojson'
  }),
  style: function(feature) {
    return CaminoSantiagoStyle(feature);
  },
});
// Estilo para la capa del Camino de Santiago


function CaminoSantiagoStyle(feature) {
const coloresAgrupacion = {
  'Caminos del Norte': 'red',
  'Caminos del Sureste': 'blue',
  'Caminos Andaluces': 'green',
  'Caminos Insulares': 'orange',
  'Caminos del Este': 'purple',
  'Caminos del Centro': 'brown',
  'Caminos Portugueses': 'teal',
  'Caminos de Galicia': 'navy',
  'Voie Turonensis - Paris': 'crimson',
  'Camino Francés': 'gold',
  'Caminos Catalanes': 'darkgreen',
  'Chemins vers Via des Piemonts': 'indigo',
  'Chemins vers Via Turonensis': 'darkorange',
  'Via Tolosana Arles': 'darkred',
  'Voie des Piemonts': 'dodgerblue'
};

const agrupacion = feature.get('agrupacion');
const color = coloresAgrupacion[agrupacion] || 'gray';

  return new Style({
    stroke: new Stroke({
      color: color,
      width: 3

  
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.6)'
    })
  });
}

// Carga de la capa WMS PNOA
const pnoaLayer = new TileLayer({
  type: 'base',
  title: 'PNOA',
  visible: false,
  source: new TileWMS({
    url: 'https://www.ign.es/wms-inspire/pnoa-ma?',
    params: {
      'LAYERS': 'OI.OrthoimageCoverage',
      'TILED': true,
      'VERSION': '1.3.0',
      'FORMAT': 'image/png',
      'SRS': 'EPSG:3857' // CAMBIO AQUÍ: usar SRS en vez de CRS
    },
    attributions: 'PNOA © <a href="https://www.ign.es">IGN</a>'
  }),
  
});

// Carga de la capa WMS Primera Edición MTN50
const mtnLayer = new TileLayer({
  type: 'base',
  title: 'Primera Edición MTN50',
  visible: false,
  source: new TileWMS({
    url: 'https://www.ign.es/wms/primera-edicion-mtn',
    params: {
      'LAYERS': 'MTN50',
      'TILED': true,
      'VERSION': '1.3.0',
      'FORMAT': 'image/png',
      'SRS': 'EPSG:3857' // CAMBIO AQUÍ: usar SRS en vez de CRS
    },
    attributions: 'Primera Edición MTN50 © <a href="https://www.ign.es">IGN</a>'
  }),
  
});

const mapasBase = new LayerGroup({
  fold: 'open',
  title: 'Mapas Base',
  layers: [mtnLayer,  pnoaLayer,osm ]
  });

const capasTematicas = new LayerGroup({
  title: 'Capas Temáticas',
  layers: [CaminoSantiago]
});

//Variables asociadas a los objetos HTML popup
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer'); 

//evento para cerrar el popup
closer.onclick = function() {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};


//Objeto Overlay de OL  
const overlay = new Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});


// Mapa
const map = new Map({
  target: 'map',
  controls: defaultControls().extend([
    new ScaleLine({
      units: 'metric',
      bar: true,
      steps: 4,
      text: false,
      minWidth: 100
    }),
    new OverviewMap({
      collapsed: false,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ]
    }),
    new ZoomToExtent({
      extent: extentACoruna3857
    }),
    new FullScreen()
  ]),
    layers: [ 
    mapasBase,
    capasTematicas
  ],

  view: new View({
    center: fromLonLat([-3.667, 40.500]),
    zoom: 2,
    extent: extent3857
  }),
  overlays: [overlay]
});



const layerSwitcher = new LayerSwitcher({
  tipLabel: 'Capas',
  
});
map.addControl(layerSwitcher);




map.on('singleclick', function(evt) {
  let info = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
    return {
      nombre: feature.get('nombre'),
      agrupacion: feature.get('agrupacion'),
      longitud: feature.get('longitud'),
      pais: feature.get('pais'),
      url_info: feature.get('url_info'),
         };
  });

  if (info) {
    content.innerHTML = `<h3>${info.agrupacion}</h3>
                         <p><strong>Descripción:</strong> ${info.agrupacion}</p>
                         <p><strong>Distancia:</strong> ${info.longitud} km</p>
                         <p><strong>Dificultad:</strong> ${info.pais}</p>
                         <p><strong>URL:</strong> <a href="${info.url_info}" target="_blank">${info.url_info}</a></p>`;
    overlay.setPosition(evt.coordinate);
  } else {
    overlay.setPosition(undefined);
  }
});

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  let pixel = map.getEventPixel(evt.originalEvent);
  let hit = map.hasFeatureAtPixel(pixel);
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
}
);