import * as examples from "./examples";

import {
  Permutation,
  QT_PERMUTATIONS
} from "./permutation";

import {
  Move,
  Face,
  Color
} from "./types";

export {
  examples,
  Move,
  Face,
  Color
};

/**
 * names of quarter-turn Rubik's Cube moves
 */
export const QT_MOVES: Move[] = [
  Move.F, Move.Fi,
  Move.R, Move.Ri,
  Move.U, Move.Ui,
  Move.B, Move.Bi,
  Move.L, Move.Li,
  Move.D, Move.Di
];

export const MOVE_STRINGS: string[] = [
  "F", "Fi",
  "R", "Ri",
  "U", "Ui",
  "B", "Bi",
  "L", "Li",
  "D", "Di",
];

export const QT_INVERSES: Map<Move, Move> = new Map([
  [Move.F, Move.Fi],
  [Move.Fi, Move.F],
  [Move.R, Move.Ri],
  [Move.Ri, Move.R],
  [Move.U, Move.Ui],
  [Move.Ui, Move.U],
  [Move.B, Move.Bi],
  [Move.Bi, Move.B],
  [Move.L, Move.Li],
  [Move.Li, Move.L],
  [Move.D, Move.Di],
  [Move.Di, Move.D],
]);


export function conjugate(seq: Move[], move: Move): Move[] {
  const newSeq = [move];
  newSeq.push(... seq);
  newSeq.push(QT_INVERSES.get(move)!);
  return newSeq;
}


export type FaceTuple = [
  number, number, number,
  number, number, number,
  number, number, number
]

export const COLORS = [
  Color.Red,
  Color.Yellow,
  Color.Orange,
  Color.White,
  Color.Blue,
  Color.Green,
];

export function colorChar(color: Color): string {
  switch (color) {
    case Color.Red:
      return "R";
    case Color.White:
      return "W";
    case Color.Green:
      return "G";
    case Color.Blue:
      return "B";
    case Color.Orange:
      return "O";
    case Color.Yellow:
      return "Y";
  }
}

export type Edge = [number, number];

export type Corner = [number, number, number];

export interface CubeStateParams {
  trackMoveHistory: boolean;
  moveHistorySize: number;
}

export class CubeState {
  moveHistory: Move[] = [];
  trackMoveHistory: boolean;
  moveHistorySize: number;
  faceColors: Color[];
  corners: Corner[];
  edges: Edge[];

  constructor(faceColors: Color[], corners: Corner[], edges: Edge[], params: Partial<CubeStateParams> = { }) {
    this.moveHistorySize = params.moveHistorySize ?? 1000;
    this.trackMoveHistory = params.trackMoveHistory ?? true;
    this.faceColors = faceColors.slice();
    this.corners = corners.slice();
    this.edges = edges.slice();

    if (! this.validate()) {
      throw new Error("invalid initial cube state");
    }
  }

  rotateCorner(cornerIdx: number, rotation: number) {
    const corner = this.corners[cornerIdx];
    if (rotation % 3 == 2) {
      const oldFirst = corner[0];
      corner[0] = corner[1];
      corner[1] = corner[2];
      corner[2] = oldFirst;
    } else if (rotation % 3 == 1) {
      const oldFirst = corner[0];
      corner[0] = corner[2];
      corner[2] = corner[1];
      corner[1] = oldFirst;
    }
  }

  swapEdge(edgeIdx: number) {
    const edge = this.edges[edgeIdx];
    const tmp = edge[1];
    edge[1] = edge[0];
    edge[0] = tmp;
  }

  validate(): boolean {
    if (this.countColors().every(c => c == 9)) {
      return true;
    } else {
      return false;
    }
  }

  countColors(): number[] {
    // TODO: take this out; it'll be obsoleted by the index-storing refactor
    const counts = [0, 0, 0, 0, 0, 0];
    this.faceColors.forEach(color => counts[color] += 1);
    this.corners.forEach(corner => corner.forEach(color => counts[color] += 1));
    this.edges.forEach(edge => edge.forEach(color => counts[color] += 1));
    return counts;
  }

  copy(): CubeState {
    return new CubeState(this.faceColors, this.corners, this.edges);
  }

