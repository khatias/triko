"use client";
import React from "react";
import Spinner from "./Spiner";

export default function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center p-8">
      <Spinner className="h-9 w-9" />
    </div>
  );
}
