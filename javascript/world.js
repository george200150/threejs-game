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

  // Hinge control
  this.hinge.enableAngularMotor( true, 1.5 * this.armMovement, 50 );

  // Step world
  this.physicsWorld.stepSimulation( deltaTime, 10 );

  // Update rope
  const softBody = this.rope.userData.physicsBody;
  const ropePositions = this.rope.geometry.attributes.position.array;
  const numVerts = ropePositions.length / 3;
  const nodes = softBody.get_m_nodes();
  let indexFloat = 0;

  for ( let i = 0; i < numVerts; i ++ ) {

    const node = nodes.at( i );
    const nodePos = node.get_m_x();
    ropePositions[ indexFloat ++ ] = nodePos.x();
    ropePositions[ indexFloat ++ ] = nodePos.y();
    ropePositions[ indexFloat ++ ] = nodePos.z();

  }

  this.rope.geometry.attributes.position.needsUpdate = true;

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

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  this.renderer.setSize( window.innerWidth, window.innerHeight );

}

_init() {

  this._initGraphics();

  this._initPhysics();

  this._createObjects();

}

_initGraphics() {

  // this.container = document.getElementById( 'container' );

  const fov = 45;
  let container;
  this.container = document.querySelector('.scene');
  // container.appendChild(this._threejs.domElement);
  const aspect = this.container.clientWidth / this.container.clientHeight;
  const near = 1.0;
  const far = 200.0;
  this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  this.camera.position.set(20, 20, 100);
  // this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );
  // this.camera.position.set( - 7, 5, 8 );

  this.scene = new THREE.Scene();
  this.scene.background = new THREE.Color( 0xbfd1e5 );

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

  const ambientLight = new THREE.AmbientLight( 0x404040 );
  this.scene.add( ambientLight );

  const light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( - 10, 10, 5 );
  light.castShadow = true;
  const d = 10;
  light.shadow.camera.left = - d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = - d;

  light.shadow.camera.near = 2;
  light.shadow.camera.far = 50;

  light.shadow.mapSize.x = 1024;
  light.shadow.mapSize.y = 1024;

  this.scene.add( light );

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
  const ground = this._createParalellepiped( 40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
  ground.castShadow = true;
  ground.receiveShadow = true;
  this.textureLoader.load( "textures/grid.png", function ( texture ) {

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 40, 40 );
    ground.material.map = texture;
    ground.material.needsUpdate = true;

  } );


  // Ball
  const ballMass = 1.2;
  const ballRadius = 0.6;

  const ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 20, 20 ), new THREE.MeshPhongMaterial( { color: 0x202020 } ) );
  ball.castShadow = true;
  ball.receiveShadow = true;
  const ballShape = new Ammo.btSphereShape( ballRadius );
  ballShape.setMargin( this.margin );
  pos.set( - 3, 2, 0 );
  quat.set( 0, 0, 0, 1 );
  this._createRigidBody( ball, ballShape, ballMass, pos, quat );
  ball.userData.physicsBody.setFriction( 0.5 );

  // Wall
  const brickMass = 0.5;
  const brickLength = 1.2;
  const brickDepth = 0.6;
  const brickHeight = brickLength * 0.5;
  const numBricksLength = 6;
  const numBricksHeight = 8;
  const z0 = - numBricksLength * brickLength * 0.5;
  pos.set( 0, brickHeight * 0.5, z0 );
  quat.set( 0, 0, 0, 1 );

  for ( let j = 0; j < numBricksHeight; j ++ ) {

    const oddRow = ( j % 2 ) == 1;

    pos.z = z0;

    if ( oddRow ) {

      pos.z -= 0.25 * brickLength;

    }

    const nRow = oddRow ? numBricksLength + 1 : numBricksLength;

    for ( let i = 0; i < nRow; i ++ ) {

      let brickLengthCurrent = brickLength;
      let brickMassCurrent = brickMass;
      if ( oddRow && ( i == 0 || i == nRow - 1 ) ) {

        brickLengthCurrent *= 0.5;
        brickMassCurrent *= 0.5;

      }

      const brick = this._createParalellepiped( brickDepth, brickHeight, brickLengthCurrent, brickMassCurrent, pos, quat, this._createMaterial() );
      brick.castShadow = true;
      brick.receiveShadow = true;

      if ( oddRow && ( i == 0 || i == nRow - 2 ) ) {

        pos.z += 0.75 * brickLength;

      } else {

        pos.z += brickLength;

      }

    }

    pos.y += brickHeight;

  }

  // The rope
  // Rope graphic object
  const ropeNumSegments = 10;
  const ropeLength = 4;
  const ropeMass = 3;
  const ropePos = ball.position.clone();
  ropePos.y += ballRadius;

  const segmentLength = ropeLength / ropeNumSegments;
  const ropeGeometry = new THREE.BufferGeometry();
  const ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
  const ropePositions = [];
  const ropeIndices = [];

  for ( let i = 0; i < ropeNumSegments + 1; i ++ ) {

    ropePositions.push( ropePos.x, ropePos.y + i * segmentLength, ropePos.z );

  }

  for ( let i = 0; i < ropeNumSegments; i ++ ) {

    ropeIndices.push( i, i + 1 );

  }

  ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
  ropeGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
  ropeGeometry.computeBoundingSphere();
  this.rope = new THREE.LineSegments( ropeGeometry, ropeMaterial );
  this.rope.castShadow = true;
  this.rope.receiveShadow = true;
  this.scene.add( this.rope );

  // Rope physic object
  const softBodyHelpers = new Ammo.btSoftBodyHelpers();
  const ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
  const ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y + ropeLength, ropePos.z );
  const ropeSoftBody = softBodyHelpers.CreateRope( this.physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0 );
  const sbConfig = ropeSoftBody.get_m_cfg();
  sbConfig.set_viterations( 10 );
  sbConfig.set_piterations( 10 );
  ropeSoftBody.setTotalMass( ropeMass, false );
  Ammo.castObject( ropeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( this.margin * 3 );
  this.physicsWorld.addSoftBody( ropeSoftBody, 1, - 1 );
  this.rope.userData.physicsBody = ropeSoftBody;
  // Disable deactivation
  ropeSoftBody.setActivationState( 4 );

  // The base
  const armMass = 2;
  const armLength = 3;
  const pylonHeight = ropePos.y + ropeLength;
  const baseMaterial = new THREE.MeshPhongMaterial( { color: 0x606060 } );
  pos.set( ropePos.x, 0.1, ropePos.z - armLength );
  quat.set( 0, 0, 0, 1 );
  const base = this._createParalellepiped( 1, 0.2, 1, 0, pos, quat, baseMaterial );
  base.castShadow = true;
  base.receiveShadow = true;
  pos.set( ropePos.x, 0.5 * pylonHeight, ropePos.z - armLength );
  const pylon = this._createParalellepiped( 0.4, pylonHeight, 0.4, 0, pos, quat, baseMaterial );
  pylon.castShadow = true;
  pylon.receiveShadow = true;
  pos.set( ropePos.x, pylonHeight + 0.2, ropePos.z - 0.5 * armLength );
  const arm = this._createParalellepiped( 0.4, 0.4, armLength + 0.4, armMass, pos, quat, baseMaterial );
  arm.castShadow = true;
  arm.receiveShadow = true;

  // Glue the rope extremes to the ball and the arm
  const influence = 1;
  ropeSoftBody.appendAnchor( 0, ball.userData.physicsBody, true, influence );
  ropeSoftBody.appendAnchor( ropeNumSegments, arm.userData.physicsBody, true, influence );

  // Hinge constraint to move the arm
  const pivotA = new Ammo.btVector3( 0, pylonHeight * 0.5, 0 );
  const pivotB = new Ammo.btVector3( 0, - 0.2, - armLength * 0.5 );
  const axis = new Ammo.btVector3( 0, 1, 0 );
  this.hinge = new Ammo.btHingeConstraint( pylon.userData.physicsBody, arm.userData.physicsBody, pivotA, pivotB, axis, axis, true );
  this.physicsWorld.addConstraint( this.hinge, true );




  this._LoadAnimatedModel(this);

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

  this._render();
  this.stats.update();

}
_RAF() {
  requestAnimationFrame((t) => {
    if (this._previousRAF === null) {
      this._previousRAF = t;
    }
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

_LoadAnimatedModel(context) {
  const params = {
    camera: context.camera,
    scene: context.scene,
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

}
}
export default ModifiedGame;

/*
class BasicWorldDemo {
  constructor() {
    this._Initialize();
  }
  

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      'resize',
      () => {
        this._OnWindowResize();
      },
      false
    );

    const fov = 45;
    let container;
    container = document.querySelector('.scene');
    container.appendChild(this._threejs.domElement);
    const aspect = container.clientWidth / container.clientHeight;
    const near = 1.0;
    const far = 200.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(20, 20, 100);

    this._scene = new THREE.Scene();

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
    this._scene.add(light);

    // light = new THREE.AmbientLight(0xc8c0b7);
    light = new THREE.AmbientLight(0xffffff);
    this._scene.add(light);

    light = new THREE.PointLight( 0xffffff, 10, 20 );
    light.position.set( -10, 15, -10 );
    this._scene.add( light );

    // var hemiLight = new THREE.HemisphereLight( 0xff0000, 0x0000ff );
    // hemiLight.position.set( 100, 100, 0 );
    // this._scene.add( hemiLight );

    const controls = new OrbitControls(this._camera, this._threejs.domElement);
    controls.enableKeys = false;
    controls.target.set(0, 10, 0);
    controls.update();

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './resources/skybox3_px.jpg',
      './resources/skybox3_nx.jpg',
      './resources/skybox3_py.jpg',
      './resources/skybox3_ny.jpg',
      './resources/skybox3_pz.jpg',
      './resources/skybox3_nz.jpg',
    ]);
    this._scene.background = texture;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 10, 100),
      new THREE.MeshStandardMaterial({
        color: 0x808080 ,
      })
    );

    // const geometry = new THREE.BoxGeometry();
    // const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    // const cube = new THREE.Mesh( geometry, material );
    // scene.add( cube );
    // TODO: ADD MORE OBJECTS

    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    

    // const box = new THREE.Mesh(
    //   new THREE.BoxGeometry(2, 2, 2),
    //   new THREE.MeshStandardMaterial({
    //     color: 0xffffff,
    //   })
    // );
    // box.position.set(0, 1, 0);
    // box.castShadow = true;
    // box.receiveShadow = true;
    // this._scene.add(box);

    for (let x = -8; x < 8; x++) {
      for (let y = -8; y < 8; y++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(2, 2, 2),
          new THREE.MeshStandardMaterial({
            color: 0x808080,
          })
        );
        if ((x > 2.5 || x < -2.5) && (y > 2.5 || y < -2.5)) {
        box.position.set(
          Math.random() + x * 5,
          Math.random() * 4.0 + 2.0,
          Math.random() + y * 5
        );
        box.castShadow = true;
        box.receiveShadow = true;
        this._scene.add(box);
        }
      }
    }
    // TODO: maybe add collider with group object - cubes - physics

    // const box = new THREE.Mesh(
    //   new THREE.SphereGeometry(2, 32, 32),
    //   new THREE.MeshStandardMaterial({
    //       color: 0xFFFFFF,
    //       wireframe: true,
    //       wireframeLinewidth: 4,
    //   }));
    // box.position.set(0, 0, 0);
    // box.castShadow = true;
    // box.receiveShadow = true;
    // this._scene.add(box);

    this._LoadAnimatedModel();
    this._RAF();
  }
  _LoadAnimatedModel() {
    const params = {
      camera: this._camera,
      scene: this._scene,
      // name: 'paladin_prop_j_nordstrom.fbx',
      name: 'paladin_j_nordstrom.fbx',
    };
    this._guard = new BasicGuardController(params);
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }
      this._RAF();
      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }
  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map((m) => m.update(timeElapsedS));
    }
    if (this._guard) {
      this._guard.Update(timeElapsedS);

    }
  }
}

// export default BasicWorldDemo;
*/
