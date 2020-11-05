import React from "react";
import * as three from "three";
import RubiksContext from "~components/RubiksContext";
import * as rubik from "rubik";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";

const { PI, sin, cos } = Math;

/**
 * centers and rotations of corner cubelets
 */
const cornerCoords: [[number, number, number], [number, number, number]][] = [
  [
    [0, 2, 2],
    [0, 0, 0]
  ],
  [
    [0, 2, 0],
    [0, - PI / 2, 0]
  ],
  [
    [2, 2, 0],
    [0, - PI, 0]
  ],
  [
    [2, 2, 2],
    [0, PI / 2, 0]
  ],
  [
    [0, 0, 2],
    [PI, - PI / 2, 0]
  ],
  [
    [0, 0, 0],
    [PI, 0, 0]
  ],
  [
    [2, 0, 0],
    [PI, PI / 2, 0]
  ],
  [
    [2, 0, 2],
    [PI, PI, 0]
  ],
];

/**
 * centers and rotations of edge cubelets
 */
const edgeCoords: [[number, number, number], [number, number, number]][] = [
  [ // 0
    [1, 2, 2],
    [0, 0, 0]
  ],
  [ // 1
    [2, 1, 2],
    [0, 0, - PI / 2]
  ],
  [ // 2
    [1, 0, 2],
    [0, 0, PI]
  ],
  [ // 3
    [0, 1, 2],
    [0, 0, PI / 2]
  ],
  [ // 4
    [0, 2, 1],
    [0, - PI / 2, 0]
  ],
  [ // 5
    [2, 2, 1],
    [-PI / 2, 0, - PI / 2]
  ],
  [ // 6
    [2, 0, 1],
    [0, PI / 2, PI]
  ],
  [ // 7
    [0, 0, 1],
    [PI / 2, 0, PI / 2]
  ],
  [ // 8
    [1, 2, 0],
    [- PI / 2, 0, 0]
  ],
  [ // 9
    [2, 1, 0],
    [- PI / 2, PI / 2, 0]
  ],
  [ // 10
    [1, 0, 0],
    [- PI / 2, PI, 0]
  ],
  [ // 11
    [0, 1, 0],
    [- PI / 2, - PI / 2, 0]
  ]
];

/**
 * centers and rotations of center cubelets
 */
const centerCoords: [[number, number, number], [number, number, number]][] = [
  [
    [1, 1, 2],
    [0, 0, 0]
  ],
  [
    [1, 2, 1],
    [- PI / 2, 0, 0]
  ],
  [
    [1, 1, 0],
    [PI, 0, 0]
  ],
  [
    [1, 0, 1],
    [PI / 2, 0, 0]
  ],
  [
    [0, 1, 1],
    [0, - PI / 2, 0]
  ],
  [
    [2, 1, 1],
    [0, PI / 2, 0]
  ],
];

export interface CubeletConfig {
  faceScale: number;
  cubeletScale: number;
  positionScale: number;
}

export interface RubiksCanvasProps {
  cubeState?: rubik.CubeState;
  width?: number;
  height?: number;
  orbitAnimation?: boolean;
  backgroundColor?: number;
}

export interface RubiksCanvasState {
  cubeState: rubik.CubeState;
}

export default class RubiksCanvas extends React.Component<RubiksCanvasProps, RubiksCanvasState> {
  renderTarget: React.RefObject<HTMLDivElement>

  scene: three.Scene;
  camera: three.PerspectiveCamera;
  renderer: three.WebGLRenderer;
  cubeGroup: three.Group;
  cornerMeshes: [three.Mesh, three.Mesh, three.Mesh][] = [];
  edgeMeshes: [three.Mesh, three.Mesh][] = [];
  centerMeshes: three.Mesh[] = [];

  faceTexture: three.Texture;
  materials: three.MeshLambertMaterial[];

  //cornerGroups: three.Group[];
  //edgeGroups: three.Group[];
  //centerGroup: three.Group;

  //style: React.CSSProperties = { };

