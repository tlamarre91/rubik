import {
  Move,
  Color
} from "./types";

type IndexRotationPair = [number, number];
type PermutationMap = Map<number, IndexRotationPair>;

export class Permutation {
  corners: PermutationMap;
  edges: PermutationMap;
  constructor(
    corners: [number, IndexRotationPair][] = [],
    edges: [number, IndexRotationPair][] = []
  ) {
    this.corners = new Map(corners);
    this.edges = new Map(edges);
  }

  copy(): Permutation {
    const newPerm = new Permutation()
    Permutation._copyHelper(newPerm.corners, this.corners);
    Permutation._copyHelper(newPerm.edges, this.edges);
    return newPerm;
  }

  private static _copyHelper(dest: PermutationMap, map: PermutationMap) {
    for (let [k, v] of map) {
      dest.set(k, v);
    }
  }

  invert(): Permutation {
    const ret = new Permutation();
    Permutation._invertHelper(ret.corners, this.corners, 3);
    Permutation._invertHelper(ret.edges, this.edges, 2);
    return ret;
  }

  /**
   * do the work of inverting a PermutationMap. only call from invert()
   */
  private static _invertHelper(dest: PermutationMap, map: PermutationMap, rotationMod: number) {
    for (let [from, [to, rotation]] of map) {
      const existing = dest.get(to);
      if (existing != undefined) {
        const err = `can't invert a degenerate map (multiple edges go to ${existing[0]})`;
        throw new Error(err);
      }

      dest.set(to, [from, (rotationMod - rotation) % rotationMod]);
    }
  }

  compose(other: Permutation): Permutation {
    const result = this.copy();
    Permutation._composeHelper(result.corners, this.corners, other.corners, 3);
    Permutation._composeHelper(result.edges, this.edges, other.edges, 2);
    return result;
  }

  /**
   * do the work of composing two PermutationMaps. only call from compose()
   */
  private static _composeHelper(dest: PermutationMap, map1: PermutationMap, map2: PermutationMap, rotationMod: number) {
    for (let [from2, [to2, rotation2]] of map2) {
      let isNew: boolean = true;
      for (let [from1, [to1, rotation1]] of map1) {
        if (to1 == from2) {
          dest.set(from1, [to2, (rotation1 + rotation2) % rotationMod]);
          isNew = false;
          break;
        }
      }

      if (isNew) {
        dest.set(from2, [to2, rotation2]);
      }
    }
  }

  prune() {
    for (let [from, [to, rotation]] of this.corners) {
      if (from == to && rotation == 0) this.corners.delete(from);
    }

    for (let [from, [to, swap]] of this.edges) {
      if (from == to && swap == 0) this.edges.delete(from);
    }
  }
}

/**
 * Permutations corresponding to quarter-turns of a Rubik's Cube.
 */
export const QT_PERMUTATIONS: Partial<Record<Move, Permutation>> = { };
QT_PERMUTATIONS[Move.F] = new Permutation(
  [
    [0, [3, 1]],
    [3, [7, 2]],
    [7, [4, 1]],
    [4, [0, 2]]
  ],
  [
    [0, [1, 0]],
    [1, [2, 0]],
    [2, [3, 0]],
    [3, [0, 0]],
  ]
);
QT_PERMUTATIONS[Move.R] = new Permutation(
  [
    [3, [2, 1]],
    [2, [6, 2]],
    [6, [7, 1]],
    [7, [3, 2]]
  ],
  [
    [1, [5, 0]],
    [5, [9, 1]],
    [9, [6, 0]],
    [6, [1, 1]],
  ]
);
QT_PERMUTATIONS[Move.U] = new Permutation(
  [
    [0, [1, 0]],
    [1, [2, 0]],
    [2, [3, 0]],
    [3, [0, 0]]
  ],
  [
    [0, [4, 0]],
    [4, [8, 1]],
    [8, [5, 0]],
    [5, [0, 1]],
  ]
);
QT_PERMUTATIONS[Move.B] = new Permutation(
  [
    [2, [1, 1]],
    [1, [5, 2]],
    [5, [6, 1]],
    [6, [2, 2]]
  ],
  [
    [11, [10, 0]],
    [10, [9, 0]],
    [9, [8, 0]],
    [8, [11, 0]],
  ]
);
QT_PERMUTATIONS[Move.L] = new Permutation(
  [
    [1, [0, 1]],
    [0, [4, 2]],
    [4, [5, 1]],
    [5, [1, 2]]
  ],
  [
    [3, [7, 0]],
    [7, [11, 1]],
    [11, [4, 0]],
    [4, [3, 1]],
  ]
);
QT_PERMUTATIONS[Move.D] = new Permutation(
  [
    [7, [6, 0]],
    [6, [5, 0]],
    [5, [4, 0]],
    [4, [7, 0]]
  ],
  [
    [6, [10, 1]],
    [10, [7, 0]],
    [7, [2, 1]],
    [2, [6, 0]],
  ]
);

QT_PERMUTATIONS[Move.Fi] = QT_PERMUTATIONS[Move.F]!.invert();
QT_PERMUTATIONS[Move.Ri] = QT_PERMUTATIONS[Move.R]!.invert();
QT_PERMUTATIONS[Move.Ui] = QT_PERMUTATIONS[Move.U]!.invert();
QT_PERMUTATIONS[Move.Bi] = QT_PERMUTATIONS[Move.B]!.invert();
QT_PERMUTATIONS[Move.Li] = QT_PERMUTATIONS[Move.L]!.invert();
QT_PERMUTATIONS[Move.Di] = QT_PERMUTATIONS[Move.D]!.invert();
