import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import BasicGuardController from './guard.js';


import Stats from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js';

class ModifiedGame {
  constructor() {
    this.clock = new THREE.Clock();
    // Physics variables
    this.gravityConstant = - 9.8;
    this.rigidBodies = [];
    this.margin = 0.05;
    this.armMovement = 0;

    let context = this;
    Ammo().then( function ( AmmoLib ) {

      Ammo = AmmoLib;
    
      context._init();
      context._animate();
    
    } );
  }
  
  _updatePhysics( deltaTime ) {

  
  // Step world
  this.physicsWorld.stepSimulation( deltaTime, 10 );

  // Update rigid bodies
  for ( let i = 0, il = this.rigidBodies.length; i < il; i ++ ) {

    const objThree = this.rigidBodies[ i ];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();
    if ( ms ) {

      ms.getWorldTransform( this.transformAux1 );
      const p = this.transformAux1.getOrigin();
      const q = this.transformAux1.getRotation();
      objThree.position.set( p.x(), p.y(), p.z() );
      objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

    }

  }

}

_onWindowResize() {
  console.log(this) // TODO: solve error on resize
  // this.camera.aspect = window.innerWidth / window.innerHeight;
  // this.camera.updateProjectionMatrix();

  // this.renderer.setSize( window.innerWidth, window.innerHeight );
  // this._threejs.setSize(window.innerWidth, window.innerHeight);

}

_init() {

  this._initGraphics();

  this._initPhysics();

  this._createObjects();

}

_initGraphics() {

  // this.container = document.getElementById( 'container' );

  const fov = 45;
  this.container = document.querySelector('.scene');
  // container.appendChild(this._threejs.domElement);
  this.aspect = this.container.clientWidth / this.container.clientHeight;
  const near = 1.0;
  const far = 200.0;
  this.camera = new THREE.PerspectiveCamera(fov, this.aspect, near, far);
  this.camera.position.set(20, 20, 100);
  // this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );
  // this.camera.position.set( - 7, 5, 8 );

  this.scene = new THREE.Scene();
  // this.scene.background = new THREE.Color( 0xbfd1e5 );
  const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './resources/skybox3_px.jpg',
      './resources/skybox3_nx.jpg',
      './resources/skybox3_py.jpg',
      './resources/skybox3_ny.jpg',
      './resources/skybox3_pz.jpg',
      './resources/skybox3_nz.jpg',
    ]);
    this.scene.background = texture;


  this.renderer = new THREE.WebGLRenderer();
  this.renderer.setPixelRatio( window.devicePixelRatio );
  this.renderer.setSize( window.innerWidth, window.innerHeight );
  this.renderer.shadowMap.enabled = true;


  
  this._threejs = new THREE.WebGLRenderer({
    antialias: true,
  });
  this._threejs.shadowMap.enabled = true;
  this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
  this._threejs.setPixelRatio(window.devicePixelRatio);
  this._threejs.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(this._threejs.domElement);

  this.container = document.querySelector('.scene');
  this.container.appendChild(this._threejs.domElement);
  // this.container.appendChild(this._threejs.domElement);
  // this.container.appendChild( this.renderer.domElement );

  
  this.controls = new OrbitControls(this.camera, this._threejs.domElement);
  this.controls.enableKeys = false;
  this.controls.target.set(0, 10, 0);
  this.controls.update();
  // this.controls = new OrbitControls( this.camera, this.renderer.domElement );
  // this.controls.target.set( 0, 2, 0 );
  // this.controls.update();
  

  this.textureLoader = new THREE.TextureLoader();

  // const ambientLight = new THREE.AmbientLight( 0x404040 );
  // this.scene.add( ambientLight );

  // const light = new THREE.DirectionalLight( 0xffffff, 1 );
  // light.position.set( - 10, 10, 5 );
  // light.castShadow = true;
  // const d = 10;
  // light.shadow.camera.left = - d;
  // light.shadow.camera.right = d;
  // light.shadow.camera.top = d;
  // light.shadow.camera.bottom = - d;

  // light.shadow.camera.near = 2;
  // light.shadow.camera.far = 50;

  // light.shadow.mapSize.x = 1024;
  // light.shadow.mapSize.y = 1024;

  // this.scene.add( light );
  let light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(20, 20, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.0001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this.scene.add(light);

    // light = new THREE.AmbientLight(0xc8c0b7);
    light = new THREE.AmbientLight(0xffffff);
    this.scene.add(light);

    light = new THREE.PointLight( 0xffffff, 10, 20 );
    light.position.set( -10, 15, -10 );
    this.scene.add( light );

    // var hemiLight = new THREE.HemisphereLight( 0xff0000, 0x0000ff );
    // hemiLight.position.set( 100, 100, 0 );
    // this.scene.add( hemiLight );

  this.stats = new Stats();
  this.stats.domElement.style.position = 'absolute';
  this.stats.domElement.style.top = '0px';
  this.container.appendChild( this.stats.domElement );

  //

  window.addEventListener( 'resize', this._onWindowResize );

}