  constructor(props: RubiksCanvasProps) {
    super(props);
    let cubeState: rubik.CubeState = props.cubeState ?? rubik.SolvedCube.copy();
    this.state = { cubeState };
    this.faceTexture = new three.TextureLoader().load("/square-gradient.png");
    this.faceTexture.wrapS = this.faceTexture.wrapT = three.RepeatWrapping;
    this.faceTexture.anisotropy = 16;

    this.renderTarget = React.createRef<HTMLDivElement>();
    this.materials = [
      new three.MeshLambertMaterial({
        map: this.faceTexture,
        side: three.DoubleSide,
        color: 0xff0000
      }),
      new three.MeshLambertMaterial({
        map: this.faceTexture,
        side: three.DoubleSide,
        color: 0xffff00
      }),
      new three.MeshLambertMaterial({
        map: this.faceTexture,
        side: three.DoubleSide,
        color: 0xff9900
      }),
      new three.MeshLambertMaterial({
        map: this.faceTexture,
        side: three.DoubleSide,
        color: 0xffffff
      }),
      new three.MeshLambertMaterial({
        map: this.faceTexture,
        side: three.DoubleSide,
        color: 0x0000ff
      }),
      new three.MeshLambertMaterial({
        map: this.faceTexture,
        side: three.DoubleSide,
        color: 0x00ff00
      }),
      new three.MeshLambertMaterial({
        map: this.faceTexture,
        side: three.DoubleSide,
        color: 0x00ffff
      }),
    ];

    console.log("constructor done");
  }

  makeFace(
    color: rubik.Color,
    [x, y, z]: [number, number, number],
    [rx, ry, rz]: [number, number, number],
    config: Partial<CubeletConfig> = { }
  ): three.Mesh {

    const mat = this.materials[color];

    const scale = config?.faceScale ?? 1;

    const geo = new three.PlaneBufferGeometry(1, 1, 1, 1);
    const face = new three.Mesh(geo, mat);
    face.position.x = x;
    face.position.y = y;
    face.position.z = z;
    face.scale.x = scale;
    face.scale.y = scale;
    face.scale.z = scale;
    face.setRotationFromEuler(new three.Euler(rx, ry, rz, "XYZ"));
    return face;
  }

  makeCornerGroup(
    [c1, c2, c3]: rubik.Corner,
    index: number,
    config: Partial<CubeletConfig> = { }
  ): three.Group {
    const positionScale = config?.positionScale ?? 1;
    const cubeletScale = config?.cubeletScale ?? 1;
    const [[x, y, z], [rx, ry, rz]] = cornerCoords[index];
    const group = new three.Group();
    group.position.x = x * positionScale;
    group.position.y = y * positionScale;
    group.position.z = z * positionScale;
    group.setRotationFromEuler(new three.Euler(rx, ry, rz, "XYZ"));
    const faces: [three.Mesh, three.Mesh, three.Mesh] = [
      this.makeFace(c1, [0, 0, 0.5 * cubeletScale], [0, 0, 0], config),
      this.makeFace(c2, [- 0.5 * cubeletScale, 0, 0], [0, PI / 2, 0], config),
      this.makeFace(c3, [0, 0.5 * cubeletScale, 0], [PI / 2, 0, 0], config),
    ];
    this.cornerMeshes.push(faces);
    group.add(... faces);

    return group;
  }

  makeEdgeGroup(
    [c1, c2]: rubik.Edge,
    index: number,
    config: Partial<CubeletConfig> = { }
  ): three.Group {
    const positionScale = config?.positionScale ?? 1;
    const cubeletScale = config?.cubeletScale ?? 1;
    const [[x, y, z], [rx, ry, rz]] = edgeCoords[index];
    const group = new three.Group();
    group.position.x = x * positionScale;
    group.position.y = y * positionScale;
    group.position.z = z * positionScale;
    group.setRotationFromEuler(new three.Euler(rx, ry, rz, "XYZ"));
    const faces: [three.Mesh, three.Mesh] = [
      this.makeFace(c1, [0, 0, 0.5 * cubeletScale], [0, 0, 0], config),
      this.makeFace(c2, [0, 0.5 * cubeletScale, 0], [PI / 2, 0, 0], config)
    ];
    this.edgeMeshes.push(faces);
    group.add(... faces);
    return group;
  }

