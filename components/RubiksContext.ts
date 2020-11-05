import React from "react";
import rubik from "rubik";

type RubiksContextValue = { cubeState: rubik.CubeState };

const RubiksContext = React.createContext<RubiksContextValue>({ cubeState: rubik.SolvedCube.copy() });

export default RubiksContext;
