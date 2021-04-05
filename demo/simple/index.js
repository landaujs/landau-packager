import React from "react";
import path from "path";

import Landau from "@landaujs/landau";

import { OtherCube } from "./second";

const Simple = () => {
  return (
    <union>
      <center>
        <cuboid size={[2 * 10, 4 * 10, 8 * 10]} center={[5, 0, 0]} />
      </center>
      <OtherCube />
    </union>
  );
}

export default Simple;