  makeCenterFace(color: rubik.Color, index: number, config: Partial<CubeletConfig> = { }): three.Group {
    const positionScale = config?.positionScale ?? 1;
    const cubeletScale = config?.cubeletScale ?? 1;
    const [[x, y, z], [rx, ry, rz]] = centerCoords[index];
    const group = new three.Group();
    group.position.x = x * positionScale;
    group.position.y = y * positionScale;
    group.position.z = z * positionScale;
    group.setRotationFromEuler(new three.Euler(rx, ry, rz, "XYZ"));
    const face = this.makeFace(color, [0, 0, 0.5 * cubeletScale], [0, 0, 0], config);
    group.add(face);
    this.centerMeshes.push(face);
    return group;
  }

  makeCubeGroup() {
    const cubeGroup = new three.Group();
    const { cubeState } = this.props;
    
    const cubeletConfig = {
      positionScale: 1.2,
      cubeletScale: 1.2,
      faceScale: 1
    };

    this.state.cubeState.corners.forEach((corner, index) => {
      cubeGroup.add(this.makeCornerGroup(corner, index, cubeletConfig));
    });

    this.state.cubeState.edges.forEach((edge, index) => {
      cubeGroup.add(this.makeEdgeGroup(edge, index, cubeletConfig));
    });

    this.state.cubeState.faces.forEach((face, index) => {
      cubeGroup.add(this.makeCenterFace(face, index, cubeletConfig));
    });

    return cubeGroup;
  }

  updateMaterials() {
    this.state.cubeState.edges.forEach((edge, index) => {
      const edgeMeshes = this.edgeMeshes[index];
      edgeMeshes[0].material = this.materials[edge[0]];
      edgeMeshes[1].material = this.materials[edge[1]];
    });

    this.state.cubeState.corners.forEach((corner, index) => {
      const cornerMeshes = this.cornerMeshes[index];
      cornerMeshes[0].material = this.materials[corner[0]];
      cornerMeshes[1].material = this.materials[corner[1]];
      cornerMeshes[2].material = this.materials[corner[2]];
    });
    this.renderer.render(this.scene, this.camera)
  }

  makeTestCube() {
    const loader = new GLTFLoader().setPath("/");
    loader.load("cubelet.gltf", (gltf: GLTF) => {
      console.log(gltf);
      //const obj = gltf.scene.children[0];
      this.scene.add(gltf.scene);
    });
  }

  componentDidMount() {
    console.log("cdm start");
    const width = this.props.width ?? 500;
    const height = this.props.height ?? 500;
    const cubeState = this.state.cubeState;

    this.scene = new three.Scene();
    this.camera = new three.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.renderer = new three.WebGLRenderer();
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(new three.Color(this.props.backgroundColor ?? 0xdddddd));
    const domTarget = this.renderTarget.current;
    domTarget?.append(this.renderer.domElement);

    const ambientLight = new three.AmbientLight(0xcccccc, 0.4);
    this.scene.add(ambientLight);
    const pointLight = new three.PointLight(0xffffff, 0.8);
    this.camera.add(pointLight);
    this.scene.add(this.camera);


    const axesHelper = new three.AxesHelper(2);
    this.scene.add(axesHelper);
    this.cubeGroup = this.makeCubeGroup();
    //this.makeTestCube();
    this.scene.add(this.cubeGroup);
    this.camera.position.x = 5;
    this.camera.position.y = 5;
    this.camera.position.z = 5;
    this.camera.lookAt(new three.Vector3(1, 1, 1));
    this.renderer.render(this.scene, this.camera);

    let orbitPosition = PI;

    if (this.props.orbitAnimation) {
    //if (true) {
      const orbit = () => {
        requestAnimationFrame(orbit);
        orbitPosition += 0.005;
        this.camera.position.x = 5 * cos(orbitPosition);
        this.camera.position.z = 5 * sin(orbitPosition);
        this.camera.lookAt(new three.Vector3(1, 1, 1));
        this.renderer.render(this.scene, this.camera)
      }

      orbit();
    }
    setTimeout(() => {
      //this.camera.position.x = 5 * cos(orbitPosition);
      //this.camera.position.z = 5 * sin(orbitPosition);
      //this.camera.lookAt(new three.Vector3(1, 1, 1));
      this.renderer.render(this.scene, this.camera)
    }, 100);
  }

