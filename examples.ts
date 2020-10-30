import {
  Color,
  CubeState,
  Face,
  indexFinder,
  Move,
  neighborFinder,
  SolvedCube,
  Solver,
  SolverParams,
  SolverStats,
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

export const Experiments = {
  bf1: () => {
    const cubeState = SolvedCube.copy();

    const bruteForceDepth = 7;

    const params: SolverParams = {
      cubeState,
      trackStats: true,
      bruteForceDepth,
      bruteForcePredicate: Predicates.anyCross,
      bruteForceStopWhenTrue: true
    };
    const solver = new Solver(params);
    const testCount = 100;
    let foundSolutionsCount = 0;
    const shuffleN = 30;
    const printInterval = 0;
    const printWhenDone = true;

    console.log(`params: testCount = ${testCount}, shuffleN = ${shuffleN}, bfDepth = ${bruteForceDepth}`);

    const times: number[] = [];
    for (let i = 0; i < testCount; i += 1) {
      solver.testBFM(shuffleN, printInterval, printWhenDone);
      times.push(solver.stats.elapsedTime);
      if (solver.stats.solutionCount > 0) foundSolutionsCount += 1;
    }

    const avg = times.reduce((acc, curr) => acc + curr, 0) / testCount;
    console.log(`ran ${testCount} tests, avg ${Math.round(avg * 100) / 100}s each; found solution ${foundSolutionsCount} times`);
  },

  bf2: () => {
    const cubeState = SolvedCube.copy();

    const bruteForceDepth = 6;

    const results: SolverStats[] = [];

    const params: SolverParams = {
      cubeState,
      trackStats: true,
      bruteForceDepth,
      bruteForcePredicate: Predicates.anyCross,
      bruteForceStopWhenTrue: false
    };
    const solver = new Solver(params);
    const testCount = 10;
    let foundSolutionsCount = 0;
    const shuffleN = 30;
    const printInterval = 0;
    const printWhenDone = true;

    console.log(`params: testCount = ${testCount}, shuffleN = ${shuffleN}, bfDepth = ${bruteForceDepth}`);

    const times: number[] = [];
    for (let i = 0; i < testCount; i += 1) {
      solver.testBFM(shuffleN, printInterval, printWhenDone);
      results.push(solver.stats);
      if (solver.stats.solutionCount > 0) foundSolutionsCount += 1;
    }

    const avg = (list: number[]) => {
      const sum = list.reduce((acc, curr) => acc + curr, 0);
      return sum / list.length;
    }
    const avgStats: Partial<SolverStats> = {
      hashSize: avg(results.map(r => r.hashSize)),
      updateCount: avg(results.map(r => r.updateCount)),
      skipCount: avg(results.map(r => r.skipCount))
    }
    console.log(avgStats);
  },

  hillclimb: () => {
    const cubeState = SolvedCube.copy();
    cubeState.shuffle(50);
    const bruteForceDepth = 6;
    const params: SolverParams = {
      cubeState: cubeState.copy(),
      trackStats: true,
      bruteForceDepth,
      bruteForcePredicate: Predicates.anyCross,
      bruteForceStopWhenTrue: false
    };
    const solver = new Solver(params);
    let bestPath: Move[] = [];
    let bestPathScore = cubeState.hammingDistance(SolvedCube);
    console.log(`shuffled hamming distance: ${bestPathScore}`);
    let gen = solver.bruteForceMemoized();
    let res = gen.next();
    let ticks = 0;
    while (! res.done) {
      const d = solver.cubeState.hammingDistance(SolvedCube);
      if (d < bestPathScore) {
        bestPath = res.value[1].slice();
      }

      ticks += 1;
      if (ticks % 10000 == 0) {
        console.log(res.value[1]);
        console.log(`tick ${ticks}, best: ${bestPathScore}`);
      }

      res = gen.next();
    }

    console.log(`tick ${ticks}, best: ${bestPathScore}, path: ${bestPath.map(m => MOVE_STRINGS[m])}`);
    console.log("before");
    console.log(cubeState.toBlockString());
    cubeState.pushMoves(bestPath);

    console.log("after");
    console.log(cubeState.toBlockString());
  },

  hamming1: () => {
    const cube = SolvedCube.copy();
    cube.shuffle(100);
    const ds: number[] = [];
    const lastCount = 5;
    let lastFew: number[] = [];
    let min = cube.hammingDistance(SolvedCube);

    const interesting = {
      allIncreasing: 0,
      allDecreasing: 0,
      increase: 0,
      decrease: 0,
      noChange: 0
    }

    for (let i = 0; i < lastCount; i += 1) {
      lastFew.push(min);
    }

    const testCount = 2000000
    for (let i = 0; i < testCount; i += 1) {
      cube.shuffle(10);
      const d1 = cube.hammingDistance(SolvedCube);
      cube.randomMove();
      const d2 = cube.hammingDistance(SolvedCube);
      if (d1 > d2) {
        interesting.decrease += 1;
      } else if (d2 > d1) {
        interesting.increase += 1;
      } else {
        interesting.noChange += 1;
      }
    }
    console.log(interesting);
    interesting.noChange /= testCount;
    interesting.increase /= testCount;
    interesting.decrease /= testCount;
    console.log(interesting);
  },

  hamming2: () => {
    const cube = SolvedCube.copy();
    cube.shuffle(100);
    const ds: number[] = [];
    const lastCount = 5;
    let lastFew: number[] = [];
    let min = cube.hammingDistance(SolvedCube);

    const interesting = {
      allIncreasing: 0,
      allDecreasing: 0,
      increase: 0,
      decrease: 0,
      noChange: 0
    }

    for (let i = 0; i < lastCount; i += 1) {
      lastFew.push(min);
    }

    const testCount = 2000000;
    for (let i = 0; i < testCount; i += 1) {
      cube.randomMove();
      const d = cube.hammingDistance(SolvedCube);

      if (d < lastFew[lastCount - 1]) {
        interesting.decrease += 1;
      } else if (d > lastFew[lastCount - 1]) {
        interesting.increase += 1;
      } else {
        interesting.noChange += 1;
      }

      lastFew = lastFew.slice(1);
      lastFew.push(d);
      if (d < min) {
        min = d;
        console.log(`new low: ${min} at iteration ${i}`);
        console.log(cube.toBlockString());
        console.log(`btw: ${lastFew}`);
      } 
    }

    console.log(ds.slice(ds.length - 20));
    console.log(`lowest seen: ${min}`);
    console.log(interesting);
    interesting.noChange /= testCount;
    interesting.increase /= testCount;
    interesting.decrease /= testCount;
    console.log(interesting);
  },

  hamming3: () => {
    let cube = SolvedCube.copy();
    const testCount = 2000000;
    const hist: Map<number, number> = new Map();
    for (let i = 0; i < 21; i += 1) {
      hist.set(i, 0);
    }

    const shuffleN = 20;
    let d = 0;
    for (let i = 0; i < testCount; i += 1) {
      cube = SolvedCube.copy();
      cube.shuffle(shuffleN);
      d = cube.hammingDistance(SolvedCube);
      const cur = hist.get(d) ?? 0;
      hist.set(d, cur + 1);
    }

    console.log(hist);
    let v: number;
    for (let i = 0; i < 21; i += 1) {
      v = hist.get(i)!;
      v = v / (testCount / 100);

      hist.set(i, v);
    }
    console.log(hist);
  },

  randomCube1: () => {
    const testCount = 10000000;
    const printInc = Math.round(testCount / 50);
    const bigN = 43252003274489856000;
    const computedRed = 227546313523200;
    const shuffleN = 30;
    let countRed = 0;
    let countAny = 0;
    const cube = SolvedCube.copy();
    cube.trackMoveHistory = false;
    for (let i = 0; i < testCount; i += 1) {
      cube.shuffle(shuffleN);
      if (Predicates.anyCross(cube)) countAny += 1;
      if (Predicates.redCross(cube)) countRed += 1;
      if (i % printInc == 0) console.log(i / testCount);
    }

    const estimateAnyN = (countAny / testCount) * bigN;
    const estimateRedN = (countRed / testCount) * bigN;
    const computedVsEstimate = computedRed / estimateRedN;
    const output = {
      testCount,
      countRed,
      estimateRedN,
      computedVsEstimate,
      countAny,
      estimateAnyN
    }
    console.log(output);
  }
};
