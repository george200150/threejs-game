import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import Stats from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js';
import BasicGuardController from './guard.js';


class ModifiedGame {
  constructor() {
    this.clock = new THREE.Clock();
    this.gravityConstant = - 9.8;
    this.rigidBodies = [];
    this.margin = 0.05;
    this.armMovement = 0;

    let context = this;
    Ammo().then(function (AmmoLib) {
      Ammo = AmmoLib;
      context._init();
      context._animate();
    });
  }
  _updatePhysics(deltaTime) {

    // Step world
    this.physicsWorld.stepSimulation(deltaTime, 10);

    // Update rigid bodies
    for (let i = 0, il = this.rigidBodies.length; i < il; i++) {
      const objThree = this.rigidBodies[i];
      const objPhys = objThree.userData.physicsBody;
      const ms = objPhys.getMotionState();
      if (ms) {
        ms.getWorldTransform(this.transformAux1);
        const p = this.transformAux1.getOrigin();
        const q = this.transformAux1.getRotation();
        objThree.position.set(p.x(), p.y(), p.z());
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

      }
    }
  }


  _init() {
    this._initGraphics();
    this._initPhysics();
    this._createObjects();
  }


  _initGraphics() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    // this._threejs.shadowMap.type = THREE.VSMShadowMap;
    

    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      'resize',
      () => {
        this._onWindowResize();
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
    this._camera.position.set(0, 20, 70);

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(100, 50, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
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

    let intensity = 10;
    light = new THREE.PointLight(0xffffff, intensity, 20);
    light.position.set(-10, 15, -10);
    light.castShadow = true;
    light.power = intensity * intensity * Math.PI;
    this._scene.add(light);

    light = new THREE.AmbientLight(0xc8c0b7);
    this._scene.add(light);

    const controls = new OrbitControls(this._camera, this._threejs.domElement);
    controls.enableKeys = false;
    controls.target.set(0, 10, 0);
    controls.update();

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './textures/skybox2.fw.png',
      './textures/skybox4.fw.png',
      './textures/skybox1.fw.png', // ok
      './textures/skybox6.fw.png', // ok
      './textures/skybox5.fw.png',
      './textures/skybox3.fw.png',
    ]);
    this._scene.background = texture;

    this.textureLoader = new THREE.TextureLoader();

    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = '0px';
    container.appendChild(this.stats.domElement);
  }


  _createObjects() {
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();

    // Ground
    pos.set(0, - 0.5, 0);
    quat.set(0, 0, 0, 1);
    const ground = this._createParalellepiped(100, 1, 100, 0, pos, quat, new THREE.MeshPhongMaterial({ color: 0x808080 }));

    ground.receiveShadow = true;
    this.textureLoader.load("textures/grid.png", function (texture) {

      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(100, 100);
      ground.material.map = texture;
      ground.material.needsUpdate = true;
    });

    // Guard
    this._LoadAnimatedModel();
  }


  _createParalellepiped(sx, sy, sz, mass, pos, quat, material) {
    const threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
    shape.setMargin(this.margin);

    this._createRigidBody(threeObject, shape, mass, pos, quat);
    return threeObject;
  }


  _createRigidBody(threeObject, physicsShape, mass, pos, quat) {
    threeObject.position.copy(pos);
    threeObject.quaternion.copy(quat);

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    const motionState = new Ammo.btDefaultMotionState(transform);

    const localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    threeObject.userData.physicsBody = body;
    this._scene.add(threeObject);

    if (mass > 0) {
      this.rigidBodies.push(threeObject);
      // Disable deactivation
      body.setActivationState(4);
    }
    this.physicsWorld.addRigidBody(body);
  }


  _createRandomColor() {
    return Math.floor(Math.random() * (1 << 24));
  }


  _createMaterial() {
    return new THREE.MeshPhongMaterial({ color: this._createRandomColor() });
  }


  _animate() {
    this._RAF();
  }


  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }
      const deltaTime = this.clock.getDelta();
      this._updatePhysics(deltaTime);

      this.stats.update();
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
    if (this.guard) {
      this.guard.Update(timeElapsedS);

    }
  }


  _LoadAnimatedModel() {
    const params = {
      camera: this._camera,
      scene: this._scene,
      // name: 'paladin_prop_j_nordstrom.fbx',
      name: 'paladin_j_nordstrom.fbx',
    };
    this.guard = new BasicGuardController(params);
  }

  _initPhysics() {

    // Physics configuration
    this.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
    this.broadphase = new Ammo.btDbvtBroadphase();
    this.solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.softBodySolver = new Ammo.btDefaultSoftBodySolver();
    this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration, this.softBodySolver);
    this.physicsWorld.setGravity(new Ammo.btVector3(0, this.gravityConstant, 0));
    this.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, this.gravityConstant, 0));

    this.transformAux1 = new Ammo.btTransform();

    const brickMass = 0.5;
    const brickLength = 1.2;
    const brickDepth = 0.6;
    const brickHeight = brickLength * 0.5;
    const numBricksLength = 6;
    const z0 = - numBricksLength * brickLength * 0.5;
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();

    quat.set(0, 0, 0, 1);
    for (let x = -8; x < 8; x++) {
      for (let y = -8; y < 0; y++) {
        for (let z = -8; z < 8; z++) {
          if ((x > 5 || x < -5) && (y > 5 || y < -5)) {
            pos.set(5 * x, brickHeight - 5 * y, z);
            const box = this._createParalellepiped(brickDepth, brickHeight, brickLength, brickMass, pos, quat, this._createMaterial());
            box.castShadow = true;
			      box.receiveShadow = true;
            this._scene.add(box);
          }
        }
      }
    }
  }


  _onWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }
}

export default ModifiedGame;