  pushMove(move: Move) {
    if (this.trackMoveHistory) {
      this.moveHistory.push(move);
      if (this.moveHistory.length > this.moveHistorySize) {
        const difference = this.moveHistory.length - this.moveHistorySize;
        this.moveHistory = this.moveHistory.slice(difference);
      }
    }
    this.performMove(move);
  }

  pushMoves(moves: Move[]) {
    moves.forEach(move => this.pushMove(move));
  }

  popMove() {
    const move = this.moveHistory.pop();
    if (move != undefined) {
      const inv = QT_INVERSES.get(move);
      if (inv != undefined) {
        this.performMove(inv);
      }
    }
  }

  popMoves(n: number) {
    for (let i = 0; i < n; i += 1) {
      this.popMove();
    }
  }

  performMove(move: Move) {
    const permutation = QT_PERMUTATIONS[move]!;
    this.permutate(permutation);
  }

  permutate(permutation: Permutation) {
    const preCorners = this.corners.slice();
    const preEdges = this.edges.slice();
    for (let [from, [to, rotation]] of permutation.corners) {
      this.corners[to] = preCorners[from];
      this.rotateCorner(to, rotation);
    }
    for (let [from, [to, swap]] of permutation.edges) {
      this.edges[to] = preEdges[from];
      if (swap != 0) {
        this.swapEdge(to);
      }
    }
  }

  randomMove() {
    const index = Math.floor(Math.random() * 12);
    this.pushMove(QT_MOVES[index]);
  }

  projectFace(face: Face): FaceTuple {
    // TODO: take this out; it'll be obsoleted by the index-storing refactor
    switch (face) {
      case Face.Front:
        return [
          this.corners[0][0],
          this.edges[0][0],
          this.corners[3][1],
          this.edges[3][0],
          this.faceColors[0],
          this.edges[1][0],
          this.corners[4][1],
          this.edges[2][0],
          this.corners[7][0]
        ];
      case Face.Top:
        return [
          this.corners[1][2],
          this.edges[8][0],
          this.corners[2][2],
          this.edges[4][1],
          this.faceColors[1],
          this.edges[5][0],
          this.corners[0][2],
          this.edges[0][1],
          this.corners[3][2]
        ];
      case Face.Back:
        return [
          this.corners[5][0],
          this.edges[10][1],
          this.corners[6][1],
          this.edges[11][1],
          this.faceColors[2],
          this.edges[9][1],
          this.corners[1][1],
          this.edges[8][1],
          this.corners[2][0]
        ];
      case Face.Bottom:
        return [
          this.corners[4][2],
          this.edges[2][1],
          this.corners[7][2],
          this.edges[7][0],
          this.faceColors[3],
          this.edges[6][1],
          this.corners[5][2],
          this.edges[10][0],
          this.corners[6][2]
        ];
      case Face.Left:
        return [
          this.corners[1][0],
          this.edges[4][0],
          this.corners[0][1],
          this.edges[11][0],
          this.faceColors[4],
          this.edges[3][1],
          this.corners[5][1],
          this.edges[7][1],
          this.corners[4][0]
        ];
      case Face.Right:
        return [
          this.corners[3][0],
          this.edges[5][1],
          this.corners[2][1],
          this.edges[1][1],
          this.faceColors[5],
          this.edges[9][0],
          this.corners[7][1],
          this.edges[6][0],
          this.corners[6][0]
        ];
    }
  }

  findEdges(color: Color): [number, number][] {
    // TODO: use this.faceColors. not priority because this function is actually never called
    const indices: [number, number][] = [];
    this.edges.forEach((edge, index) => {
      if (edge[0] == color) {
        indices.push([index, 0]);
      }

      if (edge[1] == color) {
        indices.push([index, 1]);
      }
    });

    return indices;
  }

  findCorners(color: Color): [number, number][] {
    // TODO: use this.faceColors. not priority because this function is actually never called
    const indices: [number, number][] = [];
    this.corners.forEach((corner, index) => {
      if (corner[0] == color) {
        indices.push([index, 0]);
      }
      if (corner[1] == color) {
        indices.push([index, 1]);
      }
      if (corner[2] == color) {
        indices.push([index, 2]);
      }
    });

    return indices;
  }
  
  shuffle(n: number) {
    for (let i = 0; i < n; i += 1) {
      this.randomMove();
    }
  }

  hammingDistance(other: CubeState): number {
    const d1 = CubeState._hammingDistanceHelper(this.corners, other.corners);
    const d2 = CubeState._hammingDistanceHelper(this.edges, other.edges);
    return d1 + d2;
  }

