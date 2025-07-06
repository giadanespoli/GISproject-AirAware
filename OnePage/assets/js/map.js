
import { Map, View, Overlay } from 'ol';
import { Tile, Image, Group, Vector } from 'ol/layer';
import { OSM, ImageWMS, XYZ, StadiaMaps } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { GeoJSON } from 'ol/format';
import { fromLonLat } from 'ol/proj';
import { ScaleLine, FullScreen, MousePosition } from 'ol/control';
import LayerSwitcher from 'ol-layerswitcher';
import { createStringXY } from 'ol/coordinate';
import { Style, Fill, Stroke } from 'ol/style';
import Map from 'ol/Map';
import View from 'ol/View';


// MAPPA BASE
const osm = new ol.layer.Tile({
    title: "OpenStreetMap",
    type: "base",
    visible: true,
    source: new ol.source.OSM()
});

const stamenToner = new ol.layer.Tile({
    title: "Stamen Toner",
    type: "base",
    visible: false,
    source: new ol.source.XYZ({
        url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'
    })
});

const esriWorldImagery = new ol.layer.Tile({
    title: "ESRI World Imagery",
    type: "base",
    visible: false,
    source: new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    })
});

const baseMaps = new ol.layer.Group({
    title: "Base Maps",
    fold: "open",
    layers: [osm, stamenToner, esriWorldImagery]
});


// NO2 OVERLAY LAYERS
const wmsUrl = "https://www.gis-geoserver.polimi.it/geoserver/gisgeoserver_12/wms";

const no2Concentration = new ol.layer.Tile({
    title: "NO2 Concentration",
    type: "overlay",
    visible: true,
    source: new ol.source.TileWMS({
        url: wmsUrl,
        params: {"LAYERS":"gisgeoserver_12:Hungary_no2_concentration_map_2020",
                 "STYLES":"Hungary_no2_concentration_map_2020",
                 "TILED":true},
        serverType: "geoserver"
    })
});

const landCover2022 = new ol.layer.Tile({
    title: "Land Cover 2022",
    type: "overlay",
    visible: true,
    source: new ol.source.TileWMS({
        url: wmsUrl,
        params: {"LAYERS":"gisgeoserver_12:HUNGARY_LC_reclassified_2022",
                 "STYLES":"HUNGARY_LC_reclassified_2022",
                 "TILED":true},
        serverType: "geoserver"
    })
});

const no2Group = new ol.layer.Group({
    title: "NO2 Layers",
    fold: "open",
    layers: [no2Concentration, landCover2022]
});


// COSTRUISCI LA MAPPA
const map = new ol.Map({
    target: 'map',
    layers: [baseMaps, no2Group],
    view: new ol.View({
        center: ol.proj.fromLonLat([19.5033, 47.1625]),
        zoom: 7
    })
});


// LAYER SWITCHER CON SOTTOGRUPPI
const layerSwitcher = new LayerSwitcher({
    activationMode: "click",
    startActive: true,
    groupSelectStyle: "children"
});
map.addControl(layerSwitcher);


// CONTROLLI EXTRA
map.addControl(new ol.control.ScaleLine());
map.addControl(new ol.control.FullScreen());
map.addControl(new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: 'EPSG:4326',
    className: 'ol-mouse-position custom-mouse-coords',
    placeholder: '0.0000, 0.0000',
    target: document.getElementById('mouse-coords-container')
}));


// OPZIONALE: LAYER GEOJSON (come il confine Hungary)
let countryLayer;
fetch('assets/data/hungary.geojson')
.then(res => res.json())
.then(geojson => {
    countryLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(geojson, {
                featureProjection: 'EPSG:3857'
            })
        }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({ color: 'red', width: 2 }),
            fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.4)' })
        })
    });
    map.addLayer(countryLayer);

    // controlli toggle + opacity
    document.getElementById('toggle-country-layer').addEventListener('change', e => {
        countryLayer.setVisible(e.target.checked);
    });
    document.getElementById('opacity-country').addEventListener('input', e => {
        const value = parseFloat(e.target.value);
        countryLayer.setOpacity(value);
        document.getElementById('opacity-country-value').textContent = Math.round(value * 100) + '%';
    });
});

