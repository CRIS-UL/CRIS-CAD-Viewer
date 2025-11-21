# CRIS CAD Viewer

An interactive 3D model viewer for `.glb` and `.gltf` CAD files, built with [Three.js](https://threejs.org/). This tool allows viewing locally uploaded or remotely hosted models with a variety of visual controls and metadata display.

## 🚀 Features

- ✅ Load `.glb` or `.gltf` models from local device or remote URL
- 🎛 Toggle wireframe mode, background, grid, and shadows
- 🔄 Auto-rotate and reset view functionality
- 📊 View file metadata: bounds, triangle count, polygon count
- 🌐 HDR lighting with adjustable exposure
- 👁️ Smooth camera controls via OrbitControls


## 📂 Adding Models

Place `.glb` or `.gltf` files into the `models/` folder and register them in `js/config.js`:

```js
export const MODELS = [
  {
    id: "example",
    label: "Example Model",
    path: "models/example.glb"
  }
];
```

For remote files, use a CORS-enabled URL:

```js
export const MODELS = [
  {
    id: "remote-model",
    label: "Remote Model",
    path: "https://yourdomain.com/models/example.glb"
  }
];
```


## 🗂 File Structure

```
├── index.html              # Main HTML interface
├── css/
│   └── styles.css          # Styling and layout
├── js/
│   ├── main.js             # App logic, model loading
│   ├── viewer.js           # Viewer class and rendering
│   └── config.js           # Model definitions
├── models/                 # Local model storage
└── cris.png                # CRIS logo
```



## 👨‍🎓 Author

Luke Griffin  
CRIS, University of Limerick

---

