# Node.js Server Project

This project is a simple Node.js application that serves an HTML page with a Three.js scene and AR capabilities. The application includes 3D models in GLTF format and provides a grid layout for displaying multiple 3D containers.

## Project Structure

```
nodejs-server
├── public
│   ├── index.html        # HTML structure of the application
│   ├── main.js           # JavaScript code for Three.js and AR
│   └── gtlfs
│       ├── underdasee
│       │   └── scene.gltf  # GLTF model for a 3D scene
│       └── adamHead
│           └── adamHead.gltf # GLTF model for a 3D head
├── server.js             # Entry point for the Node.js server
├── package.json          # npm configuration file
└── README.md             # Project documentation
```

## Getting Started

To run this project, you need to have Node.js and npm installed on your machine.

### Installation

1. Clone the repository or download the project files.
2. Navigate to the project directory:
   ```
   cd nodejs-server
   ```
3. Install the required dependencies:
   ```
   npm install
   ```

### Running the Server

To start the server, run the following command:
```
node server.js
```

The server will start and listen on `http://localhost:3000`. You can open this URL in your web browser to view the application.

### Dependencies

This project uses the following npm packages:

- **Express**: A web framework for Node.js to serve static files.

### License

This project is licensed under the MIT License.