  doMove = (move: rubik.Move) => {
    return () => {
      this.state.cubeState.pushMove(move);
      this.updateMaterials();
    };
  }

  undoMove = () => {
    this.state.cubeState.popMove();
    this.updateMaterials();
  }

  testSwap = () => {
    this.state.cubeState.testSwapAllEdges();
    this.updateMaterials();
  }

  testRotate = () => {
    this.state.cubeState.testRotateAllCorners();
    this.updateMaterials();
  }

  testCycle = () => {
    let stop = false;
    let i = 0;
    let interval = setInterval(() => {
      const faces = [
        rubik.Face.Front,
        rubik.Face.Top,
        rubik.Face.Back,
        rubik.Face.Bottom,
        rubik.Face.Left,
        rubik.Face.Right,
      ].map((face) => this.state.cubeState.projectFace(face));
      let solved: boolean = false;
      if (i != 0) {
        solved = faces.every(face => face.every(tile => tile == face[0]));
      }
      if (solved) {
        stop = true;
        console.log(`solved after ${i} iterations`);
        clearInterval(interval);
      }
      if (! stop) {
        i += 1;
        this.doMove(rubik.Move.F)();
        setTimeout(this.doMove(rubik.Move.R), 20);
        //setTimeout(this.doMove(rubik.Move.B), 40);
        //setTimeout(this.doMove(rubik.Move.L), 60);
        //setTimeout(this.doMove(rubik.Move.U), 800);
        //setTimeout(this.doMove(rubik.Move.D), 1000);
      }
    }, 150);
  }

  testShuffle = () => {
    const interval = setInterval(() => {
      this.state.cubeState.randomMove();
      this.updateMaterials();
    }, 5);

    setTimeout(() => {
      clearInterval(interval);
    }, 2000);
  }

  testRandomMove = () => {
    this.state.cubeState.randomMove();
    this.updateMaterials();
  }

  testConjugate = () => {
    const seq = [rubik.Move.F];
    const conj = rubik.conjugate(seq, rubiks.Move.R);
    console.log(conj);
    this.state.cubeState.pushMoves(conj);
    this.updateMaterials();
  }

  testFind = () => {
    console.log(this.state.cubeState.findCorners(rubik.Color.Red));
    console.log(this.state.cubeState.findEdges(rubik.Color.Red));
  }

  foundSolution: rubik.Move[];

  testSolve = () => {
    const params: rubik.SolverParams = {
      cubeState: this.state.cubeState.copy(),
      bruteForceDepth: 6,
      bruteForcePredicate: rubik.examples.Predicates.anyCross,
      bruteForceStopWhenTrue: true,
      trackStats: true,
    };
    const solver = new rubik.Solver(params);

    const depth = 6;
    const calculateTotal = (d: number): number => {
      if (d > 1) {
        return Math.pow(11, d) + calculateTotal(d - 1);
      } else {
        return 11;
      }
    }
    const total = calculateTotal(depth);

    let gen = solver.bruteForceMemoized();

    let res = gen.next();
    const solutions: rubik.Move[][] = [];

    const delay: number = 0;
    const start: number = Date.now();
    let end: number;
    const tickSolver = () => {
      if (! res.done) {
        res = gen.next();
        if (res?.value?.[2]) {
          const s = res.value[1];
          solutions.push(s);
        }

        if (delay != 0) {
          this.updateMaterials();
          setTimeout(tickSolver, delay);
        }
      } else {
        console.log(solutions.slice(0, 5));
        console.log("done");
      }
    }

    let i = 0;
    if (delay == 0) {
      while (! res.done) {
        tickSolver();
        i += 1;
        if (i % 100000 == 0) {
          //if (i % 50000 == 0) {
          console.log(`tried ${i} / ${total} (${Math.round(100 * i / total)}%) moves`);
          console.log(`storing ${solver.stats.hashSize} hashes`);
        }
      }

      end = Date.now();
      this.foundSolution = solutions?.[0]?.slice();
      console.log(this.foundSolution);
      //const s = res.value[1].slice().map((m: rubik.Move) => rubiks.MOVE_STRINGS[m]);
      const s = solutions[0]
      if (s) {
        console.log(s.map(move => rubik.MOVE_STRINGS[move]));
      } else {
        console.log("no solutions???");
      }
      console.log("done");
      console.log(`ran ${i} times in ${Math.round((end - start) / 100) / 10} seconds`);
      console.log(`skipped ${solver.stats.skipCount} times`);
      console.log(`stored ${solver.stats.hashSize} hashes`);
    }
  }