_createObjects() {

  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();

  // Ground
  pos.set( 0, - 0.5, 0 );
  quat.set( 0, 0, 0, 1 );
  const ground = this._createParalellepiped( 100, 1, 100, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0x808080 } ) );
  
  ground.castShadow = true;
  ground.receiveShadow = true;
  this.textureLoader.load( "textures/grid.png", function ( texture ) {

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 40, 40 );
    ground.material.map = texture;
    ground.material.needsUpdate = true;

  } );



  // The guard
  this._LoadAnimatedModel();
  console.log(this.guard);
  
}

_createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {

  const threeObject = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
  const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
  shape.setMargin( this.margin );

  this._createRigidBody( threeObject, shape, mass, pos, quat );

  return threeObject;

}

_createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

  threeObject.position.copy( pos );
  threeObject.quaternion.copy( quat );

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
  const motionState = new Ammo.btDefaultMotionState( transform );

  const localInertia = new Ammo.btVector3( 0, 0, 0 );
  physicsShape.calculateLocalInertia( mass, localInertia );

  const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
  const body = new Ammo.btRigidBody( rbInfo );

  threeObject.userData.physicsBody = body;

  this.scene.add( threeObject );

  if ( mass > 0 ) {

    this.rigidBodies.push( threeObject );

    // Disable deactivation
    body.setActivationState( 4 );

  }

  this.physicsWorld.addRigidBody( body );

}

_createRandomColor() {

  return Math.floor( Math.random() * ( 1 << 24 ) );

}

_createMaterial() {

  return new THREE.MeshPhongMaterial( { color: this._createRandomColor() } );

}

_animate() {

  this._RAF();
  // requestAnimationFrame( this.animate );

}
_RAF() {
  requestAnimationFrame((t) => {
    if (this._previousRAF === null) {
      this._previousRAF = t;
    }
    this._render();
    this.stats.update();
    this._RAF();
    this._threejs.render(this.scene, this.camera);
    this._Step(t - this._previousRAF);
    this._previousRAF = t;
  });
}
_Step(timeElapsed) {
  const timeElapsedS = timeElapsed * 0.001;
  if (this._mixers) {
    this._mixers.map((m) => m.update(timeElapsedS));
  }
  if (this.guard) {
    this.guard.Update(timeElapsedS);

  }
}



_render() {

  const deltaTime = this.clock.getDelta();

  this._updatePhysics( deltaTime );
  this.renderer.render( this.scene, this.camera );

}

_LoadAnimatedModel() {
  const params = {
    camera: this.camera,
    scene: this.scene,
    // name: 'paladin_prop_j_nordstrom.fbx',
    name: 'paladin_j_nordstrom.fbx',
  };
  this.guard = new BasicGuardController(params);
}

_initPhysics() {

  // Physics configuration

  this.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
  this.dispatcher = new Ammo.btCollisionDispatcher( this.collisionConfiguration );
  this.broadphase = new Ammo.btDbvtBroadphase();
  this.solver = new Ammo.btSequentialImpulseConstraintSolver();
  this.softBodySolver = new Ammo.btDefaultSoftBodySolver();
  this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld( this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration, this.softBodySolver );
  this.physicsWorld.setGravity( new Ammo.btVector3( 0, this.gravityConstant, 0 ) );
  this.physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, this.gravityConstant, 0 ) );

  this.transformAux1 = new Ammo.btTransform();




  const brickMass = 0.5;
  const brickLength = 1.2;
  const brickDepth = 0.6;
  const brickHeight = brickLength * 0.5;
  const numBricksLength = 6;
  const z0 = - numBricksLength * brickLength * 0.5;
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  
  // pos.set( 0, brickHeight * 0.5, z0 );
  quat.set( 0, 0, 0, 1 );
  for (let x = -8; x < 8; x++) {
    for (let y = -8; y < 0; y++) {
      for (let z = -8; z < 8; z++) {
        if ((x > 5 || x < -5) && (y > 5 || y < -5)) {
          pos.set( 5 * x, brickHeight - 5 * y, z );
          const box = this._createParalellepiped( brickDepth, brickHeight, brickLength, brickMass, pos, quat, this._createMaterial() );
          this.scene.add(box);
        }
      }
    }
  }
  // TODO: maybe add collider with group object - cubes - physics

}
}
export default ModifiedGame;