  private static _hammingDistanceHelper(cubeletList: number[][], otherList: number[][]): number {
    let d = 0;
    cubeletList.forEach((cubelet, cubeletIndex) => {
      const match = cubelet.every((facet, facetIndex) => facet == otherList[cubeletIndex][facetIndex]);
      if (! match) {
        d += 1;
      }
    });

    return d;
  }

  hash(): string {
    // TODO: refactor; it'll be obsoleted by the index-storing refactor
    const s = [
      //this.faces.join(""),
      this.corners.map(x => x.join("")).join(""),
      this.edges.map(x => x.join("")).join("")
    ].join("");

    //return md5(s);
    return s;
  }

  toBlockString(): string {
    const front = this.projectFace(Face.Front).map(colorChar).join("");
    const top = this.projectFace(Face.Top).map(colorChar).join("");
    const back = this.projectFace(Face.Back).map(colorChar).join("");
    const bottom = this.projectFace(Face.Bottom).map(colorChar).join("");
    const left = this.projectFace(Face.Left).map(colorChar).join("");
    const right = this.projectFace(Face.Right).map(colorChar).join("");

    return [
      [
        front.slice(0, 3),
        top.slice(0, 3),
        back.slice(0, 3),
        bottom.slice(0, 3),
        left.slice(0, 3),
        right.slice(0, 3),
      ].join(" "),
      [
        front.slice(3, 6),
        top.slice(3, 6),
        back.slice(3, 6),
        bottom.slice(3, 6),
        left.slice(3, 6),
        right.slice(3, 6),
      ].join(" "),
      [
        front.slice(6, 9),
        top.slice(6, 9),
        back.slice(6, 9),
        bottom.slice(6, 9),
        left.slice(6, 9),
        right.slice(6, 9),
      ].join(" "),
    ].join("\n")
  }

  testSwapAllEdges() {
    for (let i = 0; i < 12; i += 1) {
      this.swapEdge(i);
    }
  }

  testRotateAllCorners() {
    for (let i = 0; i < 8; i += 1) {
      this.rotateCorner(i, 1);
    }
  }
};

const canonicalFaceColors = [
  Color.Red,
  Color.Yellow,
  Color.Orange,
  Color.White,
  Color.Blue,
  Color.Green
];

const solvedCorners: Corner[] = [
  [ // 0
    Color.Red,
    Color.Blue,
    Color.Yellow,
  ],
  [ // 1
    Color.Blue,
    Color.Orange,
    Color.Yellow,
  ],
  [ // 2
    Color.Orange,
    Color.Green,
    Color.Yellow,
  ],
  [ // 3
    Color.Green,
    Color.Red,
    Color.Yellow,
  ],
  [ // 4
    Color.Blue,
    Color.Red,
    Color.White,
  ],
  [ // 5
    Color.Orange,
    Color.Blue,
    Color.White,
  ],
  [ // 6
    Color.Green,
    Color.Orange,
    Color.White,
  ],
  [ // 7
    Color.Red,
    Color.Green,
    Color.White,
  ]
];

const solvedEdges: Edge[] = [
  [ // 0
    Color.Red,
    Color.Yellow,
  ],
  [ // 1
    Color.Red,
    Color.Green,
  ],
  [ // 2
    Color.Red,
    Color.White,
  ],
  [ // 3
    Color.Red,
    Color.Blue,
  ],
  [ // 4
    Color.Blue,
    Color.Yellow,
  ],
  [ // 5
    Color.Yellow,
    Color.Green,
  ],
  [ // 6
    Color.Green,
    Color.White,
  ],
  [ // 7
    Color.White,
    Color.Blue,
  ],
  [ // 8
    Color.Yellow,
    Color.Orange,
  ],
  [ // 9
    Color.Green,
    Color.Orange,
  ],
  [ // 10
    Color.White,
    Color.Orange,
  ],
  [ // 11
    Color.Blue,
    Color.Orange,
  ],
];

export const SolvedCube: CubeState = new CubeState(canonicalFaceColors, solvedCorners, solvedEdges);

export interface SolverParams {
  cubeState: CubeState;
  bruteForceDepth: number;
  bruteForcePredicate: (c: CubeState) => boolean;
  bruteForceStopWhenTrue: boolean;
  trackStats?: boolean;
}

