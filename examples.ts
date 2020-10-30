import {
  Color,
  CubeState,
  Face,
  indexFinder,
  neighborFinder
} from ".";

export const Predicates = {
  anyCross: function (cube: CubeState) {
    for (let i = 0; i < 6; i += 1) {
      const edgeIndices = indexFinder.edges[i];
      const others = neighborFinder[i];
      let eIndex, fIndex = -1;
      let edge: [number, number];
      INNER_LOOP: {
        for (let j = 0; j < 4; j += 1) {
          [eIndex, fIndex] = edgeIndices[j];
          edge = cube.edges[eIndex]
          if (edge[fIndex] != i || edge[1 - fIndex] != others[j]) {
            break INNER_LOOP;
          }
        }

        return true;
      }
    }

    return false;
  },

  redCross: function (cube: CubeState) {
    const edgeIndices = indexFinder.edges[0];
    //const others = [Color.Yellow, Color.Green, Color.White, Color.Blue];
    const others = neighborFinder[0];
    for (let i = 0; i < 4; i += 1) {
      const [eIndex, fIndex] = edgeIndices[i];
      const edge = cube.edges[eIndex]
      if (edge[fIndex] != Color.Red || edge[1 - fIndex] != others[i]) return false;
    }

    return true;
  },

  basicPredicate: function (cube: CubeState) {
    const face = cube.projectFace(Face.Front)
    const cond = face[1] == Color.Red &&
      face[3] == Color.Red &&
      face[4] == Color.Red &&
      face[5] == Color.Red &&
      face[7] == Color.Red && 
      cube.edges[0][1] == Color.Yellow &&
      cube.edges[1][1] == Color.Green &&
      cube.edges[2][1] == Color.White &&
      cube.edges[3][1] == Color.Blue;
    return cond;
  },

  lowerHammingDistance: (d: number, other: CubeState) => (cube: CubeState) => {
    return cube.hammingDistance(other) < d;
  },

  equalityPredicate: (other: CubeState) => (cube: CubeState) => {
    return cube.hammingDistance(other) == 0;
  },

  alwaysTrue: function (cube: CubeState) {
    return true;
  },

  alwaysFalse: function (cube: CubeState) {
    return false;
  },
};

