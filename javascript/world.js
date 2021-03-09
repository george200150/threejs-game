import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import BasicGuardController from './guard.js';

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
        color: 0x6f8e39,
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

    /*for (let x = -8; x < 8; x++) {
      for (let y = -8; y < 8; y++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(2, 2, 2),
          new THREE.MeshStandardMaterial({
            color: 0x808080,
          })
        );
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
    // TODO: maybe add collider with group object - cubes - physics
    */

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

export default BasicWorldDemo;