export interface SolverStats {
  /**
   * how many yields have we hit in the brute force search?
   */
  ticks?: number;
  /**
   * how many times have we updated an entry in checkedDepthMap?
   */
  updateCount: number;
  /**
   * how many entries have we stored in checkedDepthMap?
   */
  hashSize: number;
  /**
   * how much time has passed since starting the search?
   */
  elapsedTime: number;
  /**
   * how many times have we hit the "skip" condition?
   */
  skipCount: number;
  /**
   * how many times have we hit the "skip" condition at each depth of the search?
   */
  skipDepthCount: Map<number, number>;
  /**
   * how many move sequences have we found that lead to cube states that
   * satisfy the predicate?
   */
  solutionCount: number;
}

export class Solver {
  cubeState: CubeState;
  bruteForceDepth: number;
  bruteForcePredicate: (c: CubeState) => boolean;
  bruteForceStopWhenTrue: boolean;
  trackStats: boolean;
  checkedDepthMap: Map<string, number> = new Map();
  stats: SolverStats;
  constructor(params: SolverParams) {
    this.cubeState = params.cubeState;
    this.bruteForceDepth = params.bruteForceDepth;
    this.bruteForcePredicate = params.bruteForcePredicate;
    this.bruteForceStopWhenTrue = params.bruteForceStopWhenTrue;
    this.trackStats = params.trackStats ?? false;
    this.initialize();
  }

  initialize() {
    this.checkedDepthMap = new Map();
    if (this.trackStats) this.stats = {
      updateCount: 0,
      hashSize: 0,
      skipCount: 0,
      skipDepthCount: new Map(),
      elapsedTime: 0,
      solutionCount: 0
    }
  }

  hasSeenAtDepth(depth: number): boolean {
    const hash = this.cubeState.hash();
    const val = this.checkedDepthMap.get(hash) ?? 0;
    const result = val >= depth;

    if (this.trackStats && result) {
      const count = this.stats.skipDepthCount.get(depth) ?? 0;
      this.stats.skipDepthCount.set(depth, count + 1);
    }
    return val >= depth
  }

  setSeenDepth(depth: number) {
    const hash = this.cubeState.hash();
    const val = this.checkedDepthMap.get(hash);
    if (val == undefined) {
      if (this.trackStats) this.stats.hashSize += 1;
      this.checkedDepthMap.set(hash, depth);
    } else if (val < depth) {
      if (this.trackStats) this.stats.updateCount += 1;
      this.checkedDepthMap.set(hash, depth);
    }
  }

  *bruteForceMemoized(
    predicate: (c: CubeState) => boolean = this.bruteForcePredicate,
    stopWhenTrue: boolean = this.bruteForceStopWhenTrue,
    depth: number = this.bruteForceDepth,
    currentBranch: Move[] = [],
  ): Iterator<[CubeState, Move[], boolean]> {
    const last = currentBranch.length > 0 ? currentBranch[currentBranch.length - 1] : -1;
    for (let i = 0; i < QT_MOVES.length; i += 1) {
      //if (i != QT_INVERSES.get(last)) {
      if (true) {
        const newBranch = currentBranch.concat(i);
        this.cubeState.pushMove(i);
        const result = predicate(this.cubeState);
        yield [this.cubeState, newBranch, result];
        if (result) {
          if (this.trackStats) this.stats.solutionCount += 1;
          if (stopWhenTrue) return;
        } else if (depth > 1) {
          if (! this.hasSeenAtDepth(depth)) {
          //if (true) {
            const gen = this.bruteForceMemoized(predicate, stopWhenTrue, depth - 1, newBranch);
            let res = gen.next();
            while (! res.done) {
              yield res.value;
              if (res.value[2]) {
                this.stats.solutionCount += 1;
                if (stopWhenTrue) {
                  return;
                }
              }
              res = gen.next();
            }

            this.setSeenDepth(depth);
            //if (! this.checkedHashes.get(this.cubeState.hash())) {
            //  this.checkedHashes.set(this.cubeState.hash(), 1);
            //  this.updateCount += 1;
            //}
          } else {
            if (this.trackStats) {
              this.stats.skipCount += 1;
            }
          }
        } else {
        }

        this.cubeState.popMove();
      }
    }
  }

