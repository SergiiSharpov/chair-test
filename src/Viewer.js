import './helpers/LoaderSupport';
import './helpers/OBJLoader2';
import './helpers/MTLLoader';
import './helpers/OrbitControls';

const objLoader = new THREE.OBJLoader2();

let camera, scene, renderer, controls;
let directionalLight;
let plane;

const SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;
const PLANE_SIZE = 9999;

init();
animate();

THREE.OrbitControls.prototype.clamp = function(instance) {
    let box = new THREE.Box3().setFromObject(instance);
    let sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    sphere.applyMatrix4( instance.matrixWorld );

    // vector from current center to camera position (shouldn't be zero in length)
    let s = new THREE.Vector3().subVectors( this.object.position, this.target );

    let h = sphere.radius / Math.tan( this.object.fov / 2 * Math.PI / 180 );

    let newPos = new THREE.Vector3().addVectors( sphere.center, s.setLength(h) );

    this.object.position.copy( newPos );
    this.target.copy( sphere.center );

    directionalLight.shadow.camera.far = sphere.radius * 3.0;
    directionalLight.shadow.camera.left = -sphere.radius;
    directionalLight.shadow.camera.right = sphere.radius;
    directionalLight.shadow.camera.top = sphere.radius;
    directionalLight.shadow.camera.bottom = -sphere.radius;
    directionalLight.shadow.camera.updateProjectionMatrix();
    directionalLight.position.set(box.max.x, box.max.y, box.max.z);
    directionalLight.castShadow = true;
};

function loadTexture(path) {
    let texture = new THREE.TextureLoader().load('./assets/textures/' + path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(PLANE_SIZE / 32, PLANE_SIZE / 32);

    return texture;
}

function init() {
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10000 );
    camera.position.z = 12;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#cce0ff');
    scene.fog = new THREE.Fog( 0xcce0ff, 5, 1000 );

    scene.add(new THREE.AmbientLight( 0x222222 ));

    directionalLight = new THREE.DirectionalLight( 0xcce0ee, 1 );
    directionalLight.position.set( 1, 1, 1 ).normalize();
    directionalLight.castShadow = true;

    directionalLight.shadow.bias = -0.004;
    directionalLight.shadow.camera.far = 10000;
    directionalLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    directionalLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    scene.add( directionalLight );

    let planeGeometry = new THREE.PlaneBufferGeometry( PLANE_SIZE, PLANE_SIZE );
    let planeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        depthTest: false,
        map: loadTexture('floor/Wood_plancks_004_COLOR.jpg'),
        normalMap: loadTexture('floor/Wood_plancks_004_NRM.jpg'),
        displacementMap: loadTexture('floor/Wood_plancks_004_DISP.jpg'),
        specularMap: loadTexture('floor/Wood_plancks_004_SPEC.jpg'),
        aoMap: loadTexture('floor/Wood_plancks_004_OCC.jpg'),
    });
    plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.receiveShadow = true;
    plane.castShadow = false;
    plane.rotateX(-Math.PI * 0.5);
    scene.add( plane );

    controls = new THREE.OrbitControls( camera );
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.4;
    controls.update();

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor( 0xffffff );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;

    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2;

    document.body.appendChild( renderer.domElement );

    objLoader.loadMtl( './assets/models/chair/chair.mtl', null, (materials) => {
        objLoader.setMaterials(materials);
        objLoader.load(
            './assets/models/chair/chair.obj',
            function ( event ) {
                let object = event.detail.loaderRootNode;
                object.traverse((node) => {
                    if (node instanceof THREE.Mesh) {
                        node.receiveShadow = true;
                        node.castShadow = true;
                        node.material.side = THREE.DoubleSide;
                    }
                });

                object.receiveShadow = true;
                object.castShadow = true;

                scene.add(object);
                controls.clamp(object);
            },
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            function ( error ) {
                console.log( 'An error happened' );
            },
            null,
            true
        );
    }, null, null );

    window.addEventListener( 'resize', onResize, false );
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

    requestAnimationFrame( animate );

    controls.update();

    renderer.render( scene, camera );
}