  testPlaySolution = () => {
    let i = 0;
    const s = this.foundSolution;
    const p = this.state.cubeState.pushMove.bind(this.state.cubeState);
    const u = this.updateMaterials.bind(this);
    let to: NodeJS.Timeout;

    if (! s) {
      console.log("aint no solution");
      return;
    }

    const tick = () => {
      if (i < s.length) {
        p(s[i]);
        u();
        i += 1;
      } else {
        clearInterval(to);
      }
    }

    const delay = 200;
    to = setInterval(tick, delay);
  }

  testFlashCross = () => {
    const findCross = () => {
      for (let i = 0; i < 6; i += 1) {
        const edgeIndices = rubik.indexFinder.edges[i];
        const others = rubik.neighborFinder[i];
        let eIndex, fIndex = -1;
        let edge: [number, number];
        INNER_LOOP: {
          for (let j = 0; j < 4; j += 1) {
            [eIndex, fIndex] = edgeIndices[j];
            edge = this.state.cubeState.edges[eIndex]
            if (edge[fIndex] != i || edge[1 - fIndex] != others[j]) {
              break INNER_LOOP;
            }
          }

          return edgeIndices;
        }
      }

      return undefined;
    }

    const crossEdgeIndices = findCross();
    if (crossEdgeIndices != undefined) {
      crossEdgeIndices.forEach(([edgeIndex, _]) => {
        const origMat1 = this.edgeMeshes[edgeIndex][0].material;
        const origMat2 = this.edgeMeshes[edgeIndex][1].material;
        this.edgeMeshes[edgeIndex][0].material = this.materials[6];
        this.edgeMeshes[edgeIndex][1].material = this.materials[6];

        setTimeout(() => {
          this.edgeMeshes[edgeIndex][0].material = origMat1;
          this.edgeMeshes[edgeIndex][1].material = origMat2;
        }, 500);
      });
    } else {
      console.log("aint no cross");
    }
  }

  testHillclimb = () => {
    const startScore = this.state.cubeState.hammingDistance(rubik.SolvedCube);
    console.log(startScore);
    let bestPath: rubik.Move[] | undefined;
    let bestPathScore = startScore;
    const params: rubik.SolverParams = {
      cubeState: this.state.cubeState.copy(),
      bruteForceDepth: 6,
      bruteForcePredicate: rubik.examples.Predicates.lowerHammingDistance(startScore, rubik.SolvedCube),
      bruteForceStopWhenTrue: false,
      trackStats: true,
    };
    const solver = new rubik.Solver(params);
    let ticks = 0;
    let gen = solver.bruteForceMemoized();
    let res = gen.next();
    while (! res.done) {
      if (res.value[2]) {
        const score = solver.cubeState.hammingDistance(rubik.SolvedCube);
        if (score < bestPathScore) {
          const seq = res.value[1];
          bestPath = seq.slice();
          bestPathScore = score;
        }
      }
      res = gen.next();

      ticks += 1;
      if (ticks % 100000 == 0) {
        console.log(ticks);
      }
    }

    if (bestPathScore == startScore) {
      console.log("failed to find an improvement!!!");
    }

    console.log(`bestPathScore: ${bestPathScore}`);
    if (bestPath != undefined) {
      console.log(bestPath);
      this.foundSolution = bestPath;
    }
  }

  log = () => {
    const s = this.state.cubeState.toBlockString();
    console.log(s);
  }

  render() {
    return <RubiksContext.Consumer>
      {
        ({ cubeState }) => 
        <div className="rubik-canvas-container" ref={ this.renderTarget } />
      }
    </RubiksContext.Consumer>
  }
}