  *bruteForceRandomized(
    predicate: (c: CubeState) => boolean,
    stopWhenTrue: boolean = this.bruteForceStopWhenTrue,
    depth: number = this.bruteForceDepth,
    currentBranch: Move[] = []
  ): Iterator<[CubeState, Move[], boolean]> {
    const shuffledMoves = QT_MOVES.slice();
    let j, x, i = 0;
    for (i = shuffledMoves.length - 1; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1));
      x = shuffledMoves[i];
      shuffledMoves[i] = shuffledMoves[j];
      shuffledMoves[j]= x;
    }
    const last = currentBranch[currentBranch.length - 1];
    for (let i = 0; i < shuffledMoves.length; i += 1) {
      if (shuffledMoves[i] != QT_INVERSES.get(last)) {
        const newBranch = currentBranch.concat(shuffledMoves[i]);
        this.cubeState.pushMove(shuffledMoves[i]);
        const result = predicate(this.cubeState);
        yield [this.cubeState, newBranch, result];
        if (stopWhenTrue && result) {
          return;
        } else if (depth > 1) {
          const gen = this.bruteForceRandomized(predicate, stopWhenTrue, depth - 1, newBranch);
          let res = gen.next();
          while (! res.done) {
            yield res.value;
            if (stopWhenTrue && res.value[2]) {
              return;
            }
            res = gen.next();
          }
        }

        this.cubeState.popMove();
      }
    }
  }

  //static *generateMoves(current: Move[], depth: number): Iterator<Move[]> {
  //  const copy = current.slice();
  //  const last = current[current.length - 1];
  //  if (depth <= 1) {
  //    for (let i = 0; i < RUBIKS_MOVES.length; i += 1) {
  //      yield copy.concat(RUBIKS_MOVES[i]);
  //    }
  //  }
  //}

  testBFM(shuffleN = 100, printInterval = 100000, printWhenDone = false): SolverStats {
    this.initialize();
    let ticks = 1;
    this.cubeState.shuffle(shuffleN);
    const solutions: Move[][] = [];
    let gen = this.bruteForceMemoized();
    let res: IteratorResult<[CubeState, Move[], boolean], any> = gen.next();
    const start = Date.now();
    let time = Date.now();

    while (! res.done) {
      ticks += 1;
      if (res.value[2]) {
        solutions.push(res.value[1]);
      }
      if (printInterval != 0 && (ticks % printInterval) == 0) {
        time = Date.now();
        this.stats.ticks = ticks;
        this.stats.elapsedTime = Math.round((time - start) / 10) / 100;
        console.log(this.stats);
      }

      res = gen.next();
    }

    this.stats.ticks = ticks;
    time = Date.now();
    this.stats.elapsedTime = Math.round((time - start) / 10) / 100;
    if (printWhenDone) {
      console.log("done");
      console.log(this.stats);
    }

    return this.stats;
  }
}

interface IndexFinder {
  edges: [number, number][][];
  corners: [number, number][][];
}

export const indexFinder: IndexFinder = {
  edges: [],
  corners: []
}

/**
 * for each face, what are the indices of the centers of that face's neighbors in the cube?
 * (matches order of indexFinder.edges)
 */
export const neighborFinder: [number, number, number, number][] = [
  //[1, 5, 3, 4],
  //[0, 4, 5, 2],
  //[3, 5, 1, 4],
  //[0, 5, 2, 4],
  //[1, 0, 3, 2],
  //[1, 2, 3, 0]
];

/**
 * initialize indexFinder and neighborFinder
 */
for (let i = 0; i < 6; i += 1) {
  const face = SolvedCube.faceColors[i];
  const edgeFacetsMatching: [number, number][] = [];
  const neighbors: Color[] = [];
  SolvedCube.edges.forEach((edge, edgeIndex) => {
    const faceIndex = edge.indexOf(face);
    if (faceIndex != -1) {
      edgeFacetsMatching.push([edgeIndex, faceIndex]);
      neighbors.push(edge[1 - faceIndex]);
    }
  });
  indexFinder.edges.push(edgeFacetsMatching);
  // if i notice weirdness with this, it's probably because it currently
  // relies on the matching of order between SolvedCube faces and colors
  // ... i think.
  neighborFinder.push([neighbors[0], neighbors[1], neighbors[2], neighbors[3]]);
}

if (require.main == module) {
  examples.Experiments.bf2